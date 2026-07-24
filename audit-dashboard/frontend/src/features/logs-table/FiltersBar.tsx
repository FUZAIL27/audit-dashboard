import { Search, X, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { useFiltersStore } from '@/store/filters.store';
import { Severity, LogStatus, SEVERITY_LABELS, STATUS_LABELS } from '@/constants/enums';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

function FilterChip({
  label,
  active,
  onClick,
  colorClass,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  colorClass: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border px-2.5 py-1 text-xs font-medium transition-colors',
        active ? colorClass : 'border-border text-text-muted hover:text-text-secondary hover:border-border-strong'
      )}
    >
      {label}
    </button>
  );
}

const SEVERITY_ACTIVE_CLASSES: Record<Severity, string> = {
  [Severity.CRITICAL]: 'border-severity-critical/50 bg-severity-critical/10 text-severity-critical',
  [Severity.HIGH]: 'border-severity-high/50 bg-severity-high/10 text-severity-high',
  [Severity.MEDIUM]: 'border-severity-medium/50 bg-severity-medium/10 text-severity-medium',
  [Severity.LOW]: 'border-severity-low/50 bg-severity-low/10 text-severity-low',
};

const STATUS_ACTIVE_CLASSES: Record<LogStatus, string> = {
  [LogStatus.PENDING]: 'border-status-pending/50 bg-status-pending/10 text-status-pending',
  [LogStatus.INVESTIGATING]: 'border-status-investigating/50 bg-status-investigating/10 text-status-investigating',
  [LogStatus.RESOLVED]: 'border-status-resolved/50 bg-status-resolved/10 text-status-resolved',
  [LogStatus.IGNORED]: 'border-status-ignored/50 bg-status-ignored/10 text-status-ignored',
};

export function FiltersBar() {
  const {
    search,
    severity,
    status,
    setSearch,
    toggleSeverity,
    toggleStatus,
    resetFilters,
  } = useFiltersStore();

  const [expanded, setExpanded] = useState(false);
  const hasActiveFilters = severity.length > 0 || status.length > 0 || search.length > 0;

  return (
    <div className="glass-panel p-3 space-y-3 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 min-w-0">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <Input
            placeholder="Search actor, action, IP, resource, region…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={expanded ? 'primary' : 'secondary'}
            size="md"
            onClick={() => setExpanded((e) => !e)}
          >
            <SlidersHorizontal size={14} />
            Filters
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="md" onClick={resetFilters}>
              <X size={14} />
              Clear
            </Button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-border pt-3">
          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
              Severity
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(Severity).map((s) => (
                <FilterChip
                  key={s}
                  label={SEVERITY_LABELS[s]}
                  active={severity.includes(s)}
                  onClick={() => toggleSeverity(s)}
                  colorClass={SEVERITY_ACTIVE_CLASSES[s]}
                />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-text-muted">
              Status
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.values(LogStatus).map((s) => (
                <FilterChip
                  key={s}
                  label={STATUS_LABELS[s]}
                  active={status.includes(s)}
                  onClick={() => toggleStatus(s)}
                  colorClass={STATUS_ACTIVE_CLASSES[s]}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
