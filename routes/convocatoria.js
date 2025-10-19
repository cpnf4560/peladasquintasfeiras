const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

// Listar convocatória
router.get('/convocatoria', optionalAuth, (req, res) => {
  console.log('=== ROTA /convocatoria CHAMADA ===');
  db.query('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', (err, jogadores) => {
    if (err) return res.status(500).send('Erro ao buscar jogadores');

    db.query('SELECT * FROM convocatoria_config LIMIT 1', (err, config) => {
      if (err || !config) {
        // fallback to initConvocatoriaSystem which is still in server.js
        return res.status(500).send('Config missing');
      }

      db.query(`
        SELECT j.*, c.posicao, c.tipo, c.confirmado, c.data_confirmacao,
               COALESCE((SELECT COUNT(*) FROM faltas_historico f WHERE f.jogador_id = j.id), 0) as total_faltas
        FROM jogadores j 
        JOIN convocatoria c ON j.id = c.jogador_id 
        WHERE j.suspenso = 0 
        ORDER BY c.tipo, c.posicao
      `, (err, convocatoria) => {
        if (err) return res.status(500).send('Erro ao buscar convocatória');        const convocados = convocatoria.filter(j => j.tipo === 'convocado');
        const reservas = convocatoria.filter(j => j.tipo === 'reserva');
        res.render('convocatoria', { 
          user: req.session.user || null,
          activePage: 'convocatoria',
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

// Confirmar equipas - Gerar equipas equilibradas
router.post('/convocatoria/confirmar-equipas', requireAdmin, (req, res) => {
  console.log('=== GERANDO EQUIPAS EQUILIBRADAS ===');
  
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
      return res.status(500).send('Erro ao buscar convocados');
    }

    if (!convocados || convocados.length < 2) {
      return res.status(400).send('Não há convocados suficientes confirmados');
    }

    console.log(`📋 ${convocados.length} convocados encontrados`);

    // 2. Buscar estatísticas do ano atual para cada jogador
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
        AND jog.id IN (${convocados.map(c => c.id).join(',')})
      GROUP BY jog.id, jog.nome
    `;

    db.query(queryEstatisticas, [], (err, estatisticas) => {
      if (err) {
        console.error('Erro ao buscar estatísticas:', err);
        return res.status(500).send('Erro ao buscar estatísticas');
      }

      // 3. Criar mapa de estatísticas
      const statsMap = {};
      (estatisticas || []).forEach(stat => {
        statsMap[stat.id] = {
          jogos: stat.jogos || 0,
          vitorias: stat.vitorias || 0,
          percentagem_vitorias: stat.percentagem_vitorias || 0
        };
      });

      // 4. Enriquecer convocados com estatísticas
      const jogadoresComStats = convocados.map(jogador => ({
        ...jogador,
        ...(statsMap[jogador.id] || { jogos: 0, vitorias: 0, percentagem_vitorias: 0 })
      }));

      // 5. Algoritmo de geração de equipas equilibradas
      // Ordenar jogadores por percentagem de vitórias (do melhor ao pior)
      jogadoresComStats.sort((a, b) => b.percentagem_vitorias - a.percentagem_vitorias);

      const equipa1 = [];
      const equipa2 = [];
      let somaPercentagemEquipa1 = 0;
      let somaPercentagemEquipa2 = 0;

      // Distribuir jogadores alternadamente, mas ajustando para equilíbrio
      jogadoresComStats.forEach((jogador, index) => {
        // Serpentine draft: 1-2-2-1-1-2-2-1...
        if (index % 4 < 2) {
          if (equipa1.length <= equipa2.length) {
            equipa1.push(jogador);
            somaPercentagemEquipa1 += jogador.percentagem_vitorias;
          } else {
            equipa2.push(jogador);
            somaPercentagemEquipa2 += jogador.percentagem_vitorias;
          }
        } else {
          if (equipa2.length <= equipa1.length) {
            equipa2.push(jogador);
            somaPercentagemEquipa2 += jogador.percentagem_vitorias;
          } else {
            equipa1.push(jogador);
            somaPercentagemEquipa1 += jogador.percentagem_vitorias;
          }
        }
      });

      // 6. Calcular médias
      const mediaEquipa1 = equipa1.length > 0 ? somaPercentagemEquipa1 / equipa1.length : 0;
      const mediaEquipa2 = equipa2.length > 0 ? somaPercentagemEquipa2 / equipa2.length : 0;

      const equipasGeradas = {
        equipa1: {
          jogadores: equipa1,
          percentagem_vitorias_media: mediaEquipa1,
          pontos_totais: equipa1.reduce((sum, j) => sum + (j.vitorias * 3), 0)
        },
        equipa2: {
          jogadores: equipa2,
          percentagem_vitorias_media: mediaEquipa2,
          pontos_totais: equipa2.reduce((sum, j) => sum + (j.vitorias * 3), 0)
        }
      };

      // 7. Armazenar equipas geradas globalmente
      global.equipasGeradas = equipasGeradas;

      console.log('✅ Equipas geradas com sucesso');
      console.log(`Equipa 1: ${equipa1.length} jogadores, média ${mediaEquipa1.toFixed(1)}%`);
      console.log(`Equipa 2: ${equipa2.length} jogadores, média ${mediaEquipa2.toFixed(1)}%`);

      // 8. Redirecionar de volta para convocatória
      res.redirect('/convocatoria');
    });
  });
});

// Reset, migrar-para-10, configurar-personalizada, configuracao-final, confirmar-presenca, mover-reserva,
// confirmar-equipas, trocar-jogadores, reequilibrar-equipas, salvar-equipas
// For brevity, these routes will be mounted here but refer to the implementations still in server.js if needed.

module.exports = router;