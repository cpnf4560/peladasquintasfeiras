// Migration script: SQLite -> PostgreSQL
// Run this locally to migrate your data to Supabase

require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');

// PostgreSQL connection
const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables!');
  console.log('Set it with: $env:DATABASE_URL="postgresql://..."');
  process.exit(1);
}

const pgPool = new Pool({
  connectionString: DATABASE_URL.replace(/^postgres:/, 'postgresql:'),
  ssl: { rejectUnauthorized: false }
});

// SQLite connection
const sqliteDb = new sqlite3.Database('./futsal.db');

console.log('🚀 Starting migration from SQLite to PostgreSQL...\n');

async function migrate() {
  try {    // 1. Drop all tables to start fresh
    console.log('🗑️  Dropping existing tables...');
    await pgPool.query('DROP TABLE IF EXISTS faltas_historico CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS convocatoria CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS convocatoria_config CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS coletes CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS presencas CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS jogos CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS jogadores CASCADE');
    await pgPool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('✅ Tables dropped\n');
    
    // 2. Create tables in PostgreSQL
    console.log('📋 Creating tables in PostgreSQL...');
    
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS jogadores (
        id SERIAL PRIMARY KEY,
        nome TEXT NOT NULL,
        suspenso INTEGER DEFAULT 0
      )
    `);
    
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS jogos (
        id SERIAL PRIMARY KEY,
        data TEXT NOT NULL,
        equipa1_golos INTEGER,
        equipa2_golos INTEGER
      )
    `);
      await pgPool.query(`
      CREATE TABLE IF NOT EXISTS presencas (
        id SERIAL PRIMARY KEY,
        jogo_id INTEGER,
        jogador_id INTEGER,
        equipa INTEGER
      )
    `);
      await pgPool.query(`
      CREATE TABLE IF NOT EXISTS coletes (
        id SERIAL PRIMARY KEY,
        jogador_id INTEGER,
        data_levou TEXT NOT NULL,
        data_devolveu TEXT
      )
    `);
    
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS convocatoria_config (
        id SERIAL PRIMARY KEY,
        max_convocados INTEGER DEFAULT 10,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
      await pgPool.query(`
      CREATE TABLE IF NOT EXISTS convocatoria (
        id SERIAL PRIMARY KEY,
        jogador_id INTEGER,
        tipo TEXT CHECK(tipo IN ('convocado', 'reserva')),
        posicao INTEGER,
        confirmado INTEGER DEFAULT 0,
        data_confirmacao TIMESTAMP
      )
    `);
      await pgPool.query(`
      CREATE TABLE IF NOT EXISTS faltas_historico (
        id SERIAL PRIMARY KEY,
        jogador_id INTEGER,
        data_falta DATE,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    await pgPool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ Tables created\n');
    
    // 2. Migrate data
    const tables = [
      'jogadores',
      'jogos', 
      'presencas',
      'coletes',
      'convocatoria_config',
      'convocatoria',
      'faltas_historico',
      'users'
    ];    for (const table of tables) {
      await migrateTable(table);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    sqliteDb.close();
    await pgPool.end();
  }
}

function migrateTable(tableName) {
  return new Promise((resolve, reject) => {
    sqliteDb.all(`SELECT * FROM ${tableName}`, async (err, rows) => {
      if (err) {
        if (err.message.includes('no such table')) {
          console.log(`⏭️  Table ${tableName} doesn't exist in SQLite, skipping...`);
          return resolve();
        }
        return reject(err);
      }
      
      if (!rows || rows.length === 0) {
        console.log(`⏭️  Table ${tableName} is empty, skipping...`);
        return resolve();
      }      console.log(`📦 Migrating ${rows.length} rows from ${tableName}...`);
      
      try {
        // Clear existing data in PostgreSQL
        await pgPool.query(`DELETE FROM ${tableName}`);
          for (const row of rows) {
          const columns = Object.keys(row).filter(col => col !== 'id');
          const values = columns.map(col => row[col]);
          const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
          
          const query = `
            INSERT INTO ${tableName} (${columns.join(', ')}) 
            VALUES (${placeholders})
            ON CONFLICT DO NOTHING
          `;
          
          try {
            await pgPool.query(query, values);
          } catch (columnError) {
            // If column doesn't exist, try without that column
            if (columnError.code === '42703') {
              console.log(`⚠️  Skipping incompatible column in ${tableName}`);
              const validColumns = columns.filter(col => !columnError.message.includes(col));
              const validValues = validColumns.map(col => row[col]);
              const validPlaceholders = validValues.map((_, i) => `$${i + 1}`).join(', ');
              
              const retryQuery = `
                INSERT INTO ${tableName} (${validColumns.join(', ')}) 
                VALUES (${validPlaceholders})
                ON CONFLICT DO NOTHING
              `;
              await pgPool.query(retryQuery, validValues);
            } else {
              throw columnError;
            }
          }
        }        // Reset sequence for id column
        await pgPool.query(`
          SELECT setval(pg_get_serial_sequence('${tableName}', 'id'), 
          COALESCE((SELECT MAX(id) FROM ${tableName}), 1))
        `);
        
        console.log(`✅ ${tableName}: ${rows.length} rows migrated`);
        resolve();
      } catch (error) {
        console.error(`❌ Error migrating ${tableName}:`, error.message);
        reject(error);
      }
    });
  });
}

// Run migration
migrate();
