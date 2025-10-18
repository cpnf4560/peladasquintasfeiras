const { db } = require('./db');

db.query('SELECT COUNT(*) as total FROM jogos WHERE data LIKE "2025%"', [], (err, result) => {
  if (err) {
    console.error('ERRO:', err);
    process.exit(1);
  }
  console.log('Jogos em 2025:', result[0].total);
  process.exit(0);
});
