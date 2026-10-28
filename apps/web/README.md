# Luma Web

Frontend application for Luma — Local Urban Mapping & Analytics.

## Tech Stack

- React
- Vite
- TypeScript
- ESLint

## Prerequisites

- Node.js
- npm

## Getting Started

1. Navigate to the frontend directory:

   ```bash
   cd apps/web
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env.local` if environment variables are required.

4. Start the development server:

   ```bash
   npm run dev
   ```

5. Open the local URL displayed in the terminal.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Build the production application |
| `npm run preview` | Preview the production build locally |

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_APP_NAME` | Application name |
| `VITE_API_BASE_URL` | Base URL for the backend API |

Only expose values through `VITE_` that are safe for client-side use. Never put secrets or private credentials in frontend environment variables.