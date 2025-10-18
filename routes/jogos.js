const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAuth, requireAdmin } = require('../middleware/auth');

// Rota para listar jogos (usada em /jogos)
router.get('/', requireAuth, (req, res) => {
  console.log('📋 Buscando lista de jogos...');
  
  db.query('SELECT * FROM jogos ORDER BY data DESC', [], (err, jogos) => {
    if (err) {
      console.error('❌ Erro ao buscar jogos:', err);
      return res.render('index', { jogos: [], user: req.session.user });
    }

    console.log(`✅ Jogos encontrados: ${jogos?.length || 0}`);

    if (!jogos || jogos.length === 0) {
      console.log('⚠️  Nenhum jogo encontrado');
      return res.render('index', { jogos: [], user: req.session.user });
    }

    const jogosComJogadores = [];
    let processedCount = 0;

    jogos.forEach((jogo) => {
      db.query(
        `SELECT j.id, j.nome, p.equipa
         FROM presencas p
         JOIN jogadores j ON p.jogador_id = j.id
         WHERE p.jogo_id = ?
         ORDER BY p.equipa, j.nome`,
        [jogo.id],
        (err, jogadores) => {
          if (!err && jogadores) {
            let rows = [];
            if (Array.isArray(jogadores)) rows = jogadores;
            else if (jogadores && Array.isArray(jogadores.rows)) rows = jogadores.rows;
            else if (jogadores && jogadores[0]) rows = jogadores;

            const seen = new Set();
            const clean = [];
            for (const r of rows) {
              const pid = r.id || r.ID || r.Id;
              const nome = r.nome || r.NOME || r.Nome || '';
              const equipa = Number(r.equipa);
              if (!pid) continue;
              const key = `${pid}-${equipa}`;
              if (seen.has(key)) continue;
              seen.add(key);
              clean.push({ id: Number(pid), nome, equipa });
            }

            jogo.jogadores_equipa1 = clean.filter(j => j.equipa === 1);
            jogo.jogadores_equipa2 = clean.filter(j => j.equipa === 2);
          } else {
            jogo.jogadores_equipa1 = [];
            jogo.jogadores_equipa2 = [];
          }

          jogosComJogadores.push(jogo);
          processedCount++;

          if (processedCount === jogos.length) {
            jogosComJogadores.sort((a, b) => new Date(b.data) - new Date(a.data));
            res.render('index', { jogos: jogosComJogadores, user: req.session.user });
          }
        }
      );
    });
  });
});

// Formulário para novo jogo
router.get('/novo', requireAdmin, (req, res) => {
  db.query('SELECT * FROM jogadores WHERE suspenso = 0 ORDER BY nome', [], (err, jogadores) => {
    res.render('novo_jogo', { jogadores: jogadores || [], user: req.session.user });
  });
});

// Inserir novo jogo (via form)
router.post('/', requireAdmin, async (req, res) => {
  const { data, equipa1, equipa2, equipa1_golos, equipa2_golos } = req.body;

  console.log('📝 Registando novo jogo:', { data, equipa1_golos, equipa2_golos });
  console.log('👥 Equipa 1 raw:', equipa1);
  console.log('👥 Equipa 2 raw:', equipa2);

  db.query(
    'INSERT INTO jogos (data, equipa1_golos, equipa2_golos) VALUES (?, ?, ?) RETURNING id',
    [data, equipa1_golos, equipa2_golos],
    function (err, result) {
      if (err) {
        console.error('❌ Erro ao inserir jogo:', err);
        return res.status(500).send('Erro ao registar jogo');
      }

      // PostgreSQL returns array with RETURNING, SQLite uses this.lastID
      const jogoId = result?.rows?.[0]?.id || result?.[0]?.id || this?.lastID || result?.lastID;
      console.log('✅ Jogo inserido com ID:', jogoId);

      if (!jogoId) {
        console.error('❌ Não foi possível obter ID do jogo inserido');
        return res.status(500).send('Erro ao obter ID do jogo');
      }

      const equipa1Arr = Array.isArray(equipa1) ? equipa1 : (equipa1 ? [equipa1] : []);
      const equipa2Arr = Array.isArray(equipa2) ? equipa2 : (equipa2 ? [equipa2] : []);

      console.log('👥 Equipa 1 array:', equipa1Arr);
      console.log('👥 Equipa 2 array:', equipa2Arr);

      let presencasInseridas = 0;
      const totalPresencas = equipa1Arr.length + equipa2Arr.length;

      if (totalPresencas === 0) {
        console.log('⚠️  Nenhum jogador selecionado');
        return res.redirect('/jogos');
      }

      const checkComplete = () => {
        presencasInseridas++;
        if (presencasInseridas === totalPresencas) {
          console.log(`✅ Total de ${totalPresencas} presenças inseridas com sucesso`);
          res.redirect('/jogos');
        }
      };

      equipa1Arr.forEach((jogadorId) => {
        if (jogadorId) {
          console.log(`  ➕ Inserindo jogador ${jogadorId} na equipa 1 do jogo ${jogoId}`);
          db.query('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 1)', [jogoId, jogadorId], (err) => {
            if (err) {
              console.error(`❌ Erro ao inserir presença equipa1 (jogador ${jogadorId}):`, err);
            } else {
              console.log(`  ✓ Jogador ${jogadorId} inserido na equipa 1`);
            }
            checkComplete();
          });
        }
      });

      equipa2Arr.forEach((jogadorId) => {
        if (jogadorId) {
          console.log(`  ➕ Inserindo jogador ${jogadorId} na equipa 2 do jogo ${jogoId}`);
          db.query('INSERT INTO presencas (jogo_id, jogador_id, equipa) VALUES (?, ?, 2)', [jogoId, jogadorId], (err) => {
            if (err) {
              console.error(`❌ Erro ao inserir presença equipa2 (jogador ${jogadorId}):`, err);
            } else {
              console.log(`  ✓ Jogador ${jogadorId} inserido na equipa 2`);
            }
            checkComplete();
          });
        }
      });
    }
  );
});

// Detalhe de um jogo
router.get('/:id', requireAuth, (req, res) => {
  const jogoId = req.params.id;

  db.query('SELECT * FROM jogos WHERE id = ?', [jogoId], (err, jogo) => {
    if (err) {
      console.error('Erro na base de dados:', err);
      return res.status(500).send('Erro na base de dados');
    }

    if (!jogo) {
      return res.status(404).send('Jogo não encontrado');
    }

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

        // Normalize rows shape
        let rows = [];
        if (Array.isArray(jogadores)) rows = jogadores;
        else if (jogadores && Array.isArray(jogadores.rows)) rows = jogadores.rows;
        else if (jogadores && jogadores[0]) rows = jogadores;

        const equipa1 = rows ? rows.filter(j => Number(j.equipa) === 1) : [];
        const equipa2 = rows ? rows.filter(j => Number(j.equipa) === 2) : [];

        res.render('detalhe_jogo', { jogo, equipa1, equipa2, user: req.session.user });
      }
    );
  });
});

// Atualizar jogo
router.post('/:id/update', requireAdmin, (req, res) => {
  const jogoId = req.params.id;
  const { data, equipa1_golos, equipa2_golos } = req.body;

  if (!data || equipa1_golos === undefined || equipa2_golos === undefined) {
    return res.status(400).send('Dados incompletos');
  }

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

      res.redirect(`/jogos/${jogoId}`);
    }
  );
});

// Eliminar jogo
router.post('/:id/delete', requireAdmin, (req, res) => {
  const jogoId = req.params.id;

  db.query('DELETE FROM presencas WHERE jogo_id = ?', [jogoId], (err) => {
    if (err) {
      console.error('Erro ao eliminar presenças:', err);
      return res.status(500).send('Erro ao eliminar presenças do jogo');
    }

    db.query('DELETE FROM jogos WHERE id = ?', [jogoId], (err) => {
      if (err) {
        console.error('Erro ao eliminar jogo:', err);
        return res.status(500).send('Erro ao eliminar jogo');
      }

      res.redirect('/jogos');
    });
  });
});

// Atualizar observações
router.post('/:id/observacoes', requireAdmin, (req, res) => {
  const jogoId = req.params.id;
  const { observacoes } = req.body;

  console.log('📝 Atualizando observações do jogo:', jogoId, observacoes);

  db.query(
    'UPDATE jogos SET observacoes = ? WHERE id = ?',
    [observacoes || '', jogoId],
    function(err) {
      if (err) {
        console.error('Erro ao atualizar observações:', err);
        return res.status(500).send('Erro ao atualizar observações');
      }

      res.redirect('/jogos');
    }
  );
});

console.log('Módulo de rotas dos jogos carregado com sucesso');
module.exports = router;
