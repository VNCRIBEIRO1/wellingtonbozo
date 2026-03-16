import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'template-v2', 'images');
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
            console.log(`  ⚠️ Resposta:`, JSON.stringify(r).substring(0, 300));
            if (attempt < 4) await sleep(15000);
        } catch(e) {
            console.log(`  ❌ Erro: ${e.message}`);
            if (attempt < 4) await sleep(15000);
        }
    }
    return false;
}

// Imagens específicas para o Template V2
const IMAGES = [
    // HERO SLIDES — wide banner formato
    ['hero-1.jpg', 'Wide cinematic banner Brazilian city councilman at podium speaking passionately in modern municipal chamber, blue suit, golden ambient lighting, audience in background, Brazilian flag, official setting, 4K ultra-wide landscape'],
    ['hero-2.jpg', 'Wide cinematic banner showing a compassionate Brazilian politician visiting community project, talking with residents at neighborhood meeting outdoors, warm golden hour lighting, trees and houses in background, hopeful atmosphere, 4K panoramic'],
    ['hero-3.jpg', 'Stunning wide panoramic aerial view of Presidente Prudente city Sao Paulo Brazil at golden sunset, cathedral in center, green parks, modern buildings, beautiful cloud sky, warm tones, 4K ultra landscape photography'],

    // NEWS CARDS — imagens para destaques
    ['news-denuncia.jpg', 'Group of animal rescue volunteers holding rescued puppies and kittens at animal shelter in Brazil, joyful caring scene, clean bright environment, professional photography, warm colors, 4K'],
    ['news-lei.jpg', 'Official document signing ceremony at Brazilian municipal government office, pen signing law, wood desk, official stamps seals, blue government folder, formal setting, warm lighting, 4K'],
    ['news-infraestrutura.jpg', 'Aerial view of well-maintained paved rural road through green farmlands and rolling hills in Sao Paulo state Brazil countryside, agricultural landscape, blue sky, golden hour, 4K landscape'],
    ['news-inclusao.jpg', 'Happy inclusive community event in Brazil with people of all ages, elderly people with children and wheelchair users all smiling together at community center, colorful banners, warm atmosphere, professional photography, 4K'],
    ['news-juventude.jpg', 'Energetic group of diverse young Brazilians volunteering at community youth center, some painting walls others organizing donations, vibrant colorful environment, teamwork spirit, professional photography, 4K'],
    ['news-saude.jpg', 'Modern clean Brazilian municipal health clinic UBS with friendly medical staff attending patients, bright well-lit interior, blue and white colors, healthcare equipment, professional medical photography, 4K'],

    // GALLERY — momentos marcantes
    ['galeria-camara.jpg', 'Interior of modern Brazilian municipal legislative chamber during session, wooden desks microphones, official setting, Brazilian and city flags, formal atmosphere, architectural photography, 4K'],
    ['galeria-comunidade.jpg', 'Brazilian politician interacting with diverse community members at outdoor neighborhood event, handshakes smiles, colorful decorations, warm natural lighting, documentary photography, 4K'],
    ['galeria-animal-fair.jpg', 'Large animal adoption fair event in Brazilian public park, many families looking at rescued dogs and cats in organized booths, festive atmosphere banners flags, sunny day, professional event photography, 4K'],
    ['galeria-premio.jpg', 'Award ceremony at Brazilian municipal government building, person receiving trophy award on stage, formal setting, blue curtain background, spotlight, audience applauding, professional photography, 4K'],

    // PRONUNCIAMENTOS — thumbnails
    ['pronunc-tribuna.jpg', 'Brazilian politician standing at tribune microphone in municipal chamber delivering passionate speech, gesturing with hand, serious expression, official backdrop, dramatic lighting, documentary photography, 4K'],
    ['pronunc-entrevista.jpg', 'Brazilian politician giving interview to TV reporters with microphones in front of municipal building, professional attire, cameras recording, outdoor daylight, press conference feel, professional photography, 4K'],
    ['pronunc-posse.jpg', 'Official inauguration ceremony of municipal vice-president in Brazilian city council, formal oath moment, hand on constitution, other officials watching, solemn atmosphere, professional event photography, 4K'],

    // VIDEO THUMBNAILS
    ['video-1.jpg', 'Split screen style thumbnail showing rescued animals before and after rescue, dramatic transformation, cute healthy pets on one side vs sad abandoned animals other side, emotional impactful, professional photography, 4K'],
    ['video-2.jpg', 'Dynamic group of young Brazilian volunteers in matching t-shirts doing community service painting mural on wall, action shot, colorful vibrant, youth empowerment theme, professional photography, 4K'],
    ['video-3.jpg', 'Rural road construction and improvement project in Sao Paulo countryside Brazil, road grader machinery working, dust and progress, workers in safety vests, panoramic rural view, 4K'],
    ['video-4.jpg', 'Inside modern Brazilian public health clinic, doctor explaining health program to attentive group of community members, whiteboard with health info, professional medical setting, warm lighting, 4K'],

    // SOCIAL MEDIA MOCK
    ['social-1.jpg', 'Close-up of rescued mixed breed dog with grateful happy expression being held by volunteer at animal shelter Brazil, emotional heartwarming, beautiful lighting, shallow depth of field, 4K pet photography'],
    ['social-2.jpg', 'Aerial view of beautiful public park in Brazilian city with families enjoying sunny afternoon, playground children playing, green trees paths, community life, drone photography, 4K'],
    ['social-3.jpg', 'Brazilian community neighborhood meeting outdoors at night, string lights decorating, diverse people sitting in circle discussing, warm intimate atmosphere, documentary style, 4K'],
    ['social-4.jpg', 'Brazilian senior citizens smiling at community center during inclusive social activity, playing board games, colorful decorations, warm caring environment, documentary photography, 4K'],
    ['social-5.jpg', 'Sunrise over Presidente Prudente city skyline Sao Paulo Brazil, cathedral silhouette, warm golden light, beautiful clouds, cityscape landscape panoramic, 4K photography'],
    ['social-6.jpg', 'Group of Brazilian animal welfare activists posing with rescued cats and dogs at shelter opening event, matching shirts, big smiles, community spirit, professional group photo, 4K'],
];

async function main() {
    console.log('🚀 Gerando imagens para Template V2\n');

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
            console.log(`  ⏳ Aguardando 8s...\n`);
            await sleep(8000);
        }
    }

    console.log(`\n📊 Resultado: ${ok} OK, ${fail} falhas`);
    console.log('\n📂 Arquivos gerados:');
    if (fs.existsSync(IMAGES_DIR)) {
        fs.readdirSync(IMAGES_DIR).forEach(f => {
            console.log(`  ${f} (${(fs.statSync(path.join(IMAGES_DIR, f)).size/1024).toFixed(0)}KB)`);
        });
    }
}

main().catch(console.error);
