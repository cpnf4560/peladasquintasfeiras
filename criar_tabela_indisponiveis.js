// Script para criar tabela de indisponíveis temporários
const { db, USE_POSTGRES } = require('./db');

console.log('🔧 CRIANDO TABELA DE INDISPONÍVEIS TEMPORÁRIOS...\n');
console.log(`📁 Banco: ${USE_POSTGRES ? 'PostgreSQL' : 'SQLite'}\n`);

const query = `CREATE TABLE IF NOT EXISTS indisponiveis_temporarios (
  id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
  jogador_id INTEGER NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  numero_jogos INTEGER,
  motivo TEXT,
  posicao_original INTEGER,
  tipo_original TEXT,
  ativo INTEGER DEFAULT 1,
  created_at ${USE_POSTGRES ? 'TIMESTAMP DEFAULT NOW()' : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
)`;

db.query(query, [], (err) => {
  if (err) {
    console.error('❌ Erro ao criar tabela:', err);
    process.exit(1);
  }
  
  console.log('✅ Tabela "indisponiveis_temporarios" criada com sucesso!\n');
  
  // Verificar se a tabela foi criada
  const checkQuery = USE_POSTGRES 
    ? "SELECT table_name FROM information_schema.tables WHERE table_name = 'indisponiveis_temporarios'"
    : "SELECT name FROM sqlite_master WHERE type='table' AND name='indisponiveis_temporarios'";
  
  db.query(checkQuery, [], (err, result) => {
    if (err) {
      console.error('❌ Erro ao verificar tabela:', err);
      process.exit(1);
    }
    
    if (result && result.length > 0) {
      console.log('✅ VERIFICAÇÃO: Tabela existe na base de dados\n');
      console.log('📊 Estrutura da Tabela:');
      console.log('═'.repeat(60));
      console.log('• id (chave primária)');
      console.log('• jogador_id (INTEGER)');
      console.log('• data_inicio (DATE)');
      console.log('• data_fim (DATE, opcional)');
      console.log('• numero_jogos (INTEGER, opcional)');
      console.log('• motivo (TEXT)');
      console.log('• posicao_original (INTEGER)');
      console.log('• tipo_original (TEXT)');
      console.log('• ativo (INTEGER, padrão 1)');
      console.log('• created_at (TIMESTAMP)');
      console.log('═'.repeat(60));
      console.log('\n🎉 PRONTO! Agora pode usar o sistema de indisponíveis.\n');
    } else {
      console.log('⚠️ Tabela não foi encontrada após criação');
    }
    
    process.exit(0);
  });
});
