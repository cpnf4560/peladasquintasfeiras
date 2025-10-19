// Adicionar jogadores faltantes no localhost
const { db, USE_POSTGRES } = require('./db');

console.log('🔧 ADICIONANDO JOGADORES FALTANTES\n');
console.log('Ambiente:', USE_POSTGRES ? 'PostgreSQL (Render)' : 'SQLite (Localhost)');
console.log('='.repeat(50));

const jogadoresFaltantes = [
  'Filipe Garcês',
  'Leonardo Sousa'
];

// Função para adicionar um jogador
function adicionarJogador(nome) {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO jogadores (nome, suspenso) VALUES (?, 0)',
      [nome],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

// Função para obter ID do jogador
function obterIdJogador(nome) {
  return new Promise((resolve, reject) => {
    db.query(
      'SELECT id FROM jogadores WHERE nome = ?',
      [nome],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result[0]?.id);
        }
      }
    );
  });
}

// Função para adicionar à convocatória
function adicionarConvocatoria(jogadorId, posicao) {
  return new Promise((resolve, reject) => {
    db.query(
      `INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado) 
       VALUES (?, 'reserva', ?, 0)`,
      [jogadorId, posicao],
      (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      }
    );
  });
}

// Função principal
async function main() {
  try {
    // 1. Verificar quantos jogadores existem
    db.query('SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0', [], async (err, result) => {
      if (err) {
        console.error('❌ Erro:', err);
        process.exit(1);
      }

      console.log(`\n📊 Total atual: ${result[0].total} jogadores\n`);

      // 2. Verificar quais faltantes já existem
      db.query(
        'SELECT nome FROM jogadores WHERE nome IN (?, ?)',
        jogadoresFaltantes,
        async (err, existentes) => {
          if (err) {
            console.error('❌ Erro:', err);
            process.exit(1);
          }

          const nomesExistentes = existentes.map(j => j.nome);
          const aAdicionar = jogadoresFaltantes.filter(j => !nomesExistentes.includes(j));

          if (aAdicionar.length === 0) {
            console.log('✅ Todos os jogadores já existem!\n');
          } else {
            console.log('📝 Adicionando jogadores:\n');

            let posicao = 9;
            for (const nome of aAdicionar) {
              try {
                // Adicionar jogador
                await adicionarJogador(nome);
                console.log(`✅ ${nome} - adicionado`);

                // Obter ID
                const id = await obterIdJogador(nome);

                // Adicionar à convocatória
                await adicionarConvocatoria(id, posicao);
                console.log(`   └─ Adicionado à convocatória (reserva #${posicao})`);

                posicao++;
              } catch (error) {
                console.error(`❌ Erro ao adicionar ${nome}:`, error.message);
              }
            }
          }

          // 3. Verificação final
          db.query('SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0', [], (err, result) => {
            if (err) {
              console.error('❌ Erro:', err);
              process.exit(1);
            }

            console.log('\n' + '='.repeat(50));
            console.log(`🎉 TOTAL FINAL: ${result[0].total} jogadores`);

            // Listar todos
            db.query('SELECT nome FROM jogadores WHERE COALESCE(suspenso, 0) = 0 ORDER BY nome', [], (err, jogadores) => {
              if (err) {
                console.error('❌ Erro:', err);
                process.exit(1);
              }

              console.log('\n📋 Lista completa:\n');
              jogadores.forEach((j, i) => {
                console.log(`${(i + 1).toString().padStart(2, '0')}. ${j.nome}`);
              });

              console.log('\n✅ Processo concluído!');
              process.exit(0);
            });
          });
        }
      );
    });
  } catch (error) {
    console.error('❌ Erro geral:', error);
    process.exit(1);
  }
}

main();
