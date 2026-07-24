# Database Design (Phase 1)

## 1. Collections

### `auditlogs`
The core collection. Designed for 10,000–50,000+ documents with heavy
read/filter/search/aggregate traffic and comparatively low write traffic
(bulk imports + occasional status updates).

### `users`
Backing `POST /api/auth/login` and RBAC.

## 2. `AuditLog` Schema (Mongoose, TypeScript)

```typescript
// backend/src/models/auditLog.model.ts
import { Schema, model, Document, Types } from 'mongoose';

export enum Severity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum LogStatus {
  PENDING = 'pending',
  INVESTIGATING = 'investigating',
  RESOLVED = 'resolved',
  IGNORED = 'ignored',
}

export interface IAuditLog extends Document {
  _id: Types.ObjectId;
  actor: string;              // who performed the action (email or username)
  role: string;                // role of the actor at time of action
  action: string;              // e.g. "USER_LOGIN", "PERMISSION_CHANGE"
  resource: string;            // e.g. "arn:aws:s3:::bucket/file.pdf"
  resourceType: string;        // e.g. "S3_BUCKET", "IAM_ROLE", "DATABASE"
  ipAddress: string;
  region: string;              // e.g. "us-east-1", "eu-west-2"
  severity: Severity;
  status: LogStatus;
  timestamp: Date;             // when the event actually occurred (source system time)
  metadata?: Record<string, unknown>; // raw/extra fields from ingested source
  createdAt: Date;             // when the record was ingested (Mongoose managed)
  updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
  {
    actor: { type: String, required: true, trim: true, maxlength: 256 },
    role: { type: String, required: true, trim: true, maxlength: 64 },
    action: { type: String, required: true, trim: true, maxlength: 128 },
    resource: { type: String, required: true, trim: true, maxlength: 512 },
    resourceType: { type: String, required: true, trim: true, maxlength: 64 },
    ipAddress: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (v: string) =>
          /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/.test(v),
        message: 'Invalid IP address format',
      },
    },
    region: { type: String, required: true, trim: true, maxlength: 64 },
    severity: {
      type: String,
      enum: Object.values(Severity),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(LogStatus),
      required: true,
      default: LogStatus.PENDING,
      index: true,
    },
    timestamp: { type: Date, required: true, index: true },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  {
    timestamps: true, // createdAt / updatedAt
    versionKey: false,
  }
);

// ---- Indexes ----

// 1. Primary sort/filter path: dashboards & default table view sort by
//    timestamp desc, frequently filtered by severity/status alongside it.
AuditLogSchema.index({ timestamp: -1, severity: 1, status: 1 });

// 2. Actor-centric investigation (e.g. "show me everything this user did").
AuditLogSchema.index({ actor: 1, timestamp: -1 });

// 3. IP-centric investigation (e.g. incident response: "what did this IP touch").
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// 4. Region + severity rollups (used by charts: severity distribution by region).
AuditLogSchema.index({ region: 1, severity: 1 });

// 5. Resource-centric lookups.
AuditLogSchema.index({ resourceType: 1, resource: 1 });

// 6. Global text search across the fields listed in SEARCH requirements.
AuditLogSchema.index(
  {
    actor: 'text',
    action: 'text',
    role: 'text',
    ipAddress: 'text',
    resource: 'text',
    resourceType: 'text',
    region: 'text',
  },
  {
    name: 'AuditLogGlobalTextIndex',
    weights: { actor: 5, action: 4, resource: 3, ipAddress: 2, region: 1 },
  }
);

export const AuditLogModel = model<IAuditLog>('AuditLog', AuditLogSchema);
```

### Index rationale

| Index | Serves |
|---|---|
| `{ timestamp: -1, severity: 1, status: 1 }` | Default table view: newest first, commonly co-filtered with severity/status. Compound order matches equality-then-range/sort MongoDB index rules (severity/status as near-equality filters, timestamp as the sort key leads since it's almost always present). |
| `{ actor: 1, timestamp: -1 }` | "All activity by this user" drill-downs and the detail drawer's "related logs" panel. |
| `{ ipAddress: 1, timestamp: -1 }` | Incident response workflows: pivot from an IP to its full timeline. |
| `{ region: 1, severity: 1 }` | Powers the severity-by-region breakdown used in charts without a collection scan. |
| `{ resourceType: 1, resource: 1 }` | Resource-centric filtering (`resourceType` facet in the filter panel). |
| Text index (weighted) | Backs the single global search box; `actor`/`action` weighted highest since those are the most common search intents. |

At 50k+ documents, every list/search/filter endpoint is written so its query
shape is coverable by one of the above (verified via `.explain('executionStats')`
in Phase 2's test suite — no endpoint should produce `COLLSCAN`).

## 3. `User` Schema (summary — full detail in Phase 2)

```typescript
interface IUser {
  _id: Types.ObjectId;
  email: string;        // unique, indexed
  passwordHash: string;
  name: string;
  role: 'admin' | 'security_analyst' | 'viewer';
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```
`email` gets a unique index. Passwords hashed with bcrypt (never stored or
logged in plaintext).

## 4. Aggregation Pipelines (design, implemented Phase 2)

- **`GET /dashboard/stats`** — single `$facet` pipeline computing: total count,
  today's count (`$match timestamp >= startOfDay`), counts per severity, counts
  per status, `$group` distinct actor count, and most recent `createdAt`
  (latest upload) — all in one round trip to avoid 6+ separate queries.
- **`GET /dashboard/charts`** — separate pipelines for:
  - Activity timeline: `$group by { $dateTrunc: { unit: 'day' } }` over a
    date range, count per day.
  - Severity distribution: `$group by severity`.
  - Heatmap: `$group by { dayOfWeek, hour }` derived from `timestamp`.

## 5. Bulk Insert Strategy

- Parse → validate each row against the Zod/Mongoose-shape schema in memory
  (not persisted) → partition into `valid[]` / `invalid[]` with reasons.
- Deduplicate within the batch using a composite fingerprint (e.g. hash of
  `actor+action+resource+timestamp+ipAddress`) before insert.
- Insert `valid[]` in chunks (default 1000/batch) via
  `AuditLogModel.bulkWrite(ops, { ordered: false })`.
- Duplicate key errors (from a unique fingerprint index, if enabled) are
  caught per-batch and counted rather than aborting the import.
- Response returns `{ insertedCount, duplicateCount, failedCount,
  executionTimeMs, memoryUsageMb, rows: { invalid: [...reasons] } }`.
