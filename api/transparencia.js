const { getDb } = require('./lib/db');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const sql = getDb();

    try {
        // ========== GET - List/Filter Transparency Data ==========
        if (req.method === 'GET') {
            const { tipo, ano, categoria, page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            await sql`
                CREATE TABLE IF NOT EXISTS transparencia (
                    id SERIAL PRIMARY KEY,
                    tipo VARCHAR(50) NOT NULL,
                    titulo VARCHAR(300) NOT NULL,
                    descricao TEXT DEFAULT '',
                    valor DECIMAL(12,2) DEFAULT 0,
                    ano INTEGER NOT NULL,
                    mes INTEGER DEFAULT 1,
                    categoria VARCHAR(100) DEFAULT '',
                    documento_url VARCHAR(500) DEFAULT '',
                    status VARCHAR(50) DEFAULT 'publicado',
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `;

            let conditions = [];
            let params = [];
            let paramIdx = 1;

            if (tipo && tipo !== 'todos') {
                conditions.push(`tipo = $${paramIdx}`);
                params.push(tipo);
                paramIdx++;
            }
            if (ano) {
                conditions.push(`ano = $${paramIdx}`);
                params.push(parseInt(ano));
                paramIdx++;
            }
            if (categoria && categoria !== 'todos') {
                conditions.push(`categoria = $${paramIdx}`);
                params.push(categoria);
                paramIdx++;
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const query = `SELECT * FROM transparencia ${whereClause} ORDER BY ano DESC, mes DESC, created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(parseInt(limit), offset);

            const data = await sql.query(query, params);

            const summary = await sql`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE tipo = 'emenda') as emendas,
                    COUNT(*) FILTER (WHERE tipo = 'projeto') as projetos,
                    COUNT(*) FILTER (WHERE tipo = 'indicacao') as indicacoes,
                    COALESCE(SUM(valor) FILTER (WHERE tipo = 'emenda'), 0) as total_emendas_valor,
                    COALESCE(SUM(valor), 0) as total_valor
                FROM transparencia
            `;

            return res.status(200).json({
                success: true,
                data,
                summary: {
                    total: parseInt(summary[0].total),
                    emendas: parseInt(summary[0].emendas),
                    projetos: parseInt(summary[0].projetos),
                    indicacoes: parseInt(summary[0].indicacoes),
                    totalEmendasValor: parseFloat(summary[0].total_emendas_valor),
                    totalValor: parseFloat(summary[0].total_valor)
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: data.length === parseInt(limit)
                }
            });
        }

        // ========== POST - Create Entry ==========
        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const { tipo, titulo, descricao, valor, ano, mes, categoria, documento_url, status } = body;

            if (!tipo || !titulo || !ano) {
                return res.status(400).json({ success: false, error: 'Campos obrigatórios: tipo, titulo, ano' });
            }

            const result = await sql`
                INSERT INTO transparencia (tipo, titulo, descricao, valor, ano, mes, categoria, documento_url, status)
                VALUES (${tipo}, ${titulo}, ${descricao || ''}, ${valor || 0}, ${parseInt(ano)}, ${parseInt(mes) || 1}, ${categoria || ''}, ${documento_url || ''}, ${status || 'publicado'})
                RETURNING *
            `;

            return res.status(201).json({ success: true, data: result[0], message: 'Registro criado com sucesso!' });
        }

        // ========== PUT - Update ==========
        if (req.method === 'PUT') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const { id, ...fields } = body;
            if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });

            const result = await sql`
                UPDATE transparencia SET
                    titulo = COALESCE(${fields.titulo || null}, titulo),
                    descricao = COALESCE(${fields.descricao || null}, descricao),
                    valor = COALESCE(${fields.valor || null}, valor),
                    categoria = COALESCE(${fields.categoria || null}, categoria),
                    documento_url = COALESCE(${fields.documento_url || null}, documento_url),
                    status = COALESCE(${fields.status || null}, status)
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) return res.status(404).json({ success: false, error: 'Registro não encontrado' });
            return res.status(200).json({ success: true, data: result[0] });
        }

        // ========== DELETE ==========
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });
            await sql`DELETE FROM transparencia WHERE id = ${id}`;
            return res.status(200).json({ success: true, message: 'Registro removido' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Transparencia error:', error);
        return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};
