const bcrypt = require('bcrypt');
const { Client } = require('pg');

async function atualizarPasswordRender() {
  // Verificar se a DATABASE_URL está configurada
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL não encontrada!');
    console.log('📋 Para atualizar no Render, executa:');
    console.log('   set DATABASE_URL=<url_do_render>');
    console.log('   node atualizar_pass_render.js');
    console.log('');
    console.log('🔗 Encontra a DATABASE_URL em:');
    console.log('   Render Dashboard → PostgreSQL → Internal Database URL');
    process.exit(1);
  }

  console.log('🔗 Conectando ao PostgreSQL do Render...');
  
  // Criar cliente PostgreSQL
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    // Conectar
    await client.connect();
    console.log('✅ Conectado com sucesso!');

    // Gerar hash da nova password
    const novaPassword = 'bodelos';
    const saltRounds = 10;
    const hash = await bcrypt.hash(novaPassword, saltRounds);
    
    console.log('🔐 Hash gerado:', hash);
    console.log('');

    // Verificar se o utilizador existe
    const checkResult = await client.query(
      'SELECT username, password FROM users WHERE username = $1',
      ['presidente']
    );

    if (checkResult.rows.length === 0) {
      console.error('❌ Utilizador "presidente" não encontrado!');
      process.exit(1);
    }

    console.log('📊 Utilizador encontrado:', checkResult.rows[0].username);
    console.log('🔑 Hash atual:', checkResult.rows[0].password.substring(0, 30) + '...');
    console.log('');

    // Atualizar password
    const updateResult = await client.query(
      'UPDATE users SET password = $1 WHERE username = $2',
      [hash, 'presidente']
    );

    console.log('✅ Password atualizada com sucesso!');
    console.log('📊 Linhas afetadas:', updateResult.rowCount);
    console.log('');

    // Verificar novamente
    const verifyResult = await client.query(
      'SELECT username, password FROM users WHERE username = $1',
      ['presidente']
    );

    console.log('🔍 Verificação:');
    console.log('   Utilizador:', verifyResult.rows[0].username);
    console.log('   Nova password: bodelos');
    console.log('   Hash:', verifyResult.rows[0].password.substring(0, 30) + '...');
    console.log('');
    console.log('🎉 CONCLUÍDO! Podes agora fazer login com:');
    console.log('   Utilizador: presidente');
    console.log('   Password: bodelos');

  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('');
    console.log('🔌 Conexão encerrada');
  }
}

atualizarPasswordRender();
