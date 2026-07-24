import { Types } from 'mongoose';
import { Severity, LogStatus } from '../constants/enums';

/**
 * Recursive JSON-compatible value type. Used for the schemaless `metadata`
 * field instead of `any`/`unknown` so every shape it can take is still
 * statically known and narrowable.
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = any;
/**
 * Database Entity.
 *
 * 
 * The canonical, framework-agnostic shape of a persisted audit log record.
 * This is the type repositories return to services (materialized via
 * `.lean()` or `.toObject()`) — it never carries Mongoose Document
 * behavior (`save`, `$set`, `populate`, change-tracking, etc.). Services,
 * controllers, and everything above the repository layer depend only on
 * this type, never on Mongoose's `Document`/`HydratedDocument`.
 */
export interface AuditLogEntity {
  _id: Types.ObjectId;
  actor: string;
  role: string;
  action: string;
  resource: string;
  resourceType: string;
  ipAddress: string;
  region: string;
  severity: Severity;
  status: LogStatus;
  timestamp: Date;
  metadata: Record<string, JsonValue>;
  fingerprint: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO — fields required to persist a new audit log record. Derived from
 * the entity by omitting database/server-generated fields, so the two can
 * never drift out of sync.
 */
export type AuditLogCreateInput = Omit<AuditLogEntity, '_id' | 'createdAt' | 'updatedAt'>;

/**
 * DTO — server-side list query parameters, already validated and coerced
 * by the validators layer before reaching the service.
 */
export interface AuditLogListQuery {
  page: number;
  limit: number;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  severity?: Severity[];
  status?: LogStatus[];
  role?: string[];
  region?: string[];
  actor?: string;
  action?: string;
  resourceType?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

/** DTO — paginated list result returned by the repository to the service. */
export interface AuditLogListResult {
  logs: AuditLogEntity[];
  totalCount: number;
}

/** DTO — single log plus its correlated logs, for the detail endpoint. */
export interface AuditLogDetailResult {
  log: AuditLogEntity;
  relatedLogs: AuditLogEntity[];
}

/** DTO — a single row-level failure surfaced during bulk import. */
export interface BulkImportRowError {
  row: number;
  reason: string;
}

/** DTO — API response payload for `POST /logs/upload`. */
export interface BulkImportSummary {
  insertedCount: number;
  duplicateCount: number;
  failedCount: number;
  totalRows: number;
  executionTimeMs: number;
  memoryUsageMb: number;
  invalidSample: BulkImportRowError[];
}

/**
 * DTO — API response payload for `GET /dashboard/stats`.
 *
 * `bySeverity`/`byStatus` are `Partial` because an aggregation pipeline
 * only emits buckets for values actually present in the collection; a
 * fully-populated `Record` would misrepresent an empty bucket as a type
 * guarantee that doesn't hold at runtime.
 */
export interface DashboardStats {
  todayLogs: number;
  totalLogs: number;
  bySeverity: Partial<Record<Severity, number>>;
  byStatus: Partial<Record<LogStatus, number>>;
  uniqueActors: number;
  latestUpload: Date | null;
  latestActivity: Date | null;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface SeverityDistributionPoint {
  severity: Severity;
  count: number;
}

export interface RegionBreakdownPoint {
  region: string;
  count: number;
}

export interface HeatmapPoint {
  dayOfWeek: number;
  hour: number;
  count: number;
}

/** DTO — API response payload for `GET /dashboard/charts`. */
export interface DashboardCharts {
  timeline: ChartDataPoint[];
  severityDistribution: SeverityDistributionPoint[];
  regionBreakdown: RegionBreakdownPoint[];
  heatmap: HeatmapPoint[];
}

/**
 * DTO — lightweight projection used by the live activity feed
 * (`GET /dashboard/activity`). Mirrors the exact field projection issued
 * by the repository query, including the implicitly-included `_id`.
 */
export type AuditLogActivityItem = Pick<
  AuditLogEntity,
  '_id' | 'actor' | 'action' | 'severity' | 'status' | 'timestamp'
>;
