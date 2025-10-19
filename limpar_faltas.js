// Limpar todas as faltas do histórico
const { db } = require('./db');

console.log('🧹 LIMPANDO CONTAGEM DE FALTAS\n');
console.log('═'.repeat(60));

// Verificar total atual
db.query('SELECT COUNT(*) as total FROM faltas_historico', [], (err, result) => {
  if (err) {
    console.error('❌ Erro ao verificar faltas:', err);
    process.exit(1);
  }
  
  const totalAntes = result[0].total;
  console.log(`📊 Total de faltas antes: ${totalAntes}`);
  
  if (totalAntes === 0) {
    console.log('\n✅ Já não existem faltas para limpar!');
    console.log('═'.repeat(60) + '\n');
    process.exit(0);
  }
  
  // Limpar todas as faltas
  console.log('\n🗑️  Limpando todas as faltas...\n');
  
  db.query('DELETE FROM faltas_historico', [], (err) => {
    if (err) {
      console.error('❌ Erro ao limpar faltas:', err);
      process.exit(1);
    }
    
    // Verificar resultado
    db.query('SELECT COUNT(*) as total FROM faltas_historico', [], (err, result) => {
      if (err) {
        console.error('❌ Erro ao verificar resultado:', err);
        process.exit(1);
      }
      
      const totalDepois = result[0].total;
      
      console.log('═'.repeat(60));
      console.log('✅ LIMPEZA CONCLUÍDA!');
      console.log('═'.repeat(60));
      console.log(`\n📊 Estatísticas:`);
      console.log(`   • Faltas antes: ${totalAntes}`);
      console.log(`   • Faltas depois: ${totalDepois}`);
      console.log(`   • Faltas removidas: ${totalAntes - totalDepois}`);
      
      // Verificar convocatória
      db.query(`
        SELECT j.nome, 
               COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
        FROM jogadores j
        WHERE COALESCE(j.suspenso, 0) = 0
        ORDER BY j.nome
        LIMIT 5
      `, [], (err, jogadores) => {
        if (err) {
          console.error('❌ Erro:', err);
          process.exit(1);
        }
        
        console.log(`\n📋 Verificação (primeiros 5 jogadores):`);
        jogadores.forEach(j => {
          console.log(`   • ${j.nome}: ${j.total_faltas} faltas`);
        });
        
        console.log('\n' + '═'.repeat(60));
        console.log('🎉 Todas as faltas foram limpas com sucesso!');
        console.log('═'.repeat(60) + '\n');
        
        process.exit(0);
      });
    });
  });
});
