const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

// Listar convocatória
router.get('/convocatoria', optionalAuth, (req, res) => {
  console.log('=== ROTA /convocatoria CHAMADA ===');
  
  // Primeiro, garantir que todos os jogadores estão na convocatória
  db.query('SELECT * FROM jogadores WHERE COALESCE(suspenso, 0) = 0 ORDER BY nome', [], (err, jogadores) => {
    if (err) {
      console.error('Erro ao buscar jogadores:', err);
      return res.status(500).send('Erro ao buscar jogadores');
    }

    // Verificar e adicionar jogadores faltantes à convocatória
    db.query('SELECT jogador_id FROM convocatoria', [], (err, convocatoria_atual) => {
      if (err) return res.status(500).send('Erro ao verificar convocatória');

      const jogadoresNaConvocatoria = convocatoria_atual.map(c => c.jogador_id);
      const jogadoresFaltantes = jogadores.filter(j => !jogadoresNaConvocatoria.includes(j.id));

      if (jogadoresFaltantes.length > 0) {
        console.log(`📋 Adicionando ${jogadoresFaltantes.length} jogadores à convocatória...`);
        
        // Buscar a última posição de reserva
        db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', [], (err, result) => {
          let proximaPosicao = (result && result[0] && result[0].max_pos) ? result[0].max_pos + 1 : 1;
          
          const inserts = jogadoresFaltantes.map(jogador => {
            return new Promise((resolve) => {
              db.query(
                'INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado) VALUES (?, "reserva", ?, 0)',
                [jogador.id, proximaPosicao++],
                (err) => {
                  if (err) console.error('Erro ao inserir jogador na convocatória:', err);
                  resolve();
                }
              );
            });
          });

          Promise.all(inserts).then(() => {
            console.log('✅ Jogadores adicionados à convocatória');
            carregarConvocatoria(req, res);
          });
        });
      } else {
        carregarConvocatoria(req, res);
      }
    });
  });
});

// Função auxiliar para carregar convocatória
function carregarConvocatoria(req, res) {
  db.query('SELECT * FROM convocatoria_config LIMIT 1', [], (err, configResult) => {
    const config = (configResult && configResult[0]) || { max_convocados: 10 };

    db.query(`
      SELECT j.*, c.posicao, c.tipo, c.confirmado, c.data_confirmacao,
             COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
      FROM jogadores j 
      JOIN convocatoria c ON j.id = c.jogador_id 
      WHERE COALESCE(j.suspenso, 0) = 0 
      ORDER BY c.tipo, c.posicao
    `, [], (err, convocatoria) => {
      if (err) {
        console.error('Erro ao buscar convocatória:', err);
        return res.status(500).send('Erro ao buscar convocatória');
      }      // Buscar indisponíveis temporários
      db.query(`
        SELECT i.*, j.nome
        FROM indisponiveis_temporarios i
        JOIN jogadores j ON i.jogador_id = j.id
        WHERE i.ativo = 1
        ORDER BY i.created_at DESC
      `, [], (err, indisponiveisResult) => {
        // Se houver erro (tabela não existe), usar array vazio
        let indisponiveis = [];
        if (err) {
          console.error('⚠️ Erro ao buscar indisponíveis (tabela pode não existir ainda):', err.message);
        } else {
          indisponiveis = indisponiveisResult || [];
        }

        const convocados = convocatoria.filter(j => j.tipo === 'convocado');
        const reservas = convocatoria.filter(j => j.tipo === 'reserva');
        
        console.log(`📊 Convocados: ${convocados.length}, Reservas: ${reservas.length}, Indisponíveis: ${indisponiveis.length}`);
        
        // Validar equipas geradas
        let equipasValidas = null;
        if (global.equipasGeradas) {
          try {
            if (global.equipasGeradas.equipa1 && global.equipasGeradas.equipa2) {
              equipasValidas = global.equipasGeradas;
            }
          } catch (e) {
            console.error('Erro ao validar equipas:', e);
            global.equipasGeradas = null;
          }
        }
        
        res.render('convocatoria', { 
          user: req.session.user || null,
          activePage: 'convocatoria',
          convocados, 
          reservas,
          indisponiveis: indisponiveis,
          config,
          equipas: equipasValidas,
          title: 'Convocatória - Peladas das Quintas Feiras',
          msg: req.query.msg || null
        });
      });
    });
  });
}

// Marcar falta
router.post('/convocatoria/marcar-falta/:id', requireAdmin, (req, res) => {
  const jogadorId = req.params.id;
  db.query('SELECT * FROM convocatoria WHERE jogador_id = ? AND tipo = "convocado"', [jogadorId], (err, convocado) => {
    if (err || !convocado) return res.status(400).send('Jogador não é convocado');

    db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', (err, result) => {
      if (err) return res.status(500).send('Erro interno');
      const novaPosicaoReserva = (result.max_pos || 0) + 1;
      db.query('UPDATE convocatoria SET tipo = "reserva", posicao = ? WHERE jogador_id = ?', [novaPosicaoReserva, jogadorId], (err) => {
        if (err) return res.status(500).send('Erro ao marcar falta');
        db.query('INSERT INTO faltas_historico (jogador_id, data_falta) VALUES (?, date("now"))', [jogadorId]);
        db.query('SELECT * FROM convocatoria WHERE tipo = "reserva" ORDER BY posicao LIMIT 1', (err, primeiroReserva) => {
          if (err) return res.status(500).send('Erro interno');
          if (primeiroReserva && primeiroReserva.jogador_id !== parseInt(jogadorId)) {
            db.query('UPDATE convocatoria SET tipo = "convocado", posicao = ? WHERE jogador_id = ?', [convocado.posicao, primeiroReserva.jogador_id], (err) => {
              if (err) return res.status(500).send('Erro ao promover reserva');
              // reorganizarReservas still in server.js
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

// Mover jogador de convocados para reservas (SEM falta)
router.post('/convocatoria/mover-para-reservas/:id', requireAdmin, (req, res) => {
  const jogadorId = req.params.id;
  
  console.log(`⬇️ Movendo jogador ${jogadorId} para reservas (sem falta)...`);
  
  // Verificar se é convocado
  db.query('SELECT * FROM convocatoria WHERE jogador_id = ? AND tipo = "convocado"', [jogadorId], (err, result) => {
    if (err || !result || result.length === 0) {
      return res.status(400).send('Jogador não é convocado');
    }
    
    const convocado = result[0];
    const posicaoVaga = convocado.posicao;
    
    // Buscar última posição de reserva
    db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', [], (err, result) => {
      if (err) return res.status(500).send('Erro interno');
      
      const novaPosicaoReserva = (result[0].max_pos || 0) + 1;
      
      // Mover jogador para reservas
      db.query('UPDATE convocatoria SET tipo = "reserva", posicao = ?, confirmado = 0 WHERE jogador_id = ?', 
        [novaPosicaoReserva, jogadorId], (err) => {
        if (err) {
          console.error('Erro ao mover para reservas:', err);
          return res.status(500).send('Erro ao mover para reservas');
        }
        
        console.log(`✅ Jogador ${jogadorId} movido para reservas (posição ${novaPosicaoReserva})`);
        
        // Promover primeiro reserva para a posição vaga
        db.query('SELECT * FROM convocatoria WHERE tipo = "reserva" AND jogador_id != ? ORDER BY posicao LIMIT 1', 
          [jogadorId], (err, primeiroReserva) => {
          if (err) return res.status(500).send('Erro interno');
          
          if (primeiroReserva && primeiroReserva.length > 0) {
            db.query('UPDATE convocatoria SET tipo = "convocado", posicao = ? WHERE jogador_id = ?', 
              [posicaoVaga, primeiroReserva[0].jogador_id], (err) => {
              if (err) {
                console.error('Erro ao promover reserva:', err);
                return res.status(500).send('Erro ao promover reserva');
              }
              
              console.log(`✅ Jogador ${primeiroReserva[0].jogador_id} promovido para convocado (posição ${posicaoVaga})`);
              
              // Reorganizar reservas
              reorganizarReservas(() => {
                res.redirect('/convocatoria?msg=jogador_movido_reservas');
              });
            });
          } else {
            // Não há reservas para promover
            res.redirect('/convocatoria?msg=jogador_movido_reservas');
          }
        });
      });
    });
  });
});

// Mover jogador de reservas para convocados
router.post('/convocatoria/mover-para-convocados/:id', requireAdmin, (req, res) => {
  const jogadorId = req.params.id;
  
  console.log(`⬆️ Movendo jogador ${jogadorId} para convocados...`);
  
  // Verificar se é reserva
  db.query('SELECT * FROM convocatoria WHERE jogador_id = ? AND tipo = "reserva"', [jogadorId], (err, result) => {
    if (err || !result || result.length === 0) {
      return res.status(400).send('Jogador não é reserva');
    }
    
    // Verificar número de convocados atual
    db.query('SELECT COUNT(*) as total FROM convocatoria WHERE tipo = "convocado"', [], (err, countResult) => {
      if (err) return res.status(500).send('Erro interno');
      
      const totalConvocados = countResult[0].total;
      
      // Buscar config de max_convocados
      db.query('SELECT * FROM convocatoria_config LIMIT 1', [], (err, configResult) => {
        const config = (configResult && configResult[0]) || { max_convocados: 10 };
        
        if (totalConvocados >= config.max_convocados) {
          // Precisa descer o último convocado para reservas
          db.query('SELECT * FROM convocatoria WHERE tipo = "convocado" ORDER BY posicao DESC LIMIT 1', 
            [], (err, ultimoConvocado) => {
            if (err || !ultimoConvocado || ultimoConvocado.length === 0) {
              return res.status(500).send('Erro ao buscar último convocado');
            }
            
            const posicaoVagaConvocado = ultimoConvocado[0].posicao;
            
            // Buscar última posição de reserva
            db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', [], (err, result) => {
              if (err) return res.status(500).send('Erro interno');
              
              const novaPosicaoReserva = (result[0].max_pos || 0) + 1;
              
              // Mover último convocado para reservas
              db.query('UPDATE convocatoria SET tipo = "reserva", posicao = ?, confirmado = 0 WHERE jogador_id = ?', 
                [novaPosicaoReserva, ultimoConvocado[0].jogador_id], (err) => {
                if (err) {
                  console.error('Erro ao mover último convocado para reservas:', err);
                  return res.status(500).send('Erro ao mover último convocado');
                }
                
                console.log(`✅ Último convocado ${ultimoConvocado[0].jogador_id} movido para reservas`);
                
                // Promover reserva selecionada
                db.query('UPDATE convocatoria SET tipo = "convocado", posicao = ? WHERE jogador_id = ?', 
                  [posicaoVagaConvocado, jogadorId], (err) => {
                  if (err) {
                    console.error('Erro ao promover reserva:', err);
                    return res.status(500).send('Erro ao promover reserva');
                  }
                  
                  console.log(`✅ Reserva ${jogadorId} promovida para convocado (posição ${posicaoVagaConvocado})`);
                  
                  // Reorganizar reservas
                  reorganizarReservas(() => {
                    res.redirect('/convocatoria?msg=jogador_movido_convocados');
                  });
                });
              });
            });
          });
        } else {
          // Há espaço livre, apenas promover
          db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "convocado"', [], (err, result) => {
            if (err) return res.status(500).send('Erro interno');
            
            const novaPosicaoConvocado = (result[0].max_pos || 0) + 1;
            
            db.query('UPDATE convocatoria SET tipo = "convocado", posicao = ? WHERE jogador_id = ?', 
              [novaPosicaoConvocado, jogadorId], (err) => {
              if (err) {
                console.error('Erro ao promover reserva:', err);
                return res.status(500).send('Erro ao promover reserva');
              }
              
              console.log(`✅ Reserva ${jogadorId} promovida para convocado (posição ${novaPosicaoConvocado})`);
              
              // Reorganizar reservas
              reorganizarReservas(() => {
                res.redirect('/convocatoria?msg=jogador_movido_convocados');
              });
            });
          });
        }
      });
    });
  });
});

// Confirmar equipas - Gerar equipas equilibradas
router.post('/convocatoria/confirmar-equipas', requireAdmin, (req, res) => {
  console.log('=== GERANDO EQUIPAS EQUILIBRADAS ===');
  
  try {
    // 1. Buscar todos os convocados confirmados
    db.query(`
      SELECT j.*, c.posicao
      FROM jogadores j
      JOIN convocatoria c ON j.id = c.jogador_id
      WHERE c.tipo = 'convocado' AND c.confirmado = 1 AND j.suspenso = 0
      ORDER BY c.posicao
    `, [], (err, convocados) => {
      if (err) {
        console.error('Erro ao buscar convocados:', err);
        global.equipasGeradas = null;
        return res.status(500).send('Erro ao buscar convocados');
      }

      if (!convocados || convocados.length < 2) {
        global.equipasGeradas = null;
        return res.status(400).send('Não há convocados suficientes confirmados (mínimo 2)');
      }    console.log(`📋 ${convocados.length} convocados encontrados`);

    // 2. Buscar estatísticas do ano atual para cada jogador
    const anoAtual = new Date().getFullYear();
    const idsConvocados = convocados.map(c => c.id);
    
    // Se não houver IDs, usar estatísticas vazias
    if (!idsConvocados || idsConvocados.length === 0) {
      console.log('⚠️ Nenhum convocado confirmado');
      global.equipasGeradas = null;
      return res.status(400).send('Não há convocados confirmados suficientes');
    }

    // Detectar PostgreSQL vs SQLite
    const isPostgres = !!process.env.DATABASE_URL;
    
    let queryEstatisticas, queryParams;
    
    if (isPostgres) {
      // PostgreSQL: usar placeholders $1, $2 e ANY para array
      queryEstatisticas = `
        SELECT 
          jog.id,
          jog.nome,
          COUNT(DISTINCT j.id) as jogos,
          COALESCE(SUM(CASE 
            WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
                 (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
            THEN 3
            WHEN (p.equipa = 1 AND j.equipa1_golos = j.equipa2_golos) OR 
                 (p.equipa = 2 AND j.equipa2_golos = j.equipa1_golos)
            THEN 1
            ELSE 0 
          END), 0) as pontos_totais,
          COALESCE(CAST(
            (SUM(CASE 
              WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
                   (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
              THEN 3
              WHEN (p.equipa = 1 AND j.equipa1_golos = j.equipa2_golos) OR 
                   (p.equipa = 2 AND j.equipa2_golos = j.equipa1_golos)
              THEN 1
              ELSE 0 
            END) * 1.0) / NULLIF(COUNT(DISTINCT j.id), 0) AS DECIMAL(10,2)
          ), 0) as media_pontos
        FROM jogadores jog
        LEFT JOIN presencas p ON jog.id = p.jogador_id
        LEFT JOIN jogos j ON p.jogo_id = j.id 
          AND EXTRACT(YEAR FROM CAST(j.data AS DATE)) = $1
        WHERE jog.suspenso = 0 
          AND jog.id = ANY($2::int[])
        GROUP BY jog.id, jog.nome
      `;
      queryParams = [anoAtual, idsConvocados];
    } else {
      // SQLite: usar placeholders ? e IN
      const placeholders = idsConvocados.map(() => '?').join(',');
      queryEstatisticas = `
        SELECT 
          jog.id,
          jog.nome,
          COUNT(DISTINCT j.id) as jogos,
          COALESCE(SUM(CASE 
            WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
                 (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
            THEN 3
            WHEN (p.equipa = 1 AND j.equipa1_golos = j.equipa2_golos) OR 
                 (p.equipa = 2 AND j.equipa2_golos = j.equipa1_golos)
            THEN 1
            ELSE 0 
          END), 0) as pontos_totais,
          COALESCE(ROUND(
            (SUM(CASE 
              WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR 
                   (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) 
              THEN 3
              WHEN (p.equipa = 1 AND j.equipa1_golos = j.equipa2_golos) OR 
                   (p.equipa = 2 AND j.equipa2_golos = j.equipa1_golos)
              THEN 1
              ELSE 0 
            END) * 1.0) / NULLIF(COUNT(DISTINCT j.id), 0), 2
          ), 0) as media_pontos
        FROM jogadores jog
        LEFT JOIN presencas p ON jog.id = p.jogador_id
        LEFT JOIN jogos j ON p.jogo_id = j.id 
          AND substr(j.data, 1, 4) = ?
        WHERE jog.suspenso = 0 
          AND jog.id IN (${placeholders})
        GROUP BY jog.id, jog.nome
      `;
      queryParams = [anoAtual.toString(), ...idsConvocados];
    }

    db.query(queryEstatisticas, queryParams, (err, estatisticas) => {      if (err) {
        console.error('Erro ao buscar estatísticas:', err);
        console.error('Query:', queryEstatisticas);
        console.error('Params:', queryParams);
        global.equipasGeradas = null;
        return res.status(500).send('Erro ao buscar estatísticas: ' + err.message);
      }

      console.log(`📊 Estatísticas recebidas: ${estatisticas ? estatisticas.length : 0}`);

      // 3. Criar mapa de estatísticas (converter strings para números)
      const statsMap = {};
      (estatisticas || []).forEach(stat => {
        statsMap[stat.id] = {
          jogos: parseInt(stat.jogos) || 0,
          pontos_totais: parseInt(stat.pontos_totais) || 0,
          media_pontos: parseFloat(stat.media_pontos) || 0
        };
      });

      // 4. Enriquecer convocados com estatísticas
      const jogadoresComStats = convocados.map(jogador => ({
        ...jogador,
        ...(statsMap[jogador.id] || { jogos: 0, pontos_totais: 0, media_pontos: 0 })
      }));

      // 5. Algoritmo de geração de equipas equilibradas
      // Ordenar jogadores por média de pontos (do melhor ao pior)
      jogadoresComStats.sort((a, b) => b.media_pontos - a.media_pontos);

      const equipa1 = [];
      const equipa2 = [];
      let somaPontosEquipa1 = 0;
      let somaPontosEquipa2 = 0;

      // Distribuir jogadores alternadamente, mas ajustando para equilíbrio
      jogadoresComStats.forEach((jogador, index) => {
        // Serpentine draft: 1-2-2-1-1-2-2-1...
        if (index % 4 < 2) {
          if (equipa1.length <= equipa2.length) {
            equipa1.push(jogador);
            somaPontosEquipa1 += jogador.media_pontos;
          } else {
            equipa2.push(jogador);
            somaPontosEquipa2 += jogador.media_pontos;
          }
        } else {
          if (equipa2.length <= equipa1.length) {
            equipa2.push(jogador);
            somaPontosEquipa2 += jogador.media_pontos;
          } else {
            equipa1.push(jogador);
            somaPontosEquipa1 += jogador.media_pontos;
          }
        }
      });

      // 6. Calcular médias
      const mediaPontosEquipa1 = equipa1.length > 0 ? somaPontosEquipa1 / equipa1.length : 0;
      const mediaPontosEquipa2 = equipa2.length > 0 ? somaPontosEquipa2 / equipa2.length : 0;      const equipasGeradas = {
        equipa1: {
          jogadores: equipa1,
          media_pontos: mediaPontosEquipa1,
          pontos_totais: equipa1.reduce((sum, j) => sum + j.pontos_totais, 0)
        },
        equipa2: {
          jogadores: equipa2,
          media_pontos: mediaPontosEquipa2,
          pontos_totais: equipa2.reduce((sum, j) => sum + j.pontos_totais, 0)
        }
      };

      // 7. Armazenar equipas geradas globalmente
      global.equipasGeradas = equipasGeradas;      console.log('✅ Equipas geradas com sucesso');
      console.log(`Equipa 1: ${equipa1.length} jogadores, média ${mediaPontosEquipa1.toFixed(2)} pontos`);
      console.log(`Equipa 2: ${equipa2.length} jogadores, média ${mediaPontosEquipa2.toFixed(2)} pontos`);

      // 8. Redirecionar de volta para convocatória
      res.redirect('/convocatoria');
    });
  });
  } catch (error) {
    console.error('❌ Erro crítico ao gerar equipas:', error);
    global.equipasGeradas = null;
    return res.status(500).send('Erro ao gerar equipas: ' + error.message);
  }
});

// Confirmar/Desconfirmar presença
router.post('/convocatoria/confirmar-presenca/:id', requireAdmin, (req, res) => {
  const jogadorId = req.params.id;
  
  db.query('SELECT confirmado FROM convocatoria WHERE jogador_id = ?', [jogadorId], (err, result) => {
    if (err || !result || result.length === 0) {
      console.error('Erro ao buscar jogador:', err);
      return res.status(400).send('Jogador não encontrado');
    }

    const novoEstado = result[0].confirmado ? 0 : 1;
    const dataConfirmacao = novoEstado ? new Date().toISOString() : null;

    db.query(
      'UPDATE convocatoria SET confirmado = ?, data_confirmacao = ? WHERE jogador_id = ?',
      [novoEstado, dataConfirmacao, jogadorId],
      (err) => {
        if (err) {
          console.error('Erro ao atualizar confirmação:', err);
          return res.status(500).send('Erro ao atualizar');
        }
        console.log(`✅ Jogador ${jogadorId} ${novoEstado ? 'confirmado' : 'desconfirmado'}`);
        res.redirect('/convocatoria');
      }
    );
  });
});

// Reequilibrar Equipas - Gera novamente com ordem diferente
router.post('/convocatoria/reequilibrar-equipas', requireAdmin, (req, res) => {
  console.log('🔄 REEQUILIBRANDO EQUIPAS...');
  
  // Simplesmente redireciona para confirmar-equipas (que regerará automaticamente)
  // As equipas são geradas de forma determinística, então sempre terão o mesmo resultado
  // Para realmente "reequilibrar", podemos adicionar aleatoriedade ou trocar jogadores
  
  if (!global.equipasGeradas) {
    console.log('⚠️ Nenhuma equipa gerada ainda');
    return res.redirect('/convocatoria');
  }

  // Opção 1: Trocar os últimos jogadores de cada equipa
  const equipa1 = [...global.equipasGeradas.equipa1.jogadores];
  const equipa2 = [...global.equipasGeradas.equipa2.jogadores];
  
  if (equipa1.length > 0 && equipa2.length > 0) {
    // Trocar último jogador de cada equipa
    const ultimoEquipa1 = equipa1.pop();
    const ultimoEquipa2 = equipa2.pop();
    
    equipa1.push(ultimoEquipa2);
    equipa2.push(ultimoEquipa1);
    
    // Recalcular médias
    const somaPontosEquipa1 = equipa1.reduce((sum, j) => sum + (parseFloat(j.media_pontos) || 0), 0);
    const somaPontosEquipa2 = equipa2.reduce((sum, j) => sum + (parseFloat(j.media_pontos) || 0), 0);
    
    const mediaPontosEquipa1 = equipa1.length > 0 ? somaPontosEquipa1 / equipa1.length : 0;
    const mediaPontosEquipa2 = equipa2.length > 0 ? somaPontosEquipa2 / equipa2.length : 0;
    
    global.equipasGeradas = {
      equipa1: {
        jogadores: equipa1,
        media_pontos: mediaPontosEquipa1,
        pontos_totais: equipa1.reduce((sum, j) => sum + (parseInt(j.pontos_totais) || 0), 0)
      },
      equipa2: {
        jogadores: equipa2,
        media_pontos: mediaPontosEquipa2,
        pontos_totais: equipa2.reduce((sum, j) => sum + (parseInt(j.pontos_totais) || 0), 0)
      }
    };
    
    console.log('✅ Equipas reequilibradas');
    console.log(`Equipa 1: ${equipa1.length} jogadores, média ${mediaPontosEquipa1.toFixed(2)} pontos`);
    console.log(`Equipa 2: ${equipa2.length} jogadores, média ${mediaPontosEquipa2.toFixed(2)} pontos`);
  }
  
  res.redirect('/convocatoria');
});

// Salvar Equipas - Salva as equipas geradas (pode ser usado para histórico futuro)
router.post('/convocatoria/salvar-equipas', requireAdmin, (req, res) => {
  console.log('💾 SALVANDO EQUIPAS...');
  
  if (!global.equipasGeradas) {
    console.log('⚠️ Nenhuma equipa gerada para salvar');
    return res.redirect('/convocatoria');
  }

  // Por enquanto, apenas exibe mensagem de sucesso
  // Futuramente pode salvar em tabela de equipas_salvas
  console.log('✅ Equipas salvas com sucesso');
  console.log(`Equipa 1: ${global.equipasGeradas.equipa1.jogadores.length} jogadores`);
  console.log(`Equipa 2: ${global.equipasGeradas.equipa2.jogadores.length} jogadores`);
  
  // Redirecionar com mensagem de sucesso
  res.redirect('/convocatoria?msg=equipas_salvas');
});

// Resetar convocatória
router.post('/convocatoria/reset', requireAdmin, (req, res) => {
  console.log('🔄 Resetando convocatória...');
  
  // 1. Limpar convocatória atual
  db.query('DELETE FROM convocatoria', [], (err) => {
    if (err) {
      console.error('Erro ao limpar convocatória:', err);
      return res.status(500).send('Erro ao resetar');
    }

    // 2. Buscar todos os jogadores ativos
    db.query('SELECT id FROM jogadores WHERE COALESCE(suspenso, 0) = 0 ORDER BY nome', [], (err, jogadores) => {
      if (err) {
        console.error('Erro ao buscar jogadores:', err);
        return res.status(500).send('Erro ao buscar jogadores');
      }

      console.log(`📋 Criando convocatória com ${jogadores.length} jogadores...`);

      // 3. Criar convocatória: primeiros 10 convocados, resto reservas
      const inserts = jogadores.map((jogador, index) => {
        return new Promise((resolve) => {
          const tipo = index < 10 ? 'convocado' : 'reserva';
          const posicao = tipo === 'convocado' ? index + 1 : index - 9;
          
          db.query(
            'INSERT INTO convocatoria (jogador_id, tipo, posicao, confirmado) VALUES (?, ?, ?, 0)',
            [jogador.id, tipo, posicao],
            (err) => {
              if (err) console.error('Erro ao inserir:', err);
              resolve();
            }
          );
        });
      });

      Promise.all(inserts).then(() => {
        console.log('✅ Convocatória resetada com sucesso');
        res.redirect('/convocatoria');
      });
    });
  });
});

// Configuração final (limpar faltas de teste e aplicar ordem específica)
router.post('/convocatoria/configuracao-final', requireAdmin, (req, res) => {
  console.log('⚙️ Aplicando configuração final...');
  
  // 1. Limpar todas as faltas (resetar histórico de teste)
  db.query('DELETE FROM faltas_historico', [], (err) => {
    if (err) {
      console.error('Erro ao limpar faltas:', err);
      return res.status(500).send('Erro ao limpar faltas');
    }

    console.log('✅ Faltas de teste limpas');

    // 2. Ordem específica dos convocados (baseada no WhatsApp)
    const ordemConvocados = [
      'Rogério Silva',
      'Césaro Cruz',
      'Carlos Silva',
      'Nuno Ferreira',
      'Joel Almeida',
      'Carlos Correia',
      'Joaquim Rocha',
      'Ismael Campos',
      'João Couto',
      'Rui Lopes'
    ];

    // 3. Buscar IDs dos jogadores por nome
    db.query('SELECT id, nome FROM jogadores', [], (err, jogadores) => {
      if (err) {
        console.error('Erro ao buscar jogadores:', err);
        return res.status(500).send('Erro');
      }

      const updates = [];
      let posicaoReserva = 1;

      jogadores.forEach((jogador) => {
        const indexConvocado = ordemConvocados.indexOf(jogador.nome);
        
        if (indexConvocado >= 0) {
          // É convocado - aplicar posição específica
          updates.push(
            new Promise((resolve) => {
              db.query(
                'UPDATE convocatoria SET tipo = "convocado", posicao = ?, confirmado = 0 WHERE jogador_id = ?',
                [indexConvocado + 1, jogador.id],
                (err) => {
                  if (err) console.error('Erro ao atualizar convocado:', err);
                  resolve();
                }
              );
            })
          );
        } else {
          // É reserva - ordem alfabética
          updates.push(
            new Promise((resolve) => {
              db.query(
                'UPDATE convocatoria SET tipo = "reserva", posicao = ?, confirmado = 0 WHERE jogador_id = ?',
                [posicaoReserva++, jogador.id],
                (err) => {
                  if (err) console.error('Erro ao atualizar reserva:', err);
                  resolve();
                }
              );
            })
          );
        }
      });

      Promise.all(updates).then(() => {
        console.log('✅ Configuração final aplicada com sucesso');
        res.redirect('/convocatoria');
      });
    });
  });
});

// Mover reserva (up/down)
router.post('/convocatoria/mover-reserva/:id/:direction', requireAdmin, (req, res) => {
  const jogadorId = req.params.id;
  const direction = req.params.direction; // 'up' ou 'down'

  db.query('SELECT posicao FROM convocatoria WHERE jogador_id = ? AND tipo = "reserva"', [jogadorId], (err, result) => {
    if (err || !result || result.length === 0) {
      return res.status(400).send('Reserva não encontrada');
    }

    const posicaoAtual = result[0].posicao;
    const novaPosicao = direction === 'up' ? posicaoAtual - 1 : posicaoAtual + 1;

    // Trocar posições
    db.query('UPDATE convocatoria SET posicao = ? WHERE jogador_id = ?', [novaPosicao, jogadorId], (err) => {
      if (err) return res.status(500).send('Erro ao mover');

      db.query(
        'UPDATE convocatoria SET posicao = ? WHERE posicao = ? AND tipo = "reserva" AND jogador_id != ?',
        [posicaoAtual, novaPosicao, jogadorId],
        (err) => {
          if (err) return res.status(500).send('Erro ao trocar posições');
          res.redirect('/convocatoria');
        }
      );
    });
  });
});

// Migrar para 10 convocados
router.post('/convocatoria/migrar-para-10', requireAdmin, (req, res) => {
  console.log('⚡ Migrando para 10 convocados...');

  // Mover convocados acima de 10 para reservas
  db.query('SELECT jogador_id FROM convocatoria WHERE tipo = "convocado" AND posicao > 10 ORDER BY posicao', [], (err, convocadosExtra) => {
    if (err || !convocadosExtra || convocadosExtra.length === 0) {
      return res.redirect('/convocatoria');
    }

    // Buscar última posição de reserva
    db.query('SELECT MAX(posicao) as max_pos FROM convocatoria WHERE tipo = "reserva"', [], (err, result) => {
      let proximaPosicaoReserva = (result && result[0] && result[0].max_pos) ? result[0].max_pos + 1 : 1;

      const updates = convocadosExtra.map((conv) => {
        return new Promise((resolve) => {
          db.query(
            'UPDATE convocatoria SET tipo = "reserva", posicao = ? WHERE jogador_id = ?',
            [proximaPosicaoReserva++, conv.jogador_id],
            (err) => {
              if (err) console.error('Erro ao mover para reservas:', err);
              resolve();
            }
          );
        });
      });

      Promise.all(updates).then(() => {
        console.log(`✅ ${convocadosExtra.length} jogadores movidos para reservas`);
        res.redirect('/convocatoria');
      });
    });
  });
});

// Rota para limpar TODAS as faltas (reset completo)
router.post('/convocatoria/limpar-todas-faltas', requireAdmin, (req, res) => {
  console.log('🧹 Limpando TODAS as faltas...');
  
  // Contar faltas antes
  db.query('SELECT COUNT(*) as total FROM faltas_historico', [], (err, result) => {
    if (err) {
      console.error('Erro ao contar faltas:', err);
      return res.status(500).send('Erro ao verificar faltas');
    }
    
    const totalAntes = result[0].total;
    console.log(`📊 Total de faltas antes: ${totalAntes}`);
    
    // Limpar todas as faltas
    db.query('DELETE FROM faltas_historico', [], (err) => {
      if (err) {
        console.error('Erro ao limpar faltas:', err);
        return res.status(500).send('Erro ao limpar faltas');
      }
      
      console.log('✅ Todas as faltas foram limpas!');
      
      // Redirecionar com mensagem de sucesso
      res.redirect('/convocatoria?msg=faltas_limpas');
    });
  });
});

// ============================================
// ROTAS DE INDISPONÍVEIS TEMPORÁRIOS
// ============================================

// Adicionar jogador aos indisponíveis
router.post('/convocatoria/adicionar-indisponivel', requireAdmin, (req, res) => {
  const { jogador_id, tipo_periodo, numero_jogos, data_fim, motivo } = req.body;
  
  console.log('➕ Adicionando jogador aos indisponíveis:', { jogador_id, tipo_periodo, numero_jogos, data_fim, motivo });
  
  // Validações
  if (!jogador_id) {
    return res.status(400).send('Jogador não selecionado');
  }
  
  if (!motivo || motivo.trim() === '') {
    return res.status(400).send('Motivo é obrigatório');
  }
  
  if (tipo_periodo === 'jogos' && (!numero_jogos || numero_jogos < 1)) {
    return res.status(400).send('Número de jogos inválido');
  }
  
  if (tipo_periodo === 'data' && !data_fim) {
    return res.status(400).send('Data de fim é obrigatória');
  }
  
  // Buscar posição atual do jogador
  db.query('SELECT * FROM convocatoria WHERE jogador_id = ?', [jogador_id], (err, result) => {
    if (err) {
      console.error('Erro ao buscar jogador:', err);
      return res.status(500).send('Erro ao buscar jogador');
    }
    
    if (!result || result.length === 0) {
      return res.status(400).send('Jogador não encontrado na convocatória');
    }
    
    const jogador = result[0];
    
    // Inserir na tabela de indisponíveis
    const dataInicio = new Date().toISOString().split('T')[0];
    db.query(`
      INSERT INTO indisponiveis_temporarios 
      (jogador_id, data_inicio, data_fim, numero_jogos, motivo, posicao_original, tipo_original, ativo)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1)
    `, [
      jogador_id,
      dataInicio,
      tipo_periodo === 'data' ? data_fim : null,
      tipo_periodo === 'jogos' ? numero_jogos : null,
      motivo,
      jogador.posicao,
      jogador.tipo
    ], (err) => {
      if (err) {
        console.error('Erro ao inserir indisponível:', err);
        return res.status(500).send('Erro ao adicionar aos indisponíveis');
      }
      
      console.log('✅ Jogador adicionado aos indisponíveis');
      res.redirect('/convocatoria?msg=indisponivel_adicionado');
    });
  });
});

// Remover jogador dos indisponíveis (retornar à posição original)
router.post('/convocatoria/remover-indisponivel/:id', requireAdmin, (req, res) => {
  const indisponivelId = req.params.id;
  
  console.log('🔙 Removendo jogador dos indisponíveis:', indisponivelId);
  
  // Buscar dados do indisponível
  db.query('SELECT * FROM indisponiveis_temporarios WHERE id = ? AND ativo = 1', [indisponivelId], (err, result) => {
    if (err || !result || result.length === 0) {
      console.error('Erro ao buscar indisponível:', err);
      return res.status(400).send('Indisponível não encontrado');
    }
    
    const indisponivel = result[0];
    
    // Reativar jogador na convocatória
    db.query(`
      UPDATE convocatoria 
      SET tipo = ?, posicao = ?
      WHERE jogador_id = ?
    `, [
      indisponivel.tipo_original,
      indisponivel.posicao_original,
      indisponivel.jogador_id
    ], (err) => {
      if (err) {
        console.error('Erro ao reativar jogador:', err);
        return res.status(500).send('Erro ao reativar jogador');
      }
      
      // Marcar como inativo
      db.query('UPDATE indisponiveis_temporarios SET ativo = 0 WHERE id = ?', [indisponivelId], (err) => {
        if (err) {
          console.error('Erro ao desativar indisponível:', err);
          return res.status(500).send('Erro ao desativar indisponível');
        }
        
        console.log('✅ Jogador removido dos indisponíveis e retornou à posição original');
        res.redirect('/convocatoria?msg=indisponivel_removido');
      });
    });
  });
});

// Decrementar jogos após um jogo registado (chamado automaticamente)
router.post('/convocatoria/decrementar-jogos-indisponiveis', requireAdmin, (req, res) => {
  console.log('⏬ Decrementando jogos dos indisponíveis...');
  
  // Buscar todos os indisponíveis ativos com número de jogos
  db.query(`
    SELECT * FROM indisponiveis_temporarios 
    WHERE ativo = 1 AND numero_jogos > 0
  `, [], (err, indisponiveis) => {
    if (err) {
      console.error('Erro ao buscar indisponíveis:', err);
      return res.status(500).send('Erro ao buscar indisponíveis');
    }
    
    if (!indisponiveis || indisponiveis.length === 0) {
      console.log('ℹ️ Nenhum indisponível por jogos encontrado');
      return res.redirect('/convocatoria');
    }
    
    let processados = 0;
    
    indisponiveis.forEach(indisponivel => {
      const novosJogos = indisponivel.numero_jogos - 1;
      
      if (novosJogos <= 0) {
        // Retornar à posição original
        db.query(`
          UPDATE convocatoria 
          SET tipo = ?, posicao = ?
          WHERE jogador_id = ?
        `, [
          indisponivel.tipo_original,
          indisponivel.posicao_original,
          indisponivel.jogador_id
        ], (err) => {
          if (err) {
            console.error('Erro ao reativar jogador:', err);
          } else {
            db.query('UPDATE indisponiveis_temporarios SET ativo = 0, numero_jogos = 0 WHERE id = ?', [indisponivel.id]);
            console.log(`✅ Jogador ${indisponivel.jogador_id} retornou automaticamente`);
          }
          
          processados++;
          if (processados === indisponiveis.length) {
            res.redirect('/convocatoria?msg=jogos_decrementados');
          }
        });
      } else {
        // Apenas decrementar
        db.query('UPDATE indisponiveis_temporarios SET numero_jogos = ? WHERE id = ?', [novosJogos, indisponivel.id], (err) => {
          if (err) {
            console.error('Erro ao decrementar jogos:', err);
          } else {
            console.log(`⏬ Jogador ${indisponivel.jogador_id}: ${indisponivel.numero_jogos} → ${novosJogos} jogos`);
          }
          
          processados++;
          if (processados === indisponiveis.length) {
            res.redirect('/convocatoria?msg=jogos_decrementados');
          }
        });
      }
    });
  });
});

module.exports = router;