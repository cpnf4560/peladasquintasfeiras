// Script para atualizar utilizadores do sistema
const bcrypt = require('bcrypt');
const { db } = require('./db');

console.log('🔧 ATUALIZANDO UTILIZADORES...\n');

// 1. Limpar todos os utilizadores existentes
console.log('1️⃣ Limpando utilizadores antigos...');
db.query('DELETE FROM users', [], (err) => {
  if (err) {
    console.error('❌ Erro ao limpar utilizadores:', err);
    process.exit(1);
  }
  
  console.log('✅ Utilizadores antigos removidos\n');
  
  // 2. Criar novos utilizadores
  console.log('2️⃣ Criando novos utilizadores...');
  
  const presidentePasswordHash = bcrypt.hashSync('Bodelos123*', 10);
  const adminPasswordHash = bcrypt.hashSync('rzq7xgq8', 10);
  
  const insertUser = 'INSERT INTO users (username, password, role) VALUES (?, ?, ?)';
  
  // Criar presidente
  db.query(insertUser, ['presidente', presidentePasswordHash, 'admin'], (err) => {
    if (err) {
      console.error('❌ Erro ao criar presidente:', err);
      process.exit(1);
    }
    console.log('✅ Utilizador criado: presidente (admin)');
    
    // Criar admin
    db.query(insertUser, ['admin', adminPasswordHash, 'admin'], (err) => {
      if (err) {
        console.error('❌ Erro ao criar admin:', err);
        process.exit(1);
      }
      console.log('✅ Utilizador criado: admin (admin)\n');
      
      // 3. Verificar utilizadores criados
      console.log('3️⃣ Verificando utilizadores...');
      db.query('SELECT username, role FROM users ORDER BY username', [], (err, users) => {
        if (err) {
          console.error('❌ Erro ao verificar:', err);
          process.exit(1);
        }
        
        console.log('\n📋 UTILIZADORES ATIVOS:');
        console.log('═'.repeat(50));
        users.forEach(user => {
          console.log(`👤 ${user.username.padEnd(20)} | 🔐 ${user.role}`);
        });
        console.log('═'.repeat(50));
        
        console.log('\n✅ ATUALIZAÇÃO COMPLETA!');
        console.log('\n🔑 CREDENCIAIS DE LOGIN:');
        console.log('   • Utilizador: presidente | Palavra-passe: Bodelos123*');
        console.log('   • Utilizador: admin      | Palavra-passe: rzq7xgq8');
        console.log('');
        
        process.exit(0);
      });
    });
  });
});
