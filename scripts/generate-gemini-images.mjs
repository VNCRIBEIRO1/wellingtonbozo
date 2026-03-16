import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'images');

if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/* ---------- Pollinations.ai — 100% free, no key ---------- */
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const follow = (u, redirects = 0) => {
            if (redirects > 5) return reject(new Error('Too many redirects'));
            const mod = u.startsWith('https') ? https : http;
            mod.get(u, { timeout: 90000 }, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307) {
                    return follow(res.headers.location, redirects + 1);
                }
                if (res.statusCode !== 200) {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`)));
                    return;
                }
                const file = fs.createWriteStream(filepath);
                res.pipe(file);
                file.on('finish', () => { file.close(); resolve(); });
                file.on('error', reject);
            }).on('error', reject);
        };
        follow(url);
    });
}

async function generateImage(prompt, filename) {
    console.log(`\n  🎨 Gerando: ${filename}`);

    for (let attempt = 1; attempt <= 3; attempt++) {
        console.log(`     [Tentativa ${attempt}/3]`);
        try {
            const encodedPrompt = encodeURIComponent(prompt);
            const w = filename.startsWith('insta-') ? 512 : 800;
            const h = filename.startsWith('insta-') ? 512 : 450;
            const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${w}&height=${h}&seed=${Date.now()}&nologo=true&model=flux`;

            const fp = path.join(IMAGES_DIR, filename);
            await downloadImage(url, fp);

            const sz = fs.statSync(fp).size;
            if (sz < 3000) {
                console.log(`     ⚠️ Arquivo muito pequeno (${sz}B), tentando novamente...`);
                fs.unlinkSync(fp);
                if (attempt < 3) { await sleep(5000); continue; }
                return false;
            }

            console.log(`     ✅ Salvo: ${filename} (${(sz / 1024).toFixed(0)}KB)`);
            return true;

        } catch (e) {
            console.log(`     ❌ Erro: ${e.message}`);
            if (attempt < 3) { await sleep(5000); continue; }
            return false;
        }
    }
    return false;
}

/* ---------- Imagens necessárias ----------
   O template V2 reutiliza as mesmas 12 imagens em ~38 slots.
   Vamos gerar imagens ÚNICAS para as seções que mais precisam de variedade:
   - Instagram grid (6 fotos únicas)
   - Vídeo thumbnails (4 thumbnails únicos)
   - Notícias extra / slots duplicados
   ---------------------------------------- */

const IMAGES_TO_GEN = [
    // Instagram posts (social media style, quadrado)
    ['insta-1.jpg',  'Photo of rescued dogs being adopted at a community event in a Brazilian city park, happy families receiving pets, warm sunlight, Instagram post style, square format, vibrant colors, 4K'],
    ['insta-2.jpg',  'Brazilian politician shaking hands with elderly community members at public health fair, tents banners, warm caring atmosphere, Instagram post style, square format, 4K'],
    ['insta-3.jpg',  'Young diverse Brazilian teenagers at sports court community center playing basketball, energy vitality, youth program, Instagram post style, square format, vibrant, 4K'],
    ['insta-4.jpg',  'Inclusive community event in Brazil with wheelchair users children elderly celebrating together, colorful decorations, warm atmosphere, Instagram post style, square format, 4K'],
    ['insta-5.jpg',  'Freshly repaired rural road in green farmland countryside São Paulo state Brazil, tractor nearby, blue sky, progress infrastructure, Instagram post style, square format, 4K'],
    ['insta-6.jpg',  'Inside Brazilian public clinic, modern equipment friendly nurse helping patient, clean white blue decor, healthcare, Instagram post style, square format, 4K'],

    // Video thumbnails (paisagem, com aspecto cinematográfico)
    ['video-1.jpg',  'Wide shot of Brazilian city council legislative chamber in session, politicians at desks, microphones, Brazilian flag, formal atmosphere, blue gold tones, cinematic 16:9, 4K'],
    ['video-2.jpg',  'Group of young Brazilian activists holding banners at peaceful community march in city streets, diverse energetic, sunlight, cinematic wide angle, 16:9, 4K'],
    ['video-3.jpg',  'Aerial view of rural road construction works in green farmland interior São Paulo Brazil, machinery working, progress, cinematic drone shot, 16:9, 4K'],
    ['video-4.jpg',  'Veterinarians and volunteers at animal rescue station Brazil, treating cats and dogs, professional care, warm lighting, cinematic 16:9, 4K'],
];

async function main() {
    console.log('🚀 Gerando imagens com Google Gemini API\n');
    console.log(`📂 Diretório: ${IMAGES_DIR}`);
    console.log(`📸 Total a gerar: ${IMAGES_TO_GEN.length}\n`);

    // Skip existing
    const needed = IMAGES_TO_GEN.filter(([fn]) => {
        const fp = path.join(IMAGES_DIR, fn);
        const fpPng = path.join(IMAGES_DIR, fn.replace(/\.\w+$/, '.png'));
        if ((fs.existsSync(fp) && fs.statSync(fp).size > 5000) ||
            (fs.existsSync(fpPng) && fs.statSync(fpPng).size > 5000)) {
            console.log(`⏭️  Existe: ${fn}`);
            return false;
        }
        return true;
    });

    if (needed.length === 0) {
        console.log('\n✅ Todas as imagens já existem!');
        return;
    }

    console.log(`\n🔄 Gerando ${needed.length} imagens...\n`);

    let ok = 0, fail = 0;
    const results = [];

    for (let i = 0; i < needed.length; i++) {
        const [fn, prompt] = needed[i];
        const result = await generateImage(prompt, fn);
        if (result) {
            ok++;
            results.push(result);
        } else {
            fail++;
        }

        // Rate limit: esperar entre requests
        if (i < needed.length - 1) {
            console.log(`  ⏳ Aguardando 8s...\n`);
            await sleep(8000);
        }
    }

    console.log(`\n${'='.repeat(50)}`);
    console.log(`📊 Resultado: ${ok} OK, ${fail} falhas`);
    if (results.length) {
        console.log(`\n✅ Imagens geradas:`);
        results.forEach(fn => {
            const fp = path.join(IMAGES_DIR, fn);
            console.log(`   ${fn} (${(fs.statSync(fp).size / 1024).toFixed(0)}KB)`);
        });
    }
    console.log(`\n📂 Todos os arquivos em images/:`);
    fs.readdirSync(IMAGES_DIR)
        .filter(f => !f.endsWith('.zip'))
        .forEach(f => {
            console.log(`   ${f} (${(fs.statSync(path.join(IMAGES_DIR, f)).size / 1024).toFixed(0)}KB)`);
        });
}

main().catch(console.error);
