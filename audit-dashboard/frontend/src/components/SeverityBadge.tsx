import { Severity, SEVERITY_LABELS } from '@/constants/enums';
import { cn } from '@/utils/cn';

const DOT_CLASSES: Record<Severity, string> = {
  [Severity.CRITICAL]: 'bg-severity-critical',
  [Severity.HIGH]: 'bg-severity-high',
  [Severity.MEDIUM]: 'bg-severity-medium',
  [Severity.LOW]: 'bg-severity-low',
};

const TEXT_CLASSES: Record<Severity, string> = {
  [Severity.CRITICAL]: 'text-severity-critical bg-severity-critical/10 border-severity-critical/25',
  [Severity.HIGH]: 'text-severity-high bg-severity-high/10 border-severity-high/25',
  [Severity.MEDIUM]: 'text-severity-medium bg-severity-medium/10 border-severity-medium/25',
  [Severity.LOW]: 'text-severity-low bg-severity-low/10 border-severity-low/25',
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium',
        TEXT_CLASSES[severity]
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT_CLASSES[severity])} />
      {SEVERITY_LABELS[severity]}
    </span>
  );
}
