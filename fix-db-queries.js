// Script to fix all db.query callbacks to use result.rows
const fs = require('fs');

let content = fs.readFileSync('./server.js', 'utf8');
let fixed = 0;

console.log('🔧 Fixing db.query callbacks...\n');

// Pattern 1: db.query with single row result (like jogos, jogadores)
// Replace: (err, variableName) => { ... if (!variableName) ... }
// With: (err, result) => { const variableName = result.rows; ... if (!variableName || variableName.length === 0) ... }

const patterns = [
  // Pattern for queries expecting array results
  {
    search: /db\.query\(([^,]+),\s*\[\],\s*\(err,\s*(\w+)\)\s*=>\s*{/g,
    replace: (match, query, varName) => {
      if (varName === 'result') return match; // Already fixed
      fixed++;
      return `db.query(${query}, [], (err, result) => {\n    const ${varName} = result.rows || [];`;
    }
  },
  // Pattern for queries with parameters expecting array results  
  {
    search: /db\.query\(([^,]+),\s*\[([^\]]*)\],\s*\(err,\s*(\w+)\)\s*=>\s*{/g,
    replace: (match, query, params, varName) => {
      if (varName === 'result') return match; // Already fixed
      fixed++;
      return `db.query(${query}, [${params}], (err, result) => {\n    const ${varName} = result.rows && result.rows.length > 0 ? result.rows[0] : null;`;
    }
  }
];

patterns.forEach(pattern => {
  content = content.replace(pattern.search, pattern.replace);
});

// Special case: queries that expect arrays should use result.rows directly
content = content.replace(
  /const (\w+) = result\.rows && result\.rows\.length > 0 \? result\.rows\[0\] : null;\s+\/\/ This should be array/g,
  'const $1 = result.rows || [];'
);

// Write back
fs.writeFileSync('./server.js', content, 'utf8');

console.log(`✅ Fixed ${fixed} db.query callbacks`);
console.log('⚠️  Manual verification recommended for complex queries');
