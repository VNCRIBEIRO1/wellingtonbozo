const { getDb } = require('./lib/db');

module.exports = async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const sql = getDb();

    try {
        const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
        const { name, email, subject, message } = body;

        if (!name || !email || !message) {
            return res.status(400).json({
                success: false,
                error: 'Campos obrigatórios: name, email, message'
            });
        }

        // Create table if needed
        await sql`
            CREATE TABLE IF NOT EXISTS mensagens (
                id SERIAL PRIMARY KEY,
                name VARCHAR(200) NOT NULL,
                email VARCHAR(200) NOT NULL,
                subject VARCHAR(300) DEFAULT '',
                message TEXT NOT NULL,
                read BOOLEAN DEFAULT false,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;

        const result = await sql`
            INSERT INTO mensagens (name, email, subject, message)
            VALUES (${name}, ${email}, ${subject || ''}, ${message})
            RETURNING id, created_at
        `;

        return res.status(201).json({
            success: true,
            message: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
            id: result[0].id
        });

    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({
            success: false,
            error: 'Erro ao enviar mensagem. Tente novamente.'
        });
    }
};
