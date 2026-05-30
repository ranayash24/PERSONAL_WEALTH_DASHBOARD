# Personal Wealth Intelligence Dashboard

A secure, private web application for tracking and managing your entire financial portfolio in one place. Built for high-net-worth individuals who want full visibility across all asset classes — stocks, crypto, real estate, bonds, and more.

---

## Features

- **Portfolio Dashboard** — Net worth overview, asset breakdown, and quick stats at a glance
- **Asset Management** — Full CRUD for assets across 10+ categories with purchase price tracking
- **Analytics** — Allocation pie charts, net worth history, risk concentration analysis, top gainers/losers
- **CSV Import** — Bulk import assets from a CSV file with drag-and-drop UI and row preview
- **Google OAuth + Email Auth** — Sign in with Google or email/password via NextAuth.js
- **Dark Theme** — Clean, professional dark UI built with Tailwind CSS and shadcn/ui
- **Encrypted Storage** — AES-256 encryption for sensitive asset data

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| Charts | Recharts |
| Auth | NextAuth.js v5 (Google + Credentials) |
| Database | MongoDB Atlas (via Prisma ORM) |
| Validation | Zod |
| Security | bcryptjs, AES-256-CBC |

---

## Asset Categories

`STOCKS` · `BONDS` · `REAL_ESTATE` · `CRYPTO` · `CASH` · `COMMODITIES` · `PRIVATE_EQUITY` · `ALTERNATIVE` · `RETIREMENT` · `OTHER`

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ranayash24/PERSONAL_WEALTH_DASHBOARD.git
cd PERSONAL_WEALTH_DASHBOARD
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Fill in the values in `.env` — see [Environment Variables](#environment-variables) below.

### 4. Push the database schema

```bash
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | MongoDB Atlas connection string |
| `NEXTAUTH_SECRET` | Yes | Random secret for JWT signing (`openssl rand -hex 32`) |
| `NEXTAUTH_URL` | Local only | `http://localhost:3000` (auto-detected on Vercel) |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `ENCRYPTION_KEY` | Yes | 32-byte hex key for AES-256 encryption |
| `DEMO_MODE` | No | Set to `true` to use mock data without auth |
| `ALPHA_VANTAGE_API_KEY` | Phase 4 | Market data API key |
| `PYTHON_ANALYTICS_URL` | Phase 3 | FastAPI microservice URL |

See `.env.example` for the full template.

---

## CSV Import Format

Navigate to `/import` and upload a `.csv` file with the following columns:

| Column | Required | Example |
|---|---|---|
| `name` | Yes | `Apple Inc` |
| `category` | Yes | `STOCKS` |
| `currentValue` | Yes | `15200.00` |
| `purchasePrice` | No | `12000.00` |
| `purchaseDate` | No | `2022-03-15` |
| `currency` | No | `USD` |
| `quantity` | No | `80` |
| `ticker` | No | `AAPL` |
| `location` | No | `Fidelity` |
| `notes` | No | `Long-term hold` |

A sample file is included at `sample_portfolio.csv`.

---

## Deployment

This app is optimized for deployment on **Vercel**.

1. Push to GitHub
2. Import the repo at [vercel.com](https://vercel.com)
3. Add all environment variables in the Vercel dashboard
4. Add your Vercel production URL to Google Cloud Console under **Authorized redirect URIs**:
   ```
   https://your-app.vercel.app/api/auth/callback/google
   ```

---

## Roadmap

- [x] Phase 1 — Auth, asset CRUD, dashboard layout
- [x] Phase 2 — Analytics visualizations (Recharts)
- [x] Phase 3 — CSV import
- [ ] Phase 3 — Python FastAPI analytics microservice (risk, anomaly detection, forecasting)
- [ ] Phase 4 — Alpha Vantage market data sync
- [ ] Phase 5 — 2FA, audit logging, PDF export

---

## License

MIT
