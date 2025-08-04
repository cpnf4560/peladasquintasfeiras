// Simple test to verify sorting functionality
console.log('🚀 Testing sorting functionality...');

const testUrls = [
  'http://localhost:3000/estatisticas?ano=2025&ordenacao=pontos',
  'http://localhost:3000/estatisticas?ano=2025&ordenacao=percentagem'
];

async function testUrl(url, testName) {
  try {
    console.log(`\n=== ${testName} ===`);
    console.log(`URL: ${url}`);
    
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const html = await response.text();
      
      // Check if sorting parameter is correctly applied
      const hasCorrectSelection = url.includes('percentagem') 
        ? html.includes('value="percentagem" selected')
        : html.includes('value="pontos" selected');
      
      // Check if criteria display is correct
      const hasCorrectCriteria = url.includes('percentagem')
        ? html.includes('% de Vitórias</span></h4>')
        : html.includes('Pontos</span></h4>');
      
      console.log(`✅ Correct dropdown selection: ${hasCorrectSelection}`);
      console.log(`✅ Correct criteria display: ${hasCorrectCriteria}`);
      
      if (hasCorrectSelection && hasCorrectCriteria) {
        console.log(`✅ ${testName} - PASS`);
      } else {
        console.log(`❌ ${testName} - FAIL`);
      }
    } else {
      console.log(`❌ ${testName} - HTTP ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ ${testName} - Error: ${error.message}`);
  }
}

async function runTests() {
  await testUrl(testUrls[0], 'Sorting by Points');
  await testUrl(testUrls[1], 'Sorting by Win Percentage');
  console.log('\n🏁 Testing completed!');
}

// Check if fetch is available (Node 18+)
if (typeof fetch === 'undefined') {
  console.log('❌ This test requires Node.js 18+ with built-in fetch');
  console.log('Current Node version:', process.version);
} else {
  runTests();
}
