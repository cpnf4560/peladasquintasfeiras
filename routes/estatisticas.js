const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { normalizeRows } = require('../utils/helpers');

// Função auxiliar para renderizar a view
function renderView(res, req, estatisticasProcessadas, curiosidades, duplas, anoSelecionado, mesSelecionado, ordenacaoSelecionada) {
  res.render('estatisticas', {
    user: req.session.user,
    estatisticas: estatisticasProcessadas,
    anoSelecionado,
    mesSelecionado,
    ordenacaoSelecionada,
    mvpMensais: [],
    totalJogosMes: 0,
    minimoJogosParaMVP: 0,
    duplas: duplas,
    curiosidades
  });
}

router.get('/estatisticas', requireAuth, (req, res) => {
  const anoSelecionado = req.query.ano || '2025';
  const mesSelecionado = req.query.mes || '';
  const ordenacaoSelecionada = req.query.ordenacao || 'percentagem';

  console.log('📊 Estatísticas solicitadas:', { anoSelecionado, mesSelecionado, ordenacaoSelecionada });

  let filtroData = '';
  const mesPad = mesSelecionado ? mesSelecionado.padStart(2, '0') : null;
  if (mesPad) filtroData = `AND j.data LIKE '${anoSelecionado}-${mesPad}-%'`;
  else filtroData = `AND j.data LIKE '${anoSelecionado}-%'`;

  console.log('🔍 Filtro de data:', filtroData);
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
  
  // Query para estatísticas do ano completo (para curiosidades)
  const queryEstatisticasAno = `SELECT 
      jog.id,
      jog.nome,
      COUNT(DISTINCT j.id) as jogos
    FROM jogadores jog
    LEFT JOIN presencas p ON jog.id = p.jogador_id
    LEFT JOIN jogos j ON p.jogo_id = j.id
    WHERE jog.suspenso = 0 AND j.data LIKE '${anoSelecionado}-%'
    GROUP BY jog.id, jog.nome
    HAVING COUNT(DISTINCT j.id) > 0`;

  db.query(queryEstatisticas, [], (err, estatisticas) => {
    if (err) {
      console.error('❌ Erro ao buscar estatísticas:', err);
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

    console.log(`✅ Estatísticas encontradas: ${estatisticas?.length || 0} jogadores`);

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
        return b.jogos - a.jogos;      });
    }    const { gerarCuriosidades } = require('../server');
    
    // Query para duplas
    const queryDuplas = `
      SELECT 
        j1.nome as jogador1,
        j2.nome as jogador2,
        COUNT(DISTINCT jogo.id) as jogos_juntos,
        SUM(CASE 
          WHEN (p1.equipa = p2.equipa AND p1.equipa = 1 AND jogo.equipa1_golos > jogo.equipa2_golos) OR 
               (p1.equipa = p2.equipa AND p1.equipa = 2 AND jogo.equipa2_golos > jogo.equipa1_golos) 
          THEN 1 ELSE 0 END) as vitorias,
        SUM(CASE 
          WHEN (p1.equipa = p2.equipa AND jogo.equipa1_golos = jogo.equipa2_golos) 
          THEN 1 ELSE 0 END) as empates,
        SUM(CASE 
          WHEN (p1.equipa = p2.equipa AND p1.equipa = 1 AND jogo.equipa1_golos < jogo.equipa2_golos) OR 
               (p1.equipa = p2.equipa AND p1.equipa = 2 AND jogo.equipa2_golos < jogo.equipa1_golos) 
          THEN 1 ELSE 0 END) as derrotas,
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
      WHERE jogo.equipa1_golos IS NOT NULL 
        AND jogo.equipa2_golos IS NOT NULL
        ${filtroData}
      GROUP BY j1.id, j2.id, j1.nome, j2.nome
      HAVING COUNT(DISTINCT jogo.id) >= 3
      ORDER BY percentagem_vitorias DESC
    `;    
    db.query(queryDuplas, [], (errDuplas, duplasResult) => {
      let duplasProcessadas = null;
      
      if (!errDuplas && duplasResult && duplasResult.length > 0) {
        // TOP 3 - Melhor % de vitórias
        const top3MelhorVitorias = duplasResult
          .sort((a, b) => b.percentagem_vitorias - a.percentagem_vitorias)
          .slice(0, 3);
        
        // TOP 3 - Pior % de vitórias
        const top3PiorVitorias = duplasResult
          .sort((a, b) => a.percentagem_vitorias - b.percentagem_vitorias)
          .slice(0, 3);
        
        // TOP 3 - Menos jogos juntos
        const top3MenosJogos = duplasResult
          .sort((a, b) => a.jogos_juntos - b.jogos_juntos)
          .slice(0, 3);
        
        duplasProcessadas = {
          melhorVitorias: top3MelhorVitorias,
          piorVitorias: top3PiorVitorias,
          menosJogos: top3MenosJogos
        };
      }
    
    // Buscar estatísticas do ano completo se estiver filtrado por mês
    if (mesSelecionado) {
      db.query(queryEstatisticasAno, [], (errAno, estatisticasAno) => {
        const statsAnoProcessadas = (estatisticasAno || []).map(stat => ({
          ...stat,
          pontos: 0,
          diferenca_golos: 0
        }));
        const curiosidades = gerarCuriosidades ? gerarCuriosidades(estatisticasProcessadas, anoSelecionado, mesSelecionado, statsAnoProcessadas) : [];
        renderView(res, req, estatisticasProcessadas, curiosidades, duplasProcessadas, anoSelecionado, mesSelecionado, ordenacaoSelecionada);
      });
    } else {
      const curiosidades = gerarCuriosidades ? gerarCuriosidades(estatisticasProcessadas, anoSelecionado, mesSelecionado) : [];
      renderView(res, req, estatisticasProcessadas, curiosidades, duplasProcessadas, anoSelecionado, mesSelecionado, ordenacaoSelecionada);
    }
    });  });
});

module.exports = router;