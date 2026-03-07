/**
 * Script para gerar imagens temáticas via ApiFree API
 * e fazer upscale da imagem do Wellington Bozo
 */

import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const IMAGES_DIR = path.join(__dirname, '..', 'images');

const client = new OpenAI({
    baseURL: 'https://api.apifree.ai/v1',
    apiKey: 'sk-p2myBAHWMKKbs1G7EiCnBmW4nB6Te'
});

// Ensure images directory exists
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filepath);
        https.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                https.get(response.headers.location, (res) => {
                    res.pipe(file);
                    file.on('finish', () => { file.close(); resolve(filepath); });
                }).on('error', reject);
            } else {
                response.pipe(file);
                file.on('finish', () => { file.close(); resolve(filepath); });
            }
        }).on('error', reject);
    });
}

// Test: generate one image first
async function testGeneration() {
    console.log('🎨 Testing image generation...');
    try {
        const result = await client.images.generate({
            model: 'google/imagen-4-fast',
            prompt: 'Professional portrait photo of a Brazilian city councilman working at his desk in a modern office, blue suit, warm lighting, government building, 4K quality',
            n: 1,
            size: '1024x1024'
        });
        console.log('✅ SUCCESS! Result:', JSON.stringify(result, null, 2));
        return result;
    } catch (err) {
        console.log('❌ imagen-4-fast failed:', err.message);
        
        // Try alternative model
        try {
            console.log('🔄 Trying openai/gpt-image-1...');
            const result2 = await client.images.generate({
                model: 'openai/gpt-image-1',
                prompt: 'Professional portrait photo of a Brazilian city councilman working at his desk in a modern office, blue suit, warm lighting',
                n: 1,
                size: '1024x1024'
            });
            console.log('✅ gpt-image-1 SUCCESS:', JSON.stringify(result2, null, 2));
            return result2;
        } catch (err2) {
            console.log('❌ gpt-image-1 failed:', err2.message);
            
            // Try flux
            try {
                console.log('🔄 Trying flux-2-dev...');
                const result3 = await client.images.generate({
                    model: 'black-forest-labs/flux-2-dev',
                    prompt: 'Professional portrait photo of a Brazilian city councilman, blue suit, modern office, warm lighting',
                    n: 1,
                    size: '1024x1024'
                });
                console.log('✅ flux-2-dev SUCCESS:', JSON.stringify(result3, null, 2));
                return result3;
            } catch (err3) {
                console.log('❌ flux-2-dev failed:', err3.message);
                
                // Try seedream
                try {
                    console.log('🔄 Trying seedream-4.5...');
                    const result4 = await client.images.generate({
                        model: 'bytedance/seedream-4.5',
                        prompt: 'Professional portrait photo of a Brazilian city councilman, blue suit, modern office',
                        n: 1,
                        size: '1024x1024'
                    });
                    console.log('✅ seedream-4.5 SUCCESS:', JSON.stringify(result4, null, 2));
                    return result4;
                } catch (err4) {
                    console.log('❌ seedream-4.5 failed:', err4.message);
                    console.log('Full error:', JSON.stringify(err4, null, 2));
                }
            }
        }
    }
}

testGeneration();
