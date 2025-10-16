const express = require('express');
const path = require('path');
const session = require('express-session');
const bcrypt = require('bcrypt');
const { db, USE_POSTGRES } = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

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

  // Criar utilizadores padrão se não existirem
  const checkUsers = 'SELECT COUNT(*) as count FROM users';
  db.query(checkUsers, [], async (err, result) => {
    const count = USE_POSTGRES ? result.rows[0].count : result.rows[0].count;
    
    if (!err && count == 0) {
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

// ROTAS DE AUTENTICAÇÃO
app.get('/login', (req, res) => {
  if (req.session.user) {
    // Se já está logado, redirecionar conforme o role
    if (req.session.user.role === 'admin') {
      return res.redirect('/');
    } else {
      return res.redirect('/dashboard');
    }
  }
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.render('login', { error: 'Por favor, preencha todos os campos' });
  }
  
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) {
      console.error('Erro na base de dados:', err);
      return res.render('login', { error: 'Erro interno do servidor' });
    }
    
    const user = result.rows && result.rows.length > 0 ? result.rows[0] : null;
    
    if (!user) {
      return res.render('login', { error: 'Utilizador não encontrado' });
    }
    
    // Verificar password
    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) {
        console.error('Erro ao verificar password:', err);
        return res.render('login', { error: 'Erro interno do servidor' });
      }
      
      if (!isMatch) {
        return res.render('login', { error: 'Password incorreta' });
      }
        // Login bem-sucedido
      req.session.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };
      
      console.log(`✅ Login bem-sucedido: ${user.username} (${user.role})`);
      
      // Salvar sessão antes de redirecionar
      req.session.save((err) => {
        if (err) {
          console.error('Erro ao salvar sessão:', err);
          return res.render('login', { error: 'Erro ao salvar sessão' });
        }
        
        // Redirecionar conforme o role
        if (user.role === 'admin') {
          res.redirect('/');
        } else {
          res.redirect('/dashboard');
        }
      });
    });
  });
});

app.post('/logout', (req, res) => {
  const username = req.session.user ? req.session.user.username : 'Desconhecido';
  req.session.destroy((err) => {
    if (err) {
      console.error('Erro ao fazer logout:', err);
    } else {
      console.log(`🚪 Logout: ${username}`);
    }
    res.redirect('/login');
  });
});

// ROTAS PRINCIPAIS
app.get('/', requireAuth, (req, res) => {  
  db.query('SELECT * FROM jogos ORDER BY data DESC', [], (err, jogos) => {
    if (err) {
      console.error('Erro ao buscar jogos:', err);
      return res.render('index', { jogos: [], user: req.session.user });
    }
    
    if (!jogos || jogos.length === 0) {
      return res.render('index', { jogos: [], user: req.session.user });
    }
    
    // Para cada jogo, buscar os jogadores das equipas
    const jogosComJogadores = [];
    let processedCount = 0;    
    
    jogos.forEach((jogo) => {
      db.query(
        `SELECT j.id, j.nome, p.equipa
         FROM presencas p 
         JOIN jogadores j ON p.jogador_id = j.id
         WHERE p.jogo_id = ?
         ORDER BY j.nome`,
        [jogo.id],
        (err, jogadores) => {
          if (!err && jogadores) {
            jogo.jogadores_equipa1 = jogadores.filter(j => j.equipa === 1);
            jogo.jogadores_equipa2 = jogadores.filter(j => j.equipa === 2);
          } else {
            jogo.jogadores_equipa1 = [];
            jogo.jogadores_equipa2 = [];
          }
          
          jogosComJogadores.push(jogo);
          processedCount++;
          
          // Quando todos os jogos foram processados, renderizar a página
          if (processedCount === jogos.length) {
            // Ordenar novamente por data
            jogosComJogadores.sort((a, b) => new Date(b.data) - new Date(a.data));
            res.render('index', { jogos: jogosComJogadores, user: req.session.user });
          }
        }
      );
    });
  });
});

// ROTAS DE JOGADORES
app.get('/jogadores', requireAdmin, (req, res) => {
  db.query('SELECT * FROM jogadores ORDER BY nome', [], (err, jogadores) => {
    res.render('jogadores', { jogadores: jogadores || [], user: req.session.user });
  });
});

app.post('/jogadores', requireAdmin, (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.redirect('/jogadores');
  
  db.query('INSERT INTO jogadores (nome) VALUES (?)', [nome], () => {
    res.redirect('/jogadores');
  });
});

app.post('/jogadores/:id/delete', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM jogadores WHERE id = ?', [id], () => {
    res.redirect('/jogadores');
  });
});

app.post('/jogadores/:id/toggle-suspension', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query('UPDATE jogadores SET suspenso = CASE WHEN suspenso = 1 THEN 0 ELSE 1 END WHERE id = ?', [id], () => {
    res.redirect('/jogadores');
  });
});

app.post('/jogadores/:id/update', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  db.query('UPDATE jogadores SET nome = ? WHERE id = ?', [nome, id], () => {
    res.json({ sucesso: true });
  });
});

// ROTAS DE JOGOS
app.get('/jogos', requireAuth, (req, res) => {
  res.redirect('/');
});

app.get('/jogos/novo', requireAdmin, (req, res) => {
  db.query('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', [], (err, jogadores) => {
    res.render('novo_jogo', { jogadores: jogadores || [], user: req.session.user });
  });
});

app.post('/jogos', requireAdmin, (req, res) => {
  const { data, equipa1, equipa2, equipa1_golos, equipa2_golos } = req.body;
  
  db.query(
    'INSERT INTO jogos (data, equipa1_golos, equipa2_golos) VALUES (?, ?, ?)',
    [data, equipa1_golos, equipa2_golos],
    function (err) {
      if (err) {
        console.error('Erro ao inserir jogo:', err);
        return res.status(500).send('Erro ao registar jogo');
      }
      
      const jogoId = this.lastID;
      
      // Inserir presenças equipa 1
      const equipa1Arr = Array.isArray(equipa1) ? equipa1 : (equipa1 ? [equipa1] : []);
      equipa1Arr.forEach((jogadorId) => {
        if (jogadorId) {
          db.query('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 1)', [jogoId, jogadorId], (err) => {
            if (err) console.error('Erro ao inserir presença equipa1:', err);
          });
        }
      });
      
      // Inserir presenças equipa 2
      const equipa2Arr = Array.isArray(equipa2) ? equipa2 : (equipa2 ? [equipa2] : []);
      equipa2Arr.forEach((jogadorId) => {
        if (jogadorId) {
          db.query('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 2)', [jogoId, jogadorId], (err) => {
            if (err) console.error('Erro ao inserir presença equipa2:', err);
          });
        }
      });
      
      res.redirect('/');
    }
  );
});

app.get('/jogos/:id', requireAuth, (req, res) => {
  const jogoId = req.params.id;
  
  console.log(`Buscando jogo com ID: ${jogoId}`);
  
  db.query('SELECT * FROM jogos WHERE id = ?', [jogoId], (err, jogo) => {
    if (err) {
      console.error('Erro na base de dados:', err);
      return res.status(500).send('Erro na base de dados');
    }
    
    if (!jogo) {
      console.log('Jogo não encontrado');
      return res.status(404).send('Jogo não encontrado');
    }
    
    console.log('Jogo encontrado:', jogo);
    
    db.query(
      `SELECT j.id, j.nome, p.equipa
       FROM presencas p 
       JOIN jogadores j ON p.jogador_id = j.id
       WHERE p.jogo_id = ?`,
      [jogoId],
      (err, jogadores) => {
        if (err) {
          console.error('Erro ao buscar jogadores:', err);
          return res.status(500).send('Erro ao buscar jogadores');
        }
        
        const equipa1 = jogadores ? jogadores.filter(j => j.equipa === 1) : [];
        const equipa2 = jogadores ? jogadores.filter(j => j.equipa === 2) : [];
        
        console.log('Renderizando detalhe_jogo com:', { jogo, equipa1, equipa2 });
        res.render('detalhe_jogo', { jogo, equipa1, equipa2, user: req.session.user });
      }
    );
  });
});

// POST route for updating game results
app.post('/jogos/:id/update', requireAdmin, (req, res) => {
  const jogoId = req.params.id;
  const { data, equipa1_golos, equipa2_golos } = req.body;
  
  console.log(`Atualizando jogo ${jogoId} com:`, { data, equipa1_golos, equipa2_golos });
  
  // Validate input
  if (!data || equipa1_golos === undefined || equipa2_golos === undefined) {
    return res.status(400).send('Dados incompletos');
  }
  
  // Update game in database
  db.query(
    'UPDATE jogos SET data = ?, equipa1_golos = ?, equipa2_golos = ? WHERE id = ?',
    [data, parseInt(equipa1_golos), parseInt(equipa2_golos), jogoId],
    function(err) {
      if (err) {
        console.error('Erro ao atualizar jogo:', err);
        return res.status(500).send('Erro ao atualizar jogo');
      }
      
      if (this.changes === 0) {
        return res.status(404).send('Jogo não encontrado');
      }
      
      console.log(`Jogo ${jogoId} atualizado com sucesso`);
      res.redirect(`/jogos/${jogoId}`);
    }
  );
});

// ROTA DE ESTATÍSTICAS
app.get('/estatisticas', requireAuth, (req, res) => {
  const anoSelecionado = req.query.ano || '2025';
  const mesSelecionado = req.query.mes || '';
  const ordenacaoSelecionada = req.query.ordenacao || 'pontos';
  
  // Construir filtro de data
  let filtroData = '';
  if (mesSelecionado) {
    filtroData = `AND strftime('%Y', j.data) = '${anoSelecionado}' AND strftime('%m', j.data) = '${mesSelecionado.padStart(2, '0')}'`;
  } else {
    filtroData = `AND strftime('%Y', j.data) = '${anoSelecionado}'`;
  }
  
  // Query para calcular estatísticas detalhadas de cada jogador
  const queryEstatisticas = `    SELECT 
      jog.id,
      jog.nome,
      COUNT(DISTINCT j.id) as jogos,      SUM(CASE 
        WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
             (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
        THEN 1 ELSE 0 END) as vitorias,      SUM(CASE 
        WHEN j.equipa1_golos = j.equipa2_golos 
        THEN 1 ELSE 0 END) as empates,
      SUM(CASE 
        WHEN (p.equipa = 1 AND j.equipa1_golos < j.equipa2_golos) OR 
             (p.equipa = 2 AND j.equipa2_golos < j.equipa1_golos) 
        THEN 1 ELSE 0 END) as derrotas,
      SUM(CASE WHEN p.equipa = 1 THEN j.equipa1_golos ELSE j.equipa2_golos END) as golos_marcados,
      SUM(CASE WHEN p.equipa = 1 THEN j.equipa2_golos ELSE j.equipa1_golos END) as golos_sofridos,      ROUND(
        (SUM(CASE 
          WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
               (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
          THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT j.id), 1
      ) as percentagem_vitorias,
      MAX(j.data) as ultimo_jogo
    FROM jogadores jog
    LEFT JOIN presencas p ON jog.id = p.jogador_id
    LEFT JOIN jogos j ON p.jogo_id = j.id
    WHERE jog.suspenso = 0 ${filtroData}
    GROUP BY jog.id, jog.nome
    HAVING COUNT(DISTINCT j.id) > 0
  `;
    db.query(queryEstatisticas, [], (err, estatisticas) => {
    if (err) {
      console.error('Erro ao buscar estatísticas:', err);      return res.render('estatisticas', {
        user: req.session.user,
        estatisticas: [],
        anoSelecionado,
        mesSelecionado,
        ordenacaoSelecionada,
        mvpMensais: [],
        totalJogosMes: 0,
        minimoJogosParaMVP: 0,
        curiosidades: [],
        duplas: null
      });
    }
      // Calcular pontos, diferença de golos e ordenar
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
        return b.jogos - a.jogos;
      });
    }
    
    // Gerar curiosidades/observações
    const curiosidades = gerarCuriosidades(estatisticasProcessadas, anoSelecionado, mesSelecionado);
      // Se é um mês específico, calcular MVP(s)
    let mvpMensais = [];
    let totalJogosMes = 0;
    let duplas = null;
    
    if (mesSelecionado) {
      // Contar total de jogos no mês
      db.query(`
        SELECT COUNT(*) as total 
        FROM jogos j 
        WHERE strftime('%Y', j.data) = ? AND strftime('%m', j.data) = ?
      `, [anoSelecionado, mesSelecionado.padStart(2, '0')], (err, result) => {
        if (!err && result) {
          totalJogosMes = result.total;
          
          // Determinar MVP(s) - usando critérios de desempate corretos
          const minimoJogos = Math.ceil(totalJogosMes * 0.75);
          const candidatos = estatisticasProcessadas.filter(stat => stat.jogos >= minimoJogos);
          
          if (candidatos.length > 0) {
            // Aplicar critérios de desempate: pontos -> diferença golos -> golos marcados -> presenças
            const maxPontos = candidatos[0].pontos;
            const candidatosPontos = candidatos.filter(c => c.pontos === maxPontos);
            
            if (candidatosPontos.length === 1) {
              mvpMensais = candidatosPontos;
            } else {
              // Empate em pontos, verificar diferença de golos
              const maxDiferenca = Math.max(...candidatosPontos.map(c => c.diferenca_golos));
              const candidatosDiferenca = candidatosPontos.filter(c => c.diferenca_golos === maxDiferenca);
              
              if (candidatosDiferenca.length === 1) {
                mvpMensais = candidatosDiferenca;
              } else {
                // Empate em diferença, verificar golos marcados
                const maxGolos = Math.max(...candidatosDiferenca.map(c => c.golos_marcados));
                const candidatosGolos = candidatosDiferenca.filter(c => c.golos_marcados === maxGolos);
                
                if (candidatosGolos.length === 1) {
                  mvpMensais = candidatosGolos;
                } else {
                  // Empate em golos, verificar presenças
                  const maxPresencas = Math.max(...candidatosGolos.map(c => c.jogos));
                  mvpMensais = candidatosGolos.filter(c => c.jogos === maxPresencas);
                }
              }
            }
          }
        }
        
        // Analisar duplas se temos jogos suficientes
        if (totalJogosMes >= 3) {
          analisarDuplas(anoSelecionado, mesSelecionado, (duplasResult) => {
            duplas = duplasResult;            res.render('estatisticas', {
              user: req.session.user,
              estatisticas: estatisticasProcessadas,
              anoSelecionado,
              mesSelecionado,
              ordenacaoSelecionada,
              mvpMensais,
              totalJogosMes,
              minimoJogosParaMVP: Math.ceil(totalJogosMes * 0.75),
              curiosidades,
              duplas
            });
          });
        } else {          res.render('estatisticas', {
            user: req.session.user,
            estatisticas: estatisticasProcessadas,
            anoSelecionado,
            mesSelecionado,
            ordenacaoSelecionada,
            mvpMensais,
            totalJogosMes,
            minimoJogosParaMVP: Math.ceil(totalJogosMes * 0.75),
            curiosidades,
            duplas // null
          });
        }
      });
    } else {
      // Para período anual, também analisar duplas
      analisarDuplas(anoSelecionado, null, (duplasResult) => {
        duplas = duplasResult;        res.render('estatisticas', {
          user: req.session.user,
          estatisticas: estatisticasProcessadas,
          anoSelecionado,
          mesSelecionado,
          ordenacaoSelecionada,
          mvpMensais: [],
          totalJogosMes: 0,
          minimoJogosParaMVP: 0,
          curiosidades,
          duplas
        });
      });
    }
  });
});

// Função para gerar curiosidades/observações
function gerarCuriosidades(estatisticas, ano, mes) {
  const curiosidades = [];
  
  if (estatisticas.length === 0) return curiosidades;
  
  // 1. Jogador com maior percentagem de vitórias
  const melhorPercentagem = estatisticas.reduce((max, stat) => 
    stat.percentagem_vitorias > max.percentagem_vitorias ? stat : max
  );
  curiosidades.push({
    icone: '👑',
    titulo: 'Rei das Vitórias',
    texto: `${melhorPercentagem.nome} tem a melhor percentagem de vitórias: ${melhorPercentagem.percentagem_vitorias}%`
  });
  
  // 2. Jogador com melhor goal average
  const melhorGoalAverage = estatisticas.reduce((max, stat) => 
    stat.diferenca_golos > max.diferenca_golos ? stat : max
  );
  if (melhorGoalAverage.diferenca_golos > 0) {
    curiosidades.push({
      icone: '⚽',
      titulo: 'Máquina de Golos',
      texto: `${melhorGoalAverage.nome} tem o melhor goal average: +${melhorGoalAverage.diferenca_golos} golos`
    });
  }
  
  // 3. Jogador mais presente
  const maisPresentas = estatisticas.reduce((max, stat) => 
    stat.jogos > max.jogos ? stat : max
  );
  curiosidades.push({
    icone: '🎯',
    titulo: 'Mais Assíduo',
    texto: `${maisPresentas.nome} é o mais presente com ${maisPresentas.jogos} jogos`
  });
  
  // 4. Jogador há mais tempo sem jogar (apenas para período anual)
  if (!mes) {
    const maisTempoSemJogar = estatisticas.reduce((oldest, stat) => {
      if (!stat.ultimo_jogo) return oldest;
      return new Date(stat.ultimo_jogo) < new Date(oldest.ultimo_jogo || '9999-12-31') ? stat : oldest;
    }, {});
    
    if (maisTempoSemJogar.ultimo_jogo) {
      const diasSemJogar = Math.floor((new Date() - new Date(maisTempoSemJogar.ultimo_jogo)) / (1000 * 60 * 60 * 24));
      if (diasSemJogar > 30) {
        curiosidades.push({
          icone: '😴',
          titulo: 'Saudades do Campo',
          texto: `${maisTempoSemJogar.nome} não joga há ${diasSemJogar} dias (último jogo: ${new Date(maisTempoSemJogar.ultimo_jogo).toLocaleDateString('pt-PT')})`
        });
      }
    }
  }
  
  // 5. Estatística curiosa sobre pontos
  const totalPontos = estatisticas.reduce((sum, stat) => sum + stat.pontos, 0);
  const mediaPontos = Math.round(totalPontos / estatisticas.length * 10) / 10;
  curiosidades.push({
    icone: '📊',
    titulo: 'Média de Pontos',
    texto: `A média de pontos ${mes ? 'do mês' : 'do ano'} é ${mediaPontos} pontos por jogador`
  });
  
  // 6. Jogador mais "azarado" (mais derrotas)
  const maisAzarado = estatisticas.reduce((max, stat) => 
    stat.derrotas > max.derrotas ? stat : max
  );
  if (maisAzarado.derrotas > 0) {
    curiosidades.push({
      icone: '😅',
      titulo: 'Azar nas Cartas',
      texto: `${maisAzarado.nome} tem o maior número de derrotas: ${maisAzarado.derrotas}`
    });  }
    // 7. Comparação interessante entre top 2
  if (estatisticas.length >= 2) {
    const primeiro = estatisticas[0];
    const segundo = estatisticas[1];
    const diferencaPontos = primeiro.pontos - segundo.pontos;
    
    if (diferencaPontos > 0) {
      curiosidades.push({
        icone: '🥇',
        titulo: 'Liderança',
        texto: `${primeiro.nome} lidera com ${diferencaPontos} ponto${diferencaPontos > 1 ? 's' : ''} de vantagem sobre ${segundo.nome}`
      });
    }
  }
  
  return curiosidades;
}

// ROTAS DE COLETES
app.get('/coletes', requireAuth, (req, res) => {
  console.log('=== ROTA /coletes CHAMADA ===');
  
  // Primeiro, adicionar a coluna suspenso se não existir
  db.query("ALTER TABLE jogadores ADD COLUMN suspenso INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Erro ao adicionar coluna suspenso:', err);
    } else {
      console.log('Coluna suspenso verificada/adicionada');
    }
    
    // Buscar estatísticas dos convocados apenas (os 10 da convocatória)
    db.query(`
      SELECT 
        j.id,
        j.nome,
        COALESCE(j.suspenso, 0) as suspenso,
        COUNT(c.id) as vezes_levou,
        MAX(c.data_levou) as ultima_vez,
        conv.posicao
      FROM jogadores j
      JOIN convocatoria conv ON j.id = conv.jogador_id AND conv.tipo = 'convocado'
      LEFT JOIN coletes c ON j.id = c.jogador_id
      WHERE COALESCE(j.suspenso, 0) = 0
      GROUP BY j.id, j.nome, j.suspenso, conv.posicao
      ORDER BY vezes_levou ASC, ultima_vez ASC NULLS FIRST, conv.posicao ASC
    `, [], (err, estatisticas) => {
      if (err) {
        console.error('Erro SQL na consulta de estatísticas:', err.message);
        return res.status(500).send(`Erro ao buscar dados: ${err.message}`);
      }
      
      console.log('Estatísticas encontradas:', estatisticas);
      
      // Buscar quem tem os coletes actualmente
      db.query(`
        SELECT c.*, j.nome as jogador_nome, c.data_levou
        FROM coletes c
        JOIN jogadores j ON c.jogador_id = j.id
        WHERE c.data_devolveu IS NULL
        ORDER BY c.data_levou DESC
        LIMIT 1
      `, [], (err, coletesActuais) => {
        if (err) {
          console.error('Erro ao buscar coletes actuais:', err);
          coletesActuais = null;
        }
        
        console.log('Coletes actuais:', coletesActuais);
        
        // Determinar próximo a levar os coletes (primeiro da lista que não tem atualmente)
        let proximoConvocado = null;
        if (estatisticas.length > 0) {
          if (coletesActuais) {
            // Se alguém tem os coletes, o próximo é o primeiro da lista que não é o atual
            proximoConvocado = estatisticas.find(e => e.id !== coletesActuais.jogador_id);
          } else {
            // Se ninguém tem os coletes, o próximo é o primeiro da lista
            proximoConvocado = estatisticas[0];
          }
        }
        
        console.log('Próximo convocado:', proximoConvocado);
          res.render('coletes', { 
          user: req.session.user,
          estatisticas: estatisticas || [],
          coletesActuais: coletesActuais || null,
          proximoConvocado: proximoConvocado || null
        });
      });
    });
  });
});

app.post('/coletes/atribuir', requireAdmin, (req, res) => {
  const { jogador_id } = req.body;
  const dataHoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Primeiro, marcar os coletes actuais como devolvidos
  db.query(`
    UPDATE coletes 
    SET data_devolveu = ? 
    WHERE data_devolveu IS NULL
  `, [dataHoje], (err) => {
    if (err) {
      console.error('Erro ao marcar devolução:', err);
      return res.status(500).send('Erro ao actualizar dados');
    }
    
    // Depois, atribuir os coletes ao novo jogador
    db.query(`
      INSERT INTO coletes (jogador_id, data_levou) 
      VALUES (?, ?)
    `, [jogador_id, dataHoje], (err) => {
      if (err) {
        console.error('Erro ao atribuir coletes:', err);
        return res.status(500).send('Erro ao atribuir coletes');
      }
      
      res.redirect('/coletes');
    });
  });
});

app.post('/jogos/:id/delete', requireAdmin, (req, res) => {
  const jogoId = req.params.id;
  
  // Primeiro, eliminar todas as presenças do jogo
  db.query('DELETE FROM presencas WHERE jogo_id = ?', [jogoId], (err) => {
    if (err) {
      console.error('Erro ao eliminar presenças:', err);
      return res.status(500).send('Erro ao eliminar presenças do jogo');
    }
    
    // Depois, eliminar o jogo
    db.query('DELETE FROM jogos WHERE id = ?', [jogoId], (err) => {
      if (err) {
        console.error('Erro ao eliminar jogo:', err);
        return res.status(500).send('Erro ao eliminar jogo');
      }
      
      res.redirect('/');
    });
  });
});

// Rota para página de convocatória
app.get('/convocatoria', requireAuth, (req, res) => {
  console.log('=== ROTA /convocatoria CHAMADA ===');
  
  // Buscar todos os jogadores ativos
  db.query('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', (err, jogadores) => {
    if (err) {
      console.error('Erro ao buscar jogadores:', err);
      return res.status(500).send('Erro ao buscar jogadores');
    }

    console.log('Jogadores encontrados:', jogadores.length);

    // Buscar configuração da convocatória (se existir)
    db.query('SELECT * FROM convocatoria_config LIMIT 1', (err, config) => {
      if (err) {
        console.error('Erro ao buscar configuração:', err);
        // Se não existe tabela, criar com configuração padrão
        console.log('Criando sistema pela primeira vez...');
        initConvocatoriaSystem(jogadores, res);
        return;
      }

      if (!config) {
        // Primeira vez - criar configuração padrão
        console.log('Config não existe, criando...');
        initConvocatoriaSystem(jogadores, res);
        return;
      }

      console.log('Config encontrada:', config);      // Buscar convocados e reservas com contagem de faltas e confirmação
      db.query(`
        SELECT j.*, c.posicao, c.tipo, c.confirmado, c.data_confirmacao,
               COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
        FROM jogadores j 
        JOIN convocatoria c ON j.id = c.jogador_id 
        WHERE j.suspenso = 0 
        ORDER BY c.tipo, c.posicao
      `, (err, convocatoria) => {
        if (err) {
          console.error('Erro ao buscar convocatória:', err);
          return res.status(500).send('Erro ao buscar convocatória');
        }

        console.log('Convocatória encontrada:', convocatoria.length);

        const convocados = convocatoria.filter(j => j.tipo === 'convocado');
        const reservas = convocatoria.filter(j => j.tipo === 'reserva');        console.log('Convocados:', convocados.length, 'Reservas:', reservas.length);        res.render('convocatoria', { 
          user: req.session.user,
          convocados, 
          reservas, 
          config,
          equipas: global.equipasGeradas || null,
          title: 'Convocatória - Peladas das Quintas Feiras'
        });
      });
    });
  });
});

// Marcar jogador como faltoso (move para último lugar das reservas)
app.post('/convocatoria/marcar-falta/:id', requireAdmin, (req, res) => {
  const jogadorId = req.params.id;
  
  // Verificar se é convocado
  db.query('SELECT * FROM convocatoria WHERE jogador_id = ? AND tipo = "convocado"', [jogadorId], (err, convocado) => {
    if (err || !convocado) {
      return res.status(400).send('Jogador não é convocado');
    }

    // Buscar último número de posição das reservas
    db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', (err, result) => {
      if (err) {
        console.error('Erro ao buscar posição:', err);
        return res.status(500).send('Erro interno');
      }

      const novaPosicaoReserva = (result.max_pos || 0) + 1;

      // Mover convocado para reservas
      db.query('UPDATE convocatoria SET tipo = "reserva", posicao = ? WHERE jogador_id = ?', 
        [novaPosicaoReserva, jogadorId], (err) => {
        if (err) {
          console.error('Erro ao mover para reservas:', err);
          return res.status(500).send('Erro ao marcar falta');
        }

        // Registrar falta no histórico
        db.query('INSERT INTO faltas_historico (jogador_id, data_falta) VALUES (?, date("now"))', [jogadorId]);

        // Promover primeiro reserva para convocado
        db.query('SELECT * FROM convocatoria WHERE tipo = "reserva" ORDER BY posicao LIMIT 1', (err, primeiroReserva) => {
          if (err) {
            console.error('Erro ao buscar primeiro reserva:', err);
            return res.status(500).send('Erro interno');
          }

          if (primeiroReserva && primeiroReserva.jogador_id !== parseInt(jogadorId)) {
            // Mover primeiro reserva para convocado na posição do faltoso
            db.query('UPDATE convocatoria SET tipo = "convocado", posicao = ? WHERE jogador_id = ?', 
              [convocado.posicao, primeiroReserva.jogador_id], (err) => {
              if (err) {
                console.error('Erro ao promover reserva:', err);
                return res.status(500).send('Erro ao promover reserva');
              }

              // Reorganizar posições das reservas
              reorganizarReservas(() => {
                res.redirect('/convocatoria');
              });
            });
          } else {
            res.redirect('/convocatoria');
          }
        });
      });
    });
  });
});

// Resetar convocatória (voltar todos para posições originais)
app.post('/convocatoria/reset', requireAdmin, (req, res) => {
  db.query('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', (err, jogadores) => {
    if (err) {
      console.error('Erro ao buscar jogadores:', err);
      return res.status(500).send('Erro ao buscar jogadores');
    }

    // Limpar convocatória atual
    db.query('DELETE FROM convocatoria', (err) => {
      if (err) {
        console.error('Erro ao limpar convocatória:', err);
        return res.status(500).send('Erro ao resetar');
      }

      // Recriar configuração padrão
      initConvocatoriaSystem(jogadores, res);
    });
  });
});

// Rota especial para migrar convocatória para 10 jogadores
app.post('/convocatoria/migrar-para-10', requireAdmin, (req, res) => {
  console.log('=== MIGRANDO CONVOCATÓRIA PARA 10 CONVOCADOS ===');
  
  // Buscar todos os convocados atuais ordenados por posição
  db.query('SELECT * FROM convocatoria WHERE tipo = "convocado" ORDER BY posicao', (err, convocados) => {
    if (err) {
      console.error('Erro ao buscar convocados:', err);
      return res.status(500).send('Erro na migração');
    }
    
    console.log('Convocados encontrados:', convocados.length);
    
    if (convocados.length <= 10) {
      console.log('Já tem 10 ou menos convocados, nada a fazer');
      return res.redirect('/convocatoria');
    }
    
    // Mover os últimos 4 convocados (posições 11-14) para reservas
    const convocadosParaMover = convocados.slice(10); // Posições 11 em diante
    
    console.log('Movendo para reservas:', convocadosParaMover.map(c => c.jogador_id));
    
    // Buscar a última posição das reservas
    db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', (err, result) => {
      if (err) {
        console.error('Erro ao buscar max posição reservas:', err);
        return res.status(500).send('Erro na migração');
      }
      
      let proximaPosicaoReserva = (result.max_pos || 0) + 1;
      
      // Mover cada convocado para reserva
      let movimentos = 0;
      
      convocadosParaMover.forEach((convocado) => {
        db.query('UPDATE convocatoria SET tipo = "reserva", posicao = ? WHERE id = ?', 
          [proximaPosicaoReserva, convocado.id], (err) => {
          if (err) {
            console.error('Erro ao mover convocado:', err);
          } else {
            console.log(`Movido jogador ${convocado.jogador_id} para reserva posição ${proximaPosicaoReserva}`);
          }
          
          movimentos++;
          proximaPosicaoReserva++;
          
          // Quando todos os movimentos estiverem completos
          if (movimentos === convocadosParaMover.length) {
            console.log('Migração concluída!');
            res.redirect('/convocatoria');
          }
        });
      });
    });
  });
});

// Rota para configuração personalizada da convocatória
app.post('/convocatoria/configurar-personalizada', requireAdmin, (req, res) => {
  console.log('=== CONFIGURANDO CONVOCATORIA PERSONALIZADA ===');
  
  // Ordem específica dos convocados
  const convocadosOrdem = [
    'Rui',
    'Joaquim Rocha', 
    'João Couto',
    'Joel Almeida',
    'Ismael Campos',
    'Césaro Cruz',
    'Rogério Silva',
    'Nuno Ferreira',
    'Ricardo Sousa',
    'Valter Pinho'
  ];
  
  // Ordem específica das reservas
  const reservasOrdem = [
    'Carlos Correia',
    'Carlos Silva',
    'Filipe Garcês',
    'Flávio Silva',
    'Manuel Rocha',
    'Pedro Lopes'
  ];
  
  // Primeiro, limpar faltas históricas
  db.query('DELETE FROM faltas_historico', (err) => {
    if (err) {
      console.error('Erro ao limpar faltas:', err);
    } else {
      console.log('Faltas históricas limpas');
    }
    
    // Buscar todos os jogadores ativos
    db.query('SELECT * FROM jogadores WHERE suspenso = 0', (err, jogadores) => {
      if (err) {
        console.error('Erro ao buscar jogadores:', err);
        return res.status(500).send('Erro ao buscar jogadores');
      }
      
      // Criar mapa de jogadores por nome
      const jogadoresPorNome = {};
      jogadores.forEach(jogador => {
        jogadoresPorNome[jogador.nome] = jogador;
      });
      
      // Limpar convocatória atual
      db.query('DELETE FROM convocatoria', (err) => {
        if (err) {
          console.error('Erro ao limpar convocatória:', err);
          return res.status(500).send('Erro ao limpar convocatória');
        }
        
        console.log('Convocatória atual limpa');
        
        // Inserir convocados na ordem especificada
        let inseridos = 0;
        const totalInserções = convocadosOrdem.length + reservasOrdem.length;
        
        convocadosOrdem.forEach((nome, index) => {
          const jogador = jogadoresPorNome[nome];
          if (jogador) {
            db.query('INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, ?, ?)', 
              [jogador.id, 'convocado', index + 1], (err) => {
              if (err) {
                console.error(`Erro ao inserir convocado ${nome}:`, err);
              } else {
                console.log(`Convocado ${nome} inserido na posição ${index + 1}`);
              }
              inseridos++;
              if (inseridos === totalInserções) {
                console.log('Configuração personalizada concluída!');
                res.redirect('/convocatoria');
              }
            });
          } else {
            console.warn(`Jogador ${nome} não encontrado`);
            inseridos++;
            if (inseridos === totalInserções) {
              res.redirect('/convocatoria');
            }
          }
        });
        
        // Inserir reservas na ordem especificada
        reservasOrdem.forEach((nome, index) => {
          const jogador = jogadoresPorNome[nome];
          if (jogador) {
            db.query('INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, ?, ?)', 
              [jogador.id, 'reserva', index + 1], (err) => {
              if (err) {
                console.error(`Erro ao inserir reserva ${nome}:`, err);
              } else {
                console.log(`Reserva ${nome} inserido na posição ${index + 1}`);
              }
              inseridos++;
              if (inseridos === totalInserções) {
                console.log('Configuração personalizada concluída!');
                res.redirect('/convocatoria');
              }
            });
          } else {
            console.warn(`Jogador ${nome} não encontrado`);
            inseridos++;
            if (inseridos === totalInserções) {
              res.redirect('/convocatoria');
            }
          }
        });
        
        // Adicionar jogadores restantes como reservas
        const jogadoresRestantes = jogadores.filter(jogador => 
          !convocadosOrdem.includes(jogador.nome) && 
          !reservasOrdem.includes(jogador.nome)
        );
        
        let posicaoReservaExtra = reservasOrdem.length + 1;
        jogadoresRestantes.forEach(jogador => {
          db.query('INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, ?, ?)', 
            [jogador.id, 'reserva', posicaoReservaExtra], (err) => {
            if (err) {
              console.error(`Erro ao inserir reserva extra ${jogador.nome}:`, err);
            } else {
              console.log(`Reserva extra ${jogador.nome} inserido na posição ${posicaoReservaExtra}`);
            }
            inseridos++;
            posicaoReservaExtra++;
            if (inseridos === totalInserções + jogadoresRestantes.length) {
              console.log('Configuração personalizada concluída!');
              res.redirect('/convocatoria');
            }
          });
        });
        
        // Se não há jogadores restantes, redirecionar imediatamente se já terminamos
        if (jogadoresRestantes.length === 0 && inseridos === totalInserções) {
          console.log('Configuração personalizada concluída!');
          res.redirect('/convocatoria');
        }
      });
    });
  });
});

// Rota para configuração final (limpar faltas e ordem específica)
app.post('/convocatoria/configuracao-final', requireAdmin, (req, res) => {
  console.log('=== CONFIGURAÇÃO FINAL ===');
  
  // 1. Limpar todas as faltas de teste
  db.query('DELETE FROM faltas_historico', (err) => {
    if (err) {
      console.error('Erro ao limpar faltas:', err);
    } else {
      console.log('Faltas de teste limpas com sucesso');
    }
  });

  // 2. Limpar convocatória atual
  db.query('DELETE FROM convocatoria', (err) => {
    if (err) {
      console.error('Erro ao limpar convocatória:', err);
      return res.status(500).send('Erro ao limpar convocatória');
    }

    // 3. Configurar ordem específica dos convocados (10 jogadores)
    const convocadosOrdem = [
      'Rui',
      'Joaquim Rocha',
      'João Couto',
      'Joel Almeida',
      'Ismael Campos',
      'Césaro Cruz',
      'Rogério Silva',
      'Nuno Ferreira',
      'Ricardo Sousa',
      'Valter Pinho'
    ];

    // 4. Configurar ordem específica das reservas (9 jogadores)
    const reservasOrdem = [
      'Carlos Correia',
      'Carlos Silva',
      'Filipe Garcês',
      'Flávio Silva',
      'Manuel Rocha',
      'Pedro Lopes',
      'Leonardo Sousa',
      'Paulo Pinto',
      'Hugo Belga'
    ];

    // Buscar jogadores para obter os IDs
    db.query('SELECT id, nome FROM jogadores WHERE suspenso = 0', (err, jogadores) => {
      if (err) {
        console.error('Erro ao buscar jogadores:', err);
        return res.status(500).send('Erro ao buscar jogadores');
      }

      console.log('Jogadores disponíveis:', jogadores.map(j => j.nome));

      const jogadoresMap = {};
      jogadores.forEach(j => jogadoresMap[j.nome] = j.id);

      let insertCount = 0;
      const totalInserts = convocadosOrdem.length + reservasOrdem.length;

      // Inserir convocados
      convocadosOrdem.forEach((nome, index) => {
        if (jogadoresMap[nome]) {
          db.query(`INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, 'convocado', ?)`,
            [jogadoresMap[nome], index + 1], (err) => {
              if (err) {
                console.error(`Erro ao inserir convocado ${nome}:`, err);
              } else {
                console.log(`Convocado inserido: ${nome} (posição ${index + 1})`);
              }
              insertCount++;
              if (insertCount === totalInserts) {
                console.log('Configuração final concluída!');
                res.redirect('/convocatoria');
              }
            });
        } else {
          console.warn(`Jogador não encontrado: ${nome}`);
          insertCount++;
          if (insertCount === totalInserts) {
            res.redirect('/convocatoria');
          }
        }
      });

      // Inserir reservas
      reservasOrdem.forEach((nome, index) => {
        if (jogadoresMap[nome]) {
          db.query(`INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, 'reserva', ?)`,
            [jogadoresMap[nome], index + 1], (err) => {
              if (err) {
                console.error(`Erro ao inserir reserva ${nome}:`, err);
              } else {
                console.log(`Reserva inserido: ${nome} (posição ${index + 1})`);
              }
              insertCount++;
              if (insertCount === totalInserts) {
                console.log('Configuração final concluída!');
                res.redirect('/convocatoria');
              }
            });
        } else {
          console.warn(`Jogador não encontrado: ${nome}`);
          insertCount++;
          if (insertCount === totalInserts) {
            res.redirect('/convocatoria');
          }
        }
      });
    });
  });
});

// Rota para confirmar/desconfirmar presença
app.post('/convocatoria/confirmar-presenca/:id', requireAuth, (req, res) => {
  const jogadorId = req.params.id;
  const dataConfirmacao = new Date().toISOString();
  
  // Alternar confirmação
  db.query('SELECT confirmado FROM convocatoria WHERE jogador_id = ?', [jogadorId], (err, result) => {
    if (err) {
      console.error('Erro ao buscar confirmação:', err);
      return res.status(500).send('Erro interno');
    }
    
    const novoStatus = result.confirmado ? 0 : 1;
    const dataParam = novoStatus ? dataConfirmacao : null;
    
    db.query('UPDATE convocatoria SET confirmado = ?, data_confirmacao = ? WHERE jogador_id = ?', 
      [novoStatus, dataParam, jogadorId], (err) => {
      if (err) {
        console.error('Erro ao atualizar confirmação:', err);
        return res.status(500).send('Erro interno');
      }
      
      res.redirect('/convocatoria');
    });
  });
});

// Rota para mover reservas para cima/baixo na lista
app.post('/convocatoria/mover-reserva/:id/:direcao', requireAuth, (req, res) => {
  const jogadorId = req.params.id;
  const direcao = req.params.direcao; // 'up' ou 'down'
  
  // Buscar posição atual do jogador
  db.query('SELECT * FROM convocatoria WHERE jogador_id = ? AND tipo = "reserva"', [jogadorId], (err, jogador) => {
    if (err || !jogador) {
      return res.status(400).send('Jogador não encontrado nas reservas');
    }

    const posicaoAtual = jogador.posicao;
    let novaPosicao;

    if (direcao === 'up' && posicaoAtual > 1) {
      novaPosicao = posicaoAtual - 1;
    } else if (direcao === 'down') {
      // Verificar se não é o último
      db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', (err, result) => {
        if (err) return res.status(500).send('Erro interno');
        
        if (posicaoAtual < result.max_pos) {
          novaPosicao = posicaoAtual + 1;
          
          // Trocar posições
          db.serialize(() => {
            db.query('UPDATE convocatoria SET posicao = -1 WHERE posicao = ? AND tipo = "reserva"', [novaPosicao]);
            db.query('UPDATE convocatoria SET posicao = ? WHERE jogador_id = ?', [novaPosicao, jogadorId]);
            db.query('UPDATE convocatoria SET posicao = ? WHERE posicao = -1', [posicaoAtual]);
          });
          
          setTimeout(() => res.redirect('/convocatoria'), 100);
        } else {
          res.redirect('/convocatoria');
        }
      });
      return;
    } else {
      return res.redirect('/convocatoria');
    }

    // Para movimento para cima
    if (novaPosicao) {
      db.serialize(() => {
        db.query('UPDATE convocatoria SET posicao = -1 WHERE posicao = ? AND tipo = "reserva"', [novaPosicao]);
        db.query('UPDATE convocatoria SET posicao = ? WHERE jogador_id = ?', [novaPosicao, jogadorId]);
        db.query('UPDATE convocatoria SET posicao = ? WHERE posicao = -1', [posicaoAtual]);
      });
      
      setTimeout(() => res.redirect('/convocatoria'), 100);
    } else {
      res.redirect('/convocatoria');
    }
  });
});

// ROTAS PARA EQUIPAS EQUILIBRADAS
// Rota para confirmar convocados e gerar equipas
app.post('/convocatoria/confirmar-equipas', requireAdmin, (req, res) => {
  console.log('=== GERANDO EQUIPAS EQUILIBRADAS ===');
  
  // Buscar convocados com suas estatísticas
  db.query(`
    SELECT 
      j.id,
      j.nome,
      c.posicao,
      COALESCE(stats.pontos, 0) as pontos,
      COALESCE(stats.jogos, 0) as jogos,
      COALESCE(stats.vitorias, 0) as vitorias,
      COALESCE(stats.percentagem_vitorias, 0) as percentagem_vitorias
    FROM jogadores j 
    JOIN convocatoria c ON j.id = c.jogador_id 
    LEFT JOIN (
      SELECT 
        jog.id,
        COUNT(DISTINCT jg.id) as jogos,        SUM(CASE 
          WHEN (p.equipa = 1 AND jg.equipa1_golos > jg.equipa2_golos) OR 
               (p.equipa = 2 AND jg.equipa2_golos > jg.equipa1_golos) 
          THEN 1 ELSE 0 
        END) as vitorias,
        SUM(CASE WHEN jg.equipa1_golos = jg.equipa2_golos THEN 1 ELSE 0 END) as empates,        SUM(CASE 
          WHEN (p.equipa = 1 AND jg.equipa1_golos < jg.equipa2_golos) OR 
               (p.equipa = 2 AND jg.equipa2_golos < jg.equipa1_golos) 
          THEN 1 ELSE 0 
        END) as derrotas,        ((SUM(CASE 
          WHEN (p.equipa = 1 AND jg.equipa1_golos > jg.equipa2_golos) OR 
               (p.equipa = 2 AND jg.equipa2_golos > jg.equipa1_golos) 
          THEN 1 ELSE 0 
        END) * 3) +
        (SUM(CASE WHEN jg.equipa1_golos = jg.equipa2_golos THEN 1 ELSE 0 END) * 1)) as pontos,        ROUND(
          (SUM(CASE 
            WHEN (p.equipa = 1 AND jg.equipa1_golos > jg.equipa2_golos) OR 
                 (p.equipa = 2 AND jg.equipa2_golos > jg.equipa1_golos) 
            THEN 1 ELSE 0 
          END) * 100.0) / COUNT(DISTINCT jg.id), 1
        ) as percentagem_vitorias
      FROM jogadores jog
      JOIN presencas p ON jog.id = p.jogador_id
      JOIN jogos jg ON p.jogo_id = jg.id
      WHERE strftime('%Y', jg.data) = '2025'
        AND jog.suspenso = 0
      GROUP BY jog.id
    ) stats ON j.id = stats.id
    WHERE c.tipo = 'convocado' 
      AND j.suspenso = 0 
    ORDER BY c.posicao
  `, (err, convocados) => {
    if (err) {
      console.error('Erro ao buscar convocados:', err);
      return res.status(500).send('Erro ao buscar dados dos convocados');
    }

    console.log('Convocados encontrados:', convocados.length);
    
    if (convocados.length < 10) {
      return res.redirect('/convocatoria?erro=convocados_insuficientes');
    }

    // Gerar equipas equilibradas
    const equipas = gerarEquipasEquilibradas(convocados);
    
    // Guardar equipas na sessão ou base de dados temporária
    // Por simplicidade, vamos usar uma variável global temporária
    global.equipasGeradas = equipas;
    
    // Buscar dados da convocatória novamente para renderizar
    buscarDadosConvocatoria((convocatoriaData) => {      res.render('convocatoria', { 
        user: req.session.user,
        ...convocatoriaData,
        equipas: equipas
      });
    });
  });
});

// Rota para trocar jogadores entre equipas
app.post('/convocatoria/trocar-jogadores', requireAdmin, (req, res) => {
  const { jogador1, jogador2 } = req.body;
  
  console.log('Trocando jogadores:', jogador1, jogador2);
  
  if (!global.equipasGeradas) {
    return res.redirect('/convocatoria');
  }

  // Encontrar os jogadores nas equipas
  let jogador1Equipa = null, jogador1Index = null;
  let jogador2Equipa = null, jogador2Index = null;

  // Procurar na equipa 1
  global.equipasGeradas.equipa1.jogadores.forEach((jogador, index) => {
    if (jogador.id == jogador1) {
      jogador1Equipa = 1;
      jogador1Index = index;
    }
    if (jogador.id == jogador2) {
      jogador2Equipa = 1;
      jogador2Index = index;
    }
  });

  // Procurar na equipa 2
  global.equipasGeradas.equipa2.jogadores.forEach((jogador, index) => {
    if (jogador.id == jogador1) {
      jogador1Equipa = 2;
      jogador1Index = index;
    }
    if (jogador.id == jogador2) {
      jogador2Equipa = 2;
      jogador2Index = index;
    }
  });

  // Fazer a troca se os jogadores estão em equipas diferentes
  if (jogador1Equipa && jogador2Equipa && jogador1Equipa !== jogador2Equipa) {
    if (jogador1Equipa === 1) {
      // Jogador1 está na equipa 1, jogador2 na equipa 2
      const temp = global.equipasGeradas.equipa1.jogadores[jogador1Index];
      global.equipasGeradas.equipa1.jogadores[jogador1Index] = global.equipasGeradas.equipa2.jogadores[jogador2Index];
      global.equipasGeradas.equipa2.jogadores[jogador2Index] = temp;
    } else {
      // Jogador1 está na equipa 2, jogador2 na equipa 1
      const temp = global.equipasGeradas.equipa2.jogadores[jogador1Index];
      global.equipasGeradas.equipa2.jogadores[jogador1Index] = global.equipasGeradas.equipa1.jogadores[jogador2Index];
      global.equipasGeradas.equipa1.jogadores[jogador2Index] = temp;
    }    // Recalcular estatísticas das equipas
    recalcularEstatisticasEquipas(global.equipasGeradas);
  }

  // Buscar dados da convocatória novamente para renderizar
  buscarDadosConvocatoria((convocatoriaData) => {
    res.render('convocatoria', { 
      user: req.session.user,
      ...convocatoriaData,
      equipas: global.equipasGeradas
    });
  });
});

// Rota para reequilibrar equipas automaticamente
app.post('/convocatoria/reequilibrar-equipas', requireAdmin, (req, res) => {
  if (!global.equipasGeradas) {
    return res.redirect('/convocatoria');
  }

  // Combinar todos os jogadores e regerar as equipas
  const todosJogadores = [
    ...global.equipasGeradas.equipa1.jogadores,
    ...global.equipasGeradas.equipa2.jogadores
  ];
  // Gerar novas equipas equilibradas
  global.equipasGeradas = gerarEquipasEquilibradas(todosJogadores);

  // Buscar dados da convocatória novamente para renderizar
  buscarDadosConvocatoria((convocatoriaData) => {
    res.render('convocatoria', { 
      user: req.session.user,
      ...convocatoriaData,
      equipas: global.equipasGeradas
    });
  });
});

// Rota para salvar equipas (criar novo jogo)
app.post('/convocatoria/salvar-equipas', requireAdmin, (req, res) => {
  if (!global.equipasGeradas) {
    return res.redirect('/convocatoria');
  }

  const dataHoje = new Date().toISOString().split('T')[0];
  
  // Criar novo jogo com as equipas
  db.query(
    'INSERT INTO jogos (data, equipa1_golos, equipa2_golos) VALUES (?, ?, ?)',
    [dataHoje, 0, 0], // Golos iniciais em 0
    function (err) {
      if (err) {
        console.error('Erro ao criar jogo:', err);
        return res.status(500).send('Erro ao salvar equipas');
      }
      
      const jogoId = this.lastID;
      
      // Inserir presenças equipa 1
      global.equipasGeradas.equipa1.jogadores.forEach((jogador) => {
        db.query('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 1)', 
          [jogoId, jogador.id], (err) => {
          if (err) console.error('Erro ao inserir presença equipa1:', err);
        });
      });
      
      // Inserir presenças equipa 2
      global.equipasGeradas.equipa2.jogadores.forEach((jogador) => {
        db.query('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 2)', 
          [jogoId, jogador.id], (err) => {
          if (err) console.error('Erro ao inserir presença equipa2:', err);
        });
      });
      
      // Limpar equipas geradas
      global.equipasGeradas = null;
      
      res.redirect(`/jogos/${jogoId}`);
    }
  );
});

// Função auxiliar para buscar dados da convocatória
function buscarDadosConvocatoria(callback) {
  db.query('SELECT * FROM convocatoria_config LIMIT 1', (err, config) => {
    if (err || !config) {
      config = { max_convocados: 10 };
    }

    db.query(`
      SELECT j.*, c.posicao, c.tipo,
             COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
      FROM jogadores j 
      JOIN convocatoria c ON j.id = c.jogador_id 
      WHERE j.suspenso = 0 
      ORDER BY c.tipo, c.posicao
    `, (err, convocatoria) => {
      if (err) {
        console.error('Erro ao buscar convocatória:', err);
        return callback({ convocados: [], reservas: [], config });
      }

      const convocados = convocatoria.filter(j => j.tipo === 'convocado');
      const reservas = convocatoria.filter(j => j.tipo === 'reserva');

      callback({ convocados, reservas, config });
    });
  });
}

// Função para gerar equipas equilibradas
function gerarEquipasEquilibradas(jogadores) {
  console.log('Gerando equipas com jogadores:', jogadores.map(j => `${j.nome} (${(j.percentagem_vitorias || 0).toFixed(1)}% vitórias)`));
  
  // Ordenar jogadores por percentagem de vitórias (melhor para pior)
  const jogadoresOrdenados = [...jogadores].sort((a, b) => {
    // Primeiro critério: percentagem de vitórias
    const percentA = a.percentagem_vitorias || 0;
    const percentB = b.percentagem_vitorias || 0;
    if (percentA !== percentB) return percentB - percentA;
    
    // Segundo critério: pontos (para desempate)
    if (a.pontos !== b.pontos) return b.pontos - a.pontos;
    
    // Terceiro critério: posição na convocatória (prioridade)
    return a.posicao - b.posicao;
  });
  
  // Algoritmo de balanceamento snake draft (serpentina)
  const equipa1 = [];
  const equipa2 = [];
  
  // Distribuir em grupos de 2, alternando a ordem
  for (let i = 0; i < jogadoresOrdenados.length; i += 4) {
    // Primeiro e quarto jogador do grupo vão para equipa 1
    if (jogadoresOrdenados[i]) equipa1.push(jogadoresOrdenados[i]);
    if (jogadoresOrdenados[i + 3]) equipa1.push(jogadoresOrdenados[i + 3]);
    
    // Segundo e terceiro jogador do grupo vão para equipa 2
    if (jogadoresOrdenados[i + 1]) equipa2.push(jogadoresOrdenados[i + 1]);
    if (jogadoresOrdenados[i + 2]) equipa2.push(jogadoresOrdenados[i + 2]);
  }
    // Se sobrar algum jogador (número ímpar), adicionar à equipa com menor percentagem de vitórias
  if (equipa1.length !== equipa2.length) {
    const percent1 = equipa1.reduce((sum, j) => sum + (j.percentagem_vitorias || 0), 0) / equipa1.length;
    const percent2 = equipa2.reduce((sum, j) => sum + (j.percentagem_vitorias || 0), 0) / equipa2.length;
    
    if (equipa1.length > equipa2.length) {
      // Mover o jogador mais fraco da equipa 1 para a equipa 2
      const jogadorMaisFrago = equipa1.pop();
      equipa2.push(jogadorMaisFrago);
    }
  }
  
  // Otimização final: trocar jogadores para equilibrar melhor se necessário
  const equipasOtimizadas = otimizarEquilibrio(equipa1, equipa2);
  
  // Calcular estatísticas das equipas
  const estatisticasEquipa1 = calcularEstatisticasEquipa(equipasOtimizadas.equipa1);
  const estatisticasEquipa2 = calcularEstatisticasEquipa(equipasOtimizadas.equipa2);
    const diferencaPercentagem = Math.abs(estatisticasEquipa1.percentagem_vitorias_media - estatisticasEquipa2.percentagem_vitorias_media);
  
  console.log('Equipa 1:', equipasOtimizadas.equipa1.map(j => j.nome), 'Média:', estatisticasEquipa1.percentagem_vitorias_media.toFixed(1) + '%');
  console.log('Equipa 2:', equipasOtimizadas.equipa2.map(j => j.nome), 'Média:', estatisticasEquipa2.percentagem_vitorias_media.toFixed(1) + '%');
  console.log('Diferença de percentagem de vitórias:', diferencaPercentagem.toFixed(1) + '%');
  
  return {
    equipa1: {
      jogadores: equipasOtimizadas.equipa1,
      ...estatisticasEquipa1
    },
    equipa2: {
      jogadores: equipasOtimizadas.equipa2,
      ...estatisticasEquipa2
    }
  };
}

// Função para otimizar o equilíbrio das equipas
function otimizarEquilibrio(equipa1, equipa2) {
  let melhorEquipa1 = [...equipa1];
  let melhorEquipa2 = [...equipa2];
  
  const percent1Inicial = equipa1.reduce((sum, j) => sum + (j.percentagem_vitorias || 0), 0) / equipa1.length;
  const percent2Inicial = equipa2.reduce((sum, j) => sum + (j.percentagem_vitorias || 0), 0) / equipa2.length;
  let melhorDiferenca = Math.abs(percent1Inicial - percent2Inicial);
  
  // Tentar trocar cada jogador da equipa 1 com cada jogador da equipa 2
  for (let i = 0; i < equipa1.length; i++) {
    for (let j = 0; j < equipa2.length; j++) {
      // Simular a troca
      const novaEquipa1 = [...equipa1];
      const novaEquipa2 = [...equipa2];
      
      const temp = novaEquipa1[i];
      novaEquipa1[i] = novaEquipa2[j];
      novaEquipa2[j] = temp;
      
      const novaPercent1 = novaEquipa1.reduce((sum, jog) => sum + (jog.percentagem_vitorias || 0), 0) / novaEquipa1.length;
      const novaPercent2 = novaEquipa2.reduce((sum, jog) => sum + (jog.percentagem_vitorias || 0), 0) / novaEquipa2.length;
      const novaDiferenca = Math.abs(novaPercent1 - novaPercent2);
      
      // Se a nova configuração é mais equilibrada, usar ela
      if (novaDiferenca < melhorDiferenca) {
        melhorDiferenca = novaDiferenca;
        melhorEquipa1 = novaEquipa1;
        melhorEquipa2 = novaEquipa2;
      }
    }
  }
  
  return {
    equipa1: melhorEquipa1,
    equipa2: melhorEquipa2
  };
}

// Função para calcular estatísticas de uma equipa
function calcularEstatisticasEquipa(jogadores) {
  const pontos_totais = jogadores.reduce((sum, j) => sum + (j.pontos || 0), 0);
  const media_pontos = pontos_totais / jogadores.length;
  const jogos_totais = jogadores.reduce((sum, j) => sum + (j.jogos || 0), 0);
  const vitorias_totais = jogadores.reduce((sum, j) => sum + (j.vitorias || 0), 0);
  const percentagem_vitorias_media = jogadores.reduce((sum, j) => sum + (j.percentagem_vitorias || 0), 0) / jogadores.length;
  
  return {
    pontos_totais,
    media_pontos,
    jogos_totais,
    vitorias_totais,
    percentagem_vitorias_media
  };
}

// Função para recalcular estatísticas após trocas
function recalcularEstatisticasEquipas(equipas) {
  const statsEquipa1 = calcularEstatisticasEquipa(equipas.equipa1.jogadores);
  const statsEquipa2 = calcularEstatisticasEquipa(equipas.equipa2.jogadores);
  
  equipas.equipa1 = { ...equipas.equipa1, ...statsEquipa1 };
  equipas.equipa2 = { ...equipas.equipa2, ...statsEquipa2 };
}

// Função para analisar duplas
function analisarDuplas(ano, mes, callback) {
  // Construir filtro de data
  let filtroData = '';
  if (mes) {
    filtroData = `AND strftime('%Y', j.data) = '${ano}' AND strftime('%m', j.data) = '${mes.padStart(2, '0')}'`;
  } else {
    filtroData = `AND strftime('%Y', j.data) = '${ano}'`;
  }

  // Buscar todos os jogos com os jogadores
  db.query(`
    SELECT 
      j.id as jogo_id,
      j.data,
      j.equipa1_golos,
      j.equipa2_golos,
      GROUP_CONCAT(CASE WHEN p.equipa = 1 THEN jog.nome END) as equipa1_jogadores,
      GROUP_CONCAT(CASE WHEN p.equipa = 2 THEN jog.nome END) as equipa2_jogadores,
      GROUP_CONCAT(CASE WHEN p.equipa = 1 THEN jog.id END) as equipa1_ids,
      GROUP_CONCAT(CASE WHEN p.equipa = 2 THEN jog.id END) as equipa2_ids
    FROM jogos j
    JOIN presencas p ON j.id = p.jogo_id
    JOIN jogadores jog ON p.jogador_id = jog.id
    WHERE jog.suspenso = 0 ${filtroData}
    GROUP BY j.id, j.data, j.equipa1_golos, j.equipa2_golos
    ORDER BY j.data DESC
  `, [], (err, jogos) => {
    if (err) {
      console.error('Erro ao analisar duplas:', err);
      return callback(null);
    }

    const duplas = {};
    
    jogos.forEach(jogo => {
      const equipa1Nomes = jogo.equipa1_jogadores ? jogo.equipa1_jogadores.split(',') : [];
      const equipa2Nomes = jogo.equipa2_jogadores ? jogo.equipa2_jogadores.split(',') : [];
      const equipa1Ids = jogo.equipa1_ids ? jogo.equipa1_ids.split(',').map(id => parseInt(id)) : [];
      const equipa2Ids = jogo.equipa2_ids ? jogo.equipa2_ids.split(',').map(id => parseInt(id)) : [];
      
      // Resultado: 1 = vitória equipa 1, 0 = empate, -1 = vitória equipa 2
      let resultado;
      if (jogo.equipa1_golos > jogo.equipa2_golos) resultado = 1;
      else if (jogo.equipa1_golos < jogo.equipa2_golos) resultado = -1;
      else resultado = 0;
      
      // Analisar duplas na equipa 1
      for (let i = 0; i < equipa1Nomes.length; i++) {
        for (let j = i + 1; j < equipa1Nomes.length; j++) {
          const jogador1 = equipa1Nomes[i];
          const jogador2 = equipa1Nomes[j];
          const id1 = equipa1Ids[i];
          const id2 = equipa1Ids[j];
          
          const chave = [jogador1, jogador2].sort().join(' & ');
          const chaveId = [id1, id2].sort().join('-');
          
          if (!duplas[chave]) {
            duplas[chave] = {
              jogadores: [jogador1, jogador2].sort(),
              ids: [id1, id2].sort(),
              jogos: 0,
              vitorias: 0,
              empates: 0,
              derrotas: 0,
              pontos: 0,
              golos_marcados: 0,
              golos_sofridos: 0
            };
          }
          
          duplas[chave].jogos++;
          duplas[chave].golos_marcados += jogo.equipa1_golos;
          duplas[chave].golos_sofridos += jogo.equipa2_golos;
          
          if (resultado === 1) {
            duplas[chave].vitorias++;
            duplas[chave].pontos += 3;
          } else if (resultado === 0) {
            duplas[chave].empates++;
            duplas[chave].pontos += 1;
          } else {
            duplas[chave].derrotas++;
          }
        }
      }
      
      // Analisar duplas na equipa 2
      for (let i = 0; i < equipa2Nomes.length; i++) {
        for (let j = i + 1; j < equipa2Nomes.length; j++) {
          const jogador1 = equipa2Nomes[i];
          const jogador2 = equipa2Nomes[j];
          const id1 = equipa2Ids[i];
          const id2 = equipa2Ids[j];
          
          const chave = [jogador1, jogador2].sort().join(' & ');
          const chaveId = [id1, id2].sort().join('-');
          
          if (!duplas[chave]) {
            duplas[chave] = {
              jogadores: [jogador1, jogador2].sort(),
              ids: [id1, id2].sort(),
              jogos: 0,
              vitorias: 0,
              empates: 0,
              derrotas: 0,
              pontos: 0,
              golos_marcados: 0,
              golos_sofridos: 0
            };
          }
          
          duplas[chave].jogos++;
          duplas[chave].golos_marcados += jogo.equipa2_golos;
          duplas[chave].golos_sofridos += jogo.equipa1_golos;
          
          if (resultado === -1) {
            duplas[chave].vitorias++;
            duplas[chave].pontos += 3;
          } else if (resultado === 0) {
            duplas[chave].empates++;
            duplas[chave].pontos += 1;
          } else {
            duplas[chave].derrotas++;
          }
        }
      }
    });
    
    // Converter para array e calcular percentagens
    const duplasArray = Object.values(duplas).map(dupla => ({
      ...dupla,
      percentagem_vitorias: dupla.jogos > 0 ? Math.round((dupla.vitorias / dupla.jogos) * 100) : 0,
      diferenca_golos: dupla.golos_marcados - dupla.golos_sofridos,
      nome: dupla.jogadores.join(' & ')
    }));
    
    // Filtrar duplas com pelo menos 3 jogos juntos
    const duplasRelevantes = duplasArray.filter(d => d.jogos >= 3);    // Estatísticas extremas de duplas (mínimo 3 jogos)
    const duplasCom3Jogos = duplasArray.filter(d => d.jogos >= 3);
    let duplaMaisJogos = null, duplaMenosJogos = null, duplaMaisVitorias = null, duplaMaisDerrotas = null;
    if (duplasCom3Jogos.length > 0) {
      duplaMaisJogos = duplasCom3Jogos.reduce((max, d) => d.jogos > max.jogos ? d : max, duplasCom3Jogos[0]);
      duplaMenosJogos = duplasCom3Jogos.reduce((min, d) => d.jogos < min.jogos ? d : min, duplasCom3Jogos[0]);
      duplaMaisVitorias = duplasCom3Jogos.reduce((max, d) => d.vitorias > max.vitorias ? d : max, duplasCom3Jogos[0]);
      duplaMaisDerrotas = duplasCom3Jogos.reduce((max, d) => d.derrotas > max.derrotas ? d : max, duplasCom3Jogos[0]);
    }    // Ordenar por percentagem de vitórias para melhores duplas
    const melhoresDuplas = [...duplasRelevantes].sort((a, b) => {
      if (a.percentagem_vitorias !== b.percentagem_vitorias) return b.percentagem_vitorias - a.percentagem_vitorias;
      if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
      return b.pontos - a.pontos;
    });
      // Ordenar por pior performance para piores duplas (menor % vitórias, mais derrotas)
    const pioresDuplas = [...duplasRelevantes].sort((a, b) => {
      // Primeiro critério: menor percentagem de vitórias
      if (a.percentagem_vitorias !== b.percentagem_vitorias) return a.percentagem_vitorias - b.percentagem_vitorias;
      // Segundo critério: mais derrotas
      if (a.derrotas !== b.derrotas) return b.derrotas - a.derrotas;
      // Terceiro critério: pior diferença de golos
      if (a.diferenca_golos !== b.diferenca_golos) return a.diferenca_golos - b.diferenca_golos;
      // Quarto critério: menos pontos
      return a.pontos - b.pontos;
    });
    
    // DEBUG: Log das piores duplas
    console.log('\n=== DEBUG: PIORES DUPLAS ===');
    pioresDuplas.slice(0, 5).forEach((dupla, index) => {
      console.log(`${index + 1}º: ${dupla.nome} - ${dupla.percentagem_vitorias}% vitórias (${dupla.vitorias}V ${dupla.empates}E ${dupla.derrotas}D)`);
    });
    
    // DEBUG: Procurar especificamente Césaro & Ismael
    const cesaroIsmael = duplasRelevantes.find(d => d.nome === 'Césaro Cruz & Ismael Campos');
    if (cesaroIsmael) {
      console.log('\n=== DEBUG: CÉSARO & ISMAEL ENCONTRADA ===');
      console.log(JSON.stringify(cesaroIsmael, null, 2));
    } else {
      console.log('\n=== DEBUG: CÉSARO & ISMAEL NÃO ENCONTRADA ===');
    }
    
    const resultado = {
      melhores: melhoresDuplas.slice(0, 3),
      piores: pioresDuplas.slice(0, 3), // Pegar as 3 piores (já ordenadas)
      extremas: {
        maisJogos: duplaMaisJogos,
        menosJogos: duplaMenosJogos,
        maisVitorias: duplaMaisVitorias,
        maisDerrotas: duplaMaisDerrotas
      }
    };
    
    callback(resultado);
  });
}

// Função para reorganizar posições das reservas
function reorganizarReservas(callback) {
  // Buscar todas as reservas ordenadas por posição
  db.query('SELECT * FROM convocatoria WHERE tipo = "reserva" ORDER BY posicao', (err, reservas) => {
    if (err) {
      console.error('Erro ao buscar reservas:', err);
      return callback();
    }

    // Reorganizar posições sequencialmente
    let updates = 0;
    if (reservas.length === 0) return callback();

    reservas.forEach((reserva, index) => {
      db.query('UPDATE convocatoria SET posicao = ? WHERE id = ?', 
        [index + 1, reserva.id], (err) => {
        updates++;
        if (updates === reservas.length) {
          callback();
        }
      });
    });
  });
}

// Migração: Atualizar configuração para 10 convocados
db.query('UPDATE convocatoria_config SET max_convocados = 10 WHERE id = 1');

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
      WHERE jog.suspenso = 0 AND strftime('%Y', j.data) = '${anoAtual}'
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
    const curiosidades = [];
    
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
        WHERE strftime('%Y', jogo.data) = '${anoAtual}' 
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
      WHERE jog.suspenso = 0 AND strftime('%Y', j.data) = '${anoAtual}'
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
