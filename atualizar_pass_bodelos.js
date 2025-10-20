const bcrypt = require('bcrypt');
const { db } = require('./db');

async function atualizarPassword() {
  try {
    // Gerar hash da nova password
    const novaPassword = 'bodelos';
    const saltRounds = 10;
    const hash = await bcrypt.hash(novaPassword, saltRounds);
    
    console.log('🔐 Hash gerado:', hash);
    
    // Atualizar na base de dados
    db.query(
      'UPDATE users SET password = ? WHERE username = ?',
      [hash, 'presidente'],
      (err, result) => {
        if (err) {
          console.error('❌ Erro ao atualizar password:', err);
          process.exit(1);
        }
        
        console.log('✅ Password do utilizador "presidente" atualizada para "bodelos"');
        console.log('📊 Linhas afetadas:', result.affectedRows || result.changes || 'N/A');
        
        // Verificar se foi atualizado
        db.query(
          'SELECT username, password FROM users WHERE username = ?',
          ['presidente'],
          (err, users) => {
            if (err) {
              console.error('❌ Erro ao verificar:', err);
              process.exit(1);
            }
            
            if (users && users.length > 0) {
              console.log('✅ Utilizador encontrado:', users[0].username);
              console.log('🔑 Hash atual:', users[0].password);
            } else {
              console.log('⚠️ Utilizador "presidente" não encontrado');
            }
            
            process.exit(0);
          }
        );
      }
    );
  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

atualizarPassword();
