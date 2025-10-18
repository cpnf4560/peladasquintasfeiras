// Script para importar histórico de resultados manualmente
const { db } = require('./db');

const jogos = [
  // Imagem 1  {
    data: '2025-07-31',
    equipa1_golos: 8,
    equipa2_golos: 9,
    equipa1: ['Ismael Campos', 'Joaquim Rocha', 'João Couto', 'Nuno Ferreira', 'Rogério Silva'],
    equipa2: ['Carlos Correia', 'João Couto', 'Ricardo Sousa', 'Rui Lopes', 'Valter Pinho']
  },
  {
    data: '2025-07-24',
    equipa1_golos: 12,
    equipa2_golos: 9,
    equipa1: ['Carlos Correia', 'Filipe Garcês', 'Flávio Silva', 'Joel Almeida', 'João Couto'],
    equipa2: ['Carlos Silva', 'Césaro Cruz', 'Ismael Campos', 'Manuel Rocha', 'Rogério Silva']
  },
  {
    data: '2025-07-17',
    equipa1_golos: 6,
    equipa2_golos: 12,
    equipa1: ['Carlos Silva', 'Flávio Silva', 'João Couto', 'Paulo Pinto', 'Rogério Silva'],
    equipa2: ['Carlos Correia', 'Césaro Cruz', 'Ismael Campos', 'Joel Almeida', 'Manuel Rocha']
  },
  {
    data: '2025-07-10',
    equipa1_golos: 8,
    equipa2_golos: 6,
    equipa1: ['Carlos Silva', 'Flávio Silva', 'João Couto', 'Paulo Pinto', 'Rogério Silva'],
    equipa2: ['Carlos Correia', 'Césaro Cruz', 'Ismael Campos', 'Joel Almeida', 'Manuel Rocha']
  },  {
    data: '2025-07-03',
    equipa1_golos: 8,
    equipa2_golos: 7,
    equipa1: ['Joel Almeida', 'João Couto', 'Leonardo Sousa', 'Paulo Pinto', 'Rui Lopes'],
    equipa2: ['Carlos Correia', 'Césaro Cruz', 'Flávio Silva', 'Ismael Campos', 'Rogério Silva']
  },
  {
    data: '2025-06-26',
    equipa1_golos: 7,
    equipa2_golos: 7,
    equipa1: ['Carlos Correia', 'Flávio Silva', 'João Couto', 'Leonardo Sousa', 'Paulo Pinto'],
    equipa2: ['Filipe Garcês', 'Flávio Silva', 'Nuno Ferreira', 'Pedro Lopes', 'Rogério Silva']
  },
  {
    data: '2025-06-19',
    equipa1_golos: 8,
    equipa2_golos: 8,
    equipa1: ['Carlos Correia', 'Carlos Silva', 'Césaro Cruz', 'João Couto', 'Rogério Silva'],
    equipa2: ['Filipe Garcês', 'Flávio Silva', 'Nuno Ferreira', 'Paulo Pinto', 'Pedro Lopes']
  },  {
    data: '2025-06-12',
    equipa1_golos: 4,
    equipa2_golos: 18,
    equipa1: ['Flávio Silva', 'Nuno Ferreira', 'Pedro Lopes', 'Rogério Silva', 'Rui Lopes'],
    equipa2: ['Carlos Correia', 'Césaro Cruz', 'Joel Almeida', 'João Couto', 'Valter Pinho']
  },
  // Imagem 2  {
    data: '2025-06-05',
    equipa1_golos: 13,
    equipa2_golos: 7,
    equipa1: ['Flávio Silva', 'Joel Almeida', 'Nuno Ferreira', 'Pedro Lopes', 'Rogério Silva'],
    equipa2: ['Carlos Correia', 'Césaro Cruz', 'João Couto', 'Rui Lopes', 'Valter Pinho']
  },
  {
    data: '2025-05-29',
    equipa1_golos: 16,
    equipa2_golos: 8,
    equipa1: ['Césaro Cruz', 'Flávio Silva', 'Ismael Campos', 'Joaquim Rocha', 'Ricardo Sousa'],
    equipa2: ['Carlos Correia', 'Nuno Ferreira', 'Rogério Silva', 'Valter Pinho']
  },  {
    data: '2025-05-22',
    equipa1_golos: 5,
    equipa2_golos: 2,
    equipa1: ['Carlos Silva', 'Césaro Cruz', 'Ismael Campos', 'Nuno Ferreira', 'Rui Lopes'],
    equipa2: ['Carlos Correia', 'Flávio Silva', 'Joaquim Rocha', 'Pedro Lopes', 'Rogério Silva']
  },
  {
    data: '2025-05-15',
    equipa1_golos: 13,
    equipa2_golos: 8,
    equipa1: ['Carlos Correia', 'Carlos Silva', 'Ismael Campos', 'Joel Almeida', 'Nuno Ferreira'],
    equipa2: ['Césaro Cruz', 'Flávio Silva', 'Joaquim Rocha', 'Pedro Lopes', 'Rogério Silva']
  },
  {
    data: '2025-05-01',
    equipa1_golos: 6,
    equipa2_golos: 9,
    equipa1: ['Césaro Cruz', 'Hugo Belga', 'Ismael Campos', 'Joel Almeida', 'Valter Pinho'],
    equipa2: ['Carlos Correia', 'Carlos Silva', 'Flávio Silva', 'Rogério Silva', 'Valter Pinho']
  },
  {
    data: '2025-04-24',
    equipa1_golos: 4,
    equipa2_golos: 7,
    equipa1: ['Césaro Cruz', 'Hugo Belga', 'Ismael Campos', 'Joel Almeida', 'Valter Pinho'],
    equipa2: ['Carlos Correia', 'Carlos Silva', 'Flávio Silva', 'Leonardo Sousa', 'Ricardo Sousa']
  }
];

// Mapeamento de nomes para IDs (será preenchido dinamicamente)
let jogadoresMap = {};

async function getJogadores() {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, nome FROM jogadores', [], (err, jogadores) => {
      if (err) {
        reject(err);
      } else {
        jogadores.forEach(j => {
          jogadoresMap[j.nome] = j.id;
        });
        console.log(`✅ ${jogadores.length} jogadores carregados`);
        resolve();
      }
    });
  });
}

async function insertJogo(jogo) {
  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO jogos (data, equipa1_golos, equipa2_golos) VALUES (?, ?, ?) RETURNING id',
      [jogo.data, jogo.equipa1_golos, jogo.equipa2_golos],
      (err, result) => {
        if (err) {
          console.error(`❌ Erro ao inserir jogo ${jogo.data}:`, err);
          reject(err);
        } else {
          const jogoId = result?.rows?.[0]?.id || result?.[0]?.id || result?.lastID;
          console.log(`✅ Jogo ${jogo.data} inserido com ID ${jogoId}`);
          resolve(jogoId);
        }
      }
    );
  });
}

async function insertPresenca(jogoId, jogadorNome, equipa) {
  const jogadorId = jogadoresMap[jogadorNome];
  
  if (!jogadorId) {
    console.warn(`⚠️  Jogador "${jogadorNome}" não encontrado na BD`);
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    db.query(
      'INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, ?)',
      [jogoId, jogadorId, equipa],
      (err) => {
        if (err) {
          console.error(`❌ Erro ao inserir presença ${jogadorNome}:`, err);
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}

async function importarTodos() {
  console.log('🚀 Iniciando importação de histórico...\n');
  
  try {
    await getJogadores();
    console.log('\n📝 Jogadores disponíveis:', Object.keys(jogadoresMap).sort().join(', '));
    console.log('\n');

    let sucessos = 0;
    let erros = 0;

    for (const jogo of jogos) {
      try {
        const jogoId = await insertJogo(jogo);
        
        // Inserir jogadores da equipa 1
        for (const jogadorNome of jogo.equipa1) {
          await insertPresenca(jogoId, jogadorNome, 1);
        }
        
        // Inserir jogadores da equipa 2
        for (const jogadorNome of jogo.equipa2) {
          await insertPresenca(jogoId, jogadorNome, 2);
        }
        
        console.log(`   ${jogo.equipa1.length + jogo.equipa2.length} jogadores inseridos\n`);
        sucessos++;
        
      } catch (err) {
        console.error(`❌ Erro ao processar jogo ${jogo.data}:`, err);
        erros++;
      }
    }

    console.log('\n✅ Importação concluída!');
    console.log(`   Sucessos: ${sucessos}/${jogos.length}`);
    console.log(`   Erros: ${erros}`);
    
  } catch (err) {
    console.error('❌ Erro fatal:', err);
  } finally {
    db.end();
    process.exit(0);
  }
}

importarTodos();
