const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./futsal.db');

db.all('SELECT id, username, role FROM users ORDER BY role DESC', [], (err, rows) => {
  if (err) {
    console.error('Error:', err.message);
  } else {
    console.log('\n=== Users in Database ===');
    rows.forEach(row => {
      const marker = row.role === 'admin' ? '👑' : '👤';
      console.log(`${marker} ${row.username} - Role: ${row.role} (ID: ${row.id})`);
    });
    console.log('\n');
  }
  db.close();
});
