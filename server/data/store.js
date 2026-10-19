'use strict';

// Persistence for products, orders, customers and accounts.
//
// `init()` picks a backend once at start-up:
//   * DATABASE_URL set -> Postgres. The whole dataset is one JSONB document, so
//     every list keeps the exact shape the routes already read. Render's disks
//     are wiped on each deploy, a managed database is not.
//   * DATABASE_URL unset -> the local db.json file, which is what `npm run dev`
//     and the scripts in this folder use.
//
// Both backends keep the data in memory, so route handlers stay synchronous.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const seed = require('./seed');

const DB_FILE = path.join(__dirname, 'db.json');
const STATE_ID = 'main';
const UPSERT_STATE = `insert into app_state (id, data) values ($1, $2)
  on conflict (id) do update set data = excluded.data, updated_at = now()`;

const db = { products: [], orders: [], customers: [], users: [] };

let pool = null;
let writeQueue = Promise.resolve();

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

function hydrate(parsed) {
  const data = parsed || {};
  return {
    products: (data.products || []).map((p, idx) => normalizeProduct(p, idx + 1)),
    orders: (data.orders || []).map(normalizeOrder),
    customers: data.customers || [],
    users: data.users || [],
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

// --------------------------------------------------------------- file backend

function readFileDatabase() {
  try {
    return hydrate(JSON.parse(fs.readFileSync(DB_FILE, 'utf8')));
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

function writeFileDatabase() {
  try {
    const tmp = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db, null, 2), 'utf8');
    fs.renameSync(tmp, DB_FILE);
  } catch (err) {
    console.warn('Could not persist database:', err.message);
  }
}

// ----------------------------------------------------------- postgres backend

// Managed hosts disagree on whether they accept TLS on their private endpoint,
// so try the configured mode first and fall back to the other one.
function sslCandidates() {
  const requested = String(process.env.DATABASE_SSL || '').trim().toLowerCase();
  if (requested === 'true' || requested === 'require') return [{ rejectUnauthorized: false }];
  if (requested === 'false' || requested === 'disable') return [false];
  return [false, { rejectUnauthorized: false }];
}

async function connect(connectionString) {
  const { Pool } = require('pg');
  let lastError;

  for (const ssl of sslCandidates()) {
    const candidate = new Pool({ connectionString, ssl });
    try {
      await candidate.query('select 1');
      candidate.on('error', (err) => console.error('Postgres connection error:', err.message));
      return candidate;
    } catch (err) {
      lastError = err;
      await candidate.end().catch(() => {});
    }
  }

  throw lastError;
}

// ------------------------------------------------------------------ lifecycle

async function init() {
  const connectionString = String(process.env.DATABASE_URL || '').trim();

  if (!connectionString) {
    Object.assign(db, readFileDatabase());
    return { backend: 'file', file: DB_FILE };
  }

  pool = await connect(connectionString);
  await pool.query(`create table if not exists app_state (
    id text primary key,
    data jsonb not null,
    updated_at timestamptz not null default now()
  )`);

  const { rows } = await pool.query('select data from app_state where id = $1', [STATE_ID]);
  if (rows.length) {
    Object.assign(db, hydrate(rows[0].data));
  } else {
    Object.assign(db, freshDatabase());
    await pool.query(UPSERT_STATE, [STATE_ID, JSON.stringify(db)]);
    console.log('Seeded the Postgres database');
  }

  return { backend: 'postgres' };
}

// Fire-and-forget: route handlers call this synchronously after mutating `db`.
// Writes are chained so they land in the order they were requested, and the last
// one always carries the newest snapshot.
function persist() {
  if (!pool) {
    writeFileDatabase();
    return;
  }

  const snapshot = JSON.stringify(db);
  writeQueue = writeQueue
    .then(() => pool.query(UPSERT_STATE, [STATE_ID, snapshot]))
    .catch((err) => console.error('Could not persist to Postgres:', err.message));
}

async function close() {
  await writeQueue.catch(() => {});
  if (pool) await pool.end();
}

function nextId(list) {
  return list.length ? Math.max(...list.map((x) => Number(x.id) || 0)) + 1 : 1;
}

module.exports = {
  db,
  init,
  persist,
  close,
  hashPassword,
  verifyPassword,
  publicUser,
  normalizeProduct,
  nextId,
  DB_FILE,
};
