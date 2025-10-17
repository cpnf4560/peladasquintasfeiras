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

db.serialize(() => {
  db.all('SELECT id, nome FROM jogadores ORDER BY id', (err, rows) => {
    if (err) {
      console.error('Erro a listar jogadores:', err);
    } else {
      console.log('Jogadores:');
      rows.forEach(r => console.log(`${r.id} - ${r.nome}`));
    }
  });
});

setTimeout(() => db.close(), 500);
