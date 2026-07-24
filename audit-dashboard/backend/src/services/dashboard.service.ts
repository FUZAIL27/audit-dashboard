import { auditLogRepository } from '../repositories/auditLog.repository';
import { DashboardStats, DashboardCharts, AuditLogActivityItem } from '../interfaces/auditLog.interface';
import { cache } from '../utils/cache';

const STATS_TTL_MS = 30_000;
const CHARTS_TTL_MS = 60_000;

export class DashboardService {
  async getStats(dateFrom?: Date, dateTo?: Date): Promise<DashboardStats> {
    const cacheKey = `dashboard:stats:${dateFrom?.toISOString() ?? ''}:${dateTo?.toISOString() ?? ''}`;
    const cached = cache.get<DashboardStats>(cacheKey);
    if (cached) return cached;

    const stats = await auditLogRepository.getStats(dateFrom, dateTo);
    cache.set(cacheKey, stats, STATS_TTL_MS);
    return stats;
  }

  async getCharts(
    dateFrom?: Date,
    dateTo?: Date,
    granularity: 'day' | 'hour' = 'day'
  ): Promise<DashboardCharts> {
    const cacheKey = `dashboard:charts:${dateFrom?.toISOString() ?? ''}:${dateTo?.toISOString() ?? ''}:${granularity}`;
    const cached = cache.get<DashboardCharts>(cacheKey);
    if (cached) return cached;

    const charts = await auditLogRepository.getCharts(dateFrom, dateTo, granularity);
    cache.set(cacheKey, charts, CHARTS_TTL_MS);
    return charts;
  }

  async getActivity(limit = 20): Promise<AuditLogActivityItem[]> {
    return auditLogRepository.getRecentActivity(limit);
  }
}

export const dashboardService = new DashboardService();
