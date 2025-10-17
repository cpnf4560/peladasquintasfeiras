const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeRows } = require('../utils/helpers');

router.get('/estatisticas', requireAuth, (req, res) => {
  const anoSelecionado = req.query.ano || '2025';
  const mesSelecionado = req.query.mes || '';
  const ordenacaoSelecionada = req.query.ordenacao || 'percentagem';

  let filtroData = '';
  const mesPad = mesSelecionado ? mesSelecionado.padStart(2, '0') : null;
  if (mesPad) filtroData = `AND j.data LIKE '${anoSelecionado}-${mesPad}-%'`;
  else filtroData = `AND j.data LIKE '${anoSelecionado}-%'`;

  const queryEstatisticas = `SELECT 
      jog.id,
      jog.nome,
      COUNT(DISTINCT j.id) as jogos,
      SUM(CASE WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) THEN 1 ELSE 0 END) as vitorias,
      SUM(CASE WHEN j.equipa1_golos = j.equipa2_golos THEN 1 ELSE 0 END) as empates,
      SUM(CASE WHEN (p.equipa = 1 AND j.equipa1_golos < j.equipa2_golos) OR (p.equipa = 2 AND j.equipa2_golos < j.equipa1_golos) THEN 1 ELSE 0 END) as derrotas,
      SUM(CASE WHEN p.equipa = 1 THEN j.equipa1_golos ELSE j.equipa2_golos END) as golos_marcados,
      SUM(CASE WHEN p.equipa = 1 THEN j.equipa2_golos ELSE j.equipa1_golos END) as golos_sofridos,
      ROUND((SUM(CASE WHEN (p.equipa = 1 AND j.equipa1_golos > j.equipa2_golos) OR (p.equipa = 2 AND j.equipa2_golos > j.equipa1_golos) THEN 1 ELSE 0 END) * 100.0) / COUNT(DISTINCT j.id), 1) as percentagem_vitorias,
      MAX(j.data) as ultimo_jogo
    FROM jogadores jog
    LEFT JOIN presencas p ON jog.id = p.jogador_id
    LEFT JOIN jogos j ON p.jogo_id = j.id
    WHERE jog.suspenso = 0 ${filtroData}
    GROUP BY jog.id, jog.nome
    HAVING COUNT(DISTINCT j.id) > 0`;

  db.query(queryEstatisticas, [], (err, estatisticas) => {
    if (err) {
      console.error('Erro ao buscar estatísticas:', err);
      return res.render('estatisticas', {
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

    const estatisticasProcessadas = estatisticas.map(stat => ({
      ...stat,
      pontos: (stat.vitorias * 3) + (stat.empates * 1),
      diferenca_golos: stat.golos_marcados - stat.golos_sofridos
    }));

    // sorting
    if (ordenacaoSelecionada === 'percentagem') {
      estatisticasProcessadas.sort((a, b) => {
        if (a.percentagem_vitorias !== b.percentagem_vitorias) return b.percentagem_vitorias - a.percentagem_vitorias;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    } else {
      estatisticasProcessadas.sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    }    const { gerarCuriosidades } = require('../server');
    const curiosidades = gerarCuriosidades ? gerarCuriosidades(estatisticasProcessadas, anoSelecionado, mesSelecionado) : [];

    // handle MVP/month logic and duplas call by delegating back to server.js helpers for now

    res.render('estatisticas', {
      user: req.session.user,
      estatisticas: estatisticasProcessadas,
      anoSelecionado,
      mesSelecionado,
      ordenacaoSelecionada,
      mvpMensais: [],
      totalJogosMes: 0,
      minimoJogosParaMVP: 0,
      curiosidades,
      duplas: null
    });
  });
});

module.exports = router;