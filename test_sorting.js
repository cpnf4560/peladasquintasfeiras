const http = require('http');

function testSortingEndpoint(sortParam, description) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: `/estatisticas?ano=2025&ordenacao=${sortParam}`,
      method: 'GET'
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`\n=== TEST: ${description} ===`);
        console.log(`Status Code: ${res.statusCode}`);
        
        if (res.statusCode === 200) {
          // Check if the sorting parameter is correctly reflected in the response
          const hasCorrectSelection = data.includes(`value="${sortParam}" selected`);
          const hasCorrectCriteria = sortParam === 'percentagem' 
            ? data.includes('% de Vitórias</strong> (critério principal)')
            : data.includes('Pontos:</strong> Vitória = 3pts');
          
          console.log(`✅ Correct dropdown selection: ${hasCorrectSelection}`);
          console.log(`✅ Correct criteria display: ${hasCorrectCriteria}`);
          
          if (hasCorrectSelection && hasCorrectCriteria) {
            console.log(`✅ ${description} - PASS`);
          } else {
            console.log(`❌ ${description} - FAIL`);
          }
        } else {
          console.log(`❌ ${description} - HTTP Error: ${res.statusCode}`);
        }
        
        resolve();
      });
    });

    req.on('error', (err) => {
      console.log(`❌ ${description} - Request Error:`, err.message);
      resolve();
    });

    req.end();
  });
}

async function runTests() {
  console.log('🚀 Testing Sorting Functionality...\n');
  
  await testSortingEndpoint('pontos', 'Sorting by Points (Default)');
  await testSortingEndpoint('percentagem', 'Sorting by Win Percentage');
  
  console.log('\n🏁 Testing completed!');
}

// Check if server is running first
const serverCheck = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
}, (res) => {
  console.log('✅ Server is running, starting tests...');
  runTests();
});

serverCheck.on('error', (err) => {
  console.log('❌ Server is not running. Please start the server first.');
  console.log('Run: npm start');
});

serverCheck.end();
