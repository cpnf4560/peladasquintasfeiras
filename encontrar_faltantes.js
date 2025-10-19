const { db } = require('./db');

console.log('🔍 Encontrando jogadores faltantes...\n');

const nomesFaltantes = ['Cesaro', 'Carlos Cruz', 'Serafim'];

db.query('SELECT id, nome FROM jogadores ORDER BY nome', [], (err, jogadores) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }

  console.log('📋 TODOS OS JOGADORES:');
  jogadores.forEach((j, idx) => {
    console.log(`   ${idx + 1}. ${j.nome} (ID: ${j.id})`);
  });

  console.log('\n🔎 PROCURANDO CORRESPONDÊNCIAS:');
  
  nomesFaltantes.forEach(busca => {
    console.log(`\n   Procurando "${busca}":`);
    
    const candidatos = jogadores.filter(j => {
      const nome = j.nome.toLowerCase();
      const buscaLower = busca.toLowerCase();
      
      // Verifica se contém alguma parte
      const palavras = buscaLower.split(' ');
      return palavras.some(p => nome.includes(p)) || nome.split(' ').some(p => p.includes(buscaLower));
    });
    
    if (candidatos.length > 0) {
      candidatos.forEach(c => console.log(`      → ${c.nome}`));
    } else {
      console.log('      → NENHUM CANDIDATO');
    }
  });

  process.exit(0);
});
