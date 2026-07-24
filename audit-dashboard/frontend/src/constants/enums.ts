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

export enum UserRole {
  ADMIN = 'admin',
  SECURITY_ANALYST = 'security_analyst',
  VIEWER = 'viewer',
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const SEVERITY_LABELS: Record<Severity, string> = {
  [Severity.CRITICAL]: 'Critical',
  [Severity.HIGH]: 'High',
  [Severity.MEDIUM]: 'Medium',
  [Severity.LOW]: 'Low',
};

export const STATUS_LABELS: Record<LogStatus, string> = {
  [LogStatus.PENDING]: 'Pending',
  [LogStatus.INVESTIGATING]: 'Investigating',
  [LogStatus.RESOLVED]: 'Resolved',
  [LogStatus.IGNORED]: 'Ignored',
};
