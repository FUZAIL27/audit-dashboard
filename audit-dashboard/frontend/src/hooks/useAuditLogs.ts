import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { auditLogService } from '@/services/auditLog.service';
import { queryKeys } from '@/constants/queryKeys';
import { useFiltersStore } from '@/store/filters.store';
import { useDebounce } from './useDebounce';

export function useAuditLogs() {
  const filters = useFiltersStore();
  const debouncedSearch = useDebounce(filters.search, 350);

  const params = {
    page: filters.page,
    limit: filters.limit,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
    search: debouncedSearch || undefined,
    severity: filters.severity.length ? filters.severity : undefined,
    status: filters.status.length ? filters.status : undefined,
    region: filters.region.length ? filters.region : undefined,
    resourceType: filters.resourceType.length ? filters.resourceType : undefined,
    dateFrom: filters.dateFrom,
    dateTo: filters.dateTo,
  };

  return useQuery({
    queryKey: queryKeys.logs.list(params),
    queryFn: () => auditLogService.list(params),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });
}
