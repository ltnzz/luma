# Luma Backend API (`apps/api`)

Backend API for Luma built with Express, TypeScript, PostgreSQL (Supabase / local), and Drizzle ORM.

## Prerequisites

- **Node.js**: v18+ (tested on v24+)
- **PostgreSQL**: v14+ (local instance or hosted service like Supabase, Neon, or AWS RDS)

## Directory Structure

```text
apps/api/
├── dataset/              # Raw & normalized urban datasets (JSON)
├── drizzle/              # Auto-generated database migrations
├── src/
│   ├── config/           # Environment variable loading and configuration
│   ├── db/               # Drizzle ORM database connection, schema, and seed logic
│   │   ├── index.ts      # Connection pool with SSL support & Drizzle client
│   │   ├── schema.ts     # Table definitions (facilities, indicators, schools, etc.)
│   │   └── seed.ts       # Database seeder for facilities & regional indicators
│   ├── middleware/       # Express middleware (error, notFound, rateLimit, cacheControl)
│   ├── routes/           # Express route handlers (visualizations, facilities, indicators, docs, health)
│   ├── utils/            # Helper utilities (in-memory dataset caching)
│   ├── app.ts            # Express application setup & middleware pipeline
│   └── index.ts          # Server entry point & graceful shutdown handling
├── .env.example          # Template environment variables
├── drizzle.config.ts     # Drizzle Kit configuration
├── eslint.config.mjs     # ESLint configuration
├── package.json          # Dependencies and scripts
└── tsconfig.json         # TypeScript compiler configuration
```

## Environment Configuration

Copy the example environment file and update the database credentials:

```bash
cp .env.example .env
```

### Environment Variables

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port for the HTTP server | `4000` |
| `NODE_ENV` | Runtime environment (`development`, `production`, `test`) | `development` |
| `DATABASE_URL` | PostgreSQL connection string (supports local & Supabase pooler) | `postgresql://postgres:password@localhost:5432/luma` |

> **Note for Supabase:** The connection pool automatically enables SSL (`rejectUnauthorized: false`) whenever a remote database or Supabase pooler connection is detected.

## Available Scripts

### Development
Start the development server with live reload via `tsx`:
```bash
npm run dev
```

### Production Build & Start
Compile TypeScript to JavaScript and run the production server:
```bash
npm run build
npm start
```

### Code Quality (Linting)
Run ESLint:
```bash
npm run lint
```

### Database Management & Migrations (Drizzle ORM)

- **Generate migrations** from schema definitions (`src/db/schema.ts`):
  ```bash
  npm run db:generate
  ```
- **Apply migrations** to the PostgreSQL database:
  ```bash
  npm run db:migrate
  ```
- **Push schema changes directly** (development / quick sync):
  ```bash
  npm run db:push
  ```
- **Seed database with urban datasets** (facilities, indicators, budgets, metrics):
  ```bash
  npm run db:seed
  ```
- **Open Drizzle Studio** (web GUI for database inspection):
  ```bash
  npm run db:studio
  ```

---

## Performance & Security Features

1. **Rate Limiting (`express-rate-limit`):**
   - Restricts client requests to **200 requests per 15 minutes** per IP.
   - Sends standard `RateLimit-*` HTTP headers.
   - Health check endpoint (`/health`) is excluded from rate limits for monitoring probes.
2. **Reverse Proxy Support (`trust proxy`):**
   - Configured with `app.set('trust proxy', 1)` to accurately detect real client IPs behind cloud load balancers (Vercel, Cloudflare, Railway).
3. **Security Headers & Payload Guard:**
   - Secured with `helmet` for HTTP header hardening (XSS, MIME-sniffing, clickjacking protection).
   - JSON and URL-encoded body size limited to `1mb`.
4. **In-Memory Caching & Compression:**
   - Static dataset JSON files are cached in memory after the first read via `datasetCache.ts`, reducing disk I/O to < 1ms on subsequent reads.
   - HTTP response compression (Gzip) enabled via `compression`.
   - Public visualization and dataset endpoints include `Cache-Control: public, max-age=300, stale-while-revalidate=600`.
5. **Connection Pool Tuning & Graceful Shutdown:**
   - PostgreSQL pool is configured with `max: 20` connections, connection timeout, and idle timeout.
   - Traps `SIGTERM` and `SIGINT` to safely drain incoming requests and cleanly close database pools (`pool.end()`).

---

## API Endpoints Reference

### Health & Monitoring
- `GET /health` — Server uptime and database connection status (`connected` / `disconnected`).

### Visualizations & Analytics
- `GET /api/v1/visualizations/overview` — High-level KPI metrics (schools, air, transit, RTH) and cross-sector chart distribution for the dashboard.
- `GET /api/v1/visualizations/catalog` — Normalized dataset package catalog list.
- `GET /api/v1/visualizations/sectors/:sector` — Detailed statistics and chart analytics for a specific sector (`air`, `rth`, `sekolah`, `transum`, `udara`, `kesehatan`).

### Facilities
- `GET /api/v1/facilities` — Paginated list of urban facilities with optional filters (`category`, `wilayah`, `kecamatan`, `page`, `limit`).
- `GET /api/v1/facilities/:id` — Detailed facility information with budgets, metrics, documents, and specs.

### Regional Indicators & Raw Datasets
- `GET /api/v1/indicators` — Urban indicators across DKI Jakarta administrative areas.
- `GET /api/v1/dataset/summary` — Cross-sector summary dataset.
- `GET /api/v1/dataset/wilayah` — Multisectoral aggregated data per administrative area.
- `GET /api/v1/dataset/sectors/:sector` — Sector-specific summary dataset (`air`, `rth`, `sekolah`, `transum`).

### API Documentation
- `GET /api/docs` — Interactive Swagger OpenAPI documentation.

---

## Frontend Integration (Vercel Multi-Service)

Luma is deployed as a unified multi-service project on Vercel via [`vercel.json`](../../vercel.json).

### In Production (Vercel)
Both frontend and backend share the same domain (e.g. `https://luma-pearl-five.vercel.app`). Client-side requests in React should use relative paths:
```typescript
const response = await fetch('/api/v1/visualizations/overview');
const data = await response.json();
```
*No cross-origin (CORS) configuration is required.*

### In Local Development
Run the API on port 4000 and configure the Vite dev proxy in `apps/web/vite.config.ts`:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4000',
      changeOrigin: true,
    },
  },
}
```
This ensures the exact same relative API calls work seamlessly across both local development and production.
