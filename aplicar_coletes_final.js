const { db } = require('./db');

console.log('🔄 Limpando e reconfigurando coletes...\n');

// Mapear nomes exatos - CORRIGIDOS
const jogadoresOrdem = [
  { busca: 'Rogério', posicao: 1 },
  { busca: 'Césaro', posicao: 2 },
  { busca: 'Carlos Silva', posicao: 3 },
  { busca: 'Nuno', posicao: 4 },
  { busca: 'Joel', posicao: 5 },
  { busca: 'Carlos Correia', posicao: 6 },
  { busca: 'Joaquim', posicao: 7 },
  { busca: 'Ismael', posicao: 8 },
  { busca: 'João', posicao: 9 },
  { busca: 'Rui', posicao: 10 },
  { busca: 'Ricardo', posicao: 11 },
  { busca: 'Valter', posicao: 12 },
  { busca: 'Leonardo', posicao: 13 },
  { busca: 'Hugo', posicao: 14 },
  { busca: 'Paulo', posicao: 15 },
  { busca: 'Flávio', posicao: 16 },
  { busca: 'Manuel', posicao: 17 },
  { busca: 'Pedro', posicao: 18 }
];

// Passo 1: Limpar convocatória
db.query('DELETE FROM convocatoria', [], (err) => {
  if (err) {
    console.error('❌ Erro ao limpar convocatória:', err);
    process.exit(1);
  }
  console.log('✅ Convocatória limpa');

  // Passo 2: Limpar coletes
  db.query('DELETE FROM coletes', [], (err) => {
    if (err) {
      console.error('❌ Erro ao limpar coletes:', err);
      process.exit(1);
    }
    console.log('✅ Histórico de coletes limpo\n');

    // Passo 3: Buscar todos os jogadores
    db.query('SELECT id, nome FROM jogadores ORDER BY nome', [], (err, jogadores) => {
      if (err) {
        console.error('❌ Erro ao buscar jogadores:', err);
        process.exit(1);
      }

      console.log('📋 Configurando nova ordem:\n');

      let inseridos = 0;

      jogadoresOrdem.forEach(item => {
        // Buscar jogador que melhor corresponda
        let jogador = jogadores.find(j => {
          const nome = j.nome.toLowerCase();
          const busca = item.busca.toLowerCase();
          
          // Match exato
          if (nome === busca) return true;
          
          // Match por partes do nome
          const partes = busca.split(' ');
          return partes.every(parte => nome.includes(parte));
        });

        if (!jogador) {
          console.log(`⚠️  ${item.posicao}º - "${item.busca}" não encontrado`);
          return;
        }

        const tipo = item.posicao <= 10 ? 'convocado' : 'reserva';

        db.query(
          'INSERT INTO convocatoria (jogador_id, posicao, tipo) VALUES (?, ?, ?)',
          [jogador.id, item.posicao, tipo],
          (err) => {
            if (err) {
              console.error(`❌ Erro ao inserir ${jogador.nome}:`, err);
            } else {
              console.log(`✅ ${item.posicao}º - ${jogador.nome} (${tipo})`);
              inseridos++;

              // Quando todos estiverem inseridos, inserir histórico de coletes
              if (inseridos === jogadoresOrdem.length) {
                setTimeout(() => inserirHistoricoColetes(jogadores), 500);
              }
            }
          }
        );
      });
    });
  });
});

function inserirHistoricoColetes(jogadores) {
  console.log('\n📊 Configurando histórico de coletes:\n');

  // Rogério - levou em 02/10/2024, devolveu em 09/10/2024
  const rogerio = jogadores.find(j => j.nome.toLowerCase().includes('rogério'));
  
  // Césaro - levou em 09/10/2024, devolveu em 16/10/2024
  const cesaro = jogadores.find(j => j.nome.toLowerCase().includes('césaro'));
  
  // Carlos Silva - tem atualmente desde 16/10/2024
  const carlosSilva = jogadores.find(j => {
    const nome = j.nome.toLowerCase();
    return nome.includes('carlos') && nome.includes('silva');
  });

  let historicoInserido = 0;
  const totalHistorico = 3;

  if (rogerio) {
    db.query(
      'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
      [rogerio.id, '2024-10-02', '2024-10-09'],
      (err) => {
        if (err) {
          console.error('❌ Erro ao registar Rogério:', err);
        } else {
          console.log(`✅ ${rogerio.nome} - levou em 02/10/2024, devolveu em 09/10/2024`);
        }
        historicoInserido++;
        if (historicoInserido === totalHistorico) finalizarVerificacao();
      }
    );
  } else {
    console.log('⚠️  Rogério não encontrado');
    historicoInserido++;
  }

  if (cesaro) {
    db.query(
      'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
      [cesaro.id, '2024-10-09', '2024-10-16'],
      (err) => {
        if (err) {
          console.error('❌ Erro ao registar Césaro:', err);
        } else {
          console.log(`✅ ${cesaro.nome} - levou em 09/10/2024, devolveu em 16/10/2024`);
        }
        historicoInserido++;
        if (historicoInserido === totalHistorico) finalizarVerificacao();
      }
    );
  } else {
    console.log('⚠️  Césaro não encontrado');
    historicoInserido++;
  }

  if (carlosSilva) {
    db.query(
      'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
      [carlosSilva.id, '2024-10-16', null],
      (err) => {
        if (err) {
          console.error('❌ Erro ao registar Carlos Silva:', err);
        } else {
          console.log(`✅ ${carlosSilva.nome} - tem atualmente desde 16/10/2024`);
        }
        historicoInserido++;
        if (historicoInserido === totalHistorico) finalizarVerificacao();
      }
    );
  } else {
    console.log('⚠️  Carlos Silva não encontrado');
    historicoInserido++;
  }
}

function finalizarVerificacao() {
  setTimeout(() => {
    console.log('\n🔍 VERIFICAÇÃO FINAL:\n');
    
    db.query(
      `SELECT c.posicao, c.tipo, j.nome
       FROM convocatoria c
       JOIN jogadores j ON c.jogador_id = j.id
       ORDER BY c.posicao`,
      [],
      (err, resultado) => {
        if (err) {
          console.error('❌ Erro na verificação:', err);
          process.exit(1);
        }

        console.log('CONVOCATÓRIA CONFIGURADA:');
        resultado.forEach(r => {
          const emoji = r.tipo === 'convocado' ? '🟢' : '⚪';
          console.log(`  ${emoji} ${r.posicao}º - ${r.nome}`);
        });

        db.query(
          `SELECT j.nome, c.data_levou, c.data_devolveu
           FROM coletes c
           JOIN jogadores j ON c.jogador_id = j.id
           ORDER BY c.data_levou`,
          [],
          (err, historico) => {
            if (err) {
              console.error('❌ Erro ao verificar histórico:', err);
              process.exit(1);
            }

            console.log('\nHISTÓRICO DE COLETES:');
            historico.forEach(h => {
              const status = h.data_devolveu ? 
                `Devolveu: ${new Date(h.data_devolveu).toLocaleDateString('pt-PT')}` :
                '✅ TEM ATUALMENTE';
              console.log(`  ${h.nome} - ${new Date(h.data_levou).toLocaleDateString('pt-PT')} | ${status}`);
            });

            console.log('\n🎉 CONFIGURAÇÃO APLICADA COM SUCESSO!\n');
            process.exit(0);
          }
        );
      }
    );
  }, 500);
}
