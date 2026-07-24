# Enterprise Security Audit Dashboard — Architecture (Phase 1)

## 1. System Overview

A two-tier application: a React 19/Vite SPA (Vercel) talking to a Node/Express REST
API (Render), backed by MongoDB Atlas. The backend follows Clean Architecture with
a strict layering discipline; the frontend follows a feature-sliced structure with
a clear separation between server-state (TanStack Query) and client/UI-state
(Zustand).

## 2. Backend Architecture — Layered / Clean Architecture

```
HTTP Request
   │
   ▼
Route (src/routes)              → maps URL + method → controller. No logic.
   │
   ▼
Middleware chain                → auth, rate-limit, validation, sanitize
   │
   ▼
Validator (src/validators)      → express-validator / zod schemas. Rejects bad input
   │                              before it reaches a controller.
   ▼
Controller (src/controllers)    → thin. Parses req, calls a service, shapes the
   │                              HTTP response (status code, envelope). No business
   │                              logic, no direct DB access.
   ▼
Service (src/services)          → business logic, orchestration, transactions,
   │                              calls one or more repositories, enforces rules
   │                              (e.g. "duplicate detection", "bulk insert batching").
   ▼
Repository (src/repositories)   → the ONLY layer that talks to Mongoose/MongoDB.
   │                              Encapsulates queries, aggregation pipelines,
   │                              indexes usage. Services never import a Model
   │                              directly.
   ▼
Model (src/models)              → Mongoose schema + indexes only. No logic.
   │
   ▼
MongoDB Atlas
```

### Why Repository Pattern here
- Swapping MongoDB for another store (or adding a read-replica / cache layer)
  touches only the repository layer.
- Services become unit-testable by mocking repositories — no DB needed for
  business-logic tests.
- Aggregation pipelines (dashboard stats, charts) live in one place instead of
  being scattered across controllers.

### Dependency rule
Inner layers never import outer layers:
`models` → known by `repositories` only.
`repositories` → known by `services` only.
`services` → known by `controllers` only.
`controllers` → known by `routes` only.

This is enforced by convention + ESLint `import/no-restricted-paths`.

### Cross-cutting concerns (`middlewares/`)
- `auth.middleware.ts` — JWT verification, attaches `req.user`.
- `rbac.middleware.ts` — role-based route guarding.
- `rateLimiter.middleware.ts` — `express-rate-limit` (per-IP + per-user tiers).
- `sanitize.middleware.ts` — `express-mongo-sanitize` + `xss-clean` equivalent.
- `errorHandler.middleware.ts` — centralized error → HTTP mapping (last middleware).
- `requestLogger.middleware.ts` — `morgan` wired to a structured logger.
- `upload.middleware.ts` — `multer` memory storage, file-type/size guard.

### Error handling strategy
Custom `AppError` class (`operational` vs `programmer` errors). Services throw
`AppError` subclasses (`NotFoundError`, `ValidationError`, `DuplicateError`,
`AuthError`). A single `errorHandler` middleware converts these to a consistent
JSON envelope and logs unexpected errors without leaking stack traces in
production.

### Config strategy (`src/config`)
- `env.ts` — loads and **validates** `process.env` with `zod` at boot; the app
  refuses to start if a required var is missing (fail fast, not at request time).
- `db.ts` — Mongoose connection with pooling, retry/backoff, and connection
  event logging.
- `constants.ts` (in `src/constants`) — enums for `Severity`, `Status`, `Role`.

## 3. Frontend Architecture — Feature-Sliced

```
src/
  app/            # app shell: router setup, providers composition, App.tsx
  pages/          # route-level components (thin, compose features)
  features/       # feature modules: logs-table, upload, dashboard-charts, auth
    <feature>/
      components/
      hooks/
      api.ts       # feature-scoped React Query hooks calling services/
      types.ts
  components/     # shared/reusable presentational + shadcn-derived components
  layouts/         # AppShell, AuthLayout, DashboardLayout
  services/       # axios instance + typed API client functions (one per resource)
  store/          # Zustand stores: ui.store.ts (drawer/sidebar), filters.store.ts
  hooks/          # cross-feature hooks (useDebounce, useMediaQuery, usePagination)
  providers/      # QueryClientProvider, ThemeProvider, ToastProvider composition
  contexts/       # React context for cases Zustand doesn't fit (rare)
  three/          # React Three Fiber scenes/components (background, globe)
  animations/     # Framer Motion variants, GSAP timelines, shared transition presets
  types/          # global TS types/interfaces shared across features
  constants/      # enums mirrored from backend (Severity, Status) + UI constants
  utils/          # formatters, class-name helpers, csv helpers
  styles/         # tailwind.css, design tokens
```

### State separation principle
- **Server state** (audit logs, stats, charts) → TanStack Query only. Never
  duplicated into Zustand. Query keys are centralized in
  `services/queryKeys.ts` to avoid typo-based cache misses.
- **Client/UI state** (selected row, drawer open/closed, active filters draft,
  column visibility, theme) → Zustand, persisted to `localStorage` where it
  improves UX (e.g. column layout).
- **Form state** → React Hook Form + Zod resolver, local to the form component.

### Data flow for the log table (representative)
1. `features/logs-table/hooks/useAuditLogs.ts` reads filter/sort/pagination
   state from `store/filters.store.ts`.
2. It builds a query key + calls `services/auditLog.service.ts` (typed axios
   call) via `useQuery`.
3. Backend does ALL filtering/sorting/pagination/search — the frontend never
   filters client-side.
4. Response is rendered in a virtualized table (`@tanstack/react-virtual`).
5. Row click → `store/ui.store.ts` sets `selectedLogId` → drawer reads it and
   fires its own `useQuery(['logs', id])`, which is warm if the list already
   fetched the summary (structural sharing) or fetches detail on demand.

## 4. Authentication & Authorization

- JWT access token (short-lived, 15 min) + refresh token (httpOnly secure
  cookie, 7 days).
- `POST /api/auth/login` issues both; access token returned in body (kept in
  memory / Zustand, **not** localStorage, to reduce XSS blast radius), refresh
  token set as httpOnly cookie.
- Roles: `admin`, `security_analyst`, `viewer`. RBAC middleware guards
  mutating routes (`upload`, `PATCH status`, `DELETE`).

## 5. Scalability Decisions

- **Bulk ingestion**: streamed CSV/JSON/XLSX parsing (never load 50k rows fully
  into a single JS array before validation — stream + validate + batch in
  chunks of ~1000) using `bulkWrite` with `ordered:false` so one bad row
  doesn't stop the batch.
- **Read scaling**: all list/aggregate endpoints are backed by compound +
  text indexes (see DB design doc) so `explain()` shows `IXSCAN` not `COLLSCAN`
  even at 100k+ documents.
- **Aggregation caching**: `GET /dashboard/stats` and `/dashboard/charts`
  results are cacheable (short TTL, e.g. 30–60s) since they're expensive
  aggregations that don't need per-request freshness at dashboard scale — this
  is added in Phase 5 with a lightweight in-memory/Redis-ready cache
  abstraction in the repository layer (interface-first, so swapping in Redis
  later doesn't touch services).
- **Stateless API**: JWT-based auth (no server session store) lets Render
  scale the API horizontally without sticky sessions.
- **Compression + pagination caps**: `compression` middleware on all
  responses; `limit` query param hard-capped server-side (max 100) regardless
  of what the client requests, to prevent accidental unbounded queries.

## 6. Security Decisions (expanded in Phase 5, decided here)

- `helmet()` for secure headers (CSP, HSTS, etc.).
- `express-mongo-sanitize` to strip `$`/`.` operator injection from
  `req.body`/`req.query`/`req.params`.
- All input validated at the edge (`validators/`) before touching services —
  defense in depth, not just relying on Mongoose schema validation.
- Rate limiting: stricter limits on `/auth/login` (brute-force protection)
  than on read endpoints.
- File upload: `multer` with `fileFilter` restricted to `.csv/.json/.xlsx`
  MIME types + extension check, size cap (e.g. 25MB), and files processed
  from memory buffer — never written to disk unvalidated.
- Secrets only via `.env`, validated at boot, never committed
  (`.env.example` committed instead).
- Passwords (if local auth is used) hashed with `bcrypt` (cost factor 12).

## 7. Tech Stack Rationale (brief)

| Choice | Why |
|---|---|
| TanStack Query over Redux for server state | Eliminates manual cache/loading/error boilerplate; built-in stale-time, refetch, optimistic updates — exactly what a log dashboard needs. |
| Zustand over Context for UI state | No provider nesting, selective re-renders, trivial persistence middleware. |
| Repository pattern in backend | Isolates MongoDB/Mongoose specifics from business logic; enables unit testing services without a DB. |
| bulkWrite w/ ordered:false | Lets large CSV imports skip bad rows instead of aborting the whole batch. |
| Compound + text indexes | Server-side search/filter/sort at 10k–50k+ scale needs index-backed queries, not full collection scans. |

## 8. What's Next
- **Phase 2**: full backend implementation (models, repositories, services,
  controllers, routes, middleware, validators — all wired and runnable).
- **Phase 3**: full frontend implementation (table, filters, drawer, forms,
  charts wiring).
- **Phase 4**: cinematic 3D/glassmorphism UI layer.
- **Phase 5**: performance + security hardening pass.
- **Phase 6**: tests, Docker, CI/CD, deployment docs.
