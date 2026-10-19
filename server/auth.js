'use strict';

// Session handling for the API.
//
// Sessions are stateless: the server hands the browser an HMAC-signed token in
// an httpOnly cookie, and verifies the signature on every request. The token
// never carries a secret and the browser never sees it, so a forged cookie or a
// token edited in client storage cannot be used to impersonate anyone.

const crypto = require('node:crypto');

const COOKIE_NAME = 'ww_session';
// A week. The browser and the signed token expire together.
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 7;

const IS_PRODUCTION = process.env.NODE_ENV === 'production';

let cachedSecret = null;

// The signing key must come from the environment. Without it we fall back to a
// per-process random key so local runs still work; that key changes on every
// restart and is not shared between instances, so production must set AUTH_SECRET.
function authSecret() {
  if (cachedSecret) return cachedSecret;

  const fromEnv = String(process.env.AUTH_SECRET || '').trim();
  if (fromEnv) {
    cachedSecret = fromEnv;
    return cachedSecret;
  }

  cachedSecret = crypto.randomBytes(32).toString('hex');
  console.warn(
    'AUTH_SECRET is not set: falling back to a random signing key. Sessions will not survive a restart and are not shared between instances. Set AUTH_SECRET in production.',
  );
  return cachedSecret;
}

const sign = (payload) => crypto.createHmac('sha256', authSecret()).update(payload).digest('base64url');

function issueSession(user) {
  const now = Date.now();
  const payload = Buffer.from(
    JSON.stringify({ sub: user.id, role: user.role, iat: now, exp: now + TOKEN_TTL_MS }),
  ).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

// Returns the claims for a valid, unexpired, correctly signed token, else null.
function readSession(token) {
  if (typeof token !== 'string') return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const payload = token.slice(0, dot);
  const signature = token.slice(dot + 1);
  const expected = sign(payload);
  const provided = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (provided.length !== wanted.length || !crypto.timingSafeEqual(provided, wanted)) return null;

  let claims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  } catch {
    return null;
  }
  if (!claims || typeof claims.exp !== 'number' || claims.exp < Date.now()) return null;
  return claims;
}

function parseCookies(header) {
  const out = {};
  if (!header) return out;
  for (const part of String(header).split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    const key = part.slice(0, eq).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(eq + 1).trim());
    } catch {
      out[key] = part.slice(eq + 1).trim();
    }
  }
  return out;
}

function cookieAttributes() {
  const attrs = ['Path=/', 'HttpOnly', 'SameSite=Lax', `Max-Age=${Math.floor(TOKEN_TTL_MS / 1000)}`];
  if (IS_PRODUCTION) attrs.push('Secure');
  return attrs;
}

const sessionCookie = (token) => [`${COOKIE_NAME}=${encodeURIComponent(token)}`, ...cookieAttributes()].join('; ');

const clearCookie = () => [`${COOKIE_NAME}=`, ...cookieAttributes().map((a) => (a.startsWith('Max-Age=') ? 'Max-Age=0' : a))].join('; ');

function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Please sign in to continue' });
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ message: 'Please sign in to continue' });
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required' });
  next();
}

// Small in-memory limiter for the auth endpoints. It is per-process, so a
// multi-instance deployment needs a shared store (Redis) instead.
function rateLimit({ windowMs, max }) {
  const hits = new Map();

  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.reset <= now) hits.delete(key);
  }, windowMs);
  if (timer.unref) timer.unref();

  return (req, res, next) => {
    const key = req.ip || req.socket?.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ message: 'Too many attempts. Please try again later.' });
    }
    next();
  };
}

module.exports = {
  COOKIE_NAME,
  issueSession,
  readSession,
  parseCookies,
  sessionCookie,
  clearCookie,
  requireAuth,
  requireAdmin,
  rateLimit,
};
