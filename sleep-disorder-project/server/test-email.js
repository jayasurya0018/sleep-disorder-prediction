const jwt = require('jsonwebtoken');
const http = require('http');

// Generate token
const token = jwt.sign(
  { userId: '69897e3321ee6158b3d490e0', email: 'viper637411@gmail.com' },
  'secretkey',
  { expiresIn: '7d' }
);

console.log('✅ Generated Token\n');

// Make request to email test endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/email/test',
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('📧 Email Test Response:');
    console.log('Status:', res.statusCode);
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch (e) {
      console.log(data);
    }
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Request Error:', error.message);
  process.exit(1);
});

req.end();
