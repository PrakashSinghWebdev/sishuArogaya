const axios = require('axios');

async function testLogin() {
  const API_URL = 'http://localhost:5000/api/auth/login';
  
  console.log('🧪 Testing login endpoint...\n');
  
  const credentials = {
    email: 'parent@sishu.gov.in',
    password: 'Parent@123',
    role: 'parent'
  };
  
  try {
    console.log('📤 Sending request to:', API_URL);
    console.log('📋 Credentials:', { email: credentials.email, role: credentials.role });
    
    const response = await axios.post(API_URL, credentials, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('\n✅ LOGIN SUCCESSFUL!\n');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('\n❌ LOGIN FAILED\n');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data.message);
    } else if (error.code === 'ECONNREFUSED') {
      console.log('❌ Cannot connect to server at http://localhost:5000');
      console.log('   Make sure backend is running: cd server && npm run dev');
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLogin();
