const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('./futsal.db');

// Configuração
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static('public'));

// Debug
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Inicializar base de dados
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS jogadores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    suspenso INTEGER DEFAULT 0
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS jogos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    equipa1_golos INTEGER,
    equipa2_golos INTEGER
  )`);
    db.run(`CREATE TABLE IF NOT EXISTS presencas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jogo_id INTEGER,
    jogador_id INTEGER,
    equipa INTEGER,
    FOREIGN KEY (jogo_id) REFERENCES jogos(id),
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS coletes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jogador_id INTEGER,
    data_levou TEXT NOT NULL,
    data_devolveu TEXT,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS convocatoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jogador_id INTEGER,
    posicao INTEGER,
    tipo TEXT,
    FOREIGN KEY (jogador_id) REFERENCES jogadores(id)
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS convocatoria_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    max_convocados INTEGER DEFAULT 10,
    max_reservas INTEGER DEFAULT 5
  )`);
  
  // Tabelas para sistema de convocatória
  db.run(`CREATE TABLE IF NOT EXISTS convocatoria_config (
    id INTEGER PRIMARY KEY,
    max_convocados INTEGER DEFAULT 10,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS convocatoria (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jogador_id INTEGER,
    tipo TEXT CHECK(tipo IN ('convocado', 'reserva')),
    posicao INTEGER,
    FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS faltas_historico (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    jogador_id INTEGER,
    data_falta DATE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
  )`);
});

// ROTAS PRINCIPAIS
app.get('/', (req, res) => {
  db.all('SELECT * FROM jogos ORDER BY data DESC', [], (err, jogos) => {
    if (err) {
      console.error('Erro ao buscar jogos:', err);
      return res.render('index', { jogos: [] });
    }
    
    if (!jogos || jogos.length === 0) {
      return res.render('index', { jogos: [] });
    }
    
    // Para cada jogo, buscar os jogadores das equipas
    const jogosComJogadores = [];
    let processedCount = 0;    jogos.forEach((jogo) => {
      db.all(
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
            res.render('index', { jogos: jogosComJogadores });
          }
        }
      );
    });
  });
});

// ROTAS DE JOGADORES
app.get('/jogadores', (req, res) => {
  db.all('SELECT * FROM jogadores ORDER BY nome', [], (err, jogadores) => {
    res.render('jogadores', { jogadores: jogadores || [] });
  });
});

app.post('/jogadores', (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.redirect('/jogadores');
  
  db.run('INSERT INTO jogadores (nome) VALUES (?)', [nome], () => {
    res.redirect('/jogadores');
  });
});

app.post('/jogadores/:id/delete', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM jogadores WHERE id = ?', [id], () => {
    res.redirect('/jogadores');
  });
});

app.post('/jogadores/:id/toggle-suspension', (req, res) => {
  const { id } = req.params;
  db.run('UPDATE jogadores SET suspenso = CASE WHEN suspenso = 1 THEN 0 ELSE 1 END WHERE id = ?', [id], () => {
    res.redirect('/jogadores');
  });
});

app.post('/jogadores/:id/update', (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  db.run('UPDATE jogadores SET nome = ? WHERE id = ?', [nome, id], () => {
    res.json({ sucesso: true });
  });
});

// ROTAS DE JOGOS
app.get('/jogos', (req, res) => {
  res.redirect('/');
});

app.get('/jogos/novo', (req, res) => {
  db.all('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', [], (err, jogadores) => {
    res.render('novo_jogo', { jogadores: jogadores || [] });
  });
});

app.post('/jogos', (req, res) => {
  const { data, equipa1, equipa2, equipa1_golos, equipa2_golos } = req.body;
  
  db.run(
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
          db.run('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 1)', [jogoId, jogadorId], (err) => {
            if (err) console.error('Erro ao inserir presença equipa1:', err);
          });
        }
      });
      
      // Inserir presenças equipa 2
      const equipa2Arr = Array.isArray(equipa2) ? equipa2 : (equipa2 ? [equipa2] : []);
      equipa2Arr.forEach((jogadorId) => {
        if (jogadorId) {
          db.run('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 2)', [jogoId, jogadorId], (err) => {
            if (err) console.error('Erro ao inserir presença equipa2:', err);
          });
        }
      });
      
      res.redirect('/');
    }
  );
});

app.get('/jogos/:id', (req, res) => {
  const jogoId = req.params.id;
  
  console.log(`Buscando jogo com ID: ${jogoId}`);
  
  db.get('SELECT * FROM jogos WHERE id = ?', [jogoId], (err, jogo) => {
    if (err) {
      console.error('Erro na base de dados:', err);
      return res.status(500).send('Erro na base de dados');
    }
    
    if (!jogo) {
      console.log('Jogo não encontrado');
      return res.status(404).send('Jogo não encontrado');
    }
    
    console.log('Jogo encontrado:', jogo);
    
    db.all(
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
        res.render('detalhe_jogo', { jogo, equipa1, equipa2 });
      }
    );
  });
});

// ROTA DE ESTATÍSTICAS
app.get('/estatisticas', (req, res) => {
  const anoSelecionado = req.query.ano || '2025';
  const mesSelecionado = req.query.mes || '';
  
  // Construir filtro de data
  let filtroData = '';
  if (mesSelecionado) {
    filtroData = `AND strftime('%Y', j.data) = '${anoSelecionado}' AND strftime('%m', j.data) = '${mesSelecionado.padStart(2, '0')}'`;
  } else {
    filtroData = `AND strftime('%Y', j.data) = '${anoSelecionado}'`;
  }
  
  // Query para calcular estatísticas detalhadas de cada jogador
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
    WHERE jog.suspenso = 0 ${filtroData}
    GROUP BY jog.id, jog.nome
    HAVING COUNT(DISTINCT j.id) > 0
  `;
  
  db.all(queryEstatisticas, [], (err, estatisticas) => {
    if (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return res.render('estatisticas', {
        estatisticas: [],
        anoSelecionado,
        mesSelecionado,
        mvpMensais: [],
        totalJogosMes: 0,
        curiosidades: []
      });
    }
    
    // Calcular pontos, diferença de golos e ordenar
    const estatisticasProcessadas = estatisticas.map(stat => ({
      ...stat,
      pontos: (stat.vitorias * 3) + (stat.empates * 1),
      diferenca_golos: stat.golos_marcados - stat.golos_sofridos
    }));
    
    // Ordenar por pontos, diferença de golos, golos marcados, presenças
    estatisticasProcessadas.sort((a, b) => {
      if (a.pontos !== b.pontos) return b.pontos - a.pontos;
      if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
      if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
      return b.jogos - a.jogos;
    });
    
    // Gerar curiosidades/observações
    const curiosidades = gerarCuriosidades(estatisticasProcessadas, anoSelecionado, mesSelecionado);
      // Se é um mês específico, calcular MVP(s)
    let mvpMensais = [];
    let totalJogosMes = 0;
    
    if (mesSelecionado) {
      // Contar total de jogos no mês
      db.get(`
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
          analisarDuplas(anoSelecionado, mesSelecionado, (duplas) => {
            res.render('estatisticas', {
              estatisticas: estatisticasProcessadas,
              anoSelecionado,
              mesSelecionado,
              mvpMensais,
              totalJogosMes,
              minimoJogosParaMVP: Math.ceil(totalJogosMes * 0.75),
              curiosidades,
              duplas
            });
          });
        } else {
          res.render('estatisticas', {
            estatisticas: estatisticasProcessadas,
            anoSelecionado,
            mesSelecionado,
            mvpMensais,
            totalJogosMes,
            minimoJogosParaMVP: Math.ceil(totalJogosMes * 0.75),
            curiosidades,
            duplas: null
          });
        }
      });
    } else {
      // Para período anual, também analisar duplas
      analisarDuplas(anoSelecionado, null, (duplas) => {
        res.render('estatisticas', {
          estatisticas: estatisticasProcessadas,
          anoSelecionado,
          mesSelecionado,
          mvpMensais: [],
          totalJogosMes: 0,
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
    });
  }
  
  // 7. Jogador mais equilibrado (com mais empates)
  const maisEmpates = estatisticas.reduce((max, stat) => 
    stat.empates > max.empates ? stat : max
  );
  if (maisEmpates.empates > 0) {
    curiosidades.push({
      icone: '⚖️',
      titulo: 'Mestre do Equilíbrio',
      texto: `${maisEmpates.nome} é o rei dos empates com ${maisEmpates.empates} jogos empatados`
    });
  }
    // 8. Comparação interessante entre top 2
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
app.get('/coletes', (req, res) => {
  console.log('=== ROTA /coletes CHAMADA ===');
  
  // Primeiro, adicionar a coluna suspenso se não existir
  db.run("ALTER TABLE jogadores ADD COLUMN suspenso INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Erro ao adicionar coluna suspenso:', err);
    } else {
      console.log('Coluna suspenso verificada/adicionada');
    }
    
    // Buscar estatísticas dos convocados apenas (os 10 da convocatória)
    db.all(`
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
      db.get(`
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
          estatisticas: estatisticas || [],
          coletesActuais: coletesActuais || null,
          proximoConvocado: proximoConvocado || null
        });
      });
    });
  });
});

app.post('/coletes/atribuir', (req, res) => {
  const { jogador_id } = req.body;
  const dataHoje = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  
  // Primeiro, marcar os coletes actuais como devolvidos
  db.run(`
    UPDATE coletes 
    SET data_devolveu = ? 
    WHERE data_devolveu IS NULL
  `, [dataHoje], (err) => {
    if (err) {
      console.error('Erro ao marcar devolução:', err);
      return res.status(500).send('Erro ao actualizar dados');
    }
    
    // Depois, atribuir os coletes ao novo jogador
    db.run(`
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

app.post('/jogos/:id/delete', (req, res) => {
  const jogoId = req.params.id;
  
  // Primeiro, eliminar todas as presenças do jogo
  db.run('DELETE FROM presencas WHERE jogo_id = ?', [jogoId], (err) => {
    if (err) {
      console.error('Erro ao eliminar presenças:', err);
      return res.status(500).send('Erro ao eliminar presenças do jogo');
    }
    
    // Depois, eliminar o jogo
    db.run('DELETE FROM jogos WHERE id = ?', [jogoId], (err) => {
      if (err) {
        console.error('Erro ao eliminar jogo:', err);
        return res.status(500).send('Erro ao eliminar jogo');
      }
      
      res.redirect('/');
    });
  });
});

// Rota para página de convocatória
app.get('/convocatoria', (req, res) => {
  console.log('=== ROTA /convocatoria CHAMADA ===');
  
  // Buscar todos os jogadores ativos
  db.all('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', (err, jogadores) => {
    if (err) {
      console.error('Erro ao buscar jogadores:', err);
      return res.status(500).send('Erro ao buscar jogadores');
    }

    console.log('Jogadores encontrados:', jogadores.length);

    // Buscar configuração da convocatória (se existir)
    db.get('SELECT * FROM convocatoria_config LIMIT 1', (err, config) => {
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

      console.log('Config encontrada:', config);      // Buscar convocados e reservas com contagem de faltas
      db.all(`
        SELECT j.*, c.posicao, c.tipo,
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
        const reservas = convocatoria.filter(j => j.tipo === 'reserva');

        console.log('Convocados:', convocados.length, 'Reservas:', reservas.length);        res.render('convocatoria', { 
          convocados, 
          reservas, 
          config,
          title: 'Convocatória - Peladas das Quintas Feiras'
        });
      });
    });
  });
});

// Marcar jogador como faltoso (move para último lugar das reservas)
app.post('/convocatoria/marcar-falta/:id', (req, res) => {
  const jogadorId = req.params.id;
  
  // Verificar se é convocado
  db.get('SELECT * FROM convocatoria WHERE jogador_id = ? AND tipo = "convocado"', [jogadorId], (err, convocado) => {
    if (err || !convocado) {
      return res.status(400).send('Jogador não é convocado');
    }

    // Buscar último número de posição das reservas
    db.get('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', (err, result) => {
      if (err) {
        console.error('Erro ao buscar posição:', err);
        return res.status(500).send('Erro interno');
      }

      const novaPosicaoReserva = (result.max_pos || 0) + 1;

      // Mover convocado para reservas
      db.run('UPDATE convocatoria SET tipo = "reserva", posicao = ? WHERE jogador_id = ?', 
        [novaPosicaoReserva, jogadorId], (err) => {
        if (err) {
          console.error('Erro ao mover para reservas:', err);
          return res.status(500).send('Erro ao marcar falta');
        }

        // Registrar falta no histórico
        db.run('INSERT INTO faltas_historico (jogador_id, data_falta) VALUES (?, date("now"))', [jogadorId]);

        // Promover primeiro reserva para convocado
        db.get('SELECT * FROM convocatoria WHERE tipo = "reserva" ORDER BY posicao LIMIT 1', (err, primeiroReserva) => {
          if (err) {
            console.error('Erro ao buscar primeiro reserva:', err);
            return res.status(500).send('Erro interno');
          }

          if (primeiroReserva && primeiroReserva.jogador_id !== parseInt(jogadorId)) {
            // Mover primeiro reserva para convocado na posição do faltoso
            db.run('UPDATE convocatoria SET tipo = "convocado", posicao = ? WHERE jogador_id = ?', 
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
app.post('/convocatoria/reset', (req, res) => {
  db.all('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', (err, jogadores) => {
    if (err) {
      console.error('Erro ao buscar jogadores:', err);
      return res.status(500).send('Erro ao buscar jogadores');
    }

    // Limpar convocatória atual
    db.run('DELETE FROM convocatoria', (err) => {
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
app.post('/convocatoria/migrar-para-10', (req, res) => {
  console.log('=== MIGRANDO CONVOCATÓRIA PARA 10 CONVOCADOS ===');
  
  // Buscar todos os convocados atuais ordenados por posição
  db.all('SELECT * FROM convocatoria WHERE tipo = "convocado" ORDER BY posicao', (err, convocados) => {
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
    db.get('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', (err, result) => {
      if (err) {
        console.error('Erro ao buscar max posição reservas:', err);
        return res.status(500).send('Erro na migração');
      }
      
      let proximaPosicaoReserva = (result.max_pos || 0) + 1;
      
      // Mover cada convocado para reserva
      let movimentos = 0;
      
      convocadosParaMover.forEach((convocado) => {
        db.run('UPDATE convocatoria SET tipo = "reserva", posicao = ? WHERE id = ?', 
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
app.post('/convocatoria/configurar-personalizada', (req, res) => {
  console.log('=== CONFIGURANDO CONVOCATÓRIA PERSONALIZADA ===');
  
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
  db.run('DELETE FROM faltas_historico', (err) => {
    if (err) {
      console.error('Erro ao limpar faltas:', err);
    } else {
      console.log('Faltas históricas limpas');
    }
    
    // Buscar todos os jogadores ativos
    db.all('SELECT * FROM jogadores WHERE suspenso = 0', (err, jogadores) => {
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
      db.run('DELETE FROM convocatoria', (err) => {
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
            db.run('INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, ?, ?)', 
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
            db.run('INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, ?, ?)', 
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
          db.run('INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, ?, ?)', 
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
app.post('/convocatoria/configuracao-final', (req, res) => {
  console.log('=== CONFIGURAÇÃO FINAL ===');
  
  // 1. Limpar todas as faltas de teste
  db.run('DELETE FROM faltas_historico', (err) => {
    if (err) {
      console.error('Erro ao limpar faltas:', err);
    } else {
      console.log('Faltas de teste limpas com sucesso');
    }
  });

  // 2. Limpar convocatória atual
  db.run('DELETE FROM convocatoria', (err) => {
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
    db.all('SELECT id, nome FROM jogadores WHERE suspenso = 0', (err, jogadores) => {
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
          db.run(`INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, 'convocado', ?)`,
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
          db.run(`INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, 'reserva', ?)`,
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

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});

// Funções auxiliares para convocatória
function initConvocatoriaSystem(jogadores, res) {
  // Criar tabelas se não existirem
  db.serialize(() => {
    // Tabela de configuração da convocatória
    db.run(`CREATE TABLE IF NOT EXISTS convocatoria_config (
      id INTEGER PRIMARY KEY,
      max_convocados INTEGER DEFAULT 14,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);    // Tabela da convocatória
    db.run(`CREATE TABLE IF NOT EXISTS convocatoria (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jogador_id INTEGER,
      tipo TEXT CHECK(tipo IN ('convocado', 'reserva')),
      posicao INTEGER,
      FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
    )`);

    // Tabela de histórico de faltas
    db.run(`CREATE TABLE IF NOT EXISTS faltas_historico (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      jogador_id INTEGER,
      data_falta DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(jogador_id) REFERENCES jogadores(id)
    )`);// Inserir configuração padrão com 10 convocados
    db.run('INSERT OR REPLACE INTO convocatoria_config (id, max_convocados) VALUES (1, 10)');

    // Distribuir jogadores: primeiros 10 como convocados, resto como reservas
    const maxConvocados = 10;
    
    jogadores.forEach((jogador, index) => {
      const tipo = index < maxConvocados ? 'convocado' : 'reserva';
      const posicao = tipo === 'convocado' ? index + 1 : index - maxConvocados + 1;
      
      db.run('INSERT INTO convocatoria (jogador_id, tipo, posicao) VALUES (?, ?, ?)', 
        [jogador.id, tipo, posicao]);
    });    // Buscar dados atualizados e renderizar
    setTimeout(() => {      db.all(`
        SELECT j.*, c.posicao, c.tipo,
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

        const convocados = convocatoria.filter(j => j.tipo === 'convocado');
        const reservas = convocatoria.filter(j => j.tipo === 'reserva');
        const config = { max_convocados: maxConvocados };

        res.render('convocatoria', { 
          convocados, 
          reservas, 
          config,
          title: 'Convocatória - Peladas das Quintas Feiras'
        });
      });
    }, 100);
  });
}

function reorganizarReservas(callback) {
  // Buscar todas as reservas ordenadas por posição
  db.all('SELECT * FROM convocatoria WHERE tipo = "reserva" ORDER BY posicao', (err, reservas) => {
    if (err) {
      console.error('Erro ao buscar reservas:', err);
      return callback();
    }

    // Reorganizar posições sequencialmente
    let updates = 0;
    if (reservas.length === 0) return callback();

    reservas.forEach((reserva, index) => {
      db.run('UPDATE convocatoria SET posicao = ? WHERE id = ?', 
        [index + 1, reserva.id], (err) => {
        updates++;
        if (updates === reservas.length) {
          callback();
        }
      });
    });
  });
}

// Mover reserva para cima na lista
app.post('/convocatoria/mover-reserva/:id/:direcao', (req, res) => {
  const jogadorId = req.params.id;
  const direcao = req.params.direcao; // 'up' ou 'down'
  
  // Buscar posição atual do jogador
  db.get('SELECT * FROM convocatoria WHERE jogador_id = ? AND tipo = "reserva"', [jogadorId], (err, jogador) => {
    if (err || !jogador) {
      return res.status(400).send('Jogador não encontrado nas reservas');
    }

    const posicaoAtual = jogador.posicao;
    let novaPosicao;

    if (direcao === 'up' && posicaoAtual > 1) {
      novaPosicao = posicaoAtual - 1;
    } else if (direcao === 'down') {
      // Verificar se não é o último
      db.get('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', (err, result) => {
        if (err) return res.status(500).send('Erro interno');
        
        if (posicaoAtual < result.max_pos) {
          novaPosicao = posicaoAtual + 1;
          
          // Trocar posições
          db.serialize(() => {
            db.run('UPDATE convocatoria SET posicao = -1 WHERE posicao = ? AND tipo = "reserva"', [novaPosicao]);
            db.run('UPDATE convocatoria SET posicao = ? WHERE jogador_id = ?', [novaPosicao, jogadorId]);
            db.run('UPDATE convocatoria SET posicao = ? WHERE posicao = -1', [posicaoAtual]);
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
        db.run('UPDATE convocatoria SET posicao = -1 WHERE posicao = ? AND tipo = "reserva"', [novaPosicao]);
        db.run('UPDATE convocatoria SET posicao = ? WHERE jogador_id = ?', [novaPosicao, jogadorId]);
        db.run('UPDATE convocatoria SET posicao = ? WHERE posicao = -1', [posicaoAtual]);
      });
      
      setTimeout(() => res.redirect('/convocatoria'), 100);
    } else {
      res.redirect('/convocatoria');
    }
  });
});

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
  db.all(`
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
    const duplasRelevantes = duplasArray.filter(d => d.jogos >= 3);
    
    // Ordenar por percentagem de vitórias
    duplasRelevantes.sort((a, b) => {
      if (a.percentagem_vitorias !== b.percentagem_vitorias) return b.percentagem_vitorias - a.percentagem_vitorias;
      if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
      return b.pontos - a.pontos;
    });
    
    const resultado = {
      melhores: duplasRelevantes.slice(0, 3),
      piores: duplasRelevantes.slice(-3).reverse()
    };
    
    callback(resultado);
  });
}

// Migração: Atualizar configuração para 10 convocados
db.run('UPDATE convocatoria_config SET max_convocados = 10 WHERE id = 1');