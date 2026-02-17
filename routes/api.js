const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAuth } = require('../middleware/auth');
const db = require('../db/database');

// --- Multer config for image uploads ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e6) + path.extname(file.originalname);
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: function (req, file, cb) {
    const allowed = /\.(jpg|jpeg|png|webp|gif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (jpg, png, webp, gif) are allowed'));
    }
  }
});

// ========== PUBLIC ENDPOINTS ==========

// GET /api/inventory — list all items
router.get('/inventory', (req, res) => {
  const { category, in_stock } = req.query;
  const items = db.getAllItems(category || null, in_stock === 'true');
  res.json(items);
});

// GET /api/inventory/:id — single item
router.get('/inventory/:id', (req, res) => {
  const item = db.getItemById(req.params.id);
  if (!item) return res.status(404).json({ error: 'Item not found' });
  res.json(item);
});

// GET /api/categories — list all categories (public)
router.get('/categories', (req, res) => {
  res.json(db.getAllCategories());
});

// ========== AUTH ENDPOINTS ==========

// POST /api/admin/login
router.post('/admin/login', (req, res) => {
  const { password } = req.body;
  if (password === process.env.ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid password' });
  }
});

// POST /api/admin/logout
router.post('/admin/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

// GET /api/admin/session — check auth status
router.get('/admin/session', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.isAdmin) });
});

// ========== ADMIN CRUD ENDPOINTS ==========

// POST /api/inventory — create item
router.post('/inventory', requireAuth, upload.single('image'), (req, res) => {
  const { name, description, category, price, image_url, in_stock } = req.body;
  const finalImageUrl = req.file ? '/uploads/' + req.file.filename : (image_url || null);
  const item = db.createItem({
    name,
    description: description || '',
    category: category || 'other',
    price: parseFloat(price) || 0,
    image_url: finalImageUrl,
    in_stock: in_stock !== 'false' && in_stock !== '0'
  });
  res.status(201).json(item);
});

// PUT /api/inventory/:id — update item
router.put('/inventory/:id', requireAuth, upload.single('image'), (req, res) => {
  const existing = db.getItemById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const { name, description, category, price, image_url, in_stock } = req.body;
  let finalImageUrl = existing.image_url;

  if (req.file) {
    // New file uploaded — delete old if it was a local upload
    if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
      const oldPath = path.join(__dirname, '..', existing.image_url);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    finalImageUrl = '/uploads/' + req.file.filename;
  } else if (image_url !== undefined) {
    finalImageUrl = image_url || null;
  }

  const item = db.updateItem(req.params.id, {
    name: name || existing.name,
    description: description !== undefined ? description : existing.description,
    category: category || existing.category,
    price: price !== undefined ? parseFloat(price) : existing.price,
    image_url: finalImageUrl,
    in_stock: in_stock !== undefined ? (in_stock !== 'false' && in_stock !== '0') : !!existing.in_stock
  });
  res.json(item);
});

// DELETE /api/inventory/:id — delete item
router.delete('/inventory/:id', requireAuth, (req, res) => {
  const existing = db.getItemById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  // Clean up uploaded image file
  if (existing.image_url && existing.image_url.startsWith('/uploads/')) {
    const filePath = path.join(__dirname, '..', existing.image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  }

  db.deleteItem(req.params.id);
  res.json({ success: true });
});

// PATCH /api/inventory/:id/stock — toggle stock status
router.patch('/inventory/:id/stock', requireAuth, (req, res) => {
  const existing = db.getItemById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Item not found' });

  const item = db.updateItem(req.params.id, {
    name: existing.name,
    description: existing.description,
    category: existing.category,
    price: existing.price,
    image_url: existing.image_url,
    in_stock: !existing.in_stock
  });
  res.json(item);
});

// ========== CATEGORY ADMIN ENDPOINTS ==========

// POST /api/categories — create category
router.post('/categories', requireAuth, (req, res) => {
  const { slug, name } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'Slug and name are required' });
  try {
    const category = db.createCategory({ slug, name });
    res.status(201).json(category);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A category with that slug already exists' });
    }
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/categories/:id — update category
router.put('/categories/:id', requireAuth, (req, res) => {
  const existing = db.getCategoryById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Category not found' });
  const { slug, name } = req.body;
  if (!slug || !name) return res.status(400).json({ error: 'Slug and name are required' });
  try {
    const category = db.updateCategory(req.params.id, { slug, name });
    res.json(category);
  } catch (err) {
    if (err.message && err.message.includes('UNIQUE')) {
      return res.status(409).json({ error: 'A category with that slug already exists' });
    }
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/categories/:id — delete category
router.delete('/categories/:id', requireAuth, (req, res) => {
  const result = db.deleteCategory(req.params.id);
  if (result.error) {
    return res.status(409).json({ error: result.error });
  }
  res.json({ success: true });
});

module.exports = router;
