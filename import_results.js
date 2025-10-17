const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

console.log('*** import_results.js START ***');

function chooseDb() {
  const candidate1 = path.join(__dirname, 'futsal-manager', 'futsal.db');
  const candidate2 = path.join(__dirname, 'futsal.db');
  if (fs.existsSync(candidate1)) return candidate1;
  if (fs.existsSync(candidate2)) return candidate2;
  return null;
}

const dbPath = chooseDb();
if (!dbPath) {
  console.error('Nenhum ficheiro futsal.db encontrado.');
  process.exit(1);
}
console.log('Usando DB:', dbPath);

const db = new sqlite3.Database(dbPath);

// Dados extraídos do OCR — confirmados pelo utilizador
const jogos = [
  {data: '31/07/2025', g1: 8, g2: 9, e1: ['Ismael Campos','Joaquim Rocha','Joel Almeida','Nuno Ferreira','Rogério Silva'], e2: ['Césaro Cruz','João Couto','Ricardo Sousa','Rui','Valter Pinho']},
  {data: '24/07/2025', g1: 12, g2: 9, e1: ['Carlos Correia','Filipe Garcês','Flávio Silva','Joel Almeida','João Couto'], e2: ['Carlos Silva','Césaro Cruz','Ismael Campos','Manuel Rocha','Rogério Silva']},
  {data: '17/07/2025', g1: 6, g2: 12, e1: ['Carlos Silva','Flávio Silva','João Couto','Paulo Pinto','Rogério Silva'], e2: ['Carlos Correia','Césaro Cruz','Ismael Campos','Joel Almeida','Manuel Rocha']},
  {data: '10/07/2025', g1: 8, g2: 6, e1: ['Carlos Silva','Flávio Silva','João Couto','Paulo Pinto','Rogério Silva'], e2: ['Carlos Correia','Césaro Cruz','Ismael Campos','Joel Almeida','Manuel Rocha']},
  {data: '03/07/2025', g1: 8, g2: 7, e1: ['Joel Almeida','João Couto','Leonardo Sousa','Paulo Pinto','Rui'], e2: ['Carlos Correia','Césaro Cruz','Flávio Silva','Ismael Campos','Rogério Silva']},
  {data: '26/06/2025', g1: 7, g2: 7, e1: ['Carlos Correia','Césaro Cruz','João Couto','Leonardo Sousa','Paulo Pinto'], e2: ['Filipe Garcês','Flávio Silva','Nuno Ferreira','Pedro Lopes','Rogério Silva']},
  {data: '19/06/2025', g1: 8, g2: 8, e1: ['Carlos Correia','Carlos Silva','Césaro Cruz','João Couto','Rogério Silva'], e2: ['Filipe Garcês','Flávio Silva','Nuno Ferreira','Paulo Pinto','Pedro Lopes']},
  {data: '12/06/2025', g1: 4, g2: 18, e1: ['Flávio Silva','Nuno Ferreira','Pedro Lopes','Rogério Silva','Rui'], e2: ['Carlos Correia','Césaro Cruz','Joel Almeida','João Couto','Valter Pinho']},
  {data: '05/06/2025', g1: 13, g2: 7, e1: ['Flávio Silva','Joel Almeida','Nuno Ferreira','Pedro Lopes','Rogério Silva'], e2: ['Carlos Correia','Césaro Cruz','João Couto','Rui','Valter Pinho']},
  {data: '29/05/2025', g1: 16, g2: 8, e1: ['Césaro Cruz','Flávio Silva','Ismael Campos','Joaquim Rocha','Ricardo Sousa'], e2: ['Carlos Correia','Nuno Ferreira','Rogério Silva','Valter Pinho']},
  {data: '22/05/2025', g1: 5, g2: 2, e1: ['Carlos Silva','Césaro Cruz','Ismael Campos','Nuno Ferreira','Rui'], e2: ['Carlos Correia','Flávio Silva','Joaquim Rocha','Pedro Lopes','Rogério Silva']},
  {data: '15/05/2025', g1: 13, g2: 8, e1: ['Carlos Correia','Carlos Silva','Ismael Campos','Joel Almeida','Nuno Ferreira'], e2: ['Césaro Cruz','Leonardo Sousa','Pedro Lopes','Rogério Silva']},
  {data: '01/05/2025', g1: 6, g2: 9, e1: ['Césaro Cruz','Hugo Belga','Ismael Campos','Joel Almeida','João Couto'], e2: ['Carlos Correia','Carlos Silva','Flávio Silva','Rogério Silva','Valter Pinho']},
  {data: '24/04/2025', g1: 4, g2: 7, e1: ['Césaro Cruz','Hugo Belga','Ismael Campos','Joel Almeida','Valter Pinho'], e2: ['Carlos Correia','Carlos Silva','Flávio Silva','Leonardo Sousa','Ricardo Sousa']}
];

function toISO(dateStr) {
  const parts = dateStr.split('/');
  if (parts.length !== 3) return dateStr;
  return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
}

function getPlayerIdByName(name) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id FROM jogadores WHERE nome = ?', [name], (err, row) => {
      if (err) return reject(err);
      if (row) return resolve(row.id);
      // se não existir, inserir novo jogador
      db.run('INSERT INTO jogadores (nome) VALUES (?)', [name], function(err) {
        if (err) return reject(err);
        console.log('Criado novo jogador:', name, '-> id', this.lastID);
        resolve(this.lastID);
      });
    });
  });
}

async function insertAll() {
  try {
    let insertedGames = 0;
    for (const j of jogos) {
      const dateISO = toISO(j.data);
      const res = await new Promise((resolve, reject) => {
        db.run('INSERT INTO jogos (data, equipa1_golos, equipa2_golos) VALUES (?, ?, ?)', [dateISO, j.g1, j.g2], function(err) {
          if (err) return reject(err);
          resolve(this.lastID);
        });
      });
      const jogoId = res;
      insertedGames++;
      // inserir presencas equipa1
      for (const nome of j.e1) {
        const pid = await getPlayerIdByName(nome);
        await new Promise((res, rej) => {
          db.run('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 1)', [jogoId, pid], function(err) {
            if (err) return rej(err);
            res();
          });
        });
      }
      // equipa2
      for (const nome of j.e2) {
        const pid = await getPlayerIdByName(nome);
        await new Promise((res, rej) => {
          db.run('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 2)', [jogoId, pid], function(err) {
            if (err) return rej(err);
            res();
          });
        });
      }
      console.log('Inserido jogo', jogoId, dateISO, j.g1 + '-' + j.g2);
    }
    console.log('Inserção concluída. Jogos inseridos:', insertedGames);

    // Verificação final
    db.get('SELECT COUNT(*) AS c FROM jogos', (err, row) => {
      if (!err) console.log('Total jogos agora:', row.c);
    });
    db.get('SELECT COUNT(*) AS c FROM presencas', (err, row) => {
      if (!err) console.log('Total presenças agora:', row.c);
    });

  } catch (err) {
    console.error('Erro ao inserir:', err);
  } finally {
    setTimeout(() => db.close(), 500);
  }
}

insertAll();
