import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { auditLogService } from '@/services/auditLog.service';
import { queryKeys } from '@/constants/queryKeys';

export function useUploadLogs() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState(0);

  const mutation = useMutation({
    mutationFn: (file: File) => {
      setProgress(0);
      return auditLogService.upload(file, setProgress);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.logs.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return { ...mutation, progress };
}
