import { Severity, LogStatus } from '@/constants/enums';

export interface AuditLog {
  _id: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  resourceType: string;
  ipAddress: string;
  region: string;
  severity: Severity;
  status: LogStatus;
  timestamp: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDetail extends AuditLog {
  relatedLogs: AuditLog[];
}

export interface AuditLogListParams {
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
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface AuditLogListResponse {
  success: true;
  data: AuditLog[];
  meta: PaginationMeta;
}

export interface BulkImportSummary {
  insertedCount: number;
  duplicateCount: number;
  failedCount: number;
  totalRows: number;
  executionTimeMs: number;
  memoryUsageMb: number;
  invalidSample: { row: number; reason: string }[];
}

export interface DashboardStats {
  todayLogs: number;
  totalLogs: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
  uniqueActors: number;
  latestUpload: string | null;
  latestActivity: string | null;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface DashboardCharts {
  timeline: ChartDataPoint[];
  severityDistribution: { severity: string; count: number }[];
  regionBreakdown: { region: string; count: number }[];
  heatmap: { dayOfWeek: number; hour: number; count: number }[];
}
