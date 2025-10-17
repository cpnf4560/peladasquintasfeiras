const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

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

function q(sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

(async () => {
  try {
    const jogos = await q('SELECT id, data, equipa1_golos, equipa2_golos FROM jogos ORDER BY data DESC LIMIT 20');
    console.log('Jogos (últimos):', jogos.length);
    jogos.forEach(j => console.log(j));

    const pres = await q('SELECT jogo_id, jogador_id, equipa FROM presencas ORDER BY jogo_id LIMIT 50');
    console.log('Presenças (amostra):', pres.length);
    pres.forEach(p => console.log(p));

    const jogadores = await q('SELECT id, nome FROM jogadores ORDER BY id LIMIT 50');
    console.log('Jogadores (count):', jogadores.length);
    jogadores.slice(0,10).forEach(j => console.log(j));

    // Test estatisticas query (simplified) - contar jogos por jogador
    const estat = await q(`SELECT jog.id, jog.nome, COUNT(DISTINCT j.id) as jogos
      FROM jogadores jog
      LEFT JOIN presencas p ON jog.id = p.jogador_id
      LEFT JOIN jogos j ON p.jogo_id = j.id
      WHERE jog.suspenso = 0
      GROUP BY jog.id, jog.nome
      HAVING COUNT(DISTINCT j.id) > 0
      ORDER BY jogos DESC
      LIMIT 10`);
    console.log('Estatísticas (amostra):', estat.length);
    estat.forEach(e => console.log(e));

  } catch (err) {
    console.error('Erro nas queries:', err);
  } finally {
    db.close();
  }
})();
