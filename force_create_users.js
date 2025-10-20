// FORÇA CRIAÇÃO DE UTILIZADORES (PostgreSQL/SQLite)
const bcrypt = require('bcrypt');
const { db, USE_POSTGRES } = require('./db');

console.log('\n🔧 FORÇANDO CRIAÇÃO DE UTILIZADORES...\n');
console.log(`📁 Banco: ${USE_POSTGRES ? 'PostgreSQL' : 'SQLite'}\n`);

async function forceCreateUsers() {
  try {
    // 1. Limpar utilizadores existentes
    console.log('1️⃣ Removendo utilizadores antigos...');
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM users', [], (err) => {
        if (err) {
          console.error('❌ Erro ao limpar:', err);
          reject(err);
        } else {
          console.log('✅ Utilizadores antigos removidos\n');
          resolve();
        }
      });
    });

    // 2. Gerar hashes das passwords
    console.log('2️⃣ Gerando hashes de passwords...');
    const presidenteHash = bcrypt.hashSync('Bodelos123*', 10);
    const adminHash = bcrypt.hashSync('rzq7xgq8', 10);
    console.log('✅ Hashes gerados\n');

    // 3. Inserir utilizadores
    console.log('3️⃣ Inserindo utilizadores...');
    
    const placeholder = USE_POSTGRES ? '$1, $2, $3' : '?, ?, ?';
    const insertQuery = `INSERT INTO users (username, password, role) VALUES (${placeholder})`;

    // Inserir presidente
    await new Promise((resolve, reject) => {
      db.query(insertQuery, ['presidente', presidenteHash, 'admin'], (err) => {
        if (err) {
          console.error('❌ Erro ao criar presidente:', err);
          reject(err);
        } else {
          console.log('✅ Criado: presidente (admin)');
          resolve();
        }
      });
    });

    // Inserir admin
    await new Promise((resolve, reject) => {
      db.query(insertQuery, ['admin', adminHash, 'admin'], (err) => {
        if (err) {
          console.error('❌ Erro ao criar admin:', err);
          reject(err);
        } else {
          console.log('✅ Criado: admin (admin)');
          resolve();
        }
      });
    });

    console.log('');

    // 4. Verificar
    console.log('4️⃣ Verificando utilizadores criados...');
    await new Promise((resolve, reject) => {
      db.query('SELECT username, role FROM users ORDER BY username', [], (err, result) => {
        if (err) {
          console.error('❌ Erro ao verificar:', err);
          reject(err);
          return;
        }

        const rows = Array.isArray(result) ? result : (result.rows || []);
        
        console.log('\n📋 UTILIZADORES NA BASE DE DADOS:');
        console.log('═'.repeat(60));
        rows.forEach(user => {
          console.log(`   👤 ${user.username.padEnd(20)} | 🔐 ${user.role}`);
        });
        console.log('═'.repeat(60));
        console.log(`   Total: ${rows.length} utilizador(es)\n`);
        
        resolve();
      });
    });

    // 5. Sucesso
    console.log('✅ CRIAÇÃO FORÇADA COMPLETA!\n');
    console.log('🔑 CREDENCIAIS DE LOGIN:');
    console.log('═'.repeat(60));
    console.log('   Utilizador: presidente  |  Password: Bodelos123*');
    console.log('   Utilizador: admin       |  Password: rzq7xgq8');
    console.log('═'.repeat(60));
    console.log('\n🌐 Teste agora o login!\n');

    process.exit(0);

  } catch (error) {
    console.error('\n❌ ERRO FATAL:', error);
    process.exit(1);
  }
}

// Executar
forceCreateUsers();
