const express = require('express');
const router = express.Router();
const { db, USE_POSTGRES } = require('../db');
const { optionalAuth } = require('../middleware/auth');

// Página inicial de comparação (sem dados)
router.get('/comparacao', optionalAuth, (req, res) => {
  // Buscar todos os jogadores ativos para os dropdowns
  db.query(`
    SELECT id, nome
    FROM jogadores
    WHERE COALESCE(suspenso, 0) = 0
    ORDER BY nome ASC
  `, [], (err, jogadores) => {
    if (err) {
      console.error('❌ Erro ao buscar jogadores:', err);
      return res.status(500).send('Erro ao buscar jogadores');
    }

    res.render('comparacao', {
      user: req.session.user || null,
      activePage: 'comparacao',
      jogadores: jogadores || [],
      jogador1: null,
      jogador2: null,
      estatisticasDupla: null,
      estatisticasConfronto: null
    });
  });
});

// Rota para processar a comparação
router.post('/comparacao/comparar', optionalAuth, (req, res) => {
  const { jogador1_id, jogador2_id } = req.body;

  if (!jogador1_id || !jogador2_id) {
    return res.status(400).send('Selecione ambos os jogadores');
  }

  if (jogador1_id === jogador2_id) {
    return res.status(400).send('Selecione jogadores diferentes');
  }

  // Buscar todos os jogadores para os dropdowns
  db.query(`
    SELECT id, nome
    FROM jogadores
    WHERE COALESCE(suspenso, 0) = 0
    ORDER BY nome ASC
  `, [], (err, jogadores) => {
    if (err) {
      console.error('❌ Erro ao buscar jogadores:', err);
      return res.status(500).send('Erro ao buscar jogadores');
    }

    // Buscar nomes dos jogadores selecionados
    db.query(`
      SELECT id, nome FROM jogadores WHERE id IN (?, ?)
    `, [jogador1_id, jogador2_id], (err, jogadoresSelecionados) => {
      if (err || jogadoresSelecionados.length !== 2) {
        console.error('❌ Erro ao buscar jogadores selecionados:', err);
        return res.status(500).send('Erro ao buscar jogadores');
      }

      const jogador1 = jogadoresSelecionados.find(j => j.id == jogador1_id);
      const jogador2 = jogadoresSelecionados.find(j => j.id == jogador2_id);

      // 1. ESTATÍSTICAS COMO DUPLA (mesma equipa)
      const queryDupla = `
        SELECT 
          COUNT(DISTINCT jogo.id) as jogos_juntos,
          SUM(CASE 
            WHEN (p1.equipa = 1 AND jogo.equipa1_golos > jogo.equipa2_golos) OR
                 (p1.equipa = 2 AND jogo.equipa2_golos > jogo.equipa1_golos)
            THEN 1 ELSE 0 
          END) as vitorias,
          SUM(CASE 
            WHEN jogo.equipa1_golos = jogo.equipa2_golos
            THEN 1 ELSE 0 
          END) as empates,
          SUM(CASE 
            WHEN (p1.equipa = 1 AND jogo.equipa1_golos < jogo.equipa2_golos) OR
                 (p1.equipa = 2 AND jogo.equipa2_golos < jogo.equipa1_golos)
            THEN 1 ELSE 0 
          END) as derrotas,
          SUM(CASE WHEN p1.equipa = 1 THEN jogo.equipa1_golos ELSE jogo.equipa2_golos END) as golos_marcados,
          SUM(CASE WHEN p1.equipa = 1 THEN jogo.equipa2_golos ELSE jogo.equipa1_golos END) as golos_sofridos
        FROM presencas p1
        JOIN presencas p2 ON p1.jogo_id = p2.jogo_id AND p1.equipa = p2.equipa
        JOIN jogos jogo ON p1.jogo_id = jogo.id
        WHERE p1.jogador_id = ? 
          AND p2.jogador_id = ?
          AND jogo.equipa1_golos IS NOT NULL 
          AND jogo.equipa2_golos IS NOT NULL
      `;

      db.query(queryDupla, [jogador1_id, jogador2_id], (err, resultDupla) => {
        if (err) {
          console.error('❌ Erro ao buscar estatísticas da dupla:', err);
          return res.status(500).send('Erro ao processar dados da dupla');
        }

        const estatisticasDupla = Array.isArray(resultDupla) 
          ? resultDupla[0] 
          : (resultDupla?.rows && resultDupla.rows[0]) || null;

        // 2. ESTATÍSTICAS DE CONFRONTOS DIRETOS (equipas diferentes)
        const queryConfronto = `
          SELECT 
            COUNT(DISTINCT jogo.id) as total_confrontos,
            SUM(CASE 
              WHEN (p1.equipa = 1 AND jogo.equipa1_golos > jogo.equipa2_golos) OR
                   (p1.equipa = 2 AND jogo.equipa2_golos > jogo.equipa1_golos)
              THEN 1 ELSE 0 
            END) as vitorias_jogador1,
            SUM(CASE 
              WHEN (p2.equipa = 1 AND jogo.equipa1_golos > jogo.equipa2_golos) OR
                   (p2.equipa = 2 AND jogo.equipa2_golos > jogo.equipa1_golos)
              THEN 1 ELSE 0 
            END) as vitorias_jogador2,
            SUM(CASE 
              WHEN jogo.equipa1_golos = jogo.equipa2_golos
              THEN 1 ELSE 0 
            END) as empates_confronto
          FROM presencas p1
          JOIN presencas p2 ON p1.jogo_id = p2.jogo_id AND p1.equipa != p2.equipa
          JOIN jogos jogo ON p1.jogo_id = jogo.id
          WHERE p1.jogador_id = ? 
            AND p2.jogador_id = ?
            AND jogo.equipa1_golos IS NOT NULL 
            AND jogo.equipa2_golos IS NOT NULL
        `;

        db.query(queryConfronto, [jogador1_id, jogador2_id], (err, resultConfronto) => {
          if (err) {
            console.error('❌ Erro ao buscar confrontos diretos:', err);
            return res.status(500).send('Erro ao processar confrontos');
          }

          const estatisticasConfronto = Array.isArray(resultConfronto) 
            ? resultConfronto[0] 
            : (resultConfronto?.rows && resultConfronto.rows[0]) || null;

          console.log('✅ Comparação:', {
            jogador1: jogador1.nome,
            jogador2: jogador2.nome,
            dupla: estatisticasDupla,
            confronto: estatisticasConfronto
          });

          res.render('comparacao', {
            user: req.session.user || null,
            activePage: 'comparacao',
            jogadores: jogadores || [],
            jogador1: jogador1,
            jogador2: jogador2,
            jogador1_id: jogador1_id,
            jogador2_id: jogador2_id,
            estatisticasDupla: estatisticasDupla,
            estatisticasConfronto: estatisticasConfronto
          });
        });
      });
    });
  });
});

module.exports = router;
