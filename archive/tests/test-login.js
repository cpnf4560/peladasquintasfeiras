// Test login endpoint
const http = require('http');
const querystring = require('querystring');

const postData = querystring.stringify({
  'username': 'admin1',
  'password': 'admin123'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log(`HEADERS: ${JSON.stringify(res.headers)}`);
  
  res.setEncoding('utf8');
  let body = '';
  
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 302) {
      console.log('✅ Login successful! Redirect to:', res.headers.location);
    } else {
      console.log('❌ Login failed');
      console.log('Response:', body.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error(`❌ Error: ${e.message}`);
});

req.write(postData);
req.end();
