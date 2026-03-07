import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const API_KEY = 'sk-p2myBAHWMKKbs1G7EiCnBmW4nB6Te';
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

function apiRequest(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = https.request({
            hostname: 'api.apifree.ai', path: '/v1/chat/completions', method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}`, 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let b = ''; res.on('data', c => b += c);
            res.on('end', () => { try { resolve(JSON.parse(b)); } catch(e) { resolve({ raw: b }); } });
        });
        req.on('error', reject); req.setTimeout(180000); req.write(data); req.end();
    });
}

function downloadFile(url, filepath) {
    return new Promise((resolve, reject) => {
        const go = (u) => {
            const mod = u.startsWith('https') ? https : http;
            mod.get(u, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) return go(res.headers.location);
                const file = fs.createWriteStream(filepath);
                res.pipe(file); file.on('finish', () => { file.close(); resolve(); });
            }).on('error', reject);
        };
        go(url);
    });
}

async function gen(prompt, filename) {
    for (let attempt = 1; attempt <= 4; attempt++) {
        console.log(`  [${attempt}/4] Gerando ${filename}...`);
        try {
            const r = await apiRequest({ model: 'bytedance/seedream-4.5', prompt });
            if (r.code === 429) {
                const w = 20000 * attempt;
                console.log(`  ⏳ Rate limit. Aguardando ${w/1000}s...`);
                await sleep(w); continue;
            }
            if (r.code === 200 && r.resp_data?.data?.[0]?.url) {
                const fp = path.join(IMAGES_DIR, filename);
                await downloadFile(r.resp_data.data[0].url, fp);
                const sz = fs.statSync(fp).size;
                console.log(`  ✅ ${filename} (${(sz/1024).toFixed(0)}KB)`);
                return true;
            }
            console.log(`  ⚠️ Resposta:`, JSON.stringify(r).substring(0, 200));
            if (attempt < 4) await sleep(15000);
        } catch(e) {
            console.log(`  ❌ Erro: ${e.message}`);
            if (attempt < 4) await sleep(15000);
        }
    }
    return false;
}

const IMAGES = [
    ['hero-slide-1.jpg', 'Professional political campaign wide banner, inside modern Brazilian municipal legislative chamber with wooden desks and microphones, blue gold color scheme, Brazilian flag, formal atmosphere, wide angle panoramic, 4K cinematic lighting'],
    ['hero-slide-2.jpg', 'Brazilian politician speaking at community meeting in modern municipal building, diverse crowd listening, blue white colors, warm lighting, wide angle panoramic, professional political photography, 4K'],
    ['hero-slide-3.jpg', 'Stunning aerial panoramic view of beautiful Brazilian medium city at golden hour sunset, modern buildings green parks tree-lined avenues, blue sky warm orange clouds, 4K ultra high resolution cityscape'],
    ['causa-animal.jpg', 'Heartwarming scene of rescued dogs and cats at animal shelter Brazil, happy healthy animals, volunteers petting them, clean bright environment, warm caring, professional photography, soft lighting, 4K'],
    ['saude.jpg', 'Modern Brazilian public health clinic interior, clean well-equipped, friendly doctors helping patients, bright warm lighting, healthcare theme, blue white colors, 4K'],
    ['infraestrutura.jpg', 'Freshly paved rural road through green farmlands rolling hills interior Sao Paulo Brazil, agricultural landscape blue sky, well-maintained infrastructure, countryside, golden hour, 4K landscape photography'],
    ['inclusao.jpg', 'Diverse group of Brazilian people all ages abilities at inclusive community center, wheelchair users elderly children smiling together, warm inclusive atmosphere, bright cheerful, professional photography, 4K'],
    ['juventude.jpg', 'Group of diverse young Brazilian students at youth center engaged in educational activities, vibrant energy, colorful modern environment, teamwork, professional photography, bright lighting, 4K'],
    ['about-bozo.jpg', 'Professional full body portrait confident Brazilian politician man late 30s wearing navy blue suit tie, standing front of municipal government building, warm lighting, green trees blue sky, approachable confident, 4K photography'],
];

async function main() {
    console.log('🚀 Gerando imagens temáticas');
    
    // Skip existing valid files
    const needed = IMAGES.filter(([fn]) => {
        const fp = path.join(IMAGES_DIR, fn);
        if (fs.existsSync(fp) && fs.statSync(fp).size > 10000) {
            console.log(`⏭️  Existe: ${fn} (${(fs.statSync(fp).size/1024).toFixed(0)}KB)`);
            return false;
        }
        return true;
    });

    console.log(`\n📸 A gerar: ${needed.length} imagens\n`);

    let ok = 0, fail = 0;
    for (let i = 0; i < needed.length; i++) {
        const [fn, prompt] = needed[i];
        const success = await gen(prompt, fn);
        if (success) ok++; else fail++;
        if (i < needed.length - 1) {
            console.log(`  ⏳ Aguardando 10s...\n`);
            await sleep(10000);
        }
    }

    console.log(`\n📊 Resultado: ${ok} OK, ${fail} falhas`);
    console.log('\n📂 Arquivos:');
    fs.readdirSync(IMAGES_DIR).forEach(f => {
        console.log(`  ${f} (${(fs.statSync(path.join(IMAGES_DIR, f)).size/1024).toFixed(0)}KB)`);
    });
}

main().catch(console.error);
