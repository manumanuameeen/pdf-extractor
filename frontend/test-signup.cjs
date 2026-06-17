const axios = require('axios');

async function testSignup() {
  try {
    const res = await axios.post('http://localhost:5000/api/auth/signup', {
      name: 'Bot Test',
      email: 'test@example.com'
    });
    console.log('SUCCESS:', res.data);
  } catch (err) {
    console.error('ERROR:', err.response ? err.response.data : err.message);
  }
}

testSignup();
