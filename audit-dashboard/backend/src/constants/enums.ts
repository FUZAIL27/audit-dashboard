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

/**
 * Admin-only authentication: a single administrator account is the only
 * account type in the system. `UserRole` is still an enum (rather than a
 * hardcoded string) purely so role checks stay type-safe and the system
 * can be extended later without touching every call site.
 */
export enum UserRole {
  ADMIN = 'admin',
}

// Valid forward transitions for a log's status (prevents nonsensical jumps,
// e.g. resolved -> pending without going through investigating).
export const STATUS_TRANSITIONS: Record<LogStatus, LogStatus[]> = {
  [LogStatus.PENDING]: [LogStatus.INVESTIGATING, LogStatus.IGNORED, LogStatus.RESOLVED],
  [LogStatus.INVESTIGATING]: [LogStatus.RESOLVED, LogStatus.IGNORED, LogStatus.PENDING],
  [LogStatus.RESOLVED]: [LogStatus.INVESTIGATING],
  [LogStatus.IGNORED]: [LogStatus.PENDING, LogStatus.INVESTIGATING],
};

export const SORTABLE_FIELDS = [
  'timestamp',
  'actor',
  'action',
  'severity',
  'status',
  'region',
  'createdAt',
] as const;

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;
