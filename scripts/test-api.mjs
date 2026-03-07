import OpenAI from 'openai';

const client = new OpenAI({
    baseURL: 'https://api.apifree.ai/v1',
    apiKey: 'sk-p2myBAHWMKKbs1G7EiCnBmW4nB6Te'
});

// Test: use chat/completions endpoint with image model
async function testChat() {
    console.log('Testing chat/completions with imagen-4-fast...');
    try {
        const result = await client.chat.completions.create({
            model: 'google/imagen-4-fast',
            messages: [
                { role: 'user', content: 'Generate a professional photo of a Brazilian city hall building, modern architecture, blue sky, 4K' }
            ],
            max_tokens: 1024
        });
        console.log('✅ Chat result:', JSON.stringify(result, null, 2));
    } catch (err) {
        console.log('❌ Chat failed:', err.status, err.message);
        if (err.error) console.log('Error detail:', JSON.stringify(err.error, null, 2));
    }
}

// Also test with a known text model to verify API works
async function testTextModel() {
    console.log('\nTesting chat/completions with a text model...');
    try {
        const result = await client.chat.completions.create({
            model: 'google/gemini-2.0-flash',
            messages: [
                { role: 'user', content: 'What is the correct API endpoint path for generating images with ApiFree.ai? Reply in 2 sentences.' }
            ],
            max_tokens: 200
        });
        console.log('✅ Text result:', result.choices[0].message.content);
    } catch (err) {
        console.log('❌ Text failed:', err.status, err.message);
    }
}

testChat();
testTextModel();
