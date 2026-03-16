const { getDb } = require('./lib/db');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const sql = getDb();

    try {
        // ========== GET - List/Filter Indicações ==========
        if (req.method === 'GET') {
            const { tipo, status: statusFilter, categoria, bairro, busca, page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            await sql`
                CREATE TABLE IF NOT EXISTS indicacoes (
                    id SERIAL PRIMARY KEY,
                    numero VARCHAR(50) DEFAULT '',
                    tipo VARCHAR(50) NOT NULL,
                    titulo VARCHAR(300) NOT NULL,
                    descricao TEXT DEFAULT '',
                    data DATE NOT NULL DEFAULT CURRENT_DATE,
                    status VARCHAR(50) DEFAULT 'em_tramitacao',
                    bairro VARCHAR(200) DEFAULT '',
                    categoria VARCHAR(100) DEFAULT '',
                    resposta TEXT DEFAULT '',
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
            if (statusFilter && statusFilter !== 'todos') {
                conditions.push(`status = $${paramIdx}`);
                params.push(statusFilter);
                paramIdx++;
            }
            if (categoria && categoria !== 'todos') {
                conditions.push(`categoria = $${paramIdx}`);
                params.push(categoria);
                paramIdx++;
            }
            if (bairro) {
                conditions.push(`LOWER(bairro) LIKE $${paramIdx}`);
                params.push(`%${bairro.toLowerCase()}%`);
                paramIdx++;
            }
            if (busca) {
                conditions.push(`(LOWER(titulo) LIKE $${paramIdx} OR LOWER(descricao) LIKE $${paramIdx} OR LOWER(numero) LIKE $${paramIdx})`);
                params.push(`%${busca.toLowerCase()}%`);
                paramIdx++;
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const query = `SELECT * FROM indicacoes ${whereClause} ORDER BY data DESC, created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(parseInt(limit), offset);

            const data = await sql.query(query, params);

            const counts = await sql`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE tipo = 'indicacao') as indicacoes,
                    COUNT(*) FILTER (WHERE tipo = 'requerimento') as requerimentos,
                    COUNT(*) FILTER (WHERE tipo = 'mocao') as mocoes,
                    COUNT(*) FILTER (WHERE status = 'aprovado') as aprovados,
                    COUNT(*) FILTER (WHERE status = 'em_tramitacao') as em_tramitacao,
                    COUNT(*) FILTER (WHERE status = 'atendido') as atendidos
                FROM indicacoes
            `;

            return res.status(200).json({
                success: true,
                data,
                counts: {
                    total: parseInt(counts[0].total),
                    indicacoes: parseInt(counts[0].indicacoes),
                    requerimentos: parseInt(counts[0].requerimentos),
                    mocoes: parseInt(counts[0].mocoes),
                    aprovados: parseInt(counts[0].aprovados),
                    emTramitacao: parseInt(counts[0].em_tramitacao),
                    atendidos: parseInt(counts[0].atendidos)
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: data.length === parseInt(limit)
                }
            });
        }

        // ========== POST - Create Indicação ==========
        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const { numero, tipo, titulo, descricao, data, status, bairro, categoria, resposta } = body;

            if (!tipo || !titulo) {
                return res.status(400).json({ success: false, error: 'Campos obrigatórios: tipo, titulo' });
            }

            const result = await sql`
                INSERT INTO indicacoes (numero, tipo, titulo, descricao, data, status, bairro, categoria, resposta)
                VALUES (${numero || ''}, ${tipo}, ${titulo}, ${descricao || ''}, ${data || new Date().toISOString().split('T')[0]}, ${status || 'em_tramitacao'}, ${bairro || ''}, ${categoria || ''}, ${resposta || ''})
                RETURNING *
            `;

            return res.status(201).json({ success: true, data: result[0], message: 'Indicação registrada com sucesso!' });
        }

        // ========== PUT - Update ==========
        if (req.method === 'PUT') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const { id, ...fields } = body;
            if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });

            const result = await sql`
                UPDATE indicacoes SET
                    titulo = COALESCE(${fields.titulo || null}, titulo),
                    descricao = COALESCE(${fields.descricao || null}, descricao),
                    status = COALESCE(${fields.status || null}, status),
                    bairro = COALESCE(${fields.bairro || null}, bairro),
                    categoria = COALESCE(${fields.categoria || null}, categoria),
                    resposta = COALESCE(${fields.resposta || null}, resposta)
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) return res.status(404).json({ success: false, error: 'Indicação não encontrada' });
            return res.status(200).json({ success: true, data: result[0] });
        }

        // ========== DELETE ==========
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });
            await sql`DELETE FROM indicacoes WHERE id = ${id}`;
            return res.status(200).json({ success: true, message: 'Indicação removida' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Indicacoes error:', error);
        return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};
