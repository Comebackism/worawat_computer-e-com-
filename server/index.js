'use strict';

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const {
  db,
  init,
  persist,
  close,
  hashPassword,
  verifyPassword,
  publicUser,
  normalizeProduct,
  nextId,
} = require('./data/store');
const {
  COOKIE_NAME,
  issueSession,
  readSession,
  parseCookies,
  sessionCookie,
  clearCookie,
  requireAuth,
  requireAdmin,
  rateLimit,
} = require('./auth');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const TAX_RATE = 0.07;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// Public OAuth client ID (not a secret). Override it with GOOGLE_CLIENT_ID to match
// VITE_GOOGLE_CLIENT_ID when the app points at your own Google Cloud project.
const GOOGLE_CLIENT_ID = String(
  process.env.GOOGLE_CLIENT_ID ||
    '418023364772-mdn0alhu6g5dlqbtarhqfp93jvi5robt.apps.googleusercontent.com',
).trim();
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ORDER_ID_PATTERN = /^ORD-\d{4}-(\d+)$/;

// Origins allowed to call the API with credentials. Same-origin deployments
// (the documented Render setup) need nothing here; only add this when the
// storefront lives on a different host.
//
// In development Vite proxies /api and rewrites the Host header to the API's
// own port, so the browser's origin (5173/4173) no longer matches Host: the dev
// origins are allowlisted explicitly.
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:4173',
  'http://127.0.0.1:4173',
];
const ALLOWED_ORIGINS = [
  ...String(process.env.CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  ...(IS_PRODUCTION ? [] : DEV_ORIGINS),
];

// Behind a reverse proxy the real client IP arrives in X-Forwarded-For; without
// this the rate limiter would count every caller as the same proxy address.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// -------------------------------------------------------------- harden shell

app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
  res.set('Cross-Origin-Opener-Policy', 'same-origin');
  if (IS_PRODUCTION) {
    res.set('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    res.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        "object-src 'none'",
        "img-src 'self' data:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self'",
        "font-src 'self' data:",
        "connect-src 'self'",
      ].join('; '),
    );
  }
  next();
});

app.use(
  cors({
    // Never reflect an arbitrary origin: only the configured allowlist, and no
    // header at all otherwise (browsers then block the cross-site read).
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      return callback(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
  }),
);

app.use(express.json({ limit: '256kb' }));

// Every host name this request could legitimately have been addressed to: our
// own Host header, plus whatever a proxy in front of us recorded there. A
// storefront hosted on another origin (Vercel) reaches the API through a
// rewrite, so the browser's Origin is that storefront's host while Host is this
// service's.
//
// Trusting X-Forwarded-Host here is safe for CSRF purposes: a browser cannot set
// it on a cross-site request, and a forged one is useless without the victim's
// cookie.
function hostOf(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  try {
    return new URL(raw.includes('://') ? raw : `http://${raw}`).host;
  } catch {
    return '';
  }
}

function requestHosts(req) {
  const hosts = new Set();
  for (const value of [req.headers.host, ...String(req.headers['x-forwarded-host'] || '').split(',')]) {
    const host = hostOf(value);
    if (host) hosts.add(host);
  }
  return hosts;
}

// Defense-in-depth CSRF guard for state-changing requests. Browsers send an
// Origin header on cross-site writes; only same-origin (or allowlisted) writes
// proceed. Non-browser clients without an Origin still work.
app.use((req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') return next();
  const origin = req.headers.origin;
  if (!origin) return next();
  const originHost = hostOf(origin);
  if (originHost && requestHosts(req).has(originHost)) return next();
  if (ALLOWED_ORIGINS.includes(origin)) return next();
  return res.status(403).json({ message: 'Cross-site request blocked' });
});

// ---------------------------------------------------------------- validation

const clean = (value, max = 200) => String(value ?? '').trim().slice(0, max);
const round = (n) => Math.round(n * 100) / 100;
const email = (value) => String(value || '').trim().toLowerCase();
const findProduct = (id) => db.products.find((p) => p.id === Number(id));
const findOrder = (id) => db.orders.find((o) => o.id === String(id));

function nextOrderId() {
  const year = new Date().getFullYear();
  const highest = db.orders.reduce((max, order) => {
    const match = ORDER_ID_PATTERN.exec(order.id || '');
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `ORD-${year}-${String(highest + 1).padStart(3, '0')}`;
}

function upsertCustomer({ name, email: mail, amount = 0 }) {
  const address = email(mail);
  if (!address) return;
  let customer = db.customers.find((c) => email(c.email) === address);
  if (!customer) {
    customer = {
      id: nextId(db.customers),
      name: name || address.split('@')[0],
      email: address,
      date: new Date().toISOString().split('T')[0],
      spent: 0,
    };
    db.customers.unshift(customer);
  }
  if (name) customer.name = name;
  customer.spent = round(Number(customer.spent || 0) + Number(amount || 0));
}

// Keeps the customer list's lifetime spend in step with order changes.
function adjustCustomerSpend(mail, delta) {
  const address = email(mail);
  if (!address) return;
  const customer = db.customers.find((c) => email(c.email) === address);
  if (!customer) return;
  customer.spent = Math.max(0, round(Number(customer.spent || 0) + Number(delta || 0)));
}

// -------------------------------------------------------------- session glue

// Reads the signed session cookie (or a Bearer token) once per request and
// resolves it to the current user record.
app.use((req, res, next) => {
  const cookies = parseCookies(req.headers.cookie);
  const header = String(req.headers.authorization || '');
  const bearer = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const claims = readSession(bearer || cookies[COOKIE_NAME] || '');
  req.user = claims ? db.users.find((u) => Number(u.id) === Number(claims.sub)) || null : null;
  next();
});

function startSession(res, user) {
  res.set('Set-Cookie', sessionCookie(issueSession(user)));
  return res.json({ user: publicUser(user) });
}

// ---------------------------------------------------------------- catalogue

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', products: db.products.length, orders: db.orders.length, uptime: process.uptime() });
});

app.get('/api/meta', (req, res) => {
  const unique = (values) => [...new Set(values)].sort((a, b) => a.localeCompare(b));
  res.json({
    categories: unique(db.products.map((p) => p.category)),
    brands: unique(db.products.map((p) => p.brand)),
    priceRange: {
      min: Math.min(...db.products.map((p) => p.price), 0),
      max: Math.max(...db.products.map((p) => p.price), 0),
    },
  });
});

app.get('/api/products', (req, res) => {
  const { category, brand, q, sort, maxPrice } = req.query;
  let list = [...db.products];

  if (category) {
    const wanted = String(category).split(',').map((c) => c.toLowerCase());
    list = list.filter((p) => wanted.includes(p.category.toLowerCase()));
  }
  if (brand) {
    const wanted = String(brand).split(',').map((b) => b.toLowerCase());
    list = list.filter((p) => wanted.includes(p.brand.toLowerCase()));
  }
  if (q) {
    const needle = String(q).toLowerCase();
    list = list.filter((p) => `${p.name} ${p.brand} ${p.category}`.toLowerCase().includes(needle));
  }
  if (maxPrice) list = list.filter((p) => p.price <= Number(maxPrice));

  if (sort === 'lowToHigh') list.sort((a, b) => a.price - b.price);
  if (sort === 'highToLow') list.sort((a, b) => b.price - a.price);

  res.json(list);
});

app.get('/api/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  res.json(product);
});

app.post('/api/products', requireAdmin, (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.category || body.price == null) {
    return res.status(400).json({ message: 'Name, category and price are required' });
  }
  const product = normalizeProduct(
    { ...body, id: nextId(db.products), stock: body.stock ?? 0, image: body.image || '/images/storage.png' },
    nextId(db.products),
  );
  db.products.unshift(product);
  persist();
  res.status(201).json(product);
});

app.put('/api/products/:id', requireAdmin, (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  Object.assign(product, normalizeProduct({ ...product, ...req.body, id: product.id }, product.id));
  persist();
  res.json(product);
});

app.delete('/api/products/:id', requireAdmin, (req, res) => {
  const index = db.products.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  db.products.splice(index, 1);
  persist();
  res.json({ message: 'Product deleted' });
});

// ------------------------------------------------------------------- orders

app.get('/api/orders', requireAuth, (req, res) => {
  const { email: customerEmail, status } = req.query;
  let list = [...db.orders];

  // Customers only ever see their own orders; the query string cannot widen that.
  if (req.user.role === 'admin') {
    if (customerEmail) list = list.filter((o) => email(o.customerEmail) === email(customerEmail));
  } else {
    list = list.filter((o) => email(o.customerEmail) === email(req.user.email));
  }
  if (status) list = list.filter((o) => o.status === status);
  res.json(list);
});

app.get('/api/orders/:id', requireAuth, (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (req.user.role !== 'admin' && email(order.customerEmail) !== email(req.user.email)) {
    return res.status(403).json({ message: 'You do not have access to this order' });
  }
  res.json(order);
});

app.post('/api/orders', requireAuth, (req, res) => {
  const body = req.body || {};
  const incoming = Array.isArray(body.items) ? body.items.slice(0, 100) : [];
  if (incoming.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  const items = [];
  const shortages = [];

  for (const raw of incoming) {
    const product = raw.productId != null
      ? findProduct(raw.productId)
      : db.products.find((p) => p.name === clean(raw.name, 200));
    if (!product) {
      return res.status(400).json({ message: 'One of the items in your cart is no longer available' });
    }

    const quantity = Math.min(Math.max(1, Math.floor(Number(raw.quantity) || 1)), 999);
    if (product.stock < quantity) {
      shortages.push(`${product.name} (left ${product.stock})`);
      continue;
    }

    // Price and stock are read from the catalogue, never from the request, so a
    // tampered cart cannot buy a GPU for ฿1.
    items.push({ productId: product.id, name: product.name, price: product.price, quantity });
  }

  if (shortages.length > 0) {
    return res.status(409).json({ message: `Not enough stock for: ${shortages.join(', ')}` });
  }

  // Stock is only touched once every line is known to be available.
  for (const item of items) {
    const product = findProduct(item.productId);
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
  }

  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const tax = round(subtotal * TAX_RATE);
  const shipping = 0;
  const paymentMethod = body.paymentMethod === 'qr' ? 'qr' : 'credit';

  const order = {
    id: nextOrderId(),
    date: new Date().toISOString().split('T')[0],
    // The buyer is the signed-in user, not whatever the request claims.
    customerEmail: email(req.user.email),
    customerName: clean(body.customerName, 100) || req.user.name || 'Guest',
    address: clean(body.address, 200),
    city: clean(body.city, 100),
    postalCode: clean(body.postalCode, 20),
    paymentMethod,
    paymentRef: clean(body.paymentRef, 40),
    // Payment state is decided by the server; a client cannot mark itself paid.
    paymentStatus: paymentMethod === 'qr' ? 'unpaid' : 'paid',
    status: 'Processing',
    subtotal,
    tax,
    shipping,
    total: round(subtotal + tax + shipping),
    items,
  };

  db.orders.unshift(order);
  upsertCustomer({ name: order.customerName, email: order.customerEmail, amount: order.total });
  persist();
  res.status(201).json(order);
});

app.put('/api/orders/:id', requireAdmin, (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
  const nextStatus = req.body?.status;
  if (nextStatus != null && !allowedStatuses.includes(nextStatus)) {
    return res.status(400).json({ message: 'Unknown order status' });
  }
  const cancelled = nextStatus === 'Cancelled' && order.status !== 'Cancelled';

  if (nextStatus) order.status = nextStatus;

  // Cancelling puts the reserved units back on the shelf and reverses the
  // lifetime-spend figure the customer list shows.
  if (cancelled) {
    for (const item of order.items) {
      const product = item.productId ? findProduct(item.productId) : db.products.find((p) => p.name === item.name);
      if (product) product.stock += item.quantity;
    }
    if (req.body?.refund !== false) {
      adjustCustomerSpend(order.customerEmail, -order.total);
    }
  }

  persist();
  res.json(order);
});

app.delete('/api/orders/:id', requireAdmin, (req, res) => {
  const index = db.orders.findIndex((o) => o.id === String(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Order not found' });
  const [removed] = db.orders.splice(index, 1);
  if (removed.status !== 'Cancelled') adjustCustomerSpend(removed.customerEmail, -removed.total);
  persist();
  res.json({ message: 'Order deleted' });
});

// ---------------------------------------------------------------- customers

app.get('/api/customers', requireAdmin, (req, res) => {
  res.json(db.customers);
});

app.post('/api/customers', requireAdmin, (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  const customer = {
    id: nextId(db.customers),
    name: clean(body.name, 100),
    email: email(body.email),
    date: clean(body.date, 20) || new Date().toISOString().split('T')[0],
    spent: round(Number(body.spent) || 0),
  };
  db.customers.unshift(customer);
  persist();
  res.status(201).json(customer);
});

app.put('/api/customers/:id', requireAdmin, (req, res) => {
  const customer = db.customers.find((c) => c.id === Number(req.params.id));
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  const body = req.body || {};
  Object.assign(customer, {
    name: body.name != null ? clean(body.name, 100) : customer.name,
    email: body.email != null ? email(body.email) : customer.email,
    date: body.date != null ? clean(body.date, 20) : customer.date,
    spent: body.spent != null ? round(Number(body.spent) || 0) : customer.spent,
  });
  persist();
  res.json(customer);
});

app.delete('/api/customers/:id', requireAdmin, (req, res) => {
  const index = db.customers.findIndex((c) => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Customer not found' });
  db.customers.splice(index, 1);
  persist();
  res.json({ message: 'Customer deleted' });
});

// ------------------------------------------------------------------ account

const AUTH_RATE_LIMIT = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.post('/api/logout', (req, res) => {
  res.set('Set-Cookie', clearCookie());
  res.json({ message: 'Signed out' });
});

app.post('/api/login', AUTH_RATE_LIMIT, (req, res) => {
  const { email: rawEmail, password } = req.body || {};
  const user = db.users.find((u) => email(u.email) === email(rawEmail));
  if (!user || !password || !verifyPassword(password, user)) {
    // One message for "no such account", "wrong password" and "Google-only
    // account" alike, so the endpoint cannot be used to enumerate users.
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  startSession(res, user);
});

// Google Identity Services hands the browser a signed ID token (the "credential").
// Google's tokeninfo endpoint validates the signature and expiry for us, so no
// extra dependency is needed; we only have to check the token belongs to this app.
app.post('/api/google-login', AUTH_RATE_LIMIT, async (req, res) => {
  const credential = String(req.body?.credential || '').trim();
  if (!credential) {
    return res.status(400).json({ message: 'Missing Google credential' });
  }

  let profile;
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    if (!response.ok) {
      return res.status(401).json({ message: 'Google sign-in failed. Please try again.' });
    }
    profile = await response.json();
  } catch {
    return res.status(502).json({ message: 'Could not reach Google to verify the sign-in. Please try again.' });
  }

  if (profile.aud !== GOOGLE_CLIENT_ID) {
    return res.status(401).json({ message: 'This Google sign-in was issued for a different app' });
  }
  if (profile.email_verified !== 'true' || !profile.email) {
    return res.status(401).json({ message: 'Your Google email address is not verified' });
  }
  if (Number(profile.exp) * 1000 < Date.now()) {
    return res.status(401).json({ message: 'Google sign-in expired. Please try again.' });
  }

  const address = email(profile.email);
  let user = db.users.find((u) => email(u.email) === address);

  if (!user) {
    user = {
      id: nextId(db.users),
      name: clean(profile.name, 100) || address.split('@')[0],
      email: address,
      phone: '',
      dob: '',
      role: 'customer',
      provider: 'google',
      picture: clean(profile.picture, 500),
    };
    db.users.push(user);
    upsertCustomer({ name: user.name, email: user.email, amount: 0 });
    persist();
  }

  startSession(res, user);
});

app.post('/api/register', AUTH_RATE_LIMIT, (req, res) => {
  const { firstName, lastName, email: rawEmail, password, phone, dob } = req.body || {};

  if (!firstName || !lastName || !rawEmail || !password) {
    return res.status(400).json({ message: 'Please fill in every required field' });
  }
  if (!EMAIL_PATTERN.test(String(rawEmail).trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  if (String(password).length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }
  const existingUser = db.users.find((u) => email(u.email) === email(rawEmail));
  if (existingUser) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const user = {
    id: nextId(db.users),
    name: `${clean(firstName, 60)} ${clean(lastName, 60)}`.trim(),
    email: email(rawEmail),
    phone: clean(phone, 40),
    dob: clean(dob, 20),
    role: 'customer',
    ...hashPassword(password),
  };

  db.users.push(user);
  upsertCustomer({ name: user.name, email: user.email, amount: 0 });
  persist();
  res.status(201).json({ user: publicUser(user) });
});

// -------------------------------------------------------------------- stats

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

app.get('/api/stats', requireAdmin, (req, res) => {
  const monthlyMap = new Map();

  for (const order of db.orders) {
    if (order.status === 'Cancelled') continue;
    const date = new Date(order.date);
    if (Number.isNaN(date.getTime())) continue;
    const key = `${date.getFullYear()}-${String(date.getMonth()).padStart(2, '0')}`;
    const entry = monthlyMap.get(key) || { name: MONTH_NAMES[date.getMonth()], sales: 0, orders: 0 };
    entry.sales = round(entry.sales + order.total);
    entry.orders += 1;
    monthlyMap.set(key, entry);
  }

  res.json({
    totalSales: round(db.orders.filter((o) => o.status !== 'Cancelled').reduce((sum, o) => sum + o.total, 0)),
    totalOrders: db.orders.length,
    totalCustomers: db.customers.length,
    activeProducts: db.products.length,
    lowStock: db.products.filter((p) => p.stock <= 5).length,
    monthly: [...monthlyMap.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, value]) => value),
  });
});

// ------------------------------------------------------- static + fallbacks

if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.use((req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

app.use('/api', (req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Errors are logged with full detail but never echoed to the client.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  if (err?.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body is not valid JSON' });
  }
  const status = Number(err?.status || err?.statusCode) || 500;
  if (status >= 500) return res.status(500).json({ message: 'Unexpected server error' });
  return res.status(status).json({ message: 'Request could not be processed' });
});

// Rotates/creates the admin account from the environment so a deployed instance
// never keeps the demo password baked into the seed data.
function syncAdminAccount() {
  const adminEmail = email(process.env.ADMIN_EMAIL || 'admin@worawat.com');
  const envPassword = String(process.env.ADMIN_PASSWORD || '').trim();
  let admin = db.users.find((u) => u.role === 'admin');

  if (!admin) {
    if (!envPassword) {
      console.warn('No admin account exists. Set ADMIN_EMAIL and ADMIN_PASSWORD to create one.');
      return;
    }
    admin = { id: nextId(db.users), name: 'Worawat Admin', email: adminEmail, phone: '', dob: '', role: 'admin' };
    db.users.push(admin);
  }

  if (envPassword) {
    Object.assign(admin, { email: adminEmail, ...hashPassword(envPassword) });
    persist();
    console.log(`Admin account ready: ${admin.email}`);
  } else {
    console.warn('ADMIN_PASSWORD is not set: the existing admin password is unchanged. Set it to rotate the credential.');
  }
}

async function main() {
  const storage = await init();
  console.log(`Data storage: ${storage.backend}`);
  syncAdminAccount();

  app.listen(PORT, () => {
    console.log(`Worawat_computer API running on http://localhost:${PORT}`);
    if (fs.existsSync(DIST_DIR)) console.log(`Serving production build from ${DIST_DIR}`);
  });
}

// Render sends SIGTERM before replacing an instance. Letting the pending write
// finish first means the last order of the old release is not lost.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    close().finally(() => process.exit(0));
  });
}

main().catch((err) => {
  console.error('Could not start the API:', err);
  process.exit(1);
});