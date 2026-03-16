import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'images');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function download(url, filepath, timeoutMs = 120000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('Timeout')), timeoutMs);
        const follow = (u, redir = 0) => {
            if (redir > 8) { clearTimeout(timer); return reject(new Error('Too many redirects')); }
            const mod = u.startsWith('https') ? https : http;
            const req = mod.get(u, { timeout: timeoutMs }, (res) => {
                if ([301, 302, 307, 308].includes(res.statusCode)) {
                    return follow(res.headers.location, redir + 1);
                }
                if (res.statusCode !== 200) {
                    let b = ''; res.on('data', c => b += c);
                    res.on('end', () => { clearTimeout(timer); reject(new Error(`HTTP ${res.statusCode}`)); });
                    return;
                }
                const chunks = [];
                res.on('data', c => chunks.push(c));
                res.on('end', () => {
                    clearTimeout(timer);
                    const buf = Buffer.concat(chunks);
                    fs.writeFileSync(filepath, buf);
                    resolve(buf.length);
                });
                res.on('error', (e) => { clearTimeout(timer); reject(e); });
            });
            req.on('error', (e) => { clearTimeout(timer); reject(e); });
            req.on('timeout', () => { req.destroy(); clearTimeout(timer); reject(new Error('Socket timeout')); });
        };
        follow(url);
    });
}

const IMAGES = [
    ['insta-1.jpg', 512, 512, 'Rescued dogs being adopted at community event Brazilian city park, happy families, warm sunlight, vibrant colors, professional photography'],
    ['insta-2.jpg', 512, 512, 'Brazilian politician shaking hands with elderly community members at public health fair, warm caring atmosphere, professional photography'],
    ['insta-3.jpg', 512, 512, 'Young diverse Brazilian teenagers at sports court community center playing basketball, energy vitality, youth program'],
    ['insta-4.jpg', 512, 512, 'Inclusive community event Brazil wheelchair users children elderly celebrating together, colorful decorations, warm atmosphere'],
    ['insta-5.jpg', 512, 512, 'Freshly repaired rural road green farmland countryside São Paulo Brazil, blue sky, progress infrastructure'],
    ['insta-6.jpg', 512, 512, 'Inside Brazilian public clinic modern equipment friendly nurse helping patient, clean white blue decor, healthcare'],
    ['video-1.jpg', 800, 450, 'Brazilian city council legislative chamber in session, politicians at desks, microphones, Brazilian flag, formal atmosphere, blue gold tones, cinematic'],
    ['video-2.jpg', 800, 450, 'Group of young Brazilian activists holding banners peaceful community march city streets, diverse energetic, sunlight, cinematic'],
    ['video-3.jpg', 800, 450, 'Aerial view rural road construction works green farmland interior São Paulo Brazil, machinery working, progress, cinematic drone shot'],
    ['video-4.jpg', 800, 450, 'Veterinarians and volunteers at animal rescue station Brazil, treating cats and dogs, professional care, warm lighting, cinematic'],
];

async function main() {
    console.log('🚀 Gerando imagens via Pollinations.ai (free)\n');

    const needed = IMAGES.filter(([fn]) => {
        const fp = path.join(IMAGES_DIR, fn);
        if (fs.existsSync(fp) && fs.statSync(fp).size > 5000) {
            console.log(`⏭️ Existe: ${fn} (${(fs.statSync(fp).size / 1024).toFixed(0)}KB)`);
            return false;
        }
        return true;
    });

    console.log(`\n📸 A gerar: ${needed.length} de ${IMAGES.length}\n`);
    let ok = 0, fail = 0;

    for (let i = 0; i < needed.length; i++) {
        const [fn, w, h, prompt] = needed[i];
        const fp = path.join(IMAGES_DIR, fn);
        const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=${w}&height=${h}&seed=${Date.now()}&nologo=true&model=flux`;

        console.log(`[${i + 1}/${needed.length}] ${fn} (${w}x${h})`);
        
        for (let att = 1; att <= 3; att++) {
            try {
                const sz = await download(url, fp, 120000);
                if (sz < 3000) {
                    console.log(`  ⚠️ Muito pequeno (${sz}B), tentando novamente...`);
                    try { fs.unlinkSync(fp); } catch {}
                    if (att < 3) { await sleep(3000); continue; }
                    fail++;
                } else {
                    console.log(`  ✅ ${fn} (${(sz / 1024).toFixed(0)}KB)`);
                    ok++;
                }
                break;
            } catch (e) {
                console.log(`  ❌ [${att}/3] ${e.message}`);
                if (att < 3) { await sleep(5000); continue; }
                fail++;
            }
        }
        if (i < needed.length - 1) await sleep(4000);
    }

    console.log(`\n${'='.repeat(40)}`);
    console.log(`📊 OK: ${ok}  |  Falha: ${fail}`);
    console.log(`\n📂 Imagens novas:`);
    IMAGES.forEach(([fn]) => {
        const fp = path.join(IMAGES_DIR, fn);
        if (fs.existsSync(fp)) console.log(`  ${fn} (${(fs.statSync(fp).size / 1024).toFixed(0)}KB)`);
    });
}

main().catch(e => console.error('FATAL:', e));
