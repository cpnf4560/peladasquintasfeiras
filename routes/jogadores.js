const express = require('express');
const router = express.Router();
const { db } = require('../db');
const { requireAdmin } = require('../middleware/auth');

router.get('/', requireAdmin, (req, res) => {
  db.query('SELECT * FROM jogadores ORDER BY nome', [], (err, jogadores) => {
    res.render('jogadores', { jogadores: jogadores || [], user: req.session.user });
  });
});

router.post('/', requireAdmin, (req, res) => {
  const { nome } = req.body;
  if (!nome) return res.redirect('/jogadores');
  db.query('INSERT INTO jogadores (nome) VALUES (?)', [nome], () => res.redirect('/jogadores'));
});

router.post('/:id/delete', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM jogadores WHERE id = ?', [id], () => res.redirect('/jogadores'));
});

router.post('/:id/toggle-suspension', requireAdmin, (req, res) => {
  const { id } = req.params;
  db.query('UPDATE jogadores SET suspenso = CASE WHEN suspenso = 1 THEN 0 ELSE 1 END WHERE id = ?', [id], () => res.redirect('/jogadores'));
});

router.post('/:id/update', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { nome } = req.body;
  db.query('UPDATE jogadores SET nome = ? WHERE id = ?', [nome, id], () => res.json({ sucesso: true }));
});

module.exports = router;