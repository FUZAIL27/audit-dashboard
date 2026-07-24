import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditLogService } from '@/services/auditLog.service';
import { queryKeys } from '@/constants/queryKeys';

export function useDeleteLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => auditLogService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logs.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
