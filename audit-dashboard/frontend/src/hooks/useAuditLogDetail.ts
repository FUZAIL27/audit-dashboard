import { useQuery } from '@tanstack/react-query';
import { auditLogService } from '@/services/auditLog.service';
import { queryKeys } from '@/constants/queryKeys';

export function useAuditLogDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.logs.detail(id ?? ''),
    queryFn: () => auditLogService.getById(id as string),
    enabled: Boolean(id),
  });
}
