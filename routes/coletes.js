const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireAdmin, optionalAuth } = require('../middleware/auth');

router.get('/coletes', optionalAuth, (req, res) => {
  console.log('=== ROTA /coletes CHAMADA ===');

  db.query("ALTER TABLE jogadores ADD COLUMN suspenso INTEGER DEFAULT 0", (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error('Erro ao adicionar coluna suspenso:', err);
    } else {
      console.log('Coluna suspenso verificada/adicionada');
    }    db.query(`
      SELECT 
        j.id,
        j.nome,
        COALESCE(j.suspenso, 0) as suspenso,
        COUNT(c.id) as vezes_levou,
        MAX(c.data_levou) as ultima_vez,
        conv.posicao,
        conv.tipo
      FROM jogadores j
      LEFT JOIN convocatoria conv ON j.id = conv.jogador_id
      LEFT JOIN coletes c ON j.id = c.jogador_id
      WHERE COALESCE(j.suspenso, 0) = 0 AND conv.id IS NOT NULL
      GROUP BY j.id, j.nome, j.suspenso, conv.posicao, conv.tipo
      ORDER BY 
        CASE WHEN conv.tipo = 'convocado' THEN 0 ELSE 1 END,
        vezes_levou ASC, 
        ultima_vez ASC NULLS FIRST, 
        conv.posicao ASC
    `, [], (err, estatisticas) => {
      if (err) {
        console.error('Erro SQL na consulta de estatísticas:', err.message);
        return res.status(500).send(`Erro ao buscar dados: ${err.message}`);
      }

      console.log('Estatísticas encontradas:', estatisticas);      db.query(`
        SELECT c.*, j.nome as jogador_nome, c.data_levou
        FROM coletes c
        JOIN jogadores j ON c.jogador_id = j.id
        WHERE c.data_devolveu IS NULL
        ORDER BY c.data_levou DESC
        LIMIT 1
      `, [], (err, coletesActuaisResult) => {
        if (err) {
          console.error('Erro ao buscar coletes actuais:', err);
        }

        // Extrair o primeiro resultado (se existir)
        const coletesActuais = coletesActuaisResult && coletesActuaisResult.length > 0 
          ? coletesActuaisResult[0] 
          : null;

        console.log('Coletes actuais:', coletesActuais);

        let proximoConvocado = null;
        if (estatisticas.length > 0) {
          if (coletesActuais) {
            proximoConvocado = estatisticas.find(e => e.id !== coletesActuais.jogador_id);
          } else {
            proximoConvocado = estatisticas[0];
          }
        }console.log('Próximo convocado:', proximoConvocado);
        res.render('coletes', {
          user: req.session.user || null,
          activePage: 'coletes',
          estatisticas: estatisticas || [],
          coletesActuais: coletesActuais || null,
          proximoConvocado: proximoConvocado || null
        });
      });
    });
  });
});

router.post('/coletes/atribuir', requireAdmin, (req, res) => {
  const { jogador_id } = req.body;
  const dataHoje = new Date().toISOString().split('T')[0];

  db.query(`
    UPDATE coletes 
    SET data_devolveu = ? 
    WHERE data_devolveu IS NULL
  `, [dataHoje], (err) => {
    if (err) {
      console.error('Erro ao marcar devolução:', err);
      return res.status(500).send('Erro ao actualizar dados');
    }

    db.query(`
      INSERT INTO coletes (jogador_id, data_levou) 
      VALUES (?, ?)
    `, [jogador_id, dataHoje], (err) => {
      if (err) {
        console.error('Erro ao atribuir coletes:', err);
        return res.status(500).send('Erro ao atribuir coletes');
      }      res.redirect('/coletes');
    });
  });
});

// Rota para devolver coletes (marca data_devolveu)
router.post('/coletes/devolver', requireAdmin, (req, res) => {
  const dataHoje = new Date().toISOString().split('T')[0];

  db.query(`
    UPDATE coletes 
    SET data_devolveu = ? 
    WHERE data_devolveu IS NULL
  `, [dataHoje], (err) => {
    if (err) {
      console.error('❌ Erro ao marcar devolução:', err);
      return res.status(500).send('Erro ao devolver coletes');
    }

    console.log('✅ Coletes devolvidos com sucesso');
    res.redirect('/coletes');
  });
});

// Rota para confirmar que alguém levou os coletes (com opção de escolher)
router.post('/coletes/confirmar', requireAdmin, (req, res) => {
  const { jogador_id } = req.body;
  const dataHoje = new Date().toISOString().split('T')[0];

  if (!jogador_id) {
    return res.status(400).send('Jogador não selecionado');
  }

  db.query(`
    INSERT INTO coletes (jogador_id, data_levou, data_devolveu) 
    VALUES (?, ?, NULL)
  `, [jogador_id, dataHoje], (err) => {
    if (err) {
      console.error('❌ Erro ao confirmar que levou coletes:', err);
      return res.status(500).send('Erro ao confirmar');
    }

    console.log('✅ Confirmado que jogador', jogador_id, 'levou os coletes');
    res.redirect('/coletes');
  });
});

module.exports = router;