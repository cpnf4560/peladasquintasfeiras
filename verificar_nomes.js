const db = require('./db');

const nomesDesejados = [
  'Rogério', 'Cesaro', 'Carlos Silva', 'Nuno', 'Joel', 'Carlos Cruz',
  'Joaquim', 'Ismael', 'João', 'Rui', 'Ricardo', 'Valter', 'Serafim',
  'Hugo', 'Paulo', 'Flávio', 'Manuel', 'Pedro'
];

console.log('🔍 Verificando nomes na base de dados...\n');

db.all('SELECT id, nome FROM jogadores ORDER BY nome', [], (err, rows) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }
  
  console.log('📋 JOGADORES NA BASE DE DADOS:');
  rows.forEach((row, idx) => {
    console.log(`   ${idx + 1}. ${row.nome}`);
  });
  
  console.log('\n🎯 VERIFICAÇÃO DOS NOMES DESEJADOS:');
  nomesDesejados.forEach((nome, idx) => {
    const encontrado = rows.find(r => 
      r.nome.includes(nome) || nome.includes(r.nome.split(' ')[0])
    );
    
    if (encontrado) {
      console.log(`   ✅ ${idx + 1}º - "${nome}" → "${encontrado.nome}"`);
    } else {
      console.log(`   ❌ ${idx + 1}º - "${nome}" → NÃO ENCONTRADO`);
    }
  });
  
  process.exit(0);
});
