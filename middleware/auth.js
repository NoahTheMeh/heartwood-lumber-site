function requireAuth(req, res, next) {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.redirect('/admin/login.html');
}

module.exports = { requireAuth };
