// Script para criar utilizadores no Render (PostgreSQL)
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

// Usar DATABASE_URL do Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupUsers() {
  console.log('🔧 CONFIGURANDO UTILIZADORES NO RENDER...\n');
  
  try {
    // 1. Limpar utilizadores existentes
    console.log('1️⃣ Limpando utilizadores antigos...');
    await pool.query('DELETE FROM users');
    console.log('✅ Utilizadores antigos removidos\n');
    
    // 2. Criar novos utilizadores
    console.log('2️⃣ Criando novos utilizadores...');
    
    const presidentePasswordHash = bcrypt.hashSync('Bodelos123*', 10);
    const adminPasswordHash = bcrypt.hashSync('rzq7xgq8', 10);
    
    // Criar presidente
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      ['presidente', presidentePasswordHash, 'admin']
    );
    console.log('✅ Utilizador criado: presidente (admin)');
    
    // Criar admin
    await pool.query(
      'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)',
      ['admin', adminPasswordHash, 'admin']
    );
    console.log('✅ Utilizador criado: admin (admin)\n');
    
    // 3. Verificar utilizadores criados
    console.log('3️⃣ Verificando utilizadores...');
    const result = await pool.query('SELECT username, role FROM users ORDER BY username');
    
    console.log('\n📋 UTILIZADORES ATIVOS:');
    console.log('═'.repeat(50));
    result.rows.forEach(user => {
      console.log(`👤 ${user.username.padEnd(20)} | 🔐 ${user.role}`);
    });
    console.log('═'.repeat(50));
    
    console.log('\n✅ ATUALIZAÇÃO COMPLETA NO RENDER!');
    console.log('\n🔑 CREDENCIAIS DE LOGIN:');
    console.log('   • Utilizador: presidente | Palavra-passe: Bodelos123*');
    console.log('   • Utilizador: admin      | Palavra-passe: rzq7xgq8');
    console.log('');
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erro:', error);
    await pool.end();
    process.exit(1);
  }
}

setupUsers();
