const express = require('express');
const router = express.Router();
const { db, USE_POSTGRES } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { normalizeRows } = require('../utils/helpers');

// Função auxiliar para renderizar a view
function renderView(res, req, estatisticasProcessadas, curiosidades, duplas, anoSelecionado, mesSelecionado, ordenacaoSelecionada, totalJogos, minimoJogos) {
  console.log('🖼️  [RENDERVIEW] Chamada com:');
  console.log('   - duplas:', duplas ? 'SIM' : 'NÃO');
  console.log('   - totalJogos:', totalJogos);
  console.log('   - minimoJogos:', minimoJogos);
  console.log('   - estatisticas:', estatisticasProcessadas?.length || 0);
  if (duplas) {
    console.log('   melhorVitorias:', duplas.melhorVitorias ? duplas.melhorVitorias.length : 'undefined');
    console.log('   piorVitorias:', duplas.piorVitorias ? duplas.piorVitorias.length : 'undefined');
    console.log('   menosJogos:', duplas.menosJogos ? duplas.menosJogos.length : 'undefined');
  }  res.render('estatisticas', {
    user: req.session.user || null,
    activePage: 'estatisticas',
    estatisticas: estatisticasProcessadas,
    anoSelecionado,
    mesSelecionado,
    ordenacaoSelecionada,
    mvpMensais: [],
    totalJogosMes: 0,
    minimoJogosParaMVP: 0,
    duplas: duplas,
    curiosidades,
    totalJogos: totalJogos || 0,
    minimoJogos: minimoJogos || 0
  });
}

router.get('/estatisticas', optionalAuth, (req, res) => {
  const anoSelecionado = req.query.ano || '2025';
  const mesSelecionado = req.query.mes || '';
  const ordenacaoSelecionada = req.query.ordenacao || 'mediaPontos';

  console.log('📊 Estatísticas solicitadas:', { anoSelecionado, mesSelecionado, ordenacaoSelecionada });
  let filtroData = '';
  const mesPad = mesSelecionado ? mesSelecionado.padStart(2, '0') : null;
  if (mesPad) filtroData = `AND j.data LIKE '${anoSelecionado}-${mesPad}-%'`;
  else filtroData = `AND j.data LIKE '${anoSelecionado}-%'`;
  
  // Filtro para query de duplas (usa alias 'jogo')
  let filtroDataDuplas = '';
  if (mesPad) filtroDataDuplas = `AND jogo.data LIKE '${anoSelecionado}-${mesPad}-%'`;
  else filtroDataDuplas = `AND jogo.data LIKE '${anoSelecionado}-%'`;

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
    GROUP BY jog.id, jog.nome    HAVING COUNT(DISTINCT j.id) > 0`;
  // Query para contar total de jogos (para calcular 25%)
  // Remove o alias 'j.' porque não existe na query de contagem
  let filtroDataSemAlias = filtroData.replace(/j\.data/g, 'data');
  const queryTotalJogos = `SELECT COUNT(*) as total FROM jogos WHERE 1=1 ${filtroDataSemAlias}`;
    db.query(queryTotalJogos, [], (errTotal, totalResult) => {
    if (errTotal) {
      console.error('❌ Erro ao contar total de jogos:', errTotal);
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
        duplas: null,
        totalJogos: 0,
        minimoJogos: 0
      });
    }

    const totalJogos = totalResult[0]?.total || totalResult[0]?.Total || totalResult[0]?.COUNT || 0;
    const minimoJogos = Math.ceil(totalJogos * 0.25); // 25% dos jogos
    
    console.log(`📊 Total de jogos no período: ${totalJogos}, Mínimo necessário (25%): ${minimoJogos}`);

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
          duplas: null,
          totalJogos: 0,
          minimoJogos: 0
        });
      }

      console.log(`✅ Estatísticas encontradas: ${estatisticas?.length || 0} jogadores`);    const estatisticasProcessadas = estatisticas.map(stat => ({
      ...stat,
      pontos: (stat.vitorias * 3) + (stat.empates * 1),
      diferenca_golos: stat.golos_marcados - stat.golos_sofridos,
      media_pontos: stat.jogos > 0 ? ((stat.vitorias * 3) + (stat.empates * 1)) / stat.jogos : 0,
      temMinimoJogos: stat.jogos >= minimoJogos
    }));

    // Separar jogadores com e sem mínimo de jogos
    const comMinimoJogos = estatisticasProcessadas.filter(s => s.temMinimoJogos);
    const semMinimoJogos = estatisticasProcessadas.filter(s => !s.temMinimoJogos);

    // Ordenar jogadores COM mínimo de jogos
    if (ordenacaoSelecionada === 'percentagem') {
      comMinimoJogos.sort((a, b) => {
        if (a.percentagem_vitorias !== b.percentagem_vitorias) return b.percentagem_vitorias - a.percentagem_vitorias;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    } else if (ordenacaoSelecionada === 'mediaPontos') {
      comMinimoJogos.sort((a, b) => {
        if (a.media_pontos !== b.media_pontos) return b.media_pontos - a.media_pontos;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    } else {
      comMinimoJogos.sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    }

    // Ordenar jogadores SEM mínimo de jogos (mesma lógica)
    if (ordenacaoSelecionada === 'percentagem') {
      semMinimoJogos.sort((a, b) => {
        if (a.percentagem_vitorias !== b.percentagem_vitorias) return b.percentagem_vitorias - a.percentagem_vitorias;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    } else if (ordenacaoSelecionada === 'mediaPontos') {
      semMinimoJogos.sort((a, b) => {
        if (a.media_pontos !== b.media_pontos) return b.media_pontos - a.media_pontos;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    } else {
      semMinimoJogos.sort((a, b) => {
        if (a.pontos !== b.pontos) return b.pontos - a.pontos;
        if (a.diferenca_golos !== b.diferenca_golos) return b.diferenca_golos - a.diferenca_golos;
        if (a.golos_marcados !== b.golos_marcados) return b.golos_marcados - a.golos_marcados;
        return b.jogos - a.jogos;
      });
    }    // Combinar: primeiro os com mínimo, depois os sem
    const estatisticasOrdenadas = [...comMinimoJogos, ...semMinimoJogos];
    
    const { gerarCuriosidades } = require('../server');
      // Query para duplas - SIMPLIFICADA (sem CTE)
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
          THEN 1 ELSE 0 END) as empates,        SUM(CASE 
          WHEN (p1.equipa = p2.equipa AND p1.equipa = 1 AND jogo.equipa1_golos < jogo.equipa2_golos) OR 
               (p1.equipa = p2.equipa AND p1.equipa = 2 AND jogo.equipa2_golos < jogo.equipa1_golos) 
          THEN 1 ELSE 0 END) as derrotas,
        ROUND(
          CAST(
            (SUM(CASE 
              WHEN (p1.equipa = p2.equipa AND p1.equipa = 1 AND jogo.equipa1_golos > jogo.equipa2_golos) OR 
                   (p1.equipa = p2.equipa AND p1.equipa = 2 AND jogo.equipa2_golos > jogo.equipa1_golos) 
              THEN 1 ELSE 0 END) * 100.0) / NULLIF(COUNT(DISTINCT jogo.id), 0)
            AS ${USE_POSTGRES ? 'NUMERIC' : 'REAL'}
          ), 1
        ) as percentagem_vitorias      FROM presencas p1
      JOIN presencas p2 ON p1.jogo_id = p2.jogo_id AND p1.equipa = p2.equipa AND p1.jogador_id < p2.jogador_id
      JOIN jogadores j1 ON p1.jogador_id = j1.id AND j1.suspenso = 0
      JOIN jogadores j2 ON p2.jogador_id = j2.id AND j2.suspenso = 0
      JOIN jogos jogo ON p1.jogo_id = jogo.id
      WHERE jogo.equipa1_golos IS NOT NULL 
        AND jogo.equipa2_golos IS NOT NULL
        ${filtroDataDuplas}      GROUP BY j1.id, j1.nome, j2.id, j2.nome
      HAVING (
        SELECT COUNT(DISTINCT jp1.jogo_id) 
        FROM presencas jp1 
        JOIN jogos jg1 ON jp1.jogo_id = jg1.id 
        WHERE jp1.jogador_id = j1.id ${filtroData.replace(/j\.data/g, 'jg1.data')}
      ) >= ${minimoJogos}
      AND (
        SELECT COUNT(DISTINCT jp2.jogo_id) 
        FROM presencas jp2 
        JOIN jogos jg2 ON jp2.jogo_id = jg2.id 
        WHERE jp2.jogador_id = j2.id ${filtroData.replace(/j\.data/g, 'jg2.data')}
      ) >= ${minimoJogos}
      ORDER BY percentagem_vitorias DESC
    `;    console.log('🔍 Query de duplas com mínimo de jogos:', minimoJogos);
    
    db.query(queryDuplas, [], (errDuplas, duplasResult) => {
      if (errDuplas) {
        console.log('❌ [DUPLAS ERROR]:', errDuplas.message);
        console.log('Stack:', errDuplas.stack);
      }
      console.log('🔍 [DUPLAS DEBUG] Erro?', errDuplas ? errDuplas.message : 'Nenhum');
      console.log('🔍 [DUPLAS DEBUG] Tipo de duplasResult:', typeof duplasResult);
      console.log('🔍 [DUPLAS DEBUG] É array?', Array.isArray(duplasResult));
      console.log('🔍 [DUPLAS DEBUG] duplasResult:', JSON.stringify(duplasResult).substring(0, 200));
      console.log('🔍 [DUPLAS DEBUG] Resultados:', duplasResult ? duplasResult.length : 0);
      
      // Normalizar resultado (PostgreSQL retorna objeto diferente)
      const duplas = Array.isArray(duplasResult) ? duplasResult : (duplasResult?.rows || []);
      console.log('🔍 [DUPLAS DEBUG] Após normalização:', duplas.length);
      
      if (duplas && duplas.length > 0) {
        console.log('🔍 [DUPLAS DEBUG] Primeira dupla:', duplas[0]);
      }        let duplasProcessadas = null;
        if (!errDuplas && duplas && duplas.length > 0) {
        console.log('✅ [DUPLAS DEBUG] A processar', duplas.length, 'duplas');
        
        // Filtrar duplas com pelo menos 3 jogos juntos (para % vitórias)
        const duplasComMinimo3Jogos = duplas.filter(d => d.jogos_juntos >= 3);
        
        // TOP 3 - Melhor % de vitórias (mínimo 3 jogos)
        const top3MelhorVitorias = [...duplasComMinimo3Jogos]
          .sort((a, b) => b.percentagem_vitorias - a.percentagem_vitorias)
          .slice(0, 3);
        
        // TOP 3 - Pior % de vitórias (mínimo 3 jogos)
        const top3PiorVitorias = [...duplasComMinimo3Jogos]
          .sort((a, b) => a.percentagem_vitorias - b.percentagem_vitorias)
          .slice(0, 3);
        
        // TOP 3 - Mais jogos juntos (sem mínimo)
        const top3MaisJogos = [...duplas]
          .sort((a, b) => b.jogos_juntos - a.jogos_juntos)
          .slice(0, 3);
        
        // TOP 3 - Menos jogos juntos (sem mínimo)
        const top3MenosJogos = [...duplas]
          .sort((a, b) => a.jogos_juntos - b.jogos_juntos)
          .slice(0, 3);
        
        duplasProcessadas = {
          melhorVitorias: top3MelhorVitorias,
          piorVitorias: top3PiorVitorias,
          maisJogos: top3MaisJogos,
          menosJogos: top3MenosJogos
        };console.log('📊 [DUPLAS DEBUG] Objeto criado:');
        console.log('   melhorVitorias:', top3MelhorVitorias.length);
        console.log('   piorVitorias:', top3PiorVitorias.length);
        console.log('   maisJogos:', top3MaisJogos.length);
        console.log('   menosJogos:', top3MenosJogos.length);
      } else {
        console.log('❌ [DUPLAS DEBUG] Nenhuma dupla processada - condição falhou');
        console.log('   errDuplas?', !!errDuplas);
        console.log('   duplas existe?', !!duplas);
        console.log('   duplas.length:', duplas ? duplas.length : 'N/A');
      }// Buscar estatísticas do ano completo se estiver filtrado por mês
    if (mesSelecionado) {
      db.query(queryEstatisticasAno, [], (errAno, estatisticasAno) => {
        const statsAnoProcessadas = (estatisticasAno || []).map(stat => ({
          ...stat,
          pontos: 0,
          diferenca_golos: 0
        }));
        const curiosidades = gerarCuriosidades ? gerarCuriosidades(estatisticasOrdenadas, anoSelecionado, mesSelecionado, statsAnoProcessadas) : [];
        console.log('🎯 [RENDER] Renderizando com mês selecionado, duplas:', duplasProcessadas ? 'SIM' : 'NÃO');
        renderView(res, req, estatisticasOrdenadas, curiosidades, duplasProcessadas, anoSelecionado, mesSelecionado, ordenacaoSelecionada, totalJogos, minimoJogos);
      });
    } else {
      const curiosidades = gerarCuriosidades ? gerarCuriosidades(estatisticasOrdenadas, anoSelecionado, mesSelecionado) : [];
      console.log('🎯 [RENDER] Renderizando sem mês, duplas:', duplasProcessadas ? 'SIM' : 'NÃO');
      console.log('   Duplas object:', JSON.stringify(duplasProcessadas ? Object.keys(duplasProcessadas) : null));
      renderView(res, req, estatisticasOrdenadas, curiosidades, duplasProcessadas, anoSelecionado, mesSelecionado, ordenacaoSelecionada, totalJogos, minimoJogos);
    }
    });  });
  });
});

module.exports = router;