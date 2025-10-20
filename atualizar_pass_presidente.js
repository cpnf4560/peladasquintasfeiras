// Script para atualizar password do presidente
const bcrypt = require('bcrypt');
const { db } = require('./db');

console.log('🔐 Atualizando password do presidente...\n');

// Nova password: bodelos
const novaPassword = 'bodelos';
const passwordHash = bcrypt.hashSync(novaPassword, 10);

db.query('UPDATE users SET password = ? WHERE username = ?', [passwordHash, 'presidente'], (err, result) => {
  if (err) {
    console.error('❌ Erro ao atualizar password:', err);
    process.exit(1);
  }
  
  console.log('✅ Password do presidente atualizada com sucesso!');
  console.log('\n🔑 NOVAS CREDENCIAIS:');
  console.log('   • Utilizador: presidente');
  console.log('   • Password: bodelos');
  console.log('');
  
  process.exit(0);
});
