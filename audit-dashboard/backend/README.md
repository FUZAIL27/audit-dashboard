# Audit Dashboard — Backend API

Node.js / Express / TypeScript / MongoDB (Mongoose) API implementing Clean
Architecture with a Repository Pattern. See `/docs` at the project root for
full architecture, database, and API design docs.

## Setup

```bash
cp .env.example .env
# edit .env with your MongoDB Atlas URI and JWT secrets (32+ char random strings)

npm install
npm run dev    # starts on http://localhost:5000
# an "admin" / "Admin@123" account is created automatically on first boot
```

## Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start with hot-reload (ts-node + nodemon) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled build (production) |
| `npm run seed` | Create the initial admin user |
| `npm test` | Run Jest test suite |
| `npm run lint` | ESLint over `src/` |

## Layers

```
routes → validators → controllers → services → repositories → models → MongoDB
```

- **routes/** — URL + HTTP method wiring only.
- **validators/** — express-validator chains; requests are rejected before
  reaching a controller if invalid.
- **controllers/** — parse `req`, call a service, shape the HTTP response.
  No business logic, no direct Mongoose access.
- **services/** — business logic, transactions, orchestration.
- **repositories/** — the only layer that imports a Mongoose model.
- **models/** — schema + indexes only.

## Auth

**Registration is disabled.** This system provisions exactly one
administrator account, seeded automatically on every server startup
(idempotent — safe on every restart/redeploy, never creates a duplicate).
`POST /api/auth/signup` and `POST /api/auth/register` both return
`403 Registration Disabled` rather than a bare 404, so any stray client
code calling them gets an explicit answer.

- `POST /api/auth/login` — `{ username, password }`, returns a short-lived
  JWT access token in the body and sets an httpOnly refresh-token cookie.
- `POST /api/auth/refresh` reads the cookie and issues a new access token.
- `GET /api/auth/me` returns the authenticated caller's own profile — used
  by the frontend to re-hydrate the admin's identity after a page reload.
- Send `Authorization: Bearer <accessToken>` on all other requests.

Change `ADMIN_USERNAME`/`ADMIN_PASSWORD` via environment variables before
any real deployment — the server logs a warning on startup if either
default is still active under `NODE_ENV=production`.

## Testing

Four distinct test categories, all under `src/`:

| Category | Location | What it checks |
|---|---|---|
| **Unit** | `utils/userMapper.test.ts`, `services/auth.service.test.ts`, `utils/rowValidator.test.ts` | Pure functions and service logic in isolation, with the repository mocked via `jest.mock` — no database. |
| **Integration** | `tests/auth.integration.test.ts`, `tests/auditLog.integration.test.ts` | Full request → route → service → repository → MongoDB (in-memory) flow via Supertest. |
| **API contract** | `tests/api-contract.test.ts` | Response envelope shape (`{success,data}`/`{success,error}`), status codes, and security/rate-limit headers — independent of business logic correctness. |
| **Validation** | `tests/validators/*.test.ts` | Validator chains mounted on a bare Express app with no database and no auth — isolates a 400 caused by a bad validation rule from a 400 caused by anything else. |

```bash
npm test              # runs all four categories
npm test -- --coverage
```


## Bulk Upload

`POST /api/logs/upload` (multipart, field `file`) accepts `.csv`, `.json`,
`.xlsx`, `.xls`, streams the parsed rows through Zod validation, fingerprints
each row (SHA-256 of `actor|action|resource|ipAddress|timestamp`) to
deduplicate within the file and against existing DB records, then inserts in
batches of `UPLOAD_BATCH_SIZE` (default 1000) via `bulkWrite({ ordered:
false })` so a handful of bad rows never abort the whole import.

## Docker

```bash
docker build -t audit-dashboard-backend .
docker run -p 5000:5000 --env-file .env audit-dashboard-backend
```

## Deployment (Render)

1. New Web Service → connect this repo/subfolder (`backend`).
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add all variables from `.env.example` in the Render dashboard's
   Environment settings (use a real MongoDB Atlas URI and strong JWT
   secrets).
