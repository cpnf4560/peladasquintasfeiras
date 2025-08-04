const http = require('http');

function testEquipasGeneration() {
  console.log('🏆 Testando geração de equipas equilibradas...');
  
  // Primeiro, acessar a página de convocatória
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/convocatoria',
    method: 'GET'
  }, (res) => {
    console.log('✅ Página de convocatória acessível');
    console.log(`Status: ${res.statusCode}`);
    
    if (res.statusCode === 200) {
      console.log('✅ Convocatória carregada com sucesso');
      
      // Testar a geração de equipas
      console.log('🔄 Testando geração de equipas...');
      
      const postData = '';
      const equipasReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/convocatoria/confirmar-equipas',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (equipasRes) => {
        console.log(`Status da geração de equipas: ${equipasRes.statusCode}`);
        
        if (equipasRes.statusCode === 200) {
          console.log('✅ Equipas geradas com sucesso!');
        } else if (equipasRes.statusCode === 302) {
          console.log('✅ Redirecionamento após geração de equipas');
        } else {
          console.log('❌ Erro na geração de equipas');
        }
      });
      
      equipasReq.on('error', (err) => {
        console.error('❌ Erro na requisição de equipas:', err.message);
      });
      
      equipasReq.write(postData);
      equipasReq.end();
      
    } else {
      console.log('❌ Erro ao acessar convocatória');
    }
  });
  
  req.on('error', (err) => {
    console.error('❌ Erro na conexão:', err.message);
    console.log('Certifique-se de que o servidor está rodando em http://localhost:3000');
  });
  
  req.end();
}

// Verificar se o servidor está rodando
const serverCheck = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
}, (res) => {
  console.log('✅ Servidor detectado, iniciando testes...');
  testEquipasGeneration();
});

serverCheck.on('error', (err) => {
  console.log('❌ Servidor não está rodando. Inicie com: npm start');
  console.log('Erro:', err.message);
});

serverCheck.end();
