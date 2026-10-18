'use strict';

const path = require('node:path');
const fs = require('node:fs');
const express = require('express');
const cors = require('cors');
const {
  db,
  persist,
  hashPassword,
  verifyPassword,
  publicUser,
  normalizeProduct,
  nextId,
} = require('./data/store');

const app = express();
const PORT = Number(process.env.PORT) || 4000;
const TAX_RATE = 0.07;
const DIST_DIR = path.join(__dirname, '..', 'dist');
const ORDER_ID_PATTERN = /^ORD-\d{4}-(\d+)$/;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

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

app.post('/api/products', (req, res) => {
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

app.put('/api/products/:id', (req, res) => {
  const product = findProduct(req.params.id);
  if (!product) return res.status(404).json({ message: 'Product not found' });
  Object.assign(product, normalizeProduct({ ...product, ...req.body, id: product.id }, product.id));
  persist();
  res.json(product);
});

app.delete('/api/products/:id', (req, res) => {
  const index = db.products.findIndex((p) => p.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Product not found' });
  db.products.splice(index, 1);
  persist();
  res.json({ message: 'Product deleted' });
});

// ------------------------------------------------------------------- orders

app.get('/api/orders', (req, res) => {
  const { email: customerEmail, status } = req.query;
  let list = [...db.orders];
  if (customerEmail) list = list.filter((o) => email(o.customerEmail) === email(customerEmail));
  if (status) list = list.filter((o) => o.status === status);
  res.json(list);
});

app.get('/api/orders/:id', (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

app.post('/api/orders', (req, res) => {
  const body = req.body || {};
  const incoming = Array.isArray(body.items) ? body.items : [];
  if (incoming.length === 0) {
    return res.status(400).json({ message: 'Your cart is empty' });
  }

  const items = [];
  const shortages = [];

  for (const raw of incoming) {
    const product = raw.productId != null ? findProduct(raw.productId) : db.products.find((p) => p.name === raw.name);
    const quantity = Math.max(1, Number(raw.quantity) || 1);
    const price = product ? product.price : Number(raw.price) || 0;

    if (product && product.stock < quantity) {
      shortages.push(`${product.name} (left ${product.stock})`);
      continue;
    }
    items.push({ productId: product?.id, name: product?.name || raw.name || 'Item', price, quantity });
  }

  if (shortages.length > 0) {
    return res.status(409).json({ message: `Not enough stock for: ${shortages.join(', ')}` });
  }

  // Stock is only touched once every line is known to be available.
  for (const item of items) {
    const product = item.productId ? findProduct(item.productId) : null;
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
  }

  const subtotal = round(items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  const tax = round(subtotal * TAX_RATE);
  const shipping = 0;

  const order = {
    id: nextOrderId(),
    date: new Date().toISOString().split('T')[0],
    customerEmail: email(body.customerEmail),
    customerName: String(body.customerName || '').trim() || 'Guest',
    address: String(body.address || '').trim(),
    city: String(body.city || '').trim(),
    postalCode: String(body.postalCode || '').trim(),
    paymentMethod: body.paymentMethod === 'qr' ? 'qr' : 'credit',
    paymentRef: String(body.paymentRef || '').trim(),
    paymentStatus: body.paymentStatus === 'unpaid' ? 'unpaid' : 'paid',
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

app.put('/api/orders/:id', (req, res) => {
  const order = findOrder(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const nextStatus = req.body?.status;
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

app.delete('/api/orders/:id', (req, res) => {
  const index = db.orders.findIndex((o) => o.id === String(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Order not found' });
  const [removed] = db.orders.splice(index, 1);
  if (removed.status !== 'Cancelled') adjustCustomerSpend(removed.customerEmail, -removed.total);
  persist();
  res.json({ message: 'Order deleted' });
});

// ---------------------------------------------------------------- customers

app.get('/api/customers', (req, res) => {
  res.json(db.customers);
});

app.post('/api/customers', (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.email) {
    return res.status(400).json({ message: 'Name and email are required' });
  }
  const customer = {
    id: nextId(db.customers),
    name: String(body.name).trim(),
    email: email(body.email),
    date: body.date || new Date().toISOString().split('T')[0],
    spent: Number(body.spent) || 0,
  };
  db.customers.unshift(customer);
  persist();
  res.status(201).json(customer);
});

app.put('/api/customers/:id', (req, res) => {
  const customer = db.customers.find((c) => c.id === Number(req.params.id));
  if (!customer) return res.status(404).json({ message: 'Customer not found' });
  const body = req.body || {};
  Object.assign(customer, {
    name: body.name ?? customer.name,
    email: email(body.email ?? customer.email),
    date: body.date ?? customer.date,
    spent: body.spent != null ? Number(body.spent) || 0 : customer.spent,
  });
  persist();
  res.json(customer);
});

app.delete('/api/customers/:id', (req, res) => {
  const index = db.customers.findIndex((c) => c.id === Number(req.params.id));
  if (index === -1) return res.status(404).json({ message: 'Customer not found' });
  db.customers.splice(index, 1);
  persist();
  res.json({ message: 'Customer deleted' });
});

// ------------------------------------------------------------------ account

function issueToken(user) {
  const payload = Buffer.from(JSON.stringify({ sub: user.id, role: user.role })).toString('base64url');
  return `${payload}.${Date.now()}`;
}

app.post('/api/login', (req, res) => {
  const { email: rawEmail, password } = req.body || {};
  const user = db.users.find((u) => email(u.email) === email(rawEmail));

  if (!user || !password || !verifyPassword(password, user)) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }

  res.json({ user: publicUser(user), token: issueToken(user) });
});

app.post('/api/register', (req, res) => {
  const { firstName, lastName, email: rawEmail, password, phone, dob } = req.body || {};

  if (!firstName || !lastName || !rawEmail || !password) {
    return res.status(400).json({ message: 'Please fill in every required field' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(rawEmail).trim())) {
    return res.status(400).json({ message: 'Please enter a valid email address' });
  }
  if (String(password).length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters' });
  }
  if (db.users.some((u) => email(u.email) === email(rawEmail))) {
    return res.status(409).json({ message: 'An account with this email already exists' });
  }

  const user = {
    id: nextId(db.users),
    name: `${firstName} ${lastName}`.trim(),
    email: email(rawEmail),
    phone: phone || '',
    dob: dob || '',
    role: 'customer',
    ...hashPassword(password),
  };

  db.users.push(user);
  upsertCustomer({ name: user.name, email: user.email, amount: 0 });
  persist();
  res.status(201).json({ user: publicUser(user), token: issueToken(user) });
});

// -------------------------------------------------------------------- stats

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

app.get('/api/stats', (req, res) => {
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
  res.status(404).json({ message: `Unknown endpoint: ${req.method} ${req.originalUrl}` });
});

app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ message: err.message || 'Unexpected server error' });
});

app.listen(PORT, () => {
  console.log(`Worawat_computer API running on http://localhost:${PORT}`);
  if (fs.existsSync(DIST_DIR)) console.log(`Serving production build from ${DIST_DIR}`);
});
