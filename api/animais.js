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

            // Build dynamic query with parameterized values
            let conditions = [`status = $1`];
            let params = [statusFilter || 'ativo'];
            let paramIdx = 2;

            if (tipo && tipo !== 'todos') {
                conditions.push(`tipo = $${paramIdx}`);
                params.push(tipo);
                paramIdx++;
            }
            if (especie && especie !== 'todos') {
                conditions.push(`especie = $${paramIdx}`);
                params.push(especie);
                paramIdx++;
            }
            if (busca) {
                const searchTerm = `%${busca.toLowerCase()}%`;
                conditions.push(`(LOWER(bairro) LIKE $${paramIdx} OR LOWER(cor) LIKE $${paramIdx} OR LOWER(raca) LIKE $${paramIdx} OR LOWER(nome) LIKE $${paramIdx} OR LOWER(descricao) LIKE $${paramIdx})`);
                params.push(searchTerm);
                paramIdx++;
            }

            const whereClause = conditions.join(' AND ');
            const query = `SELECT * FROM animais WHERE ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`;
            params.push(parseInt(limit), offset);

            const animals = await sql.query(query, params);

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
