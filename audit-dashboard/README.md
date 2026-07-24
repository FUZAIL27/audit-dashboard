# Sentinel — Enterprise Security Audit Dashboard

A production-oriented audit log investigation and monitoring console.
React 19 / Vite / TypeScript frontend, Node/Express/MongoDB backend, built with
Clean Architecture and the Repository Pattern.

```
audit-dashboard/
├── docs/                     # Phase 1: architecture, DB design, API design
├── backend/                  # Phase 2: Express/TypeScript API
├── frontend/                 # Phase 3-4: React 19 SPA + 3D/animated UI
├── docker-compose.yml        # Phase 6: local full-stack orchestration
└── .github/workflows/ci.yml  # Phase 6: CI pipeline
```

## Quickstart (local, Docker)

```bash
git clone <this-repo>
cd audit-dashboard
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000/api/health
- MongoDB: localhost:27017 (no auth, local dev only)

The backend automatically seeds a single administrator account on its
first startup — no manual step needed, no signup page exists. Log in with:

```
Username: admin
Password: Admin@123
```

**Change `ADMIN_USERNAME`/`ADMIN_PASSWORD` in your deployment's environment
variables before going live** — a startup warning is logged if the
defaults are still in place under `NODE_ENV=production`.

## Quickstart (local, without Docker)

```bash
# Terminal 1 — backend
cd backend
cp .env.example .env   # point MONGODB_URI at your own Atlas cluster or local mongod
npm install
npm run seed
npm run dev

# Terminal 2 — frontend
cd frontend
cp .env.example .env
npm install
npm run dev
```

## Architecture Summary

**Backend** — Clean Architecture, strict one-directional dependency flow:

```
routes → validators → controllers → services → repositories → models → MongoDB
```

Only `repositories/` import Mongoose models. Only `services/` contain business
logic. See `docs/01-ARCHITECTURE.md` for the full rationale.

**Frontend** — feature-sliced, with server state (TanStack Query) and UI state
(Zustand) kept strictly separate. All filtering/sorting/pagination happens
server-side; the frontend never filters the list client-side. See
`frontend/README.md`.

## Key Design Decisions

| Area | Decision | Why |
|---|---|---|
| Auth | Single administrator account, auto-seeded on every server boot | No registration surface to secure or abuse — matches a single-operator security console rather than a multi-tenant SaaS |
| Auth | Short-lived JWT access token (in-memory) + httpOnly refresh cookie | Reduces XSS blast radius vs. localStorage; refresh cookie survives reloads |
| Cross-origin cookies | `sameSite: 'none'` + `secure: true` in production, `sameSite: 'lax'` + non-secure in development | Frontend and backend live on different domains once deployed (Vercel + Render) — `sameSite: 'strict'`/`'lax'` silently drops the cookie cross-site; this is the #1 cause of "login works locally, breaks in production" |
| Reverse proxy | `app.set('trust proxy', 1)` | Render/Vercel/most PaaS platforms sit behind a proxy; without this, `express-rate-limit` throws on every rate-limited route (including login) in production while working fine locally |
| Bulk import | Chunked `bulkWrite({ordered:false})` + SHA-256 row fingerprinting | 50k+ row imports don't abort on a handful of bad/duplicate rows |
| Dashboard aggregations | Short-TTL in-memory cache behind an `ICache` interface | Expensive `$facet` pipelines don't need per-request freshness; interface allows swapping in Redis later without touching services |
| Search/filter/sort | 100% server-side, backed by compound + weighted text indexes | The only way to stay responsive at 10k-50k+ documents |

## Deployment Pitfalls (and how this project avoids them)

These are the specific things that break authentication after deploying a
frontend and backend to separate domains, even when everything works
perfectly on localhost:

1. **Cookie `sameSite`/`secure` mismatch** — a cross-site cookie needs
   `sameSite: 'none'` and `secure: true` together, or the browser drops it
   silently (no error in the console). Fixed in `auth.controller.ts`.
2. **Missing `trust proxy`** — without it, `express-rate-limit` throws a
   validation error on every rate-limited request once the platform's
   reverse proxy adds an `X-Forwarded-For` header. Fixed in `app.ts`.
3. **CORS origin mismatch** — the deployed frontend's exact origin (no
   trailing slash) must be in `CLIENT_ORIGIN`/`FRONTEND_URL`; both env var
   names are accepted, and the value can be a comma-separated list to
   allow a preview-deployment domain alongside the production one.
4. **`VITE_API_URL` baked in at build time** — Vite inlines env vars during
   `npm run build`, not at runtime. Changing it in a hosting dashboard
   requires a full rebuild/redeploy, not just a restart.
| 3D/ambient UI | One restrained R3F particle field + wireframe globe, used behind the login and dashboard shell only | Signature visual interest without competing with the data-dense table/charts |

## Testing

```bash
cd backend && npm test    # Jest + Supertest + mongodb-memory-server
cd frontend && npm test   # Vitest
```

The backend suite covers four distinct categories (see `backend/README.md`
for the full breakdown): **unit** (mocked repositories, no DB), **integration**
(full request → DB round trip via an in-memory MongoDB), **API contract**
(response envelope/header shape), and **validation** (validator chains
tested in isolation, with no database or auth in the loop).

## Deployment

- **Frontend → Vercel**: framework preset "Vite", build command `npm run build`,
  output dir `dist`, env var `VITE_API_URL` pointing at the Render backend URL.
- **Backend → Render**: build command `npm install && npm run build`, start
  command `npm start`, environment variables from `backend/.env.example`
  (real MongoDB Atlas URI + strong random JWT secrets — generate with
  `openssl rand -base64 48`).
- **Database → MongoDB Atlas**: create a cluster, add a database user, and
  allow network access from Render's IPs (or `0.0.0.0/0` for simplicity, with
  a strong password).

CI (`.github/workflows/ci.yml`) lints, tests, and builds both apps plus a
Docker build smoke test on every push/PR to `main`.

## Security Notes

- Helmet, `express-mongo-sanitize`, and tiered rate limiting (stricter on
  `/auth/login` and `/logs/upload`) are applied by default.
- Passwords hashed with bcrypt (cost factor 12 in the seed script; 10 in
  tests for speed).
- File uploads are type/extension/size-validated and parsed entirely in
  memory — never written to disk unvalidated.
- RBAC is enforced server-side on every mutating route; the frontend hiding a
  button is a UX nicety, not a security boundary.

## Performance Notes

- Every list/aggregate query is backed by an index verified against the
  query shape (see `docs/02-DATABASE-DESIGN.md` §2).
- The logs table uses `@tanstack/react-virtual` — only visible rows are
  mounted, regardless of page size.
- TanStack Query's `placeholderData: keepPreviousData` keeps the table
  populated (no flash-to-empty) while a new page/filter loads.
- `compression` middleware is enabled on all API responses.
