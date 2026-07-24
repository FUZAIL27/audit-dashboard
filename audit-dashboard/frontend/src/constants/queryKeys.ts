import { AuditLogListParams } from '@/types/auditLog.types';

export const queryKeys = {
  logs: {
    all: ['logs'] as const,
    list: (params: AuditLogListParams) => ['logs', 'list', params] as const,
    detail: (id: string) => ['logs', 'detail', id] as const,
  },
  dashboard: {
    stats: (dateFrom?: string, dateTo?: string) =>
      ['dashboard', 'stats', dateFrom, dateTo] as const,
    charts: (dateFrom?: string, dateTo?: string, granularity?: string) =>
      ['dashboard', 'charts', dateFrom, dateTo, granularity] as const,
    activity: ['dashboard', 'activity'] as const,
  },
};
