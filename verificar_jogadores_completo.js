// Verificar jogadores no localhost e preparar para o Render
const { db, USE_POSTGRES } = require('./db');

console.log('🔍 VERIFICAÇÃO DE JOGADORES\n');
console.log('Ambiente:', USE_POSTGRES ? 'PostgreSQL (Render)' : 'SQLite (Localhost)');
console.log('='.repeat(50));

// Lista completa dos 20 jogadores
const jogadoresCompletos = [
  'Carlos Correia',
  'Carlos Silva',
  'Césaro Cruz',
  'Filipe Garcês',
  'Flávio Silva',
  'Hugo Belga',
  'Ismael Campos',
  'João Couto',
  'Joel Almeida',
  'Joaquim Rocha',
  'Leonardo Sousa',
  'Manuel Rocha',
  'Nuno Ferreira',
  'Paulo Pinto',
  'Pedro Lopes',
  'Ricardo Sousa',
  'Rogério Silva',
  'Rui Lopes',
  'Serafim Sousa',
  'Valter Pinho'
];

console.log(`\n📋 Lista completa esperada: ${jogadoresCompletos.length} jogadores\n`);

db.query('SELECT nome FROM jogadores WHERE COALESCE(suspenso, 0) = 0 ORDER BY nome', [], (err, result) => {
  if (err) {
    console.error('❌ Erro:', err);
    process.exit(1);
  }

  const jogadoresDB = result.map(r => r.nome).sort();
  
  console.log(`✅ Jogadores na base de dados: ${jogadoresDB.length}`);
  console.log('\nJogadores encontrados:');
  jogadoresDB.forEach((nome, i) => {
    console.log(`${(i + 1).toString().padStart(2, '0')}. ${nome}`);
  });

  // Verificar faltantes
  const faltantes = jogadoresCompletos.filter(j => !jogadoresDB.includes(j));
  
  if (faltantes.length > 0) {
    console.log('\n⚠️  JOGADORES FALTANTES:');
    faltantes.forEach(nome => console.log(`   ❌ ${nome}`));
    
    console.log('\n💡 SOLUÇÃO:');
    console.log('Execute o seguinte SQL para adicionar os jogadores faltantes:\n');
    faltantes.forEach(nome => {
      console.log(`INSERT INTO jogadores (nome, suspenso) VALUES ('${nome}', 0);`);
    });
  } else {
    console.log('\n✅ Todos os 20 jogadores estão presentes!');
  }

  // Verificar convocatória
  db.query('SELECT COUNT(*) as total FROM convocatoria', [], (err, result) => {
    if (err) {
      console.error('❌ Erro ao verificar convocatória:', err);
      process.exit(1);
    }

    console.log(`\n📊 Jogadores na convocatória: ${result[0].total}`);
    
    if (result[0].total < 20) {
      console.log('⚠️  Faltam jogadores na convocatória!');
      console.log('💡 Solução: Aceda a /convocatoria - o sistema adicionará automaticamente');
    }

    process.exit(0);
  });
});
