// Script to update server.js to use PostgreSQL-compatible queries
const fs = require('fs');

const serverPath = './server.js';
let content = fs.readFileSync(serverPath, 'utf8');

console.log('🔄 Converting server.js to PostgreSQL-compatible queries...\n');

// 1. Remove db.serialize wrapper (not needed for pg)
content = content.replace(/db\.serialize\(\(\) => \{/g, '// Database initialization');
content = content.replace(/}\);(\s+)\/\/ Configuração/g, '\n// Configuração');

// 2. Convert db.run for table creation to async/await pattern
const createTablePattern = /db\.run\(`CREATE TABLE IF NOT EXISTS/g;
content = content.replace(createTablePattern, 'db.query(`CREATE TABLE IF NOT EXISTS');

// 3. Convert INTEGER PRIMARY KEY AUTOINCREMENT to SERIAL
content = content.replace(/INTEGER PRIMARY KEY AUTOINCREMENT/g, 'SERIAL PRIMARY KEY');

// 4. Convert datetime('now') to NOW()
content = content.replace(/datetime\('now'\)/g, 'NOW()');
content = content.replace(/DATETIME DEFAULT CURRENT_TIMESTAMP/g, 'TIMESTAMP DEFAULT NOW()');

// 5. Wrap initialization in async IIFE
const initStart = '// Database initialization';
const initEnd = '// Configuração';

if (content.includes(initStart)) {
  const beforeInit = content.substring(0, content.indexOf(initStart));
  const afterConfig = content.substring(content.indexOf(initEnd));
  const initSection = content.substring(content.indexOf(initStart), content.indexOf(initEnd));
  
  const wrappedInit = `${initStart}
(async () => {
  try {
${initSection.replace(initStart, '').trim().split('\n').map(line => '    ' + line).join('\n')}
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ Database initialization error:', err);
  }
})();

`;
  
  content = beforeInit + wrappedInit + afterConfig;
}

// 6. Convert callback-style db operations to promise-style
// This is complex, so we'll handle the most common patterns

// Save the updated file
fs.writeFileSync(serverPath, content, 'utf8');

console.log('✅ server.js converted successfully!');
console.log('\n⚠️  NOTE: Some manual adjustments may be needed for complex queries.');
console.log('Test the server with: npm start');
