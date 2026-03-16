const { getDb } = require('./lib/db');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();

    const sql = getDb();

    try {
        // ========== GET - List/Filter Agenda ==========
        if (req.method === 'GET') {
            const { tipo, data_inicio, data_fim, status: statusFilter, publico, page = 1, limit = 30 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            await sql`
                CREATE TABLE IF NOT EXISTS agenda (
                    id SERIAL PRIMARY KEY,
                    titulo VARCHAR(300) NOT NULL,
                    descricao TEXT DEFAULT '',
                    data_evento DATE NOT NULL,
                    hora_inicio TIME DEFAULT '08:00',
                    hora_fim TIME DEFAULT '17:00',
                    local VARCHAR(300) DEFAULT '',
                    tipo VARCHAR(50) NOT NULL,
                    status VARCHAR(50) DEFAULT 'confirmado',
                    publico BOOLEAN DEFAULT true,
                    destaque BOOLEAN DEFAULT false,
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
            if (data_inicio) {
                conditions.push(`data_evento >= $${paramIdx}`);
                params.push(data_inicio);
                paramIdx++;
            }
            if (data_fim) {
                conditions.push(`data_evento <= $${paramIdx}`);
                params.push(data_fim);
                paramIdx++;
            }
            if (publico === 'true') {
                conditions.push(`publico = true`);
            }

            const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
            const query = `SELECT * FROM agenda ${whereClause} ORDER BY data_evento ASC, hora_inicio ASC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(parseInt(limit), offset);

            const data = await sql.query(query, params);

            const counts = await sql`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE tipo = 'audiencia') as audiencias,
                    COUNT(*) FILTER (WHERE tipo = 'reuniao') as reunioes,
                    COUNT(*) FILTER (WHERE tipo = 'evento') as eventos,
                    COUNT(*) FILTER (WHERE tipo = 'sessao') as sessoes,
                    COUNT(*) FILTER (WHERE status = 'confirmado') as confirmados,
                    COUNT(*) FILTER (WHERE status = 'realizado') as realizados,
                    COUNT(*) FILTER (WHERE data_evento >= CURRENT_DATE AND status = 'confirmado') as proximos
                FROM agenda
            `;

            return res.status(200).json({
                success: true,
                data,
                counts: {
                    total: parseInt(counts[0].total),
                    audiencias: parseInt(counts[0].audiencias),
                    reunioes: parseInt(counts[0].reunioes),
                    eventos: parseInt(counts[0].eventos),
                    sessoes: parseInt(counts[0].sessoes),
                    confirmados: parseInt(counts[0].confirmados),
                    realizados: parseInt(counts[0].realizados),
                    proximos: parseInt(counts[0].proximos)
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: data.length === parseInt(limit)
                }
            });
        }

        // ========== POST - Create Event ==========
        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const { titulo, descricao, data_evento, hora_inicio, hora_fim, local, tipo, status, publico, destaque } = body;

            if (!titulo || !data_evento || !tipo) {
                return res.status(400).json({ success: false, error: 'Campos obrigatórios: titulo, data_evento, tipo' });
            }

            const result = await sql`
                INSERT INTO agenda (titulo, descricao, data_evento, hora_inicio, hora_fim, local, tipo, status, publico, destaque)
                VALUES (${titulo}, ${descricao || ''}, ${data_evento}, ${hora_inicio || '08:00'}, ${hora_fim || '17:00'}, ${local || ''}, ${tipo}, ${status || 'confirmado'}, ${publico !== false}, ${destaque || false})
                RETURNING *
            `;

            return res.status(201).json({ success: true, data: result[0], message: 'Evento criado com sucesso!' });
        }

        // ========== PUT - Update Event ==========
        if (req.method === 'PUT') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const { id, ...fields } = body;
            if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });

            const result = await sql`
                UPDATE agenda SET
                    titulo = COALESCE(${fields.titulo || null}, titulo),
                    descricao = COALESCE(${fields.descricao || null}, descricao),
                    data_evento = COALESCE(${fields.data_evento || null}, data_evento),
                    hora_inicio = COALESCE(${fields.hora_inicio || null}, hora_inicio),
                    hora_fim = COALESCE(${fields.hora_fim || null}, hora_fim),
                    local = COALESCE(${fields.local || null}, local),
                    tipo = COALESCE(${fields.tipo || null}, tipo),
                    status = COALESCE(${fields.status || null}, status),
                    publico = COALESCE(${fields.publico}, publico),
                    destaque = COALESCE(${fields.destaque}, destaque)
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) return res.status(404).json({ success: false, error: 'Evento não encontrado' });
            return res.status(200).json({ success: true, data: result[0] });
        }

        // ========== DELETE ==========
        if (req.method === 'DELETE') {
            const { id } = req.query;
            if (!id) return res.status(400).json({ success: false, error: 'ID obrigatório' });
            await sql`DELETE FROM agenda WHERE id = ${id}`;
            return res.status(200).json({ success: true, message: 'Evento removido' });
        }

        return res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('Agenda error:', error);
        return res.status(500).json({ success: false, error: 'Erro interno do servidor' });
    }
};
