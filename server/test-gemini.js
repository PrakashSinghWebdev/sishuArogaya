require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    
    const prompt = `You are a child health assistant. User asks: "What vaccines should my 6 week old baby get?" Respond concisely with Indian vaccination schedule.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ GEMINI API TEST PASSED!');
    console.log('Response:', text);
    console.log('\\nKey loaded successfully from .env');
  } catch (error) {
    console.error('❌ GEMINI API TEST FAILED:', error.message);
    if (error.status === 401) {
      console.log('🔑 Check API key in server/.env');
    } else if (error.status === 429) {
      console.log('⏳ Rate limit - wait and retry');
    }
  }
}

testGemini();

