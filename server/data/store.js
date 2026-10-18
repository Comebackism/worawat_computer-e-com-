'use strict';

// Tiny JSON-file persistence layer so admin edits and new orders survive a
// server restart. Swap this module for a real database when you outgrow it.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const seed = require('./seed');

const DB_FILE = path.join(__dirname, 'db.json');

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  return { salt, passwordHash: crypto.scryptSync(String(password), salt, 32).toString('hex') };
}

function verifyPassword(password, user) {
  if (!user || !user.salt || !user.passwordHash) return false;
  const attempt = crypto.scryptSync(String(password), user.salt, 32).toString('hex');
  const a = Buffer.from(attempt, 'hex');
  const b = Buffer.from(user.passwordHash, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function publicUser(user) {
  if (!user) return null;
  const { salt: _salt, passwordHash: _passwordHash, password: _password, ...safe } = user;
  return safe;
}

// Products created through the admin UI (or an old db.json) may miss optional
// fields. Normalising here keeps the storefront from crashing on `specs`.
function normalizeProduct(product, fallbackId) {
  const specs = Array.isArray(product.specs)
    ? product.specs.filter(Boolean).map(String)
    : String(product.specs || '')
        .split(/\r?\n|,/)
        .map((s) => s.trim())
        .filter(Boolean);

  return {
    ...product,
    id: Number(product.id) || fallbackId,
    name: String(product.name || 'Untitled product').trim(),
    brand: String(product.brand || 'Other').trim(),
    category: String(product.category || 'Other').trim(),
    description: String(product.description || 'No description provided.'),
    image: String(product.image || '/images/storage.png'),
    memory: String(product.memory || 'N/A'),
    price: Number(product.price) || 0,
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : 0,
    specs,
  };
}

function normalizeOrder(order) {
  const items = Array.isArray(order.items) ? order.items : [];
  const subtotal = Number(order.subtotal) || items.reduce((s, i) => s + Number(i.price) * Number(i.quantity), 0);
  const tax = Number.isFinite(Number(order.tax)) ? Number(order.tax) : Math.round(subtotal * 0.07);
  return {
    ...order,
    id: String(order.id),
    date: order.date || new Date().toISOString().split('T')[0],
    customerEmail: String(order.customerEmail || order.customer || ''),
    customerName: String(order.customerName || 'Guest'),
    status: order.status || 'Pending',
    subtotal,
    tax,
    shipping: Number(order.shipping) || 0,
    total: Number(order.total) || subtotal + tax,
    items: items.map((i) => ({
      productId: i.productId != null ? Number(i.productId) : undefined,
      name: String(i.name || 'Item'),
      price: Number(i.price) || 0,
      quantity: Number(i.quantity) || 1,
    })),
  };
}

function freshDatabase() {
  return {
    products: seed.products.map((p, idx) => normalizeProduct(p, idx + 1)),
    orders: seed.orders.map(normalizeOrder),
    customers: seed.customers.map((c) => ({ ...c, spent: Number(c.spent) || 0 })),
    users: seed.users.map(({ password, ...user }) => ({ ...user, ...hashPassword(password) })),
  };
}

function loadDatabase() {
  try {
    const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    return {
      products: (parsed.products || []).map((p, idx) => normalizeProduct(p, idx + 1)),
      orders: (parsed.orders || []).map(normalizeOrder),
      customers: parsed.customers || [],
      users: parsed.users || [],
    };
  } catch {
    const fresh = freshDatabase();
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(fresh, null, 2), 'utf8');
      console.log(`Seeded database at ${DB_FILE}`);
    } catch (err) {
      console.warn('Could not write database file, running in memory:', err.message);
    }
    return fresh;
  }
}

const db = loadDatabase();

function persist() {
  try {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.warn('Could not persist database:', err.message);
  }
}

function nextId(list) {
  return list.length ? Math.max(...list.map((x) => Number(x.id) || 0)) + 1 : 1;
}

module.exports = { db, persist, hashPassword, verifyPassword, publicUser, normalizeProduct, nextId, DB_FILE };
