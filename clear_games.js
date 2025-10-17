const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Detectar o ficheiro DB como em db.js
const candidate1 = path.join(__dirname, 'futsal-manager', 'futsal.db');
const candidate2 = path.join(__dirname, 'futsal.db');
let dbPath;
if (fs.existsSync(candidate1)) dbPath = candidate1;
else if (fs.existsSync(candidate2)) dbPath = candidate2;
else {
  console.error('Nenhum ficheiro futsal.db encontrado.');
  process.exit(1);
}

const backupPath = dbPath + '.' + new Date().toISOString().replace(/[:.]/g, '-') + '.bak';
fs.copyFileSync(dbPath, backupPath);
console.log('Backup criado em:', backupPath);

const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.get('SELECT COUNT(*) AS c FROM jogos', (err, row) => {
    if (!err) console.log('Jogos antes:', row.c);
  });
  db.get('SELECT COUNT(*) AS c FROM presencas', (err, row) => {
    if (!err) console.log('Presenças antes:', row.c);
  });

  db.run('DELETE FROM presencas', function(err) {
    if (err) console.error('Erro ao apagar presenças:', err);
    else console.log('Presenças apagadas:', this.changes);
  });

  db.run('DELETE FROM jogos', function(err) {
    if (err) console.error('Erro ao apagar jogos:', err);
    else console.log('Jogos apagados:', this.changes);
  });

  // Reset autoincrement
  db.run("DELETE FROM sqlite_sequence WHERE name='jogos' OR name='presencas'", function(err) {
    if (err) console.error('Erro ao resetar sqlite_sequence:', err);
    else console.log('sqlite_sequence atualizado');
  });

  db.get('SELECT COUNT(*) AS c FROM jogos', (err, row) => {
    if (!err) console.log('Jogos depois:', row.c);
  });
  db.get('SELECT COUNT(*) AS c FROM presencas', (err, row) => {
    if (!err) console.log('Presenças depois:', row.c);
  });
});

db.close();
