const path = require('path');
const { db } = require(path.join(__dirname, '..', 'db'));

function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

function requireAdmin(req, res, next) {
  if (req.session && req.session.user && req.session.user.role === 'admin') {
    return next();
  }
  return res.status(403).render('error', {
    message: 'Acesso negado. Apenas administradores podem aceder a esta página.',
    user: req.session ? req.session.user : null
  });
}

module.exports = { requireAuth, requireAdmin };