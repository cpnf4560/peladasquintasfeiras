const db = require('./db');

console.log('📋 Jogadores na base de dados:\n');

db.all('SELECT id, nome FROM jogadores ORDER BY nome', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
  
  rows.forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.nome} (ID: ${row.id})`);
  });
  
  console.log(`\n✅ Total: ${rows.length} jogadores`);
  process.exit(0);
});
