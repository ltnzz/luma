# Luma Backend API (`apps/api`)

Backend API for Luma built with Express, TypeScript, PostgreSQL, and Drizzle ORM.

## Prerequisites

- **Node.js**: v18+ (tested on v24+)
- **PostgreSQL**: v14+ (local instance or hosted service like Neon, Supabase, or AWS RDS)

## Directory Structure

```text
apps/api/
├── drizzle/              # Auto-generated database migrations
├── src/
│   ├── config/           # Environment variable loading and configuration
│   ├── db/               # Drizzle ORM database connection and schema definitions
│   │   ├── index.ts      # Connection pool and Drizzle client
│   │   └── schema.ts     # Table definitions (e.g. users)
│   ├── middleware/       # Express middleware (error handling, 404 handler)
│   ├── routes/           # Express route handlers (e.g. /health)
│   ├── app.ts            # Express application setup
│   └── index.ts          # Server entry point
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

Default variables:
```env
PORT=4000
NODE_ENV=development
DATABASE_URL=postgres://postgres:password@localhost:5432/luma
```

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
- **Push schema changes directly** (development only, skips migration files):
  ```bash
  npm run db:push
  ```
- **Open Drizzle Studio** (web GUI for database inspection):
  ```bash
  npm run db:studio
  ```

## Endpoints

- `GET /health`
  - Returns server health status, uptime, and database connection status (`connected` / `disconnected`).
  - Example response:
    ```json
    {
      "status": "ok",
      "uptime": 12.34,
      "timestamp": "2026-10-23T00:00:00.000Z",
      "database": "connected"
    }
    ```
