# Worawat_computer — e-commerce store

ร้านขายอุปกรณ์คอมพิวเตอร์ (React + Vite + Tailwind 4) พร้อม REST API (Express)
รองรับการชำระเงินผ่าน **พร้อมเพย์ (Thai QR / PromptPay)** ด้วยการสร้าง QR เอง
ตามมาตรฐาน EMVCo โดยไม่ต้องพึ่งบริการภายนอก

## What's inside

| Layer | Tech | Where |
| --- | --- | --- |
| Storefront | React 19, Vite, Tailwind CSS 4, React Router 7, Recharts, lucide-react | `src/` |
| API | Node + Express 5, JSON-file storage | `server/` |
| Payment | PromptPay QR generated client-side (EMVCo TLV + CRC16) | `src/lib/promptpay.js`, `src/components/PromptPayQR.jsx` |

## Quick start

```bash
# 1. install (frontend and API are separate packages)
npm install
npm --prefix server install

# 2. run the API on :4000
npm run server          # or: npm run server:dev   (auto-restart on change)

# 3. in a second terminal, run the storefront on :5173
npm run dev
```

Open http://localhost:5173 — the dev server proxies `/api` to
`http://localhost:4000`, so the frontend always talks to relative `/api` URLs.

### Production

```bash
npm run build           # emits dist/
npm start               # builds, then serves dist/ + /api from :4000
```

With a build present the Express server serves both the SPA and the API on the
same origin, so no proxy is needed.

### Deploy to Render

`render.yaml` is a [Blueprint](https://render.com/docs/blueprint-spec) that
creates a free web service plus a free Postgres database in Singapore, and wires
the connection string into the API.

1. Push this repository to GitHub.
2. In the Render Dashboard: **New → Blueprint**, pick the repository, apply.
3. Render builds the storefront, installs the API, and starts Express.

`DATABASE_URL` decides where data lives:

| `DATABASE_URL` | Storage |
| --- | --- |
| unset | `server/data/db.json` (the local dev default) |
| set | `app_state` table in Postgres — one JSONB document holding products, orders, customers and accounts |

Postgres matters in production: a Render service has an ephemeral filesystem, so
a `db.json` written at runtime disappears on every deploy, restart or spin-down.

Free-plan caveats worth knowing before you rely on it:

- A free web service spins down after 15 minutes without traffic; the next
  request takes roughly a minute to wake it.
- A free Postgres database **expires 30 days after creation**, then gets a
  14-day grace period and is deleted with all of its data. Upgrade the database
  plan to keep it.
- Product images are files under `public/images/`, so they ship with the
  deployment. An image uploaded at runtime would not survive a redeploy.

Google Sign-In needs the deployed origin registered: add
`https://<your-service>.onrender.com` to the authorised JavaScript origins of the
OAuth client in Google Cloud Console. To use a different client, set both
`VITE_GOOGLE_CLIENT_ID` (build time) and `GOOGLE_CLIENT_ID` (run time) as
environment variables.

That single service is the whole app: the storefront, the API and the data all
live on the same origin.

### Deploy the storefront to Vercel (optional)

Vercel can serve the built SPA while Render keeps the API and the database. The
browser then only ever talks to the Vercel origin, because `vercel.json` rewrites
`/api/*` through to the Render service. That keeps the session cookie
first-party (a cookie sent straight from `vercel.app` to `onrender.com` would be
a third-party cookie and browsers would drop it) and keeps the API's
same-origin rules intact.

1. Import this repository into Vercel: framework preset **Vite**, output `dist`.
   Leave `VITE_API_URL` unset there so the app keeps calling the relative
   `/api` path that the rewrite handles.
2. If your API is not `worawat-computer.onrender.com`, change the `/api/:path*`
   destination in `vercel.json`.
3. Add the Vercel origin to the API's `CORS_ORIGINS` (`render.yaml` already
   lists `https://worawat-computer-e-com.vercel.app`; use your own domain if you
   attach one).
4. The catch-all rewrite sends every unknown path to `/index.html`, so deep links
   such as `/products` load the app instead of Vercel's 404 page.

Without those rewrites a Vercel deployment is frontend only: `/api/health`
answers `404` and every page that reads data shows "The page could not be found".

### Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Customer | `john.doe@example.com` | `demo1234` |
| Customer | `alice.smith@example.com` | `demo1234` |

The sign-in page has a one-click button for the customer account. The **admin
account is not listed there**: its password comes from `ADMIN_PASSWORD`, and the
API rotates (or creates) the account from `ADMIN_EMAIL` / `ADMIN_PASSWORD` on
every start. Without `ADMIN_PASSWORD` a fresh database logs a generated
one-time password to the console.

### Google Sign-In (optional)

The login page no longer shows a Google button. The `/api/google-login` endpoint
is still available for other clients: it verifies a Google ID token against
Google's `tokeninfo` endpoint (audience and expiry included) before creating or
reusing an account.

To point it at your own Google Cloud project, create an OAuth 2.0 **Web
application** client, add `http://localhost:5173` and `http://localhost:4000`
to the authorised JavaScript origins, and set the same client ID in both
places:

```bash
VITE_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com   # browser
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com        # API verification
```

Email + password sign-in keeps working if Google is unavailable.

## Security

- **Sessions** are stateless HMAC-signed tokens in an `httpOnly`, `SameSite=Lax`
  (and `Secure` in production) cookie. JavaScript cannot read them, and a forged
  or edited token is rejected. Set `AUTH_SECRET` in production so sessions
  survive restarts and are shared across instances.
- **Authorization**: reading and writing the catalogue, orders, customers and
  stats requires an admin session; customers can only read their own orders.
  Product prices and stock, the buyer's email and the payment state are always
  taken from the server, never from the request body.
- **Rate limiting**: login, register and Google sign-in allow 10 attempts per
  15 minutes per IP (in-memory; use a shared store if you run more than one
  instance).
- **Headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy` on every response; HSTS and a `default-src 'self'` CSP in
  production.
- **CORS**: same-origin by default. Add extra origins with `CORS_ORIGINS`
  (comma-separated); a wildcard is never used with credentials.
- **CSRF**: writes are refused unless the `Origin` header matches the host the
  request came in on (a proxy's `X-Forwarded-Host` counts, so the Vercel rewrite
  works) or an allowlisted origin. An origin-less non-browser client still works.
- Errors returned to clients are generic; details go to the server log only.

## PromptPay payments

Checkout offers two methods: **Credit Card** (demo form) and **QR PromptPay**.

Choosing QR PromptPay renders a *dynamic* Thai QR for the exact order total:

- payload tag `29` carries the PromptPay AID `A000000677010111` plus the
  receiving mobile number normalised to `0066xxxxxxxxx`
- tag `54` carries the amount, tag `62/05` the payment reference
- tag `63` is the CRC-16/CCITT-FALSE checksum, so any Thai bank app can scan it
- the code shows a 15-minute countdown and a "new QR code" button

The receiving account and the name printed on the QR live in
`src/lib/promptpay.js` and can be overridden with environment variables
(see `.env.example`):

```bash
VITE_PROMPTPAY_PHONE=0828072613
VITE_PROMPTPAY_NAME=WORAWAT BOONRUENG
VITE_PROMPTPAY_DISPLAY_NAME=วรวัฒน์ บุญเรือง
VITE_PROMPTPAY_CITY=BANGKOK
```

> `VITE_PROMPTPAY_NAME` is embedded in the QR itself. EMVCo restricts that field
> to the Latin "ans" character set, so Thai script is not portable there — the
> Thai spelling is shown in the UI via `VITE_PROMPTPAY_DISPLAY_NAME` instead.

After scanning, the buyer presses **"I have paid — confirm order"**, which
creates the order with `paymentMethod: 'qr'` and the payment reference. The API
records `paymentStatus: 'unpaid'` for QR orders (the merchant confirms the
payment) and `'paid'` for the demo card flow; the client cannot set it.

## API reference

Base URL `/api`. Try `GET /api/health` first. Endpoints marked **admin** need an
admin session cookie; **auth** needs any signed-in user.

| Method | Endpoint | Notes |
| --- | --- | --- |
| GET | `/health` | liveness + row counts |
| GET | `/meta` | categories, brands, price range |
| GET | `/products` | filters: `category`, `brand`, `q`, `maxPrice`, `sort=lowToHigh\|highToLow` |
| POST | `/products` | **admin** |
| PUT/DELETE | `/products/:id` | **admin** |
| GET | `/orders` | **auth** — customers see only their own orders; admins see all |
| GET | `/orders/:id` | **auth** — owner or admin only |
| POST | `/orders` | **auth** — server-side pricing, decrements stock, returns **409** when short |
| PUT/DELETE | `/orders/:id` | **admin** — cancelling restores stock and customer spend |
| GET/POST | `/customers`, `/customers/:id` | **admin** (`PUT`/`DELETE` on `/:id`) |
| POST | `/login`, `/register` | scrypt-hashed passwords; sets the session cookie |
| POST | `/logout` | clears the session cookie |
| GET | `/me` | **auth** — current user profile |
| POST | `/google-login` | verifies a Google ID token, creates the customer on first use |
| GET | `/stats` | **admin** — dashboard KPIs + monthly series |

## Data storage

Locally, `server/data/db.json` is created on first run from
`server/data/seed.js` (22 products, 2 orders, 5 customers, 3 accounts).
Passwords are stored as `scrypt` hashes with a per-user salt — the plain text
only ever exists in the seed file, and the admin password comes from
`ADMIN_PASSWORD`.

```bash
npm run reset-db        # delete db.json; it is reseeded on the next start
```

Set `DATABASE_URL` and the same document is kept in the `app_state` table of a
Postgres database instead, seeded on first start. Either way the API loads
everything into memory at boot, so the routes stay synchronous. To run the API
against a local Postgres:

```bash
DATABASE_URL=postgres://USER:PASSWORD@127.0.0.1:5432/worawat npm run server
```

## Scripts

| Command | Does |
| --- | --- |
| `npm run dev` | Vite dev server (http://localhost:5173) |
| `npm run build` | production bundle into `dist/` |
| `npm start` | build + serve `dist/` and `/api` from :4000 |
| `npm run server` | start the API |
| `npm run server:dev` | start the API with auto-restart |
| `npm run lint` | oxlint |
| `npm run reset-db` | wipe the JSON database |