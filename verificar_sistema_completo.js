// ========================================
// VERIFICAÇÃO COMPLETA DO SISTEMA
// ========================================
// Este script verifica todo o sistema e identifica problemas

const { db, USE_POSTGRES } = require('./db');

console.log('🔍 VERIFICAÇÃO COMPLETA DO SISTEMA FUTSAL MANAGER\n');
console.log('═'.repeat(60));
console.log('Ambiente:', USE_POSTGRES ? '🌐 PostgreSQL (Render)' : '💻 SQLite (Localhost)');
console.log('Data:', new Date().toLocaleString('pt-PT'));
console.log('═'.repeat(60));

const problemas = [];
const avisos = [];
const sucessos = [];

// Funções auxiliares
function addProblema(msg) {
  problemas.push(msg);
  console.log(`\n❌ PROBLEMA: ${msg}`);
}

function addAviso(msg) {
  avisos.push(msg);
  console.log(`\n⚠️  AVISO: ${msg}`);
}

function addSucesso(msg) {
  sucessos.push(msg);
  console.log(`\n✅ ${msg}`);
}

// Query helper
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.query(sql, params, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
  });
}

async function verificarSistema() {
  console.log('\n\n📊 1. VERIFICANDO JOGADORES...');
  console.log('─'.repeat(60));
  
  try {
    // 1. Jogadores
    const jogadores = await query('SELECT COUNT(*) as total FROM jogadores WHERE COALESCE(suspenso, 0) = 0');
    const totalJogadores = jogadores[0].total;
    
    console.log(`Total de jogadores: ${totalJogadores}`);
    
    if (totalJogadores === 20) {
      addSucesso(`20 jogadores cadastrados (correto)`);
    } else if (totalJogadores === 18) {
      addProblema(`Apenas ${totalJogadores} jogadores (faltam 2: Filipe Garcês e Leonardo Sousa)`);
      console.log(`   → Solução: Executar ADICIONAR_JOGADORES.bat`);
    } else {
      addAviso(`Total de jogadores: ${totalJogadores} (esperado: 20)`);
    }

    // Listar jogadores
    const listaJogadores = await query('SELECT nome FROM jogadores WHERE COALESCE(suspenso, 0) = 0 ORDER BY nome');
    console.log('\nJogadores cadastrados:');
    listaJogadores.forEach((j, i) => {
      console.log(`  ${(i + 1).toString().padStart(2, '0')}. ${j.nome}`);
    });

    // Verificar faltantes
    const jogadoresEsperados = [
      'Carlos Correia', 'Carlos Silva', 'Césaro Cruz', 'Filipe Garcês',
      'Flávio Silva', 'Hugo Belga', 'Ismael Campos', 'João Couto',
      'Joel Almeida', 'Joaquim Rocha', 'Leonardo Sousa', 'Manuel Rocha',
      'Nuno Ferreira', 'Paulo Pinto', 'Pedro Lopes', 'Ricardo Sousa',
      'Rogério Silva', 'Rui Lopes', 'Serafim Sousa', 'Valter Pinho'
    ];

    const nomes = listaJogadores.map(j => j.nome);
    const faltantes = jogadoresEsperados.filter(j => !nomes.includes(j));
    
    if (faltantes.length > 0) {
      console.log('\n❌ Jogadores faltantes:');
      faltantes.forEach(f => console.log(`  - ${f}`));
    }

  } catch (err) {
    addProblema(`Erro ao verificar jogadores: ${err.message}`);
  }

  // 2. Convocatória
  console.log('\n\n📋 2. VERIFICANDO CONVOCATÓRIA...');
  console.log('─'.repeat(60));
  
  try {
    const convocados = await query(`SELECT COUNT(*) as total FROM convocatoria WHERE tipo = 'convocado'`);
    const reservas = await query(`SELECT COUNT(*) as total FROM convocatoria WHERE tipo = 'reserva'`);
    const totalConv = await query(`SELECT COUNT(*) as total FROM convocatoria`);
    
    console.log(`Convocados: ${convocados[0].total}`);
    console.log(`Reservas: ${reservas[0].total}`);
    console.log(`Total: ${totalConv[0].total}`);
    
    if (convocados[0].total === 10 && reservas[0].total === 10) {
      addSucesso('Convocatória configurada corretamente (10 + 10)');
    } else {
      addAviso(`Convocatória com ${convocados[0].total} convocados e ${reservas[0].total} reservas`);
    }

    // Verificar confirmações
    const confirmados = await query(`SELECT COUNT(*) as total FROM convocatoria WHERE confirmado = 1`);
    console.log(`Presenças confirmadas: ${confirmados[0].total}`);

  } catch (err) {
    addProblema(`Erro ao verificar convocatória: ${err.message}`);
  }

  // 3. Coletes
  console.log('\n\n🎽 3. VERIFICANDO SISTEMA DE COLETES...');
  console.log('─'.repeat(60));
  
  try {
    const coletes = await query('SELECT * FROM coletes ORDER BY ordem');
    
    if (coletes.length === 0) {
      addProblema('Sistema de coletes não configurado');
      console.log('   → Solução: Executar aplicar_coletes.bat');
    } else if (coletes.length === 20) {
      addSucesso('Sistema de coletes configurado (20 jogadores)');
      
      // Verificar quem tem os coletes
      const comColetes = coletes.filter(c => c.quem_tem === 1);
      if (comColetes.length > 0) {
        console.log(`\n🎽 Coletes com: ${comColetes[0].jogador_nome}`);
      } else {
        console.log('\n📦 Coletes disponíveis (ninguém tem)');
      }
      
      // Mostrar ordem
      console.log('\nOrdem dos coletes:');
      coletes.slice(0, 5).forEach((c, i) => {
        const icon = c.quem_tem === 1 ? '👉' : '  ';
        console.log(`  ${icon} ${(i + 1).toString().padStart(2, '0')}. ${c.jogador_nome}`);
      });
      if (coletes.length > 5) {
        console.log(`  ... (${coletes.length - 5} mais)`);
      }
    } else {
      addAviso(`Sistema de coletes com ${coletes.length} entradas (esperado: 20)`);
    }

  } catch (err) {
    addProblema(`Erro ao verificar coletes: ${err.message}`);
  }

  // 4. Jogos
  console.log('\n\n⚽ 4. VERIFICANDO JOGOS...');
  console.log('─'.repeat(60));
  
  try {
    const jogos = await query('SELECT COUNT(*) as total FROM jogos');
    const presencas = await query('SELECT COUNT(*) as total FROM presencas');
    
    console.log(`Total de jogos: ${jogos[0].total}`);
    console.log(`Total de presenças: ${presencas[0].total}`);
    
    if (jogos[0].total > 0) {
      addSucesso(`${jogos[0].total} jogos registados`);
      
      // Último jogo
      const ultimoJogo = await query('SELECT * FROM jogos ORDER BY data DESC LIMIT 1');
      if (ultimoJogo.length > 0) {
        const jogo = ultimoJogo[0];
        console.log(`\nÚltimo jogo: ${new Date(jogo.data).toLocaleDateString('pt-PT')}`);
        console.log(`  Equipa A: ${jogo.golos_equipa_a} x ${jogo.golos_equipa_b} Equipa B`);
      }
    } else {
      addAviso('Nenhum jogo registado ainda');
    }

  } catch (err) {
    addProblema(`Erro ao verificar jogos: ${err.message}`);
  }

  // 5. Usuários (Admin)
  console.log('\n\n👤 5. VERIFICANDO USUÁRIOS...');
  console.log('─'.repeat(60));
  
  try {
    const users = await query('SELECT username, is_admin FROM users');
    
    console.log(`Total de usuários: ${users.length}`);
    
    const admins = users.filter(u => u.is_admin === 1);
    if (admins.length > 0) {
      addSucesso(`${admins.length} administrador(es) configurado(s)`);
      console.log('\nAdministradores:');
      admins.forEach(u => console.log(`  - ${u.username}`));
    } else {
      addProblema('Nenhum administrador configurado');
    }

  } catch (err) {
    addProblema(`Erro ao verificar usuários: ${err.message}`);
  }

  // 6. Faltas
  console.log('\n\n📊 6. VERIFICANDO FALTAS...');
  console.log('─'.repeat(60));
  
  try {
    const faltas = await query('SELECT COUNT(*) as total FROM faltas_historico');
    console.log(`Total de faltas registadas: ${faltas[0].total}`);
    
    if (faltas[0].total > 0) {
      addSucesso(`${faltas[0].total} faltas no histórico`);
    } else {
      console.log('Nenhuma falta registada');
    }

  } catch (err) {
    addProblema(`Erro ao verificar faltas: ${err.message}`);
  }

  // RELATÓRIO FINAL
  console.log('\n\n' + '═'.repeat(60));
  console.log('📋 RELATÓRIO FINAL');
  console.log('═'.repeat(60));
  
  console.log(`\n✅ Sucessos: ${sucessos.length}`);
  if (sucessos.length > 0) {
    sucessos.forEach(s => console.log(`  ✅ ${s}`));
  }
  
  console.log(`\n⚠️  Avisos: ${avisos.length}`);
  if (avisos.length > 0) {
    avisos.forEach(a => console.log(`  ⚠️  ${a}`));
  }
  
  console.log(`\n❌ Problemas: ${problemas.length}`);
  if (problemas.length > 0) {
    problemas.forEach(p => console.log(`  ❌ ${p}`));
  }

  // AÇÕES RECOMENDADAS
  if (problemas.length > 0 || avisos.length > 0) {
    console.log('\n\n🔧 AÇÕES RECOMENDADAS:');
    console.log('─'.repeat(60));
    
    if (problemas.some(p => p.includes('faltam 2'))) {
      console.log('\n1️⃣ ADICIONAR JOGADORES FALTANTES:');
      console.log('   Duplo clique: ADICIONAR_JOGADORES.bat');
      console.log('   Ou: node add_missing_players.js');
    }
    
    if (problemas.some(p => p.includes('coletes não configurado'))) {
      console.log('\n2️⃣ CONFIGURAR SISTEMA DE COLETES:');
      console.log('   Duplo clique: aplicar_coletes.bat');
    }
    
    if (!USE_POSTGRES) {
      console.log('\n3️⃣ SINCRONIZAR COM RENDER (após corrigir):');
      console.log('   Duplo clique: SYNC.bat');
      console.log('   Ou: node sync_from_render.js');
    }
  }

  console.log('\n\n' + '═'.repeat(60));
  console.log('Status:', problemas.length === 0 ? '✅ SISTEMA OK' : '⚠️  ATENÇÃO NECESSÁRIA');
  console.log('═'.repeat(60) + '\n');

  process.exit(problemas.length === 0 ? 0 : 1);
}

// Executar verificação
verificarSistema().catch(err => {
  console.error('\n❌ ERRO FATAL:', err);
  process.exit(1);
});
