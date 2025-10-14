// Database connection module - supports both SQLite (local) and PostgreSQL (production)
const DATABASE_URL = process.env.DATABASE_URL;
const USE_POSTGRES = !!DATABASE_URL;

let db;

if (USE_POSTGRES) {
  console.log('🐘 Using PostgreSQL (production)');
  const { Pool } = require('pg');
  
  // Parse connection string and ensure SSL
  const connectionString = DATABASE_URL.replace(/^postgres:/, 'postgresql:');
  
  db = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false // Supabase requires this
    }
  });

  // Test connection
  db.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection error:', err);
    } else {
      console.log('✅ PostgreSQL connected successfully');
    }
  });

} else {
  console.log('📁 Using SQLite (local development)');
  const sqlite3 = require('sqlite3').verbose();
  const path = require('path');
  
  const dbPath = path.join(__dirname, 'futsal.db');
  const sqliteDb = new sqlite3.Database(dbPath);
    // Wrapper to make SQLite compatible with PostgreSQL-style queries
  db = {
    query: (text, params, callback) => {
      // Handle CREATE/DROP/ALTER commands
      if (/^(CREATE|DROP|ALTER)/i.test(text.trim())) {
        sqliteDb.run(text, [], function(err) {
          if (callback) callback(err, { rows: [], rowCount: 0 });
        });
        return;
      }
      
      // Handle INSERT/UPDATE/DELETE
      if (/^(INSERT|UPDATE|DELETE)/i.test(text.trim())) {
        sqliteDb.run(text, params || [], function(err) {
          if (callback) {
            callback(err, { 
              rows: [], 
              rowCount: this?.changes || 0,
              lastID: this?.lastID 
            });
          }
        });
        return;
      }
      
      // Handle SELECT queries
      if (/LIMIT 1|WHERE.*=/.test(text) && !/COUNT\(\*\)|MAX\(|MIN\(|SUM\(/i.test(text)) {
        sqliteDb.get(text, params || [], (err, row) => {
          if (callback) {
            callback(err, { rows: row ? [row] : [], rowCount: row ? 1 : 0 });
          }
        });
      } else {
        sqliteDb.all(text, params || [], (err, rows) => {
          if (callback) {
            callback(err, { rows: rows || [], rowCount: rows?.length || 0 });
          }
        });
      }
    },
    
    end: () => {
      sqliteDb.close();
    }
  };
}

module.exports = { db, USE_POSTGRES };
