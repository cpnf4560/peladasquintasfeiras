const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { db } = require('../db');

// Login page
router.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    if (req.session.user.role === 'admin') return res.redirect('/');
    return res.redirect('/dashboard');
  }
  res.render('login', { error: null });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.render('login', { error: 'Por favor, preencha todos os campos' });

  db.query('SELECT * FROM users WHERE username = ?', [username], (err, result) => {
    if (err) {
      console.error('Erro na base de dados:', err);
      return res.render('login', { error: 'Erro interno do servidor' });
    }

    let rows = [];
    if (Array.isArray(result)) rows = result;
    else if (result && Array.isArray(result.rows)) rows = result.rows;
    else if (result && result[0]) rows = result;

    const user = rows.length > 0 ? rows[0] : null;
    if (!user) return res.render('login', { error: 'Utilizador não encontrado' });

    bcrypt.compare(password, user.password, (err, isMatch) => {
      if (err) return res.render('login', { error: 'Erro interno do servidor' });
      if (!isMatch) return res.render('login', { error: 'Password incorreta' });

      req.session.user = { id: user.id, username: user.username, role: user.role };
      req.session.save((err) => {
        if (err) console.error('Erro ao salvar sessão:', err);
        if (user.role === 'admin') return res.redirect('/');
        return res.redirect('/dashboard');
      });
    });
  });
});

router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) console.error('Erro ao fazer logout:', err);
    res.redirect('/login');
  });
});

module.exports = router;