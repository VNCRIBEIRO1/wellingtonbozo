import https from 'https';

function apiRequest(body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const options = {
            hostname: 'api.apifree.ai',
            path: '/v1/chat/completions',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer sk-p2myBAHWMKKbs1G7EiCnBmW4nB6Te',
                'Content-Length': Buffer.byteLength(data)
            }
        };
        const req = https.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, data: JSON.parse(body) }); }
                catch(e) { resolve({ status: res.statusCode, data: body }); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function main() {
    // Test 1: prompt field with imagen-4-fast
    console.log('=== Test 1: prompt field ===');
    const r1 = await apiRequest({
        model: 'google/imagen-4-fast',
        prompt: 'Professional photo of a Brazilian city hall building, modern architecture, blue sky, 4K quality',
        n: 1,
        size: '1024x1024'
    });
    console.log('Status:', r1.status);
    console.log('Result:', JSON.stringify(r1.data, null, 2).substring(0, 2000));

    // Test 2: messages with image_url content type
    console.log('\n=== Test 2: messages + prompt ===');
    const r2 = await apiRequest({
        model: 'google/imagen-4-fast',
        prompt: 'Professional photo of a Brazilian city hall building',
        messages: [{ role: 'user', content: 'Generate image' }],
        n: 1,
        size: '1024x1024'
    });
    console.log('Status:', r2.status);
    console.log('Result:', JSON.stringify(r2.data, null, 2).substring(0, 2000));

    // Test 3: just prompt and model, minimal
    console.log('\n=== Test 3: minimal with gpt-image-1 ===');
    const r3 = await apiRequest({
        model: 'openai/gpt-image-1',
        prompt: 'A beautiful sunset over a Brazilian coastal city'
    });
    console.log('Status:', r3.status);
    console.log('Result:', JSON.stringify(r3.data, null, 2).substring(0, 2000));

    // Test 4: seedream
    console.log('\n=== Test 4: seedream-4.5 ===');
    const r4 = await apiRequest({
        model: 'bytedance/seedream-4.5',
        prompt: 'Professional photo of animal welfare, dogs and cats in a shelter, warm and caring atmosphere'
    });
    console.log('Status:', r4.status);
    console.log('Result:', JSON.stringify(r4.data, null, 2).substring(0, 2000));
}

main().catch(console.error);
