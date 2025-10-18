// Add observacoes column to jogos table
const { db, USE_POSTGRES } = require('./db');

console.log('🔧 Adding observacoes column to jogos table...');
console.log(`📊 Database type: ${USE_POSTGRES ? 'PostgreSQL' : 'SQLite'}`);

// First check if column exists
const checkSql = USE_POSTGRES
  ? `SELECT column_name FROM information_schema.columns WHERE table_name = 'jogos' AND column_name = 'observacoes'`
  : `PRAGMA table_info(jogos)`;

db.query(checkSql, [], (err, rows) => {
  if (err) {
    console.error('❌ Error checking column:', err);
    process.exit(1);
  }

  let columnExists = false;
  if (USE_POSTGRES) {
    columnExists = rows && rows.length > 0;
  } else {
    columnExists = rows && rows.some(row => row.name === 'observacoes');
  }

  if (columnExists) {
    console.log('✅ Column observacoes already exists!');
    process.exit(0);
  }

  // Add column if it doesn't exist
  console.log('➕ Adding column observacoes...');
  const alterSql = `ALTER TABLE jogos ADD COLUMN observacoes TEXT`;

  db.query(alterSql, [], (err) => {
    if (err) {
      console.error('❌ Error adding column:', err.message);
      // Check for various "already exists" error messages
      if (err.message.includes('duplicate column') || 
          err.message.includes('already exists') ||
          err.code === '42701') {
        console.log('✅ Column already exists (caught by error)');
        process.exit(0);
      } else {
        process.exit(1);
      }
    } else {
      console.log('✅ Column observacoes added successfully!');
      process.exit(0);
    }
  });
});
