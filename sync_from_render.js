// Sincronizar dados do Render (PostgreSQL) para localhost (SQLite)
const { db, USE_POSTGRES } = require('./db');

console.log('🔄 SINCRONIZANDO DADOS DO RENDER PARA LOCALHOST\n');

if (USE_POSTGRES) {
  console.log('❌ Este script deve ser executado no LOCALHOST (SQLite)');
  console.log('💡 Execute: SET USE_POSTGRES=false');
  process.exit(1);
}

console.log('✅ Executando em SQLite (localhost)\n');

// Dados corretos do Render (os 20 jogadores)
const jogadoresRender = [
  { nome: 'Rogério Silva' },
  { nome: 'Césaro Cruz' },
  { nome: 'Carlos Silva' },
  { nome: 'Nuno Ferreira' },
  { nome: 'Joel Almeida' },
  { nome: 'Carlos Correia' },
  { nome: 'Joaquim Rocha' },
  { nome: 'Ismael Campos' },
  { nome: 'João Couto' },
  { nome: 'Rui Lopes' },
  { nome: 'Ricardo Sousa' },
  { nome: 'Valter Pinho' },
  { nome: 'Serafim Sousa' },
  { nome: 'Hugo Belga' },
  { nome: 'Paulo Pinto' },
  { nome: 'Flávio Silva' },
  { nome: 'Manuel Rocha' },
  { nome: 'Pedro Lopes' },
  { nome: 'Filipe Garcês' },  // ← FALTA NO LOCALHOST
  { nome: 'Leonardo Sousa' }   // ← FALTA NO LOCALHOST
];

console.log('📋 Jogadores esperados:', jogadoresRender.length);

// 1. Verificar quem falta
db.query('SELECT nome FROM jogadores ORDER BY nome', [], (err, jogadoresLocais) => {
  if (err) {
    console.error('❌ Erro ao buscar jogadores locais:', err);
    process.exit(1);
  }

  console.log('📊 Jogadores no localhost:', jogadoresLocais.length);

  const nomesLocais = jogadoresLocais.map(j => j.nome);
  const jogadoresFaltantes = jogadoresRender.filter(j => !nomesLocais.includes(j.nome));

  if (jogadoresFaltantes.length === 0) {
    console.log('✅ Todos os jogadores já existem no localhost!');
    verificarConvocatoria();
  } else {
    console.log(`\n🔍 Jogadores faltantes: ${jogadoresFaltantes.length}`);
    jogadoresFaltantes.forEach(j => console.log(`   ❌ ${j.nome}`));

    console.log('\n➕ Adicionando jogadores faltantes...');
    
    const inserts = jogadoresFaltantes.map((jogador) => {
      return new Promise((resolve) => {
        db.query(
          'INSERT INTO jogadores (nome, suspenso) VALUES (?, 0)',
          [jogador.nome],
          (err) => {
            if (err) {
              console.error(`   ❌ Erro ao adicionar ${jogador.nome}:`, err.message);
            } else {
              console.log(`   ✅ ${jogador.nome} adicionado`);
            }
            resolve();
          }
        );
      });
    });

    Promise.all(inserts).then(() => {
      console.log('\n✅ Jogadores sincronizados!');
      verificarConvocatoria();
    });
  }
});

function verificarConvocatoria() {
  console.log('\n🔍 Verificando convocatória...');

  // Verificar quantos estão na convocatória
  db.query('SELECT COUNT(*) as total FROM convocatoria', [], (err, result) => {
    if (err) {
      console.error('❌ Erro ao verificar convocatória:', err);
      process.exit(1);
    }

    const totalConvocatoria = result[0].total;
    console.log(`📊 Jogadores na convocatória: ${totalConvocatoria}`);

    // Verificar quem está fora
    db.query(`
      SELECT j.id, j.nome 
      FROM jogadores j 
      LEFT JOIN convocatoria c ON j.id = c.jogador_id 
      WHERE COALESCE(j.suspenso, 0) = 0 AND c.jogador_id IS NULL
      ORDER BY j.nome
    `, [], (err, jogadoresForaConvocatoria) => {
      if (err) {
        console.error('❌ Erro ao verificar jogadores fora:', err);
        process.exit(1);
      }

      if (jogadoresForaConvocatoria.length > 0) {
        console.log(`\n⚠️  ${jogadoresForaConvocatoria.length} jogadores fora da convocatória:`);
        jogadoresForaConvocatoria.forEach(j => console.log(`   - ${j.nome}`));

        console.log('\n➕ Adicionando à convocatória como reservas...');

        // Buscar última posição de reserva
        db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', [], (err, result) => {
          let proximaPosicao = (result && result[0] && result[0].max_pos) ? result[0].max_pos + 1 : 1;

          const inserts = jogadoresForaConvocatoria.map((jogador) => {
            return new Promise((resolve) => {
              db.query(
                'INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado) VALUES (?, "reserva", ?, 0)',
                [jogador.id, proximaPosicao++],
                (err) => {
                  if (err) {
                    console.error(`   ❌ Erro ao adicionar ${jogador.nome}:`, err.message);
                  } else {
                    console.log(`   ✅ ${jogador.nome} adicionado como reserva #${proximaPosicao - 1}`);
                  }
                  resolve();
                }
              );
            });
          });

          Promise.all(inserts).then(() => {
            console.log('\n✅ Convocatória sincronizada!');
            mostrarResumo();
          });
        });
      } else {
        console.log('✅ Todos os jogadores estão na convocatória!');
        mostrarResumo();
      }
    });
  });
}

function mostrarResumo() {
  console.log('\n📊 RESUMO FINAL:\n');

  db.query('SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0', [], (err, result) => {
    console.log(`✅ Total de jogadores ativos: ${result[0].total}`);

    db.query('SELECT tipo, COUNT(*) as total FROM convocatoria GROUP BY tipo', [], (err, result) => {
      console.log('\n📋 Convocatória:');
      result.forEach(r => {
        console.log(`   ${r.tipo === 'convocado' ? '🏆' : '⏳'} ${r.tipo}: ${r.total}`);
      });

      db.query('SELECT COUNT(*) as total FROM faltas_historico', [], (err, result) => {
        console.log(`\n🚫 Faltas registadas: ${result[0].total}`);
        console.log('\n✅ SINCRONIZAÇÃO COMPLETA!');
        console.log('💡 Agora podes executar: npm start');
        process.exit(0);
      });
    });
  });
}
