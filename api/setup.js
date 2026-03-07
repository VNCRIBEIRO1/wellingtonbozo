const { getDb } = require('./lib/db');

module.exports = async function handler(req, res) {
    const sql = getDb();

    try {
        // Create the animals table
        await sql`
            CREATE TABLE IF NOT EXISTS animais (
                id SERIAL PRIMARY KEY,
                tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('perdido', 'encontrado')),
                especie VARCHAR(20) NOT NULL CHECK (especie IN ('cachorro', 'gato', 'outro')),
                nome VARCHAR(100) DEFAULT '',
                raca VARCHAR(100) DEFAULT '',
                cor VARCHAR(100) NOT NULL,
                porte VARCHAR(20) DEFAULT '' CHECK (porte IN ('', 'pequeno', 'medio', 'grande')),
                bairro VARCHAR(200) NOT NULL,
                data DATE NOT NULL,
                descricao TEXT DEFAULT '',
                foto TEXT DEFAULT '',
                contato_nome VARCHAR(200) NOT NULL,
                contato_tel VARCHAR(30) NOT NULL,
                status VARCHAR(20) DEFAULT 'ativo' CHECK (status IN ('ativo', 'reunido', 'inativo')),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            )
        `;

        // Create indexes for faster filtering
        await sql`CREATE INDEX IF NOT EXISTS idx_animais_tipo ON animais(tipo)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_animais_especie ON animais(especie)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_animais_status ON animais(status)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_animais_bairro ON animais(bairro)`;
        await sql`CREATE INDEX IF NOT EXISTS idx_animais_created ON animais(created_at DESC)`;

        // Insert seed data if table is empty
        const count = await sql`SELECT COUNT(*) as total FROM animais`;
        
        if (parseInt(count[0].total) === 0) {
            await sql`
                INSERT INTO animais (tipo, especie, nome, raca, cor, porte, bairro, data, descricao, foto, contato_nome, contato_tel, status)
                VALUES
                ('perdido', 'cachorro', 'Mel', 'Vira-lata caramelo', 'Caramelo', 'medio', 'Jardim Maracanã', '2026-03-01',
                 'Cachorrinha caramelo de porte médio, muito dócil. Estava com coleira vermelha. Desapareceu na região do Jardim Maracanã.',
                 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&q=80',
                 'Maria Silva', '(18) 99888-7777', 'ativo'),

                ('encontrado', 'gato', '', 'Siamês', 'Bege com pontas escuras', 'pequeno', 'Vila Marcondes', '2026-03-03',
                 'Gato siamês encontrado na Rua das Flores, Vila Marcondes. Aparenta ser bem cuidado, com coleira azul sem plaquinha. Muito manso e carinhoso.',
                 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&q=80',
                 'José Santos', '(18) 99777-6666', 'ativo'),

                ('perdido', 'cachorro', 'Thor', 'Golden Retriever', 'Dourado', 'grande', 'Jardim Bongiovani', '2026-02-28',
                 'Golden Retriever macho, 3 anos, muito brincalhão. Saiu pelo portão aberto. Atende pelo nome de Thor. Castrado e vacinado.',
                 'https://images.unsplash.com/photo-1633722715463-d30f4f325e24?w=400&q=80',
                 'Ana Paula', '(18) 99666-5555', 'ativo'),

                ('encontrado', 'cachorro', '', 'Pinscher', 'Preto e marrom', 'pequeno', 'Centro', '2026-03-05',
                 'Pinscher pequeno encontrado próximo à praça central. Está assustado mas sem ferimentos. Sem coleira.',
                 'https://images.unsplash.com/photo-1583337130417-13104dec14a3?w=400&q=80',
                 'Carlos Ribeiro', '(18) 99555-4444', 'ativo')
            `;
        }

        res.status(200).json({
            success: true,
            message: 'Database setup complete. Tables created and seed data inserted.',
            tables: ['animais'],
            seedCount: parseInt(count[0].total) === 0 ? 4 : 0
        });
    } catch (error) {
        console.error('Setup error:', error);
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
};
