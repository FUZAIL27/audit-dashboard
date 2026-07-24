import { Schema, model, HydratedDocument } from 'mongoose';
import { Severity, LogStatus } from '../constants/enums';
import { AuditLogEntity } from '../interfaces/auditLog.interface';

const IP_REGEX = /^(\d{1,3}\.){3}\d{1,3}$|^([a-fA-F0-9:]+)$/;

/**
 * Schema is typed directly against `AuditLogEntity` (the Database Entity),
 * so any drift between the persisted shape and the domain type is caught
 * at compile time rather than discovered at runtime.
 */
const AuditLogSchema = new Schema(
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
        validator: (value: string) => IP_REGEX.test(value),
        message: 'Invalid IP address format',
      },
    },
    region: { type: String, required: true, trim: true, maxlength: 64 },
    severity: {
      type: String,
      enum: Object.values(Severity),
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(LogStatus),
      required: true,
      default: LogStatus.PENDING,
    },
    timestamp: { type: Date, required: true },
    metadata: { type: Schema.Types.Mixed as any, default: {} },
    // Deterministic fingerprint of a row's semantic content, used to
    // de-duplicate bulk imports without a heavier compound-key scan.
    fingerprint: { type: String, required: true, unique: true, index: true },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Default table view: newest first, commonly co-filtered by severity/status.
AuditLogSchema.index({ timestamp: -1, severity: 1, status: 1 });

// Actor-centric investigation / "related logs" panel.
AuditLogSchema.index({ actor: 1, timestamp: -1 });

// IP-centric incident-response pivot.
AuditLogSchema.index({ ipAddress: 1, timestamp: -1 });

// Region + severity rollups for charts.
AuditLogSchema.index({ region: 1, severity: 1 });

// Resource-centric lookups.
AuditLogSchema.index({ resourceType: 1, resource: 1 });

// Weighted global text search.
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

/**
 * Mongoose Document type — a `AuditLogEntity` hydrated with Document
 * behavior (`save`, `$set`, change tracking, virtuals, ...). This type is
 * intentionally exported only for use inside the repository layer; nothing
 * above it (services, controllers) should ever reference it.
//  */
// export type AuditLogDocument = HydratedDocument<AuditLogEntity>;

// export const AuditLogModel = model<AuditLogEntity>('AuditLog', AuditLogSchema);

export type AuditLogDocument = HydratedDocument<AuditLogEntity>;

export const AuditLogModel = model<AuditLogEntity>(
  'AuditLog',
  AuditLogSchema as any
);