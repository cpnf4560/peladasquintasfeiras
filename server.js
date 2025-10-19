console.log('Running from directory: ' + __dirname);
const express = require('express');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { db, USE_POSTGRES } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('view cache');
app.set('etag', false);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Forçar no-cache em todas as respostas (útil para debug/deploy)
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  res.set('Surrogate-Control', 'no-store');
  next();
});

// Serve static from both roots to avoid path mismatches (sem cache)
const staticNoCacheRoot = {
  etag: false,
  lastModified: false,
  maxAge: 0,
  cacheControl: true,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.set('X-Asset-Source', 'root-public');
  }
};

const staticNoCacheNested = {
  etag: false,
  lastModified: false,
  maxAge: 0,
  cacheControl: true,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.set('Surrogate-Control', 'no-store');
    res.set('X-Asset-Source', 'nested-public');
  }
};

// Logging simples para chamadas ao style.css (debug)
app.use((req, _res, next) => {
  if (req.path && req.path.startsWith('/style.css')) {
    console.log(`[static] Pedido a ${req.path}`);
  }
  next();
});

app.use('/public', express.static(path.join(__dirname, 'public'), staticNoCacheRoot));
app.use(express.static(path.join(__dirname, 'public'), staticNoCacheRoot));

// Configuração de sessões
app.use(session({
  secret: process.env.SESSION_SECRET || 'futsal-manager-secret-key-2025',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production' && process.env.COOKIE_SECURE === 'true',
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} - User: ${req.session.user ? req.session.user.username : 'Anónimo'}`);
  next();
});

// Inicializar base de dados
const initDatabase = async () => {
  const queries = [
    `CREATE TABLE IF NOT EXISTS jogadores (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      nome TEXT NOT NULL,
      suspenso INTEGER DEFAULT 0
    )`,
    
    `CREATE TABLE IF NOT EXISTS jogos (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      data TEXT NOT NULL,
      equipa1_golos INTEGER,
      equipa2_golos INTEGER
    )`,
    
    `CREATE TABLE IF NOT EXISTS presencas (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      jogo_id INTEGER,
      jogador_id INTEGER,
      equipa INTEGER
    )`,
    
    `CREATE TABLE IF NOT EXISTS coletes (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      jogador_id INTEGER,
      data_levou TEXT NOT NULL,
      data_devolveu TEXT
    )`,
    
    `CREATE TABLE IF NOT EXISTS convocatoria_config (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      max_convocados INTEGER DEFAULT 10,
      created_at ${USE_POSTGRES ? 'TIMESTAMP DEFAULT NOW()' : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
    )`,
    
    `CREATE TABLE IF NOT EXISTS convocatoria (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      jogador_id INTEGER,
      tipo TEXT CHECK(tipo IN ('convocado', 'reserva')),
      posicao INTEGER,
      confirmado INTEGER DEFAULT 0,
      data_confirmacao ${USE_POSTGRES ? 'TIMESTAMP' : 'DATETIME'}
    )`,
    
    `CREATE TABLE IF NOT EXISTS faltas_historico (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      jogador_id INTEGER,
      data_falta DATE,
      created_at ${USE_POSTGRES ? 'TIMESTAMP DEFAULT NOW()' : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
    )`,
    
    `CREATE TABLE IF NOT EXISTS users (
      id ${USE_POSTGRES ? 'SERIAL' : 'INTEGER'} PRIMARY KEY ${USE_POSTGRES ? '' : 'AUTOINCREMENT'},
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at ${USE_POSTGRES ? 'TIMESTAMP DEFAULT NOW()' : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
    )`
  ];
  for (const query of queries) {
    await new Promise((resolve, reject) => {
      db.query(query, [], (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // 🔧 MIGRAÇÃO: Adicionar coluna observacoes se não existir
  console.log('🔧 Checking for observacoes column...');
  const checkColumnSql = USE_POSTGRES
    ? `SELECT column_name FROM information_schema.columns WHERE table_name = 'jogos' AND column_name = 'observacoes'`
    : `PRAGMA table_info(jogos)`;

  await new Promise((resolve) => {
    db.query(checkColumnSql, [], (err, rows) => {
      if (err) {
        console.error('⚠️ Error checking observacoes column:', err);
        resolve();
        return;
      }

      let columnExists = false;
      if (USE_POSTGRES) {
        columnExists = rows && rows.length > 0;
      } else {
        columnExists = rows && rows.some(row => row.name === 'observacoes');
      }

      if (columnExists) {
        console.log('✅ Column observacoes already exists');
        resolve();
      } else {
        console.log('➕ Adding column observacoes to jogos table...');
        const alterSql = `ALTER TABLE jogos ADD COLUMN observacoes TEXT`;
        db.query(alterSql, [], (err) => {
          if (err) {
            // Check for "already exists" errors
            if (err.message && (err.message.includes('duplicate column') || 
                err.message.includes('already exists') ||
                err.code === '42701')) {
              console.log('✅ Column observacoes already exists (caught by error)');
            } else {
              console.error('⚠️ Error adding observacoes column:', err.message);
            }
          } else {
            console.log('✅ Column observacoes added successfully!');
          }
          resolve();
        });
      }
    });
  });

  // Criar utilizadores padrão se não existirem
  const checkUsers = 'SELECT COUNT(*) as count FROM users';
  db.query(checkUsers, [], async (err, result) => {
    if (err) {
      console.error('Erro ao verificar utilizadores:', err);
      return;
    }

    // O wrapper db pode retornar várias shapes:
    // - um array de rows (SQLite wrapper)
    // - um objeto { rows: [...] } (pg wrapper)
    // - ou outros formatos em casos inesperados
    // Normalizar e extrair a primeira linha com segurança
    let firstRow = null;

    if (Array.isArray(result)) {
      firstRow = result[0] || null;
    } else if (result && Array.isArray(result.rows)) {
      firstRow = result.rows[0] || null;
    } else if (result && result[0]) {
      firstRow = result[0] || null;
    }

    const count = firstRow ? parseInt(firstRow.count || firstRow.COUNT || 0, 10) : 0;

    if (count === 0) {
      console.log('Criando utilizadores padrão...');

      const adminPasswordHash1 = bcrypt.hashSync('admin123', 10);
      const adminPasswordHash2 = bcrypt.hashSync('admin', 10);
      const userPasswordHash = bcrypt.hashSync('user', 10);

      const insertUser = 'INSERT INTO users (username, password, role) VALUES ($1, $2, $3)';

      db.query(insertUser, ['admin1', adminPasswordHash1, 'admin'], () => {});
      db.query(insertUser, ['admin2', adminPasswordHash2, 'admin'], () => {});

      for (let i = 1; i <= 19; i++) {
        db.query(insertUser, [`user${i}`, userPasswordHash, 'user'], () => {});
      }

      console.log('✅ Utilizadores criados com sucesso!');
    }
  });
  
  console.log('✅ Database initialized');
};

initDatabase().catch(err => {
  console.error('❌ Database initialization error:', err);
});

// MIDDLEWARE DE AUTENTICAÇÃO
function requireAuth(req, res, next) {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
}

function requireAdmin(req, res, next) {
  if (req.session.user && req.session.user.role === 'admin') {
    next();
  } else {
    res.status(403).render('error', { 
      message: 'Acesso negado. Apenas administradores podem aceder a esta página.',
      user: req.session.user 
    });
  }
}

const authRoutes = require('./routes/auth');
const jogadoresRoutes = require('./routes/jogadores');
const jogosRoutes = require('./routes/jogos');
const coletesRoutes = require('./routes/coletes');
const convocatoriaRoutes = require('./routes/convocatoria');
const estatisticasRoutes = require('./routes/estatisticas');
const adminRoutes = require('./routes/admin');
const backupRoutes = require('./routes/backup');

// Remove inline auth routes and use modular routes
app.use('/', authRoutes);
app.use('/jogadores', jogadoresRoutes);

// ROTAS DE JOGOS
app.use('/jogos', jogosRoutes);

// ROTAS DE COLETES
app.use('/', coletesRoutes);

// ROTAS DE CONVOCATORIA
app.use('/', convocatoriaRoutes);

// ROTAS DE ESTATÍSTICAS
app.use('/', estatisticasRoutes);

// ROTAS ADMIN (temporárias para importação)
app.use('/admin', adminRoutes);

// ROTAS DE BACKUP
app.use('/admin', backupRoutes);

// Ensure root path is handled — redirect to jogos index
app.get('/', (req, res) => {
  return res.redirect('/jogos');
});

// Keep other routes as-is (they still reference requireAuth/requireAdmin from middleware when needed)

// Função para gerar curiosidades baseadas em estatísticas
function gerarCuriosidades(estatisticas, ano, mes, estatisticasAnoCompleto = null) {
  const curiosidades = [];
  
  if (estatisticas.length === 0) return curiosidades;
  
  // Usar estatísticas do ano completo para "Mais Assíduo" se disponível
  const statsParaAssiduidade = estatisticasAnoCompleto || estatisticas;
    // Filtro de mínimo 5 jogos (para todas as categorias exceto "Saudades do Campo" e "Mais Assíduos")
  const statsCom5Jogos = estatisticas.filter(stat => stat.jogos >= 5);
  
  // ORDEM SOLICITADA:
  // 1 - TOP 3 - Média de Pontos/Jogo
  // 2 - TOP 3 - Mais Assíduos
  // 3 - TOP 3 - % Vitórias
  // 4 - TOP 3 - Goal Average
  // 5 - TOP 3 - Golos Marcados
  // 6 - TOP 3 - Golos Sofridos
  // 7 - TOP 3 - Melhor Ataque (NOVO)
  // 8 - TOP 3 - Melhor Defesa
  // 9 - TOP 3 - Saudades do Campo
  
  // 1. TOP 3 - Média de Pontos/Jogo (mínimo 5 jogos)
  const top3MediaPontos = [...statsCom5Jogos]
    .map(stat => ({
      ...stat,
      media_pontos: stat.jogos > 0 ? (stat.pontos / stat.jogos).toFixed(1) : 0
    }))
    .sort((a, b) => parseFloat(b.media_pontos) - parseFloat(a.media_pontos))
    .slice(0, 3);
  
  if (top3MediaPontos.length > 0) {
    const texto = top3MediaPontos
      .map((stat, i) => `${i + 1}º ${stat.nome} (${stat.media_pontos} pts/jogo)`)
      .join(' • ');
    curiosidades.push({
      icone: '📊',
      titulo: 'TOP 3 - Média de Pontos/Jogo',
      texto: texto
    });
  }
  
  // 2. TOP 3 - Mais Assíduos (SEM filtro de 5 jogos - usando estatísticas do ano completo)
  const top3Assiduos = [...statsParaAssiduidade]
    .sort((a, b) => b.jogos - a.jogos)
    .slice(0, 3);
  
  if (top3Assiduos.length > 0) {
    const texto = top3Assiduos
      .map((stat, i) => `${i + 1}º ${stat.nome} (${stat.jogos} jogos)`)
      .join(' • ');
    curiosidades.push({
      icone: '🎯',
      titulo: `TOP 3 - Mais Assíduos${mes ? ' do Ano' : ''}`,
      texto: texto
    });
  }
  
  // 3. TOP 3 - % de Vitórias (mínimo 5 jogos)
  const top3Percentagem = [...statsCom5Jogos]
    .sort((a, b) => b.percentagem_vitorias - a.percentagem_vitorias)
    .slice(0, 3);
  
  if (top3Percentagem.length > 0) {
    const texto = top3Percentagem
      .map((stat, i) => `${i + 1}º ${stat.nome} (${stat.percentagem_vitorias}%)`)
      .join(' • ');
    curiosidades.push({
      icone: '👑',
      titulo: 'TOP 3 - % de Vitórias',
      texto: texto
    });
  }
  
  // 4. TOP 3 - Goal Average (mínimo 5 jogos)
  const top3GoalAverage = [...statsCom5Jogos]
    .filter(stat => stat.diferenca_golos > 0)
    .sort((a, b) => b.diferenca_golos - a.diferenca_golos)
    .slice(0, 3);
  
  if (top3GoalAverage.length > 0) {
    const texto = top3GoalAverage
      .map((stat, i) => `${i + 1}º ${stat.nome} (+${stat.diferenca_golos})`)
      .join(' • ');
    curiosidades.push({
      icone: '⚡',
      titulo: 'TOP 3 - Goal Average',
      texto: texto
    });
  }
  
  // 5. TOP 3 - Golos Marcados (mínimo 5 jogos)
  const top3GolosMarcados = [...statsCom5Jogos]
    .sort((a, b) => b.golos_marcados - a.golos_marcados)
    .slice(0, 3);
  
  if (top3GolosMarcados.length > 0 && top3GolosMarcados[0].golos_marcados > 0) {
    const texto = top3GolosMarcados
      .map((stat, i) => `${i + 1}º ${stat.nome} (${stat.golos_marcados} golos)`)
      .join(' • ');
    curiosidades.push({
      icone: '⚽',
      titulo: 'TOP 3 - Golos Marcados',
      texto: texto
    });
  }
  
  // 6. TOP 3 - Golos Sofridos (mínimo 5 jogos) - Os que mais sofreram golos
  const top3GolosSofridos = [...statsCom5Jogos]
    .sort((a, b) => b.golos_sofridos - a.golos_sofridos)
    .slice(0, 3);
  
  if (top3GolosSofridos.length > 0 && top3GolosSofridos[0].golos_sofridos > 0) {
    const texto = top3GolosSofridos
      .map((stat, i) => `${i + 1}º ${stat.nome} (${stat.golos_sofridos} golos)`)
      .join(' • ');
    curiosidades.push({
      icone: '💥',
      titulo: 'TOP 3 - Golos Sofridos',
      texto: texto
    });
  }
  
  // 7. TOP 3 - Melhor Ataque (mínimo 5 jogos) - NOVO: Média de golos marcados por jogo
  const top3MelhorAtaque = [...statsCom5Jogos]
    .map(stat => ({
      ...stat,
      media_golos_marcados: stat.jogos > 0 ? (stat.golos_marcados / stat.jogos).toFixed(2) : 0
    }))
    .sort((a, b) => parseFloat(b.media_golos_marcados) - parseFloat(a.media_golos_marcados))
    .slice(0, 3);
  
  if (top3MelhorAtaque.length > 0) {
    const texto = top3MelhorAtaque
      .map((stat, i) => `${i + 1}º ${stat.nome} (${stat.media_golos_marcados} golos/jogo)`)
      .join(' • ');
    curiosidades.push({
      icone: '🚀',
      titulo: 'TOP 3 - Melhor Ataque',
      texto: texto
    });
  }
  
  // 8. TOP 3 - Melhor Defesa (mínimo 5 jogos)
  const top3Defesa = [...statsCom5Jogos]
    .map(stat => ({
      ...stat,
      media_golos_sofridos: stat.jogos > 0 ? (stat.golos_sofridos / stat.jogos).toFixed(2) : 0
    }))
    .sort((a, b) => parseFloat(a.media_golos_sofridos) - parseFloat(b.media_golos_sofridos))
    .slice(0, 3);
  
  if (top3Defesa.length > 0) {
    const texto = top3Defesa
      .map((stat, i) => `${i + 1}º ${stat.nome} (${stat.media_golos_sofridos} golos/jogo)`)
      .join(' • ');
    curiosidades.push({
      icone: '🛡️',
      titulo: 'TOP 3 - Melhor Defesa',
      texto: texto
    });
  }
  
  // 8. TOP 3 - Saudades do Campo (SEM filtro de 5 jogos - jogadores que não jogam há mais tempo)
  const top3Saudades = [...estatisticas]
    .filter(stat => stat.ultimo_jogo) // Apenas jogadores que já jogaram
    .sort((a, b) => {
      // Ordenar por data mais antiga primeiro
      return new Date(a.ultimo_jogo) - new Date(b.ultimo_jogo);
    })
    .slice(0, 3);
  
  if (top3Saudades.length > 0) {
    const texto = top3Saudades
      .map((stat, i) => {
        const diasDesde = Math.floor((new Date() - new Date(stat.ultimo_jogo)) / (1000 * 60 * 60 * 24));
        return `${i + 1}º ${stat.nome} (${diasDesde} dias)`;
      })
      .join(' • ');
    curiosidades.push({
      icone: '😢',
      titulo: 'TOP 3 - Saudades do Campo',
      texto: texto
    });
  }
  
  return curiosidades;
}

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor a correr na porta ${PORT}`);
  console.log(`📱 Aceda a: http://localhost:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Produção: Aplicação online!`);
  }
});

// ROTA DASHBOARD (Para utilizadores normais)
app.get('/dashboard', requireAuth, async (req, res) => {
  try {
    // Parâmetro de ordenação (percentagem por defeito)
    const ordenacaoSelecionada = req.query.ordenacao || 'percentagem';
      // 1. CONVOCATÓRIA ATUAL (sempre mostrar)
    const convocatoria = await new Promise((resolve, reject) => {
      db.query(
        `SELECT j.*, c.posicao, c.tipo, c.confirmado, c.data_confirmacao,
         COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
         FROM jogadores j 
         JOIN convocatoria c ON j.id = c.jogador_id 
         WHERE j.suspenso = 0 
         ORDER BY c.tipo, c.posicao`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });

    // 2. LÓGICA DAS EQUIPAS (quinta-feira seguinte ao último jogo às 18h30)
    const ultimoJogo = await new Promise((resolve, reject) => {
      db.query(
        `SELECT * FROM jogos 
         WHERE equipa1_golos IS NOT NULL AND equipa2_golos IS NOT NULL
         ORDER BY data DESC LIMIT 1`,
        [],
        (err, jogo) => {
          if (err) reject(err);
          else resolve(jogo);
        }
      );
    });    let equipasFormadas = { 
      equipa1: { 
        jogadores: [], 
        percentagem_vitorias_media: 0, 
        pontos_totais: 0 
      }, 
      equipa2: { 
        jogadores: [], 
        percentagem_vitorias_media: 0, 
        pontos_totais: 0 
      } 
    };
    let mostrarEquipas = false;
    let proximaQuintaFeira = null;if (ultimoJogo) {
      // Calcular a próxima quinta-feira após o último jogo
      const dataUltimoJogo = new Date(ultimoJogo.data);
      proximaQuintaFeira = new Date(dataUltimoJogo);
      
      // Encontrar a próxima quinta-feira (dia 4 da semana, 0=domingo)
      const diasAteQuinta = (4 - proximaQuintaFeira.getDay() + 7) % 7;
      if (diasAteQuinta === 0) {
        // Se o último jogo foi numa quinta-feira, próxima quinta é daqui a 7 dias
        proximaQuintaFeira.setDate(proximaQuintaFeira.getDate() + 7);
      } else {
        proximaQuintaFeira.setDate(proximaQuintaFeira.getDate() + diasAteQuinta);
      }
      
      // Verificar se é quinta-feira às 18h30 ou depois
      const agora = new Date();
      const quintaFeiraAs1830 = new Date(proximaQuintaFeira);
      quintaFeiraAs1830.setHours(18, 30, 0, 0);
      
      mostrarEquipas = agora >= quintaFeiraAs1830;

      if (mostrarEquipas && global.equipasGeradas) {
        // Se há equipas geradas globalmente, usar essas
        equipasFormadas = global.equipasGeradas;
      }
    }

    // 2. INFORMAÇÃO DE COLETES
    const coletesInfo = await new Promise((resolve, reject) => {
      db.query(
        `SELECT c.*, j.nome, c.data_levou
         FROM coletes c
         JOIN jogadores j ON c.jogador_id = j.id
         WHERE c.data_devolveu IS NULL
         ORDER BY c.data_levou DESC`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        }
      );
    });    // Próximo a levar coletes
    const proximoColetes = await new Promise((resolve, reject) => {
      db.query(
        `SELECT j.*, c.posicao
         FROM jogadores j
         JOIN convocatoria c ON j.id = c.jogador_id
         WHERE c.tipo = 'convocado'
         AND j.id NOT IN (
           SELECT jogador_id FROM coletes WHERE data_devolveu IS NULL
         )
         ORDER BY c.posicao
         LIMIT 1`,
        [],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    // 3. ÚLTIMOS 20 RESULTADOS
    const ultimosResultados = await new Promise((resolve, reject) => {
      db.query(
        `SELECT * FROM jogos 
         WHERE equipa1_golos IS NOT NULL AND equipa2_golos IS NOT NULL
         ORDER BY data DESC LIMIT 20`,
        [],
        (err, jogos) => {
          if (err) reject(err);
          else resolve(jogos || []);
        }
      );
    });

    // Para cada resultado, buscar jogadores das equipas
    const resultadosComJogadores = await Promise.all(
      ultimosResultados.map(async (jogo) => {
        const jogadores = await new Promise((resolve, reject) => {
          db.query(
            `SELECT j.nome, p.equipa
             FROM presencas p 
             JOIN jogadores j ON p.jogador_id = j.id
             WHERE p.jogo_id = ?
             ORDER BY j.nome`,
            [jogo.id],
            (err, rows) => {
              if (err) reject(err);
              else resolve(rows || []);
            }
          );
        });

        return {
          ...jogo,
          jogadores_equipa1: jogadores.filter(j => j.equipa === 1),
          jogadores_equipa2: jogadores.filter(j => j.equipa === 2)
        };
      })
    );    // 4. ESTATÍSTICAS COMPLETAS com ANÁLISE DE DUPLAS E CURIOSIDADES
    const anoAtual = new Date().getFullYear().toString();
    const queryEstatisticas = `
      SELECT 
        jog.id,
        jog.nome,
        COUNT(DISTINCT j.id) as jogos,
        SUM(CASE 
          WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
               (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
          THEN 1 ELSE 0 END) as vitorias,
        SUM(CASE 
          WHEN j.equipa1_golos = j.equipa2_golos 
          THEN 1 ELSE 0 END) as empates,
        SUM(CASE 
          WHEN (p.equipa = 1 AND j.equipa1_golos < j.equipa2_golos) OR 
               (p.equipa = 2 AND j.equipa2_golos < j.equipa1_golos) 
          THEN 1 ELSE 0 END) as derrotas,
        SUM(CASE WHEN p.equipa = 1 THEN j.equipa1_golos ELSE j.equipa2_golos END) as golos_marcados,
        SUM(CASE WHEN p.equipa = 1 THEN j.equipa2_golos ELSE j.equipa1_golos END) as golos_sofridos,
        ROUND(
          (SUM(CASE 
            WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
                 (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
            THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT j.id), 1
        ) as percentagem_vitorias,
        MAX(j.data) as ultimo_jogo
      FROM jogadores jog
      LEFT JOIN presencas p ON jog.id = p.jogador_id
      LEFT JOIN jogos j ON p.jogo_id = j.id
      WHERE jog.suspenso = 0 AND j.data LIKE '${anoAtual}-%'
      GROUP BY jog.id, jog.nome
      HAVING COUNT(DISTINCT j.id) > 0
    `;

    const estatisticas = await new Promise((resolve, reject) => {
      db.query(queryEstatisticas, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    // Processar estatísticas (calcular pontos e ordenar)
    const estatisticasProcessadas = estatisticas.map(stat => ({
      ...stat,
      pontos: (stat.vitorias * 3) + (stat.empates * 1),
      diferenca_golos: stat.golos_marcados - stat.golos_sofridos
    }));

    // Ordenar conforme a opção selecionada
    if (ordenacaoSelecionada === 'percentagem') {
      // Ordenar por % de vitórias, diferença de golos, golos marcados, presenças
      estatisticasProcessadas.sort((a, b) => {
        if (a.percentagem_vitorias !== b.percentagem_vitorias) return b.percentagem_vitorias - a.percentagem_vitorias;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    } else {
      // Ordenar por pontos (padrão), diferença de golos, golos marcados, presenças
      estatisticasProcessadas.sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;      });
    }    // 5. CURIOSIDADES E ANÁLISES ESPECIAIS
    const curiosidades = gerarCuriosidades(estatisticasProcessadas, anoAtual);
    
    if (estatisticasProcessadas.length > 0) {
      // MVP do ano
      const mvp = estatisticasProcessadas[0];
      curiosidades.push({
        tipo: 'mvp',
        titulo: '🏆 MVP do Ano',
        descricao: `${mvp.nome} lidera com ${mvp.pontos} pontos (${mvp.vitorias}V-${mvp.empates}E-${mvp.derrotas}D)`,
        valor: mvp.pontos
      });

      // Melhor percentagem de vitórias
      const melhorPercentagem = [...estatisticasProcessadas].sort((a, b) => b.percentagem_vitorias - a.percentagem_vitorias)[0];
      if (melhorPercentagem.percentagem_vitorias > 0) {
        curiosidades.push({
          tipo: 'percentagem',
          titulo: '📈 Melhor % de Vitórias',
          descricao: `${melhorPercentagem.nome} com ${melhorPercentagem.percentagem_vitorias}% de vitórias`,
          valor: melhorPercentagem.percentagem_vitorias
        });
      }

      // Mais golos marcados
      const artilheiro = [...estatisticasProcessadas].sort((a, b) => b.golos_marcados - a.golos_marcados)[0];
      curiosidades.push({
        tipo: 'golos',
        titulo: '⚽ Maior Artilheiro',
        descricao: `${artilheiro.nome} marcou ${artilheiro.golos_marcados} golos`,
        valor: artilheiro.golos_marcados
      });

      // Melhor defesa (menos golos sofridos)
      const melhorDefesa = [...estatisticasProcessadas].sort((a, b) => a.golos_sofridos - b.golos_sofridos)[0];
      curiosidades.push({
        tipo: 'defesa',
        titulo: '🛡️ Melhor Defesa',
        descricao: `${melhorDefesa.nome} sofreu apenas ${melhorDefesa.golos_sofridos} golos`,
        valor: melhorDefesa.golos_sofridos
      });

      // Mais jogos
      const maisPresente = [...estatisticasProcessadas].sort((a, b) => b.jogos - a.jogos)[0];
      curiosidades.push({
        tipo: 'presenca',
        titulo: '👥 Mais Presente',
        descricao: `${maisPresente.nome} jogou ${maisPresente.jogos} jogos`,
        valor: maisPresente.jogos
      });
    }

    // 6. ANÁLISE DE DUPLAS
    const duplas = await new Promise((resolve, reject) => {
      db.query(`
        SELECT 
          j1.nome as jogador1,
          j2.nome as jogador2,
          COUNT(DISTINCT jogo.id) as jogos_juntos,
          SUM(CASE 
            WHEN (p1.equipa = p2.equipa AND p1.equipa = 1 AND jogo.equipa1_golos > jogo.equipa2_golos) OR 
                 (p1.equipa = p2.equipa AND p1.equipa = 2 AND jogo.equipa2_golos > jogo.equipa1_golos) 
            THEN 1 ELSE 0 END) as vitorias_juntos,
          ROUND(
            (SUM(CASE 
              WHEN (p1.equipa = p2.equipa AND p1.equipa = 1 AND jogo.equipa1_golos > jogo.equipa2_golos) OR 
                   (p1.equipa = p2.equipa AND p1.equipa = 2 AND jogo.equipa2_golos > jogo.equipa1_golos) 
              THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT jogo.id), 1
          ) as percentagem_vitorias
        FROM presencas p1
        JOIN presencas p2 ON p1.jogo_id = p2.jogo_id AND p1.equipa = p2.equipa AND p1.jogador_id < p2.jogador_id
        JOIN jogadores j1 ON p1.jogador_id = j1.id
        JOIN jogadores j2 ON p2.jogador_id = j2.id
        JOIN jogos jogo ON p1.jogo_id = jogo.id
        WHERE j.data LIKE '${anoAtual}-%' 
          AND jogo.equipa1_golos IS NOT NULL 
          AND jogo.equipa2_golos IS NOT NULL
        GROUP BY j1.id, j2.id, j1.nome, j2.nome
        HAVING COUNT(DISTINCT jogo.id) >= 3
        ORDER BY percentagem_vitorias DESC, jogos_juntos DESC
      `, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const duplasProcessadas = {
      melhores: duplas.slice(0, 5),
      piores: duplas.slice(-3).reverse(),
      extremas: {}
    };

    if (duplas.length > 0) {
      const maisJogos = [...duplas].sort((a, b) => b.jogos_juntos - a.jogos_juntos)[0];
      const menosJogos = [...duplas].sort((a, b) => a.jogos_juntos - b.jogos_juntos)[0];
      
      duplasProcessadas.extremas = {
        maisJogos: maisJogos,
        menosJogos: menosJogos
      };
    }

    // Calcular countdown para mostrar equipas
    let countdown = null;
    if (proximaQuintaFeira && !mostrarEquipas) {
      const agora = new Date();
      const quintaFeiraAs1830 = new Date(proximaQuintaFeira);
      quintaFeiraAs1830.setHours(18, 30, 0, 0);
      const diff = quintaFeiraAs1830.getTime() - agora.getTime();
        if (diff > 0) {
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24));
        const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        countdown = { dias, horas, minutos };
      }
    }    res.render('dashboard', {
      proximaQuintaFeira,
      convocatoria,
      equipasGlobais: equipasFormadas, // Corrigir nome da variável
      tempoRestante: countdown ? 
        (countdown.dias * 24 * 60 * 60 * 1000) + 
        (countdown.horas * 60 * 60 * 1000) + 
        (countdown.minutos * 60 * 1000) : null,
      countdown: countdown, // Passar o countdown diretamente também
      coletesInfo,
      proximoColetes,
      ultimosResultados: resultadosComJogadores,
      estatisticas: estatisticasProcessadas,
      curiosidades: curiosidades,
      duplas: duplasProcessadas,
      anoAtual,
      ordenacaoSelecionada,
      user: req.session.user
    });  } catch (error) {
    console.error('Erro no dashboard:', error);
    res.render('dashboard', {
      proximaQuintaFeira: null,
      convocatoria: [],
      equipasGlobais: { 
        equipa1: { 
          jogadores: [], 
          percentagem_vitorias_media: 0, 
          pontos_totais: 0 
        }, 
        equipa2: { 
          jogadores: [], 
          percentagem_vitorias_media: 0, 
          pontos_totais: 0 
        } 
      },
      tempoRestante: 0,
      countdown: null,
      coletesInfo: [],
      proximoColetes: null,
      ultimosResultados: [],
      estatisticas: [],
      curiosidades: [],
      duplas: { melhores: [], piores: [], extremas: {} },
      anoAtual: new Date().getFullYear().toString(),
      ordenacaoSelecionada: 'percentagem',
      user: req.session.user
    });
  }
});

// ROTA DE TESTE DO DASHBOARD
app.get('/dashboard-test', async (req, res) => {
  try {
    const ordenacaoSelecionada = req.query.ordenacao || 'percentagem';
    const anoAtual = new Date().getFullYear().toString();
    
    const queryEstatisticas = `
      SELECT 
        jog.id,
        jog.nome,
        COUNT(DISTINCT j.id) as jogos,
        SUM(CASE 
          WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
               (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
          THEN 1 ELSE 0 END) as vitorias,
        SUM(CASE 
          WHEN j.equipa1_golos = j.equipa2_golos 
          THEN 1 ELSE 0 END) as empates,
        SUM(CASE 
          WHEN (p.equipa = 1 AND j.equipa1_golos < j.equipa2_golos) OR 
               (p.equipa = 2 AND j.equipa2_golos < j.equipa1_golos) 
          THEN 1 ELSE 0 END) as derrotas,
        ROUND(
          (SUM(CASE 
            WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
                 (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
            THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT j.id), 1
        ) as percentagem_vitorias
      FROM jogadores jog
      LEFT JOIN presencas p ON jog.id = p.jogador_id
      LEFT JOIN jogos j ON p.jogo_id = j.id
      WHERE jog.suspenso = 0 AND j.data LIKE '${anoAtual}-%'
      GROUP BY jog.id, jog.nome
      HAVING COUNT(DISTINCT j.id) > 0
    `;

    const estatisticas = await new Promise((resolve, reject) => {
      db.query(queryEstatisticas, [], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const estatisticasProcessadas = estatisticas.map(stat => ({
      ...stat,
      pontos: (stat.vitorias * 3) + (stat.empates * 1)
    }));

    if (ordenacaoSelecionada === 'percentagem') {
      estatisticasProcessadas.sort((a, b) => b.percentagem_vitorias - a.percentagem_vitorias);
    } else {
      estatisticasProcessadas.sort((a, b) => b.pontos - a.pontos);
    }

    res.render('dashboard_test', {
      estatisticas: estatisticasProcessadas,
      ordenacaoSelecionada,
      anoAtual
    });

  } catch (error) {
    console.error('Erro no dashboard-test:', error);
    res.render('dashboard_test', {
      estatisticas: [],
      ordenacaoSelecionada: 'percentagem',
      anoAtual: new Date().getFullYear().toString()
    });
  }
});

// Exportar função para ser utilizada em rotas
module.exports = {
  gerarCuriosidades,
  app
};
