const { db } = require('./db');
const fs = require('fs');

console.log('🔄 Executando configuração dos coletes...\n');

// Ler o arquivo SQL
const sql = fs.readFileSync('setup_coletes.sql', 'utf8');

// Dividir em comandos individuais
const comandos = sql
  .split(';')
  .map(cmd => cmd.trim())
  .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

let executados = 0;

function executarProximo(index) {
  if (index >= comandos.length) {
    console.log(`\n✅ ${executados} comandos executados com sucesso!\n`);
    
    // Agora executar a verificação
    console.log('📋 VERIFICANDO RESULTADO:\n');
    
    db.query(`
      SELECT c.posicao, c.tipo, j.nome
      FROM convocatoria c
      JOIN jogadores j ON c.jogador_id = j.id
      ORDER BY c.posicao ASC
    `, [], (err, convocados) => {
      if (err) {
        console.error('❌ Erro na verificação:', err);
        db.close();
        return;
      }

      console.log('ORDEM DA CONVOCATÓRIA:');
      convocados.forEach(c => {
        console.log(`  ${c.posicao}º - ${c.nome} (${c.tipo})`);
      });

      db.query(`
        SELECT j.nome, c.data_levou, c.data_devolveu
        FROM coletes c
        JOIN jogadores j ON c.jogador_id = j.id
        ORDER BY c.data_levou ASC
      `, [], (err, historico) => {
        if (err) {
          console.error('❌ Erro na verificação do histórico:', err);
          db.close();
          return;
        }

        console.log('\nHISTÓRICO DE COLETES:');
        historico.forEach(h => {
          const devolveu = h.data_devolveu ? new Date(h.data_devolveu).toLocaleDateString('pt-PT') : 'TEM ATUALMENTE';
          console.log(`  ${h.nome} - Levou: ${new Date(h.data_levou).toLocaleDateString('pt-PT')} | ${devolveu}`);
        });

        console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!\n');
        db.close();
      });
    });
    
    return;
  }

  const comando = comandos[index];
  
  db.query(comando, [], (err) => {
    if (err && !err.message.includes('no such table')) {
      console.error(`❌ Erro no comando ${index + 1}:`, err.message);
    } else {
      executados++;
      if (index % 5 === 0) {
        console.log(`⏳ Executados ${executados}/${comandos.length} comandos...`);
      }
    }
    executarProximo(index + 1);
  });
}

executarProximo(0);
