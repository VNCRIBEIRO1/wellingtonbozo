const { getDb } = require('./lib/db');

module.exports = async function handler(req, res) {
    // CORS preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const sql = getDb();

    try {
        // ========== GET - List/Filter Animals ==========
        if (req.method === 'GET') {
            const { tipo, especie, busca, status: statusFilter, page = 1, limit = 20 } = req.query;
            const offset = (parseInt(page) - 1) * parseInt(limit);

            let conditions = [];
            let params = [];

            // Default to active animals
            const activeStatus = statusFilter || 'ativo';
            
            let query = `SELECT * FROM animais WHERE status = '${activeStatus}'`;

            if (tipo && tipo !== 'todos') {
                query += ` AND tipo = '${tipo}'`;
            }
            if (especie && especie !== 'todos') {
                query += ` AND especie = '${especie}'`;
            }
            if (busca) {
                const searchTerm = `%${busca.toLowerCase()}%`;
                query += ` AND (LOWER(bairro) LIKE '${searchTerm}' OR LOWER(cor) LIKE '${searchTerm}' OR LOWER(raca) LIKE '${searchTerm}' OR LOWER(nome) LIKE '${searchTerm}' OR LOWER(descricao) LIKE '${searchTerm}')`;
            }

            query += ` ORDER BY created_at DESC LIMIT ${parseInt(limit)} OFFSET ${offset}`;

            const animals = await sql(query);

            // Get counts
            const counts = await sql`
                SELECT 
                    COUNT(*) FILTER (WHERE tipo = 'perdido' AND status = 'ativo') as perdidos,
                    COUNT(*) FILTER (WHERE tipo = 'encontrado' AND status = 'ativo') as encontrados,
                    COUNT(*) FILTER (WHERE status = 'reunido') as reunidos,
                    COUNT(*) as total
                FROM animais
            `;

            return res.status(200).json({
                success: true,
                data: animals,
                counts: {
                    perdidos: parseInt(counts[0].perdidos),
                    encontrados: parseInt(counts[0].encontrados),
                    reunidos: parseInt(counts[0].reunidos),
                    total: parseInt(counts[0].total)
                },
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    hasMore: animals.length === parseInt(limit)
                }
            });
        }

        // ========== POST - Create Animal ==========
        if (req.method === 'POST') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const {
                tipo, especie, nome = '', raca = '', cor, porte = '',
                bairro, data, descricao = '', foto = '',
                contato_nome, contato_tel
            } = body;

            // Validation
            if (!tipo || !especie || !cor || !bairro || !data || !contato_nome || !contato_tel) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: tipo, especie, cor, bairro, data, contato_nome, contato_tel'
                });
            }

            const result = await sql`
                INSERT INTO animais (tipo, especie, nome, raca, cor, porte, bairro, data, descricao, foto, contato_nome, contato_tel)
                VALUES (${tipo}, ${especie}, ${nome}, ${raca}, ${cor}, ${porte}, ${bairro}, ${data}, ${descricao}, ${foto}, ${contato_nome}, ${contato_tel})
                RETURNING *
            `;

            return res.status(201).json({
                success: true,
                data: result[0],
                message: 'Animal cadastrado com sucesso!'
            });
        }

        // ========== PUT - Update Animal Status ==========
        if (req.method === 'PUT') {
            const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            const { id, status } = body;

            if (!id || !status) {
                return res.status(400).json({
                    success: false,
                    error: 'Campos obrigatórios: id, status'
                });
            }

            const result = await sql`
                UPDATE animais 
                SET status = ${status}, updated_at = NOW()
                WHERE id = ${id}
                RETURNING *
            `;

            if (result.length === 0) {
                return res.status(404).json({
                    success: false,
                    error: 'Animal não encontrado'
                });
            }

            return res.status(200).json({
                success: true,
                data: result[0],
                message: `Status atualizado para ${status}`
            });
        }

        // ========== DELETE - Remove Animal ==========
        if (req.method === 'DELETE') {
            const { id } = req.query;

            if (!id) {
                return res.status(400).json({
                    success: false,
                    error: 'ID obrigatório'
                });
            }

            await sql`DELETE FROM animais WHERE id = ${id}`;

            return res.status(200).json({
                success: true,
                message: 'Animal removido'
            });
        }

        res.status(405).json({ error: 'Method not allowed' });

    } catch (error) {
        console.error('API error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro interno do servidor',
            details: error.message
        });
    }
};
