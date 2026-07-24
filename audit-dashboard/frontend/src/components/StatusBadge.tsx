import { LogStatus, STATUS_LABELS } from '@/constants/enums';
import { cn } from '@/utils/cn';

const TEXT_CLASSES: Record<LogStatus, string> = {
  [LogStatus.PENDING]: 'text-status-pending bg-status-pending/10 border-status-pending/25',
  [LogStatus.INVESTIGATING]: 'text-status-investigating bg-status-investigating/10 border-status-investigating/25',
  [LogStatus.RESOLVED]: 'text-status-resolved bg-status-resolved/10 border-status-resolved/25',
  [LogStatus.IGNORED]: 'text-status-ignored bg-status-ignored/10 border-status-ignored/25',
};

export function StatusBadge({ status }: { status: LogStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', TEXT_CLASSES[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}
