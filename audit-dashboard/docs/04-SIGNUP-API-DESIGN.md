# Signup / Registration — API Design (Phase 1 Addendum)

## Why this wasn't in the original design

The original API design (`03-API-DESIGN.md`) only specified `POST /api/auth/login`,
on the assumption that enterprise security tools provision accounts via an
admin-created seed user (`npm run seed`) plus internal HR/IT onboarding — not
public self-registration. Since you've asked for signup explicitly, here is
the design for it, reconciled with the existing RBAC model.

## Decision: invite-free self-signup, `viewer` role by default

To avoid an unauthenticated endpoint being able to mint `admin` accounts:

- `POST /api/auth/signup` is **public** (no auth required) but always creates
  a `viewer`-role account, regardless of what the request body contains.
- Elevating a `viewer` to `security_analyst`/`admin` is an existing
  authenticated `admin`-only action (new endpoint, see below) — never
  something the signup payload itself can request.

This is the same pattern used by Datadog/Vercel/Linear-style tools: anyone
can create an account, but meaningful access is granted after the fact by
someone who already has it.

---

## POST /api/auth/signup

**Auth**: none
**Rate limit**: strict (5 req / 15 min / IP — same tier as login, prevents
account-enumeration and mass-registration abuse)

Request:
```json
{
  "name": "Jane Analyst",
  "email": "jane@company.com",
  "password": "StrongPassword123!",
  "confirmPassword": "StrongPassword123!"
}
```

Password policy (enforced server-side, mirrored client-side for UX):
- Minimum 8 characters
- At least one uppercase, one lowercase, one digit
- `confirmPassword` must match `password`

Response `201`:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "...", "email": "jane@company.com", "name": "Jane Analyst", "role": "viewer" }
  }
}
```
Sets the same httpOnly refresh cookie as login. Signup logs the user in
immediately — no separate "please log in" step.

Errors:
- `409 CONFLICT` — email already registered
- `400 VALIDATION_ERROR` — weak password, mismatched confirmation, invalid email
- `429 RATE_LIMITED`

---

## PATCH /api/users/:id/role  *(new — admin-only role elevation)*

**Auth**: `admin` only

Request:
```json
{ "role": "security_analyst" }
```

Response `200`: updated user object (id, email, name, role).
Errors: `404 NOT_FOUND`, `403 FORBIDDEN`, `422 UNPROCESSABLE_ENTITY` (invalid role value).

This is the only path by which a `viewer` account gains elevated access,
and it requires an existing `admin` to act — closing the loop opened by
public signup.

---

## GET /api/auth/me  *(new — needed by the frontend)*

**Auth**: any authenticated role

Returns the current user's profile from the access token's `sub` claim.
This fixes a real gap from the earlier build: the frontend's session
bootstrap (`useSessionBootstrap`) could refresh the *access token* after a
page reload, but had no way to re-fetch the *user's name/role* — `user` was
silently `null` until the next login. This endpoint closes that gap.

Response `200`:
```json
{ "success": true, "data": { "id": "...", "email": "...", "name": "...", "role": "viewer" } }
```
