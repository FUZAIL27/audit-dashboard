import { apiClient } from './axiosClient';
import { DashboardStats, DashboardCharts, AuditLog } from '@/types/auditLog.types';

export const dashboardService = {
  async getStats(dateFrom?: string, dateTo?: string): Promise<DashboardStats> {
    const { data } = await apiClient.get('/dashboard/stats', { params: { dateFrom, dateTo } });
    return data.data as DashboardStats;
  },

  async getCharts(
    dateFrom?: string,
    dateTo?: string,
    granularity: 'day' | 'hour' = 'day'
  ): Promise<DashboardCharts> {
    const { data } = await apiClient.get('/dashboard/charts', {
      params: { dateFrom, dateTo, granularity },
    });
    return data.data as DashboardCharts;
  },

  async getActivity(limit = 20): Promise<Partial<AuditLog>[]> {
    const { data } = await apiClient.get('/dashboard/activity', { params: { limit } });
    return data.data;
  },
};
