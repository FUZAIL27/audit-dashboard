# API Design (Phase 1)

Base URL: `/api`. All responses use a consistent envelope:

```typescript
// Success
{ "success": true, "data": <payload>, "meta"?: {...} }

// Error
{ "success": false, "error": { "code": string, "message": string, "details"?: any } }
```

---

## POST /api/auth/login

**Auth**: none
**Rate limit**: strict (e.g. 5 req / 15 min / IP)

Request:
```json
{ "email": "analyst@company.com", "password": "string" }
```

Response `200`:
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "...", "email": "...", "name": "...", "role": "security_analyst" }
  }
}
```
Sets `refreshToken` as an httpOnly, secure, sameSite=strict cookie.

Errors: `401 INVALID_CREDENTIALS`, `429 RATE_LIMITED`.

---

## POST /api/logs/upload

**Auth**: `admin`, `security_analyst`
**Content-Type**: `multipart/form-data`, field name `file`
**Accepts**: `.csv`, `.json`, `.xlsx` (max 25MB, configurable)

Response `201`:
```json
{
  "success": true,
  "data": {
    "insertedCount": 48213,
    "duplicateCount": 1204,
    "failedCount": 583,
    "totalRows": 50000,
    "executionTimeMs": 4123,
    "memoryUsageMb": 187.4,
    "invalidSample": [
      { "row": 42, "reason": "severity must be one of critical|high|medium|low" }
    ]
  }
}
```
`invalidSample` is capped (e.g. first 50 failures) — not all 50,000 rows echoed
back. Errors: `400 INVALID_FILE_TYPE`, `413 FILE_TOO_LARGE`, `422 NO_VALID_ROWS`.

---

## GET /api/logs

**Auth**: any authenticated role
**Query params** (all optional, server validates/coerces):

| Param | Type | Notes |
|---|---|---|
| `page` | number | default 1 |
| `limit` | number | default 25; enum-capped to `10\|25\|50\|100` |
| `sortBy` | string | default `timestamp`; whitelist-validated field name |
| `sortOrder` | `asc\|desc` | default `desc` |
| `search` | string | global text search (actor, action, ip, resource, resourceType, region) |
| `severity` | string or CSV | one or more of `critical,high,medium,low` |
| `status` | string or CSV | one or more of `pending,investigating,resolved,ignored` |
| `role` | string or CSV | |
| `region` | string or CSV | |
| `actor` | string | exact or partial |
| `action` | string | |
| `resourceType` | string or CSV | |
| `dateFrom` | ISO date | inclusive |
| `dateTo` | ISO date | inclusive |

Response `200`:
```json
{
  "success": true,
  "data": [ { "_id": "...", "actor": "...", "action": "...", "...": "..." } ],
  "meta": {
    "page": 1,
    "limit": 25,
    "totalCount": 48213,
    "totalPages": 1929,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## GET /api/logs/:id

Response `200`: full document + (Phase 2) a `relatedLogs` array (same actor or
IP, last 5, excluding self) for the detail drawer.

Errors: `404 LOG_NOT_FOUND`, `400 INVALID_ID`.

---

## PATCH /api/logs/:id/status

**Auth**: `admin`, `security_analyst`

Request:
```json
{ "status": "resolved" }
```

Response `200`: updated document. Errors: `404 LOG_NOT_FOUND`,
`422 INVALID_STATUS_TRANSITION` (if Phase 2 enforces a status state machine,
e.g. `resolved` can't go directly back to `pending` without `investigating`).

---

## DELETE /api/logs/:id

**Auth**: `admin` only

Response `200`: `{ "success": true, "data": { "deletedId": "..." } }`
Errors: `404 LOG_NOT_FOUND`, `403 FORBIDDEN`.

---

## GET /api/dashboard/stats

**Query params**: `dateFrom`, `dateTo` (optional, default = all time / last 30d — TBD Phase 2)

Response `200`:
```json
{
  "success": true,
  "data": {
    "todayLogs": 342,
    "totalLogs": 48213,
    "bySeverity": { "critical": 120, "high": 980, "medium": 5210, "low": 41903 },
    "byStatus": { "pending": 812, "investigating": 140, "resolved": 47100, "ignored": 161 },
    "uniqueActors": 1893,
    "latestUpload": "2026-07-19T22:03:11.000Z",
    "latestActivity": "2026-07-20T09:41:02.000Z"
  }
}
```

---

## GET /api/dashboard/charts

**Query params**: `dateFrom`, `dateTo`, `granularity` (`day\|hour`, default `day`)

Response `200`:
```json
{
  "success": true,
  "data": {
    "timeline": [ { "date": "2026-07-14", "count": 1204 } ],
    "severityDistribution": [ { "severity": "critical", "count": 120 } ],
    "regionBreakdown": [ { "region": "us-east-1", "count": 8213 } ],
    "heatmap": [ { "dayOfWeek": 1, "hour": 14, "count": 88 } ]
  }
}
```

---

## GET /api/dashboard/activity

Recent activity feed (most recent N logs, lightweight projection) for a
live-updating "Latest Activity" panel.

Response `200`:
```json
{
  "success": true,
  "data": [
    { "_id": "...", "actor": "...", "action": "...", "severity": "high", "timestamp": "..." }
  ]
}
```

---

## Standard Error Codes

| HTTP | code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request failed schema validation |
| 401 | `UNAUTHORIZED` | Missing/invalid/expired token |
| 403 | `FORBIDDEN` | Authenticated but lacks role permission |
| 404 | `NOT_FOUND` | Resource doesn't exist |
| 409 | `CONFLICT` | e.g. duplicate unique field |
| 413 | `PAYLOAD_TOO_LARGE` | Upload exceeds size limit |
| 422 | `UNPROCESSABLE_ENTITY` | Semantically invalid (e.g. bad state transition) |
| 429 | `RATE_LIMITED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Unexpected server error (never leaks stack trace in prod) |
