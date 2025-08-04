const http = require('http');

function testCompleteEquipasFlow() {
  console.log('🏆 Teste completo de equipas equilibradas...');
  
  // Testar geração de equipas
  console.log('1. Testando geração inicial de equipas...');
  
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
    console.log(`✅ Geração de equipas: ${equipasRes.statusCode}`);
    
    if (equipasRes.statusCode === 200) {
      console.log('2. Testando reequilibrar equipas...');
      
      // Testar reequilibrar
      const reequilibrarReq = http.request({
        hostname: 'localhost',
        port: 3000,
        path: '/convocatoria/reequilibrar-equipas',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      }, (reequilibrarRes) => {
        console.log(`✅ Reequilibrar equipas: ${reequilibrarRes.statusCode}`);
        
        console.log('3. Testando troca de jogadores...');
        
        // Simular troca de jogadores (IDs fictícios para teste)
        const trocaData = 'jogador1=1&jogador2=2';
        const trocaReq = http.request({
          hostname: 'localhost',
          port: 3000,
          path: '/convocatoria/trocar-jogadores',
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(trocaData)
          }
        }, (trocaRes) => {
          console.log(`✅ Troca de jogadores: ${trocaRes.statusCode}`);
          console.log('🎉 Todos os testes de funcionalidade completados!');
        });
        
        trocaReq.on('error', (err) => {
          console.log('⚠️ Troca de jogadores:', err.message);
        });
        
        trocaReq.write(trocaData);
        trocaReq.end();
      });
      
      reequilibrarReq.on('error', (err) => {
        console.error('❌ Erro no reequilibrar:', err.message);
      });
      
      reequilibrarReq.write(postData);
      reequilibrarReq.end();
      
    } else {
      console.log('❌ Falha na geração inicial');
    }
  });
  
  equipasReq.on('error', (err) => {
    console.error('❌ Erro na geração de equipas:', err.message);
  });
  
  equipasReq.write(postData);
  equipasReq.end();
}

// Verificar servidor e executar testes
const serverCheck = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
}, (res) => {
  console.log('🚀 Servidor online, iniciando teste completo...');
  testCompleteEquipasFlow();
});

serverCheck.on('error', (err) => {
  console.log('❌ Servidor offline:', err.message);
});

serverCheck.end();
