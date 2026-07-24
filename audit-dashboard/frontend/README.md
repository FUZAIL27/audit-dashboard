# Sentinel — Audit Dashboard Frontend

React 19 + Vite + TypeScript + TanStack Query + Zustand + Tailwind.

## Setup

```bash
cp .env.example .env
# set VITE_API_URL to your backend URL

npm install
npm run dev   # http://localhost:5173
```

Default seeded login (after running `npm run seed` in the backend):
`admin@company.com` / `ChangeMe123!`

## Structure

- **services/** — Axios client (with token-refresh interceptor) + typed API functions
- **store/** — Zustand: `auth.store` (in-memory access token), `ui.store` (drawer/sidebar,
  persisted), `filters.store` (table filters/sort/pagination)
- **hooks/** — TanStack Query hooks per resource; all filtering/sorting/pagination happens
  server-side, the frontend never filters the list client-side
- **features/** — feature-sliced modules (logs-table, dashboard, upload)
- **three/** — a restrained React Three Fiber ambient background (particle field + wireframe
  globe), used behind the login screen and dashboard shell
- **components/ui/** — shared primitives (Button, Input, Card, Dialog, Skeleton)

## Design system

Dark "operations console" theme — near-black surfaces, a cyan-blue "signal" accent for the
live-monitoring feel, and semantic severity/status colors that carry real meaning throughout
the table, badges, and charts. Space Grotesk for headings, Inter for UI text, JetBrains Mono
for IPs/resources/JSON (this is a data-dense audit tool — monospace where the data itself
matters).

## Build & Deploy (Vercel)

```bash
npm run build   # outputs dist/
```

Vercel project settings: framework preset "Vite", build command `npm run build`, output
directory `dist`, and set `VITE_API_URL` as an environment variable pointing at the deployed
Render backend.

## Docker

```bash
docker build --build-arg VITE_API_URL=https://your-api.onrender.com/api -t audit-dashboard-frontend .
docker run -p 8080:80 audit-dashboard-frontend
```
