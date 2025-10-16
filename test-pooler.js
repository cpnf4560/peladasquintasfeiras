const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_cWJx6pE2uhjs@ep-steep-queen-ad4z7lbl-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require',
  ssl: { rejectUnauthorized: false }
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Erro de conexão:', err);
  } else {
    console.log('Conectado! Resultado:', res.rows);
  }
  pool.end();
});
