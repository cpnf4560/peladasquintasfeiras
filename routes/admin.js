const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

// Rota para painel de administração
router.get('/dashboard', requireAdmin, (req, res) => {
  res.render('admin-dashboard', {
    user: req.session.user,
    activePage: 'admin'
  });
});

const jogos = [
  { data: '2025-07-31', equipa1_golos: 8, equipa2_golos: 9, equipa1: ['Ismael Campos', 'Joaquim Rocha', 'João Couto', 'Nuno Ferreira', 'Rogério Silva'], equipa2: ['Carlos Correia', 'João Couto', 'Ricardo Sousa', 'Rui Lopes', 'Valter Pinho'] },
  { data: '2025-07-24', equipa1_golos: 12, equipa2_golos: 9, equipa1: ['Carlos Correia', 'Filipe Garcês', 'Flávio Silva', 'Joel Almeida', 'João Couto'], equipa2: ['Carlos Silva', 'Césaro Cruz', 'Ismael Campos', 'Manuel Rocha', 'Rogério Silva'] },
  { data: '2025-07-17', equipa1_golos: 6, equipa2_golos: 12, equipa1: ['Carlos Silva', 'Flávio Silva', 'João Couto', 'Paulo Pinto', 'Rogério Silva'], equipa2: ['Carlos Correia', 'Césaro Cruz', 'Ismael Campos', 'Joel Almeida', 'Manuel Rocha'] },
  { data: '2025-07-10', equipa1_golos: 8, equipa2_golos: 6, equipa1: ['Carlos Silva', 'Flávio Silva', 'João Couto', 'Paulo Pinto', 'Rogério Silva'], equipa2: ['Carlos Correia', 'Césaro Cruz', 'Ismael Campos', 'Joel Almeida', 'Manuel Rocha'] },
  { data: '2025-07-03', equipa1_golos: 8, equipa2_golos: 7, equipa1: ['Joel Almeida', 'João Couto', 'Leonardo Sousa', 'Paulo Pinto', 'Rui Lopes'], equipa2: ['Carlos Correia', 'Césaro Cruz', 'Flávio Silva', 'Ismael Campos', 'Rogério Silva'] },
  { data: '2025-06-26', equipa1_golos: 7, equipa2_golos: 7, equipa1: ['Carlos Correia', 'Flávio Silva', 'João Couto', 'Leonardo Sousa', 'Paulo Pinto'], equipa2: ['Filipe Garcês', 'Flávio Silva', 'Nuno Ferreira', 'Pedro Lopes', 'Rogério Silva'] },
  { data: '2025-06-19', equipa1_golos: 8, equipa2_golos: 8, equipa1: ['Carlos Correia', 'Carlos Silva', 'Césaro Cruz', 'João Couto', 'Rogério Silva'], equipa2: ['Filipe Garcês', 'Flávio Silva', 'Nuno Ferreira', 'Paulo Pinto', 'Pedro Lopes'] },
  { data: '2025-06-12', equipa1_golos: 4, equipa2_golos: 18, equipa1: ['Flávio Silva', 'Nuno Ferreira', 'Pedro Lopes', 'Rogério Silva', 'Rui Lopes'], equipa2: ['Carlos Correia', 'Césaro Cruz', 'Joel Almeida', 'João Couto', 'Valter Pinho'] },
  { data: '2025-06-05', equipa1_golos: 13, equipa2_golos: 7, equipa1: ['Flávio Silva', 'Joel Almeida', 'Nuno Ferreira', 'Pedro Lopes', 'Rogério Silva'], equipa2: ['Carlos Correia', 'Césaro Cruz', 'João Couto', 'Rui Lopes', 'Valter Pinho'] },
  { data: '2025-05-29', equipa1_golos: 16, equipa2_golos: 8, equipa1: ['Césaro Cruz', 'Flávio Silva', 'Ismael Campos', 'Joaquim Rocha', 'Ricardo Sousa'], equipa2: ['Carlos Correia', 'Nuno Ferreira', 'Rogério Silva', 'Valter Pinho'] },
  { data: '2025-05-22', equipa1_golos: 5, equipa2_golos: 2, equipa1: ['Carlos Silva', 'Césaro Cruz', 'Ismael Campos', 'Nuno Ferreira', 'Rui Lopes'], equipa2: ['Carlos Correia', 'Flávio Silva', 'Joaquim Rocha', 'Pedro Lopes', 'Rogério Silva'] },
  { data: '2025-05-15', equipa1_golos: 13, equipa2_golos: 8, equipa1: ['Carlos Correia', 'Carlos Silva', 'Ismael Campos', 'Joel Almeida', 'Nuno Ferreira'], equipa2: ['Césaro Cruz', 'Flávio Silva', 'Joaquim Rocha', 'Pedro Lopes', 'Rogério Silva'] },
  { data: '2025-05-01', equipa1_golos: 6, equipa2_golos: 9, equipa1: ['Césaro Cruz', 'Hugo Belga', 'Ismael Campos', 'Joel Almeida', 'Valter Pinho'], equipa2: ['Carlos Correia', 'Carlos Silva', 'Flávio Silva', 'Rogério Silva', 'Valter Pinho'] },
  { data: '2025-04-24', equipa1_golos: 4, equipa2_golos: 7, equipa1: ['Césaro Cruz', 'Hugo Belga', 'Ismael Campos', 'Joel Almeida', 'Valter Pinho'], equipa2: ['Carlos Correia', 'Carlos Silva', 'Flávio Silva', 'Leonardo Sousa', 'Ricardo Sousa'] }
];

function getJogadores() {
  return new Promise((resolve, reject) => {
    db.query('SELECT id, nome FROM jogadores', [], (err, jogadores) => {
      if (err) return reject(err);
      const map = {};
      jogadores.forEach(j => { map[j.nome] = j.id; });
      resolve(map);
    });
  });
}

function insertJogo(jogo) {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO jogos (data, equipa1_golos, equipa2_golos) VALUES (?, ?, ?) RETURNING id', [jogo.data, jogo.equipa1_golos, jogo.equipa2_golos], (err, result) => {
      if (err) return reject(err);
      const jogoId = result?.rows?.[0]?.id || result?.[0]?.id || result?.lastID;
      resolve(jogoId);
    });
  });
}

function insertPresenca(jogoId, jogadorId, equipa) {
  return new Promise((resolve, reject) => {
    db.query('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, ?)', [jogoId, jogadorId, equipa], (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

router.get('/import-history', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Importação de Histórico</title><style>body{font-family:'Inter',sans-serif;max-width:800px;margin:50px auto;padding:20px;background:#f8f9fa}.container{background:white;padding:30px;border-radius:10px;box-shadow:0 2px 10px rgba(0,0,0,0.1)}h1{color:#007bff}.warning{background:#fff3cd;border-left:4px solid #ffc107;padding:15px;margin:20px 0}.info{background:#d1ecf1;border-left:4px solid #17a2b8;padding:15px;margin:20px 0}button{background:#007bff;color:white;border:none;padding:12px 30px;font-size:16px;border-radius:5px;cursor:pointer;margin-right:10px}button:hover{background:#0056b3}.cancel{background:#6c757d}.cancel:hover{background:#545b62}table{width:100%;border-collapse:collapse;margin:20px 0}th,td{padding:8px;text-align:left;border-bottom:1px solid #dee2e6}th{background:#f8f9fa;font-weight:600}#result{margin-top:20px;padding:15px;border-radius:5px;display:none}.success{background:#d4edda;border-left:4px solid #28a745}.error{background:#f8d7da;border-left:4px solid #dc3545}.log{background:#f8f9fa;padding:15px;border-radius:5px;font-family:monospace;font-size:12px;max-height:400px;overflow-y:auto;white-space:pre-wrap}</style></head><body><div class="container"><h1>🚀 Importação de Histórico</h1><div class="info"><strong>ℹ️ Informação</strong><br>Este processo vai importar <strong>14 jogos</strong> com aproximadamente <strong>139 presenças</strong>.</div><div class="warning"><strong>⚠️ Atenção</strong><br>• Executa isto apenas UMA vez<br>• Certifica-te que não existem jogos duplicados na base de dados<br>• Após a importação, esta rota será desativada</div><h3>Jogos a Importar:</h3><table><thead><tr><th>#</th><th>Data</th><th>Resultado</th><th>Jogadores</th></tr></thead><tbody>${jogos.map((j, i) => `<tr><td>${i + 1}</td><td>${new Date(j.data).toLocaleDateString('pt-PT')}</td><td>${j.equipa1_golos} - ${j.equipa2_golos}</td><td>${j.equipa1.length + j.equipa2.length}</td></tr>`).join('')}</tbody></table><div style="margin-top:30px;"><button onclick="importar()">✅ Confirmar Importação</button><button class="cancel" onclick="window.location.href='/'">❌ Cancelar</button></div><div id="result"></div></div><script>async function importar(){const resultDiv=document.getElementById('result');resultDiv.style.display='block';resultDiv.className='';resultDiv.innerHTML='<div class="log">⏳ Importando...</div>';try{const response=await fetch('/admin/import-history',{method:'POST'});const data=await response.json();if(data.success){resultDiv.className='success';resultDiv.innerHTML=\`<h3>✅ Importação Concluída!</h3><p><strong>Sucessos:</strong> \${data.sucessos}/\${data.total}</p>\${data.erros>0?\`<p><strong>Erros:</strong> \${data.erros}</p>\`:''}\${data.avisos.length>0?\`<div style="margin-top:15px;"><strong>⚠️ Avisos:</strong><div class="log">\${data.avisos.join('\\n')}</div></div>\`:''}<div class="log" style="margin-top:15px;">\${data.log}</div><p style="margin-top:20px;"><a href="/">← Voltar à Página Principal</a></p>\`}else{resultDiv.className='error';resultDiv.innerHTML=\`<h3>❌ Erro na Importação</h3><p>\${data.message}</p><div class="log">\${data.log||''}</div>\`}}catch(error){resultDiv.className='error';resultDiv.innerHTML=\`<h3>❌ Erro Fatal</h3><p>\${error.message}</p>\`}}</script></body></html>`);
});

router.post('/import-history', async (req, res) => {
  const log = [];
  const avisos = [];
  let sucessos = 0;
  let erros = 0;
  try {
    log.push('🚀 Iniciando importação...\\n');
    const jogadoresMap = await getJogadores();
    log.push(`✅ ${Object.keys(jogadoresMap).length} jogadores carregados\\n`);

    for (const jogo of jogos) {
      try {
        const jogoId = await insertJogo(jogo);
        log.push(`✅ Jogo ${jogo.data} inserido com ID ${jogoId}`);

        for (const jogadorNome of jogo.equipa1) {
          const jogadorId = jogadoresMap[jogadorNome];
          if (!jogadorId) {
            const aviso = `⚠️  Jogador "${jogadorNome}" não encontrado (Equipa 1, ${jogo.data})`;
            avisos.push(aviso);
            log.push(aviso);
            continue;
          }
          await insertPresenca(jogoId, jogadorId, 1);
        }

        for (const jogadorNome of jogo.equipa2) {
          const jogadorId = jogadoresMap[jogadorNome];
          if (!jogadorId) {
            const aviso = `⚠️  Jogador "${jogadorNome}" não encontrado (Equipa 2, ${jogo.data})`;
            avisos.push(aviso);
            log.push(aviso);
            continue;
          }
          await insertPresenca(jogoId, jogadorId, 2);
        }

        log.push(`   ${jogo.equipa1.length + jogo.equipa2.length} jogadores processados\\n`);
        sucessos++;
      } catch (err) {
        log.push(`❌ Erro ao processar jogo ${jogo.data}: ${err.message}\\n`);
        erros++;
      }
    }

    log.push('\\n✅ Importação concluída!');
    log.push(`   Sucessos: ${sucessos}/${jogos.length}`);
    log.push(`   Erros: ${erros}`);
    log.push(`   Avisos: ${avisos.length}`);

    res.json({ success: true, sucessos, erros, total: jogos.length, avisos, log: log.join('\\n') });
  } catch (error) {
    log.push(`\\n❌ Erro fatal: ${error.message}`);
    res.status(500).json({ success: false, message: error.message, log: log.join('\\n') });
  }
});

// Rota para corrigir presenças do Rui Lopes
router.get('/fix-rui-lopes', async (req, res) => {
  const log = [];
  
  try {
    // 1. Obter ID do jogador "Rui Lopes"
    const jogadores = await new Promise((resolve, reject) => {
      db.query("SELECT id FROM jogadores WHERE nome = ?", ['Rui Lopes'], (err, result) => {
        if (err) return reject(err);
        resolve(result);
      });
    });
    
    if (!jogadores || jogadores.length === 0) {
      return res.send(`
        <h1>❌ Erro</h1>
        <p>Jogador "Rui Lopes" não encontrado na base de dados.</p>
        <p>Certifica-te que o nome está exatamente assim na tabela jogadores.</p>
        <a href="/admin/import-history">← Voltar</a>
      `);
    }
    
    const ruiId = jogadores[0].id;
    log.push(`✅ Jogador "Rui Lopes" encontrado com ID ${ruiId}`);
    
    // 2. Encontrar os jogos pelas datas
    const jogosParaCorrigir = [
      { data: '2025-07-31', equipa: 2 },
      { data: '2025-07-03', equipa: 1 },
      { data: '2025-06-12', equipa: 1 },
      { data: '2025-06-05', equipa: 2 },
      { data: '2025-05-22', equipa: 1 }
    ];
    
    let adicionados = 0;
    
    for (const info of jogosParaCorrigir) {
      // Encontrar ID do jogo
      const jogos = await new Promise((resolve, reject) => {
        db.query("SELECT id FROM jogos WHERE data = ?", [info.data], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      
      if (!jogos || jogos.length === 0) {
        log.push(`⚠️  Jogo ${info.data} não encontrado`);
        continue;
      }
      
      const jogoId = jogos[0].id;
      
      // Verificar se já existe
      const presencaExistente = await new Promise((resolve, reject) => {
        db.query("SELECT id FROM presencas WHERE jogo_id = ? AND jogador_id = ?", [jogoId, ruiId], (err, result) => {
          if (err) return reject(err);
          resolve(result);
        });
      });
      
      if (presencaExistente && presencaExistente.length > 0) {
        log.push(`ℹ️  Presença já existe no jogo ${info.data}`);
        continue;
      }
      
      // Inserir presença
      await new Promise((resolve, reject) => {
        db.query("INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, ?)", [jogoId, ruiId, info.equipa], (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
      
      log.push(`✅ Presença adicionada: Jogo ${info.data}, Equipa ${info.equipa}`);
      adicionados++;
    }
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Correção Rui Lopes</title>
        <style>
          body { font-family: Inter, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; background: #f8f9fa; }
          .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #28a745; }
          .log { background: #f8f9fa; padding: 15px; border-radius: 5px; font-family: monospace; white-space: pre-wrap; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
          a { display: inline-block; margin-top: 20px; color: #007bff; text-decoration: none; }
          a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Correção Concluída!</h1>
          <div class="success">
            <strong>Presenças adicionadas:</strong> ${adicionados}/5
          </div>
          <h3>Log Detalhado:</h3>
          <div class="log">${log.join('\n')}</div>
          <a href="/">← Voltar à Página Principal</a>
        </div>
      </body>
      </html>
    `);
      } catch (error) {
    res.status(500).send(`
      <h1>❌ Erro</h1>
      <p>${error.message}</p>
      <pre>${log.join('\n')}</pre>
      <a href="/admin/import-history">← Voltar</a>
    `);
  }
});

// Rota para configurar ordem dos coletes (executar uma vez)
router.get('/setup-coletes', requireAdmin, async (req, res) => {
  const log = [];
  
  try {
    log.push('🔄 Iniciando configuração dos coletes...\n');
      // Ordem definida no WhatsApp
    const jogadoresOrdem = [
      { busca: 'Rogério', posicao: 1 },
      { busca: 'Césaro Cruz', posicao: 2 },
      { busca: 'Carlos Silva', posicao: 3 },
      { busca: 'Nuno', posicao: 4 },
      { busca: 'Joel', posicao: 5 },
      { busca: 'Carlos Correia', posicao: 6 },
      { busca: 'Joaquim', posicao: 7 },
      { busca: 'Ismael', posicao: 8 },
      { busca: 'João', posicao: 9 },
      { busca: 'Rui', posicao: 10 },
      { busca: 'Ricardo', posicao: 11 },
      { busca: 'Valter', posicao: 12 },
      { busca: 'Serafim', posicao: 13 },
      { busca: 'Hugo', posicao: 14 },
      { busca: 'Paulo', posicao: 15 },
      { busca: 'Flávio', posicao: 16 },
      { busca: 'Manuel', posicao: 17 },
      { busca: 'Pedro', posicao: 18 }
    ];
    
    // Passo 1: Limpar convocatória
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM convocatoria', [], (err) => {
        if (err) return reject(err);
        log.push('✅ Convocatória limpa');
        resolve();
      });
    });
    
    // Passo 2: Limpar histórico de coletes
    await new Promise((resolve, reject) => {
      db.query('DELETE FROM coletes', [], (err) => {
        if (err) return reject(err);
        log.push('✅ Histórico de coletes limpo\n');
        resolve();
      });
    });
    
    // Passo 3: Buscar todos os jogadores
    const jogadores = await new Promise((resolve, reject) => {
      db.query('SELECT id, nome FROM jogadores ORDER BY nome', [], (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
    
    log.push('📋 Configurando nova ordem:\n');
      // Passo 4: Inserir jogadores na ordem correta
    for (const item of jogadoresOrdem) {
      const jogador = jogadores.find(j => {
        const nome = j.nome.toLowerCase();
        const busca = item.busca.toLowerCase();
        
        // Match exato
        if (nome === busca) return true;
        
        // Match por primeiro nome
        const primeiroNome = nome.split(' ')[0];
        if (primeiroNome === busca) return true;
        
        // Match especial para "Cesaro" → "Césaro Cruz" ou similar
        if (busca === 'cesaro' && (nome.includes('cesar') || nome.includes('césar'))) return true;
        
        // Match especial para "Carlos Cruz" → buscar por sobrenome
        if (busca === 'carlos cruz') {
          const partes = nome.split(' ');
          return partes.includes('carlos') && (partes.includes('cruz') || partes.includes('correia'));
        }
        
        // Match por partes do nome
        const partes = busca.split(' ');
        return partes.every(parte => nome.includes(parte));
      });
      
      if (!jogador) {
        log.push(`⚠️  ${item.posicao}º - "${item.busca}" não encontrado`);
        continue;
      }
      
      const tipo = item.posicao <= 10 ? 'convocado' : 'reserva';
      
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO convocatoria (jogador_id, posicao, tipo) VALUES (?, ?, ?)',
          [jogador.id, item.posicao, tipo],
          (err) => {
            if (err) return reject(err);
            log.push(`✅ ${item.posicao}º - ${jogador.nome} (${tipo})`);
            resolve();
          }
        );
      });
    }
    
    log.push('\n📊 Configurando histórico de coletes:\n');
    
    // Passo 5: Adicionar histórico de coletes
    const rogerio = jogadores.find(j => j.nome.toLowerCase().includes('rogério'));
    const cesaro = jogadores.find(j => j.nome.toLowerCase().includes('cesaro') || j.nome.toLowerCase().includes('césar'));
    const carlosSilva = jogadores.find(j => j.nome.toLowerCase() === 'carlos silva');
      if (rogerio) {
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
          [rogerio.id, '2024-10-02', '2024-10-09'],
          (err) => {
            if (err) return reject(err);
            log.push(`✅ ${rogerio.nome}: levou 02/10/2024, devolveu 09/10/2024`);
            resolve();
          }
        );
      });
    }
    
    if (cesaro) {
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
          [cesaro.id, '2024-10-09', '2024-10-16'],
          (err) => {
            if (err) return reject(err);
            log.push(`✅ ${cesaro.nome}: levou 09/10/2024, devolveu 16/10/2024`);
            resolve();
          }
        );
      });
    }
    
    if (carlosSilva) {
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO coletes (jogador_id, data_levou, data_devolveu) VALUES (?, ?, ?)',
          [carlosSilva.id, '2024-10-16', null],
          (err) => {
            if (err) return reject(err);
            log.push(`✅ ${carlosSilva.nome}: TEM ATUALMENTE desde 16/10/2024`);
            resolve();
          }
        );
      });
    }
    
    log.push('\n✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!');
    log.push('\n🔗 Acede à página de coletes para verificar: /coletes');
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Setup Coletes - Concluído</title>
        <style>
          body { font-family: Inter, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; background: #f8f9fa; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
          h1 { color: #28a745; margin-bottom: 30px; }
          .log { background: #f8f9fa; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; 
                 white-space: pre-wrap; line-height: 1.6; font-size: 14px; margin: 20px 0; 
                 max-height: 600px; overflow-y: auto; border: 1px solid #dee2e6; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 20px; margin: 30px 0; border-radius: 4px; }
          .btn { display: inline-block; margin: 10px 10px 0 0; padding: 12px 24px; background: #007bff; 
                 color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .btn:hover { background: #0056b3; }
          .btn-secondary { background: #6c757d; }
          .btn-secondary:hover { background: #545b62; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✅ Configuração dos Coletes Concluída!</h1>
          <div class="success">
            <strong>🎉 Sucesso!</strong> A ordem dos coletes e o histórico foram configurados na base de dados.
          </div>
          <h3>📝 Log da Execução:</h3>
          <div class="log">${log.join('\n')}</div>
          <div>
            <a href="/coletes" class="btn">🟢🔴 Ver Página de Coletes</a>
            <a href="/admin/dashboard" class="btn btn-secondary">← Voltar ao Admin</a>
          </div>
        </div>
      </body>
      </html>
    `);
    
  } catch (error) {
    log.push(`\n❌ ERRO: ${error.message}`);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Erro - Setup Coletes</title>
        <style>
          body { font-family: Inter, sans-serif; max-width: 900px; margin: 50px auto; padding: 20px; background: #f8f9fa; }
          .container { background: white; padding: 40px; border-radius: 12px; box-shadow: 0 2px 20px rgba(0,0,0,0.1); }
          h1 { color: #dc3545; }
          .error { background: #f8d7da; border-left: 4px solid #dc3545; padding: 20px; margin: 30px 0; border-radius: 4px; }
          .log { background: #f8f9fa; padding: 20px; border-radius: 8px; font-family: 'Courier New', monospace; 
                 white-space: pre-wrap; line-height: 1.6; font-size: 14px; margin: 20px 0; 
                 max-height: 600px; overflow-y: auto; border: 1px solid #dee2e6; }
          .btn { display: inline-block; margin-top: 20px; padding: 12px 24px; background: #6c757d; 
                 color: white; text-decoration: none; border-radius: 6px; font-weight: 500; }
          .btn:hover { background: #545b62; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Erro na Configuração</h1>
          <div class="error">
            <strong>Erro:</strong> ${error.message}
          </div>
          <h3>📝 Log da Execução:</h3>
          <div class="log">${log.join('\n')}</div>
          <a href="/admin/dashboard" class="btn">← Voltar ao Admin</a>
        </div>
      </body>
      </html>
    `);
  }
});

module.exports = router;
