const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Persistent data directory — on Railway, mount a volume at /app/data
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'heartwood.db');
let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

const DEFAULT_CATEGORIES = [
  { slug: 'live-edge-slab', name: 'Live Edge Slabs', sort_order: 0 },
  { slug: 'dimensional-lumber', name: 'Dimensional Lumber', sort_order: 1 },
  { slug: 'mantel-beam', name: 'Mantels & Beams', sort_order: 2 },
  { slug: 'cookies-rounds', name: 'Cookies & Rounds', sort_order: 3 },
  { slug: 'charcuterie', name: 'Charcuterie / Cutting Boards', sort_order: 4 },
  { slug: 'custom-milling', name: 'Custom Milling', sort_order: 5 },
  { slug: 'other', name: 'Other', sort_order: 6 }
];

function initDatabase() {
  const database = getDb();
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  database.exec(schema);

  // Seed default categories if table is empty
  const count = database.prepare('SELECT COUNT(*) as cnt FROM categories').get();
  if (count.cnt === 0) {
    const stmt = database.prepare('INSERT INTO categories (slug, name, sort_order) VALUES (@slug, @name, @sort_order)');
    for (const cat of DEFAULT_CATEGORIES) {
      stmt.run(cat);
    }
  }
}

// ========== INVENTORY ==========

function getAllItems(category, inStockOnly) {
  const database = getDb();
  let sql = 'SELECT * FROM inventory';
  const conditions = [];
  const params = {};

  if (category) {
    conditions.push('category = @category');
    params.category = category;
  }
  if (inStockOnly) {
    conditions.push('in_stock = 1');
  }
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY created_at DESC';

  return database.prepare(sql).all(params);
}

function getItemById(id) {
  return getDb().prepare('SELECT * FROM inventory WHERE id = ?').get(id);
}

function createItem({ name, description, category, price, image_url, in_stock }) {
  const stmt = getDb().prepare(`
    INSERT INTO inventory (name, description, category, price, image_url, in_stock)
    VALUES (@name, @description, @category, @price, @image_url, @in_stock)
  `);
  const result = stmt.run({
    name,
    description: description || '',
    category: category || 'other',
    price: parseFloat(price) || 0,
    image_url: image_url || null,
    in_stock: in_stock ? 1 : 0
  });
  return getItemById(result.lastInsertRowid);
}

function updateItem(id, { name, description, category, price, image_url, in_stock }) {
  const stmt = getDb().prepare(`
    UPDATE inventory
    SET name = @name, description = @description, category = @category,
        price = @price, image_url = @image_url, in_stock = @in_stock,
        updated_at = datetime('now')
    WHERE id = @id
  `);
  stmt.run({
    id,
    name,
    description,
    category,
    price: parseFloat(price) || 0,
    image_url: image_url || null,
    in_stock: in_stock ? 1 : 0
  });
  return getItemById(id);
}

function deleteItem(id) {
  return getDb().prepare('DELETE FROM inventory WHERE id = ?').run(id);
}

// ========== CATEGORIES ==========

function getAllCategories() {
  return getDb().prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
}

function getCategoryById(id) {
  return getDb().prepare('SELECT * FROM categories WHERE id = ?').get(id);
}

function createCategory({ slug, name }) {
  const database = getDb();
  const maxOrder = database.prepare('SELECT COALESCE(MAX(sort_order), -1) as max_order FROM categories').get();
  const stmt = database.prepare('INSERT INTO categories (slug, name, sort_order) VALUES (@slug, @name, @sort_order)');
  const result = stmt.run({ slug, name, sort_order: maxOrder.max_order + 1 });
  return getCategoryById(result.lastInsertRowid);
}

function updateCategory(id, { slug, name }) {
  const stmt = getDb().prepare('UPDATE categories SET slug = @slug, name = @name WHERE id = @id');
  stmt.run({ id, slug, name });
  return getCategoryById(id);
}

function deleteCategory(id) {
  const cat = getCategoryById(id);
  if (!cat) return { error: 'Category not found' };

  // Check if any inventory items use this category
  const usage = getDb().prepare('SELECT COUNT(*) as cnt FROM inventory WHERE category = ?').get(cat.slug);
  if (usage.cnt > 0) {
    return { error: `Cannot delete: ${usage.cnt} inventory item(s) use this category` };
  }

  getDb().prepare('DELETE FROM categories WHERE id = ?').run(id);
  return { success: true };
}

module.exports = {
  initDatabase,
  getAllItems, getItemById, createItem, updateItem, deleteItem,
  getAllCategories, getCategoryById, createCategory, updateCategory, deleteCategory
};
