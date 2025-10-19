const { db } = require('./db');

// Ordem definida no WhatsApp
const ordemColetes = [
  'Rogério',      // 02/10 - já levou
  'Cesaro',       // 09/10 - já levou  
  'Carlos Silva', // 16/10 - tem atualmente
  'Nuno',
  'Joel',
  'Carlos Cruz',
  'Joaquim',
  'Ismael',
  'João Couto',
  'Rui',
  'Ricardo',
  'Valter',
  'Serafim',
  'Hugo',
  'Paulo',
  'Flávio',
  'Manuel',
  'Pedro'
];

async function setupColetesOrdem() {
  console.log('🔄 Configurando ordem dos coletes...\n');

  // 1. Buscar todos os jogadores
  db.query('SELECT id, nome FROM jogadores', [], async (err, jogadores) => {
    if (err) {
      console.error('❌ Erro ao buscar jogadores:', err);
      return;
    }

    console.log(`📋 ${jogadores.length} jogadores encontrados\n`);

    // 2. Limpar convocatória atual
    db.query('DELETE FROM convocatoria', [], (err) => {
      if (err) {
        console.error('❌ Erro ao limpar convocatória:', err);
        return;
      }

      console.log('✅ Convocatória limpa\n');

      // 3. Inserir nova ordem
      let inseridos = 0;
      ordemColetes.forEach((nomeOrdem, index) => {
        const jogador = jogadores.find(j => {
          const nomeJogador = j.nome.toLowerCase().trim();
          const nomeBusca = nomeOrdem.toLowerCase().trim();
          return nomeJogador === nomeBusca || 
                 nomeJogador.includes(nomeBusca) ||
                 nomeBusca.includes(nomeJogador);
        });

        if (jogador) {
          const posicao = index + 1;
          const tipo = posicao <= 10 ? 'convocado' : 'reserva';
          
          db.query(
            'INSERT INTO convocatoria (jogador_id, posicao, tipo) VALUES (?, ?, ?)',
            [jogador.id, posicao, tipo],
            (err) => {
              if (err) {
                console.error(`❌ Erro ao inserir ${jogador.nome}:`, err);
              } else {
                inseridos++;
                console.log(`✅ ${posicao}º - ${jogador.nome} (${tipo})`);
                
                if (inseridos === ordemColetes.length) {
                  console.log(`\n✅ ${inseridos} jogadores configurados com sucesso!\n`);
                  setupHistoricoColetes(jogadores);
                }
              }
            }
          );
        } else {
          console.log(`⚠️  Jogador não encontrado: ${nomeOrdem}`);
        }
      });
    });
  });
}

function setupHistoricoColetes(jogadores) {
  console.log('🔄 Configurando histórico de coletes...\n');

  // Limpar histórico existente
  db.query('DELETE FROM coletes', [], (err) => {
    if (err) {
      console.error('❌ Erro ao limpar histórico:', err);
      return;
    }

    console.log('✅ Histórico limpo\n');

    // Rogério - levou em 02/10
    const rogerio = jogadores.find(j => j.nome.toLowerCase().includes('rogério'));
    if (rogerio) {
      db.query(
        'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
        [rogerio.id, '2025-10-02', '2025-10-09'],
        (err) => {
          if (err) {
            console.error('❌ Erro ao registar Rogério:', err);
          } else {
            console.log('✅ Rogério - levou em 02/10, devolveu em 09/10');
          }
        }
      );
    }

    // Cesaro - levou em 09/10
    const cesaro = jogadores.find(j => j.nome.toLowerCase().includes('cesaro'));
    if (cesaro) {
      db.query(
        'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
        [cesaro.id, '2025-10-09', '2025-10-16'],
        (err) => {
          if (err) {
            console.error('❌ Erro ao registar Cesaro:', err);
          } else {
            console.log('✅ Cesaro - levou em 09/10, devolveu em 16/10');
          }
        }
      );
    }

    // Carlos Silva - tem atualmente desde 16/10
    const carlosSilva = jogadores.find(j => j.nome.toLowerCase().includes('carlos silva'));
    if (carlosSilva) {
      db.query(
        'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
        [carlosSilva.id, '2025-10-16', null],
        (err) => {
          if (err) {
            console.error('❌ Erro ao registar Carlos Silva:', err);
          } else {
            console.log('✅ Carlos Silva - tem atualmente desde 16/10');
            console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!\n');
            db.close();
          }
        }
      );
    }
  });
}

// Executar
setupColetesOrdem();
