import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'images');
const API_KEY = 'sk-p2myBAHWMKKbs1G7EiCnBmW4nB6Te';

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
            const mod = https;
            mod.get(u, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) return go(res.headers.location);
                const file = fs.createWriteStream(filepath);
                res.pipe(file); file.on('finish', () => { file.close(); resolve(); });
            }).on('error', reject);
        };
        go(url);
    });
}

async function main() {
    // Generate the Denúncia Premiada banner - wider aspect ratio for hero slider
    console.log('🎨 Gerando banner Denúncia Premiada para hero slider...');
    
    const r = await apiRequest({
        model: 'bytedance/seedream-4.5',
        prompt: 'Professional political campaign hero banner, a confident Brazilian politician man in his late 30s wearing a light blue dress shirt with crossed arms and warm smile, standing on the right side, text area on the left with large bold words DENUNCIA PREMIADA in gold yellow letters on dark blue gradient background, modern political branding design, golden accents, clean professional graphic design, wide panoramic banner format 1920x800, 4K quality, photorealistic, Brazilian political campaign style'
    });

    if (r.code === 200 && r.resp_data?.data?.[0]?.url) {
        const fp = path.join(IMAGES_DIR, 'hero-denuncia-premiada.jpg');
        await downloadFile(r.resp_data.data[0].url, fp);
        console.log(`✅ Banner salvo: ${fp} (${(fs.statSync(fp).size/1024).toFixed(0)}KB)`);
    } else {
        console.log('❌ Erro:', JSON.stringify(r).substring(0, 300));
    }

    // Also generate an image for the CTA section and animal banner
    await sleep(10000);
    
    console.log('\n🎨 Gerando imagem para CTA section...');
    const r2 = await apiRequest({
        model: 'bytedance/seedream-4.5',
        prompt: 'Aerial view of a vibrant Brazilian city at night with beautiful illuminated streets and buildings, warm city lights, modern urban landscape, stars visible in sky, Presidente Prudente city Sao Paulo Brazil, 4K ultra high resolution cityscape night photography, cinematic atmosphere'
    });

    if (r2.code === 200 && r2.resp_data?.data?.[0]?.url) {
        const fp = path.join(IMAGES_DIR, 'cta-bg.jpg');
        await downloadFile(r2.resp_data.data[0].url, fp);
        console.log(`✅ CTA background: ${fp} (${(fs.statSync(fp).size/1024).toFixed(0)}KB)`);
    } else {
        console.log('❌ Erro:', JSON.stringify(r2).substring(0, 300));
    }

    await sleep(10000);

    console.log('\n🎨 Gerando imagem para animal banner...');
    const r3 = await apiRequest({
        model: 'bytedance/seedream-4.5',
        prompt: 'Beautiful photograph of happy rescued dogs and cats together in a sunny park in Brazil, golden retriever labrador small kittens, green grass blue sky, heartwarming scene of animal welfare, professional pet photography, warm natural lighting, joyful atmosphere, 4K quality'
    });

    if (r3.code === 200 && r3.resp_data?.data?.[0]?.url) {
        const fp = path.join(IMAGES_DIR, 'animal-banner-bg.jpg');
        await downloadFile(r3.resp_data.data[0].url, fp);
        console.log(`✅ Animal banner: ${fp} (${(fs.statSync(fp).size/1024).toFixed(0)}KB)`);
    } else {
        console.log('❌ Erro:', JSON.stringify(r3).substring(0, 300));
    }

    console.log('\n📂 Todos os arquivos:');
    fs.readdirSync(IMAGES_DIR).forEach(f => {
        console.log(`  ${f} (${(fs.statSync(path.join(IMAGES_DIR, f)).size/1024).toFixed(0)}KB)`);
    });
}

main().catch(console.error);
