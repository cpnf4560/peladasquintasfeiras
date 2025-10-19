// Diagnóstico completo da convocatória
const { db } = require('./db');

console.log('🔍 DIAGNÓSTICO COMPLETO DA CONVOCATÓRIA\n');
console.log('═'.repeat(70));

// 1. Total de jogadores
db.query('SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0', [], (err, result) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
  
  console.log(`\n1️⃣ JOGADORES NA BASE DE DADOS: ${result[0].total}`);
  
  // 2. Total na convocatória
  db.query('SELECT COUNT(*) as total FROM convocatoria', [], (err, result) => {
    if (err) {
      console.error('❌ Erro:', err);
      process.exit(1);
    }
    
    console.log(`2️⃣ TOTAL NA CONVOCATÓRIA: ${result[0].total}`);
    
    // 3. Por tipo
    db.query(`
      SELECT tipo, COUNT(*) as total 
      FROM convocatoria 
      GROUP BY tipo 
      ORDER BY tipo
    `, [], (err, result) => {
      if (err) {
        console.error('❌ Erro:', err);
        process.exit(1);
      }
      
      console.log(`\n3️⃣ POR TIPO:`);
      result.forEach(r => {
        console.log(`   - ${r.tipo}: ${r.total}`);
      });
      
      // 4. Listar todos na convocatória com nome
      db.query(`
        SELECT c.id, c.jogador_id, j.nome, c.tipo, c.posicao
        FROM convocatoria c
        LEFT JOIN jogadores j ON c.jogador_id = j.id
        ORDER BY c.tipo, c.posicao
      `, [], (err, lista) => {
        if (err) {
          console.error('❌ Erro:', err);
          process.exit(1);
        }
        
        console.log(`\n4️⃣ LISTA COMPLETA NA CONVOCATÓRIA (${lista.length}):`);
        console.log('─'.repeat(70));
        
        const convocados = lista.filter(l => l.tipo === 'convocado');
        const reservas = lista.filter(l => l.tipo === 'reserva');
        
        console.log('\n📌 CONVOCADOS:');
        convocados.forEach(c => {
          console.log(`   ${c.posicao}. ${c.nome || '❌ JOGADOR REMOVIDO'} (ID: ${c.jogador_id})`);
        });
        
        console.log('\n📌 RESERVAS:');
        reservas.forEach(r => {
          console.log(`   ${r.posicao}. ${r.nome || '❌ JOGADOR REMOVIDO'} (ID: ${r.jogador_id})`);
        });
        
        // 5. Verificar Filipe e Leonardo especificamente
        console.log('\n' + '═'.repeat(70));
        console.log('5️⃣ VERIFICANDO FILIPE GARCÊS E LEONARDO SOUSA:');
        console.log('─'.repeat(70));
        
        db.query(`
          SELECT id, nome FROM jogadores 
          WHERE nome IN ('Filipe Garcês', 'Leonardo Sousa')
          ORDER BY nome
        `, [], (err, jogadores) => {
          if (err) {
            console.error('❌ Erro:', err);
            process.exit(1);
          }
          
          if (jogadores.length === 0) {
            console.log('\n❌ NENHUM DOS DOIS JOGADORES ENCONTRADO NA BASE!');
            process.exit(1);
          }
          
          console.log(`\n✅ Encontrados ${jogadores.length} jogador(es):\n`);
          
          let checks = 0;
          jogadores.forEach(jogador => {
            console.log(`🔍 ${jogador.nome} (ID: ${jogador.id})`);
            
            // Verificar se está na convocatória
            db.query(`
              SELECT c.*, j.nome as nome_jogador
              FROM convocatoria c
              LEFT JOIN jogadores j ON c.jogador_id = j.id
              WHERE c.jogador_id = ?
            `, [jogador.id], (err, conv) => {
              if (err) {
                console.error('   ❌ Erro ao verificar:', err);
                return;
              }
              
              if (conv.length > 0) {
                console.log(`   ✅ ESTÁ na convocatória`);
                console.log(`      Tipo: ${conv[0].tipo}`);
                console.log(`      Posição: ${conv[0].posicao}`);
                console.log(`      Confirmado: ${conv[0].confirmado ? 'Sim' : 'Não'}`);
              } else {
                console.log(`   ❌ NÃO ESTÁ na convocatória - PROBLEMA IDENTIFICADO!`);
                console.log(`      → Este jogador precisa ser adicionado`);
              }
              
              checks++;
              
              if (checks === jogadores.length) {
                // 6. Verificar se há registros órfãos (sem jogador)
                setTimeout(() => {
                  console.log('\n' + '═'.repeat(70));
                  console.log('6️⃣ VERIFICANDO REGISTROS ÓRFÃOS:');
                  console.log('─'.repeat(70));
                  
                  db.query(`
                    SELECT c.*, j.nome
                    FROM convocatoria c
                    LEFT JOIN jogadores j ON c.jogador_id = j.id
                    WHERE j.id IS NULL
                  `, [], (err, orfaos) => {
                    if (err) {
                      console.error('❌ Erro:', err);
                      process.exit(1);
                    }
                    
                    if (orfaos.length > 0) {
                      console.log(`\n⚠️  ENCONTRADOS ${orfaos.length} REGISTROS ÓRFÃOS (sem jogador):`);
                      orfaos.forEach(o => {
                        console.log(`   - ID convocatória: ${o.id}, jogador_id: ${o.jogador_id} (não existe)`);
                      });
                      console.log('\n   → Estes registros devem ser removidos!');
                    } else {
                      console.log('\n✅ Nenhum registro órfão encontrado');
                    }
                    
                    console.log('\n' + '═'.repeat(70));
                    console.log('FIM DO DIAGNÓSTICO');
                    console.log('═'.repeat(70) + '\n');
                    process.exit(0);
                  });
                }, 100);
              }
            });
          });
        });
      });
    });
  });
});
