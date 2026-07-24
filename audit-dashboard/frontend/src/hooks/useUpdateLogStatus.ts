import { useMutation, useQueryClient } from '@tanstack/react-query';
import { auditLogService } from '@/services/auditLog.service';
import { queryKeys } from '@/constants/queryKeys';
import { LogStatus } from '@/constants/enums';
import { AuditLog } from '@/types/auditLog.types';

export function useUpdateLogStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: LogStatus }) =>
      auditLogService.updateStatus(id, status),

    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.logs.detail(id) });
      const previous = queryClient.getQueryData(queryKeys.logs.detail(id));

      queryClient.setQueryData(
        queryKeys.logs.detail(id),
        (old: AuditLog | undefined) => old && { ...old, status }
      );

      return { previous };
    },

    onError: (_err, { id }, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKeys.logs.detail(id), context.previous);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logs.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}
