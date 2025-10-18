// Add observacoes column to jogos table
const { db } = require('./db');

const sql = `ALTER TABLE jogos ADD COLUMN observacoes TEXT`;

db.query(sql, [], (err) => {
  if (err) {
    console.error('❌ Error adding column:', err.message);
    if (err.message.includes('duplicate column name')) {
      console.log('✅ Column already exists');
    }
  } else {
    console.log('✅ Column observacoes added successfully');
  }
  process.exit(0);
});
