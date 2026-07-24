import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '@/services/dashboard.service';
import { queryKeys } from '@/constants/queryKeys';

export function useDashboardStats(dateFrom?: string, dateTo?: string) {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(dateFrom, dateTo),
    queryFn: () => dashboardService.getStats(dateFrom, dateTo),
    staleTime: 20_000,
    refetchInterval: 30_000,
  });
}

export function useDashboardCharts(
  dateFrom?: string,
  dateTo?: string,
  granularity: 'day' | 'hour' = 'day'
) {
  return useQuery({
    queryKey: queryKeys.dashboard.charts(dateFrom, dateTo, granularity),
    queryFn: () => dashboardService.getCharts(dateFrom, dateTo, granularity),
    staleTime: 30_000,
  });
}

export function useDashboardActivity(limit = 20) {
  return useQuery({
    queryKey: queryKeys.dashboard.activity,
    queryFn: () => dashboardService.getActivity(limit),
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}
