// Script para verificar estado da base de dados
const { db, USE_POSTGRES } = require('./db');

console.log('🔍 VERIFICANDO ESTADO DA BASE DE DADOS\n');
console.log(`📊 Tipo: ${USE_POSTGRES ? 'PostgreSQL (Produção)' : 'SQLite (Local)'}`);
console.log(`📁 Ambiente: ${process.env.NODE_ENV || 'development'}\n`);

const queries = [
  { name: 'Jogadores', sql: 'SELECT COUNT(*) as total FROM jogadores' },
  { name: 'Jogos', sql: 'SELECT COUNT(*) as total FROM jogos' },
  { name: 'Presenças', sql: 'SELECT COUNT(*) as total FROM presencas' },
  { name: 'Utilizadores', sql: 'SELECT COUNT(*) as total FROM users' },
  { name: 'Convocatória Ativa', sql: 'SELECT COUNT(*) as total FROM convocatoria' },
];

let completed = 0;

queries.forEach(({ name, sql }) => {
  db.query(sql, [], (err, result) => {
    if (err) {
      console.error(`❌ Erro ao contar ${name}:`, err.message);
    } else {
      const count = result[0]?.total || result[0]?.Total || result[0]?.count || 0;
      console.log(`✅ ${name.padEnd(20)} : ${count}`);
    }
    
    completed++;
    if (completed === queries.length) {
      console.log('\n📊 RESUMO:');
      console.log('─'.repeat(50));
      
      // Mostrar últimos 5 jogos
      db.query(
        'SELECT id, data, equipa1_golos, equipa2_golos FROM jogos ORDER BY data DESC LIMIT 5',
        [],
        (err, jogos) => {
          if (!err && jogos && jogos.length > 0) {
            console.log('\n🎮 ÚLTIMOS 5 JOGOS:');
            jogos.forEach(j => {
              console.log(`   ${j.data}: ${j.equipa1_golos} - ${j.equipa2_golos} (ID: ${j.id})`);
            });
          }
          
          // Mostrar jogadores ativos
          db.query(
            'SELECT nome FROM jogadores WHERE suspenso = 0 ORDER BY nome LIMIT 10',
            [],
            (err, jogadores) => {
              if (!err && jogadores && jogadores.length > 0) {
                console.log(`\n👥 PRIMEIROS 10 JOGADORES ATIVOS:`);
                jogadores.forEach(j => {
                  console.log(`   • ${j.nome}`);
                });
              }
              
              console.log('\n' + '─'.repeat(50));
              console.log('✅ Verificação completa!\n');
              
              if (!USE_POSTGRES) {
                const path = require('path');
                const fs = require('fs');
                const dbPath = path.join(__dirname, 'futsal.db');
                
                if (fs.existsSync(dbPath)) {
                  const stats = fs.statSync(dbPath);
                  const sizeKB = (stats.size / 1024).toFixed(2);
                  console.log(`📁 Ficheiro: ${dbPath}`);
                  console.log(`💾 Tamanho: ${sizeKB} KB`);
                  console.log(`📅 Última modificação: ${stats.mtime.toLocaleString('pt-PT')}\n`);
                }
              }
              
              process.exit(0);
            }
          );
        }
      );
    }
  });
});
