const express = require('express');
const router = express.Router();
const path = require('path');

// /admin — redirect to dashboard or login
router.get('/', (req, res) => {
  if (req.session && req.session.isAdmin) {
    return res.redirect('/admin/dashboard.html');
  }
  res.redirect('/admin/login.html');
});

// Protect dashboard — redirect to login if not authed
router.get('/dashboard.html', (req, res, next) => {
  if (!req.session || !req.session.isAdmin) {
    return res.redirect('/admin/login.html');
  }
  next();
});

module.exports = router;
