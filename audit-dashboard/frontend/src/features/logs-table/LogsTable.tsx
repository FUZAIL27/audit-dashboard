import { useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ArrowUpDown, ArrowUp, ArrowDown, Columns3, Copy, Check } from 'lucide-react';
import { useAuditLogs } from '@/hooks/useAuditLogs';
import { useFiltersStore } from '@/store/filters.store';
import { useUIStore } from '@/store/ui.store';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Pagination } from './Pagination';
import { formatDateTime } from '@/utils/formatters';
import { cn } from '@/utils/cn';
import { AuditLog } from '@/types/auditLog.types';

interface ColumnDef {
  key: keyof AuditLog | 'actions';
  label: string;
  sortable?: boolean;
  width: string;
}

const COLUMNS: ColumnDef[] = [
  { key: 'timestamp', label: 'Timestamp', sortable: true, width: 'w-44' },
  { key: 'severity', label: 'Severity', sortable: true, width: 'w-28' },
  { key: 'status', label: 'Status', sortable: true, width: 'w-32' },
  { key: 'actor', label: 'Actor', sortable: true, width: 'w-48' },
  { key: 'action', label: 'Action', sortable: true, width: 'w-40' },
  { key: 'resource', label: 'Resource', width: 'w-56' },
  { key: 'ipAddress', label: 'IP Address', width: 'w-36' },
  { key: 'region', label: 'Region', sortable: true, width: 'w-28' },
];

function CopyableCell({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 1200);
      }}
      className="group flex items-center gap-1.5 font-mono text-xs text-text-secondary hover:text-text-primary"
      title="Copy"
    >
      <span className="truncate">{value}</span>
      {copied ? (
        <Check size={12} className="text-severity-low shrink-0" />
      ) : (
        <Copy size={12} className="opacity-0 group-hover:opacity-100 shrink-0 transition-opacity" />
      )}
    </button>
  );
}

export function LogsTable() {
  const { data, isLoading, isFetching } = useAuditLogs();
  const { sortBy, sortOrder, setSort, page, limit, setPage, setLimit } = useFiltersStore();
  const openDrawer = useUIStore((s) => s.openDrawer);
  const [columnMenuOpen, setColumnMenuOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());

  const parentRef = useRef<HTMLDivElement>(null);
  const rows = data?.data ?? [];

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 52,
    overscan: 12,
  });

  const visibleColumns = COLUMNS.filter((c) => !hiddenColumns.has(c.key));

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSort(key, sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSort(key, 'desc');
    }
  };

  return (
    <div className="glass-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
        <p className="text-xs text-text-muted">
          {isFetching ? 'Refreshing…' : `${data?.meta.totalCount.toLocaleString() ?? 0} results`}
        </p>
        <div className="relative">
          <button
            onClick={() => setColumnMenuOpen((o) => !o)}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-muted hover:text-text-primary hover:bg-base-800"
          >
            <Columns3 size={14} />
            Columns
          </button>
          {columnMenuOpen && (
            <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-lg border border-border bg-base-800 p-2 shadow-panel">
              {COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 rounded px-2 py-1.5 text-xs text-text-secondary hover:bg-base-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!hiddenColumns.has(col.key)}
                    onChange={() =>
                      setHiddenColumns((prev) => {
                        const next = new Set(prev);
                        next.has(col.key) ? next.delete(col.key) : next.add(col.key);
                        return next;
                      })
                    }
                  />
                  {col.label}
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sticky header */}
      <div className="flex border-b border-border bg-base-800/80 px-4 sticky top-0 z-[1]">
        {visibleColumns.map((col) => (
          <button
            key={col.key}
            onClick={() => col.sortable && handleSort(col.key)}
            className={cn(
              'flex items-center gap-1 py-2.5 pr-4 text-left text-xs font-medium uppercase tracking-wide text-text-muted shrink-0',
              col.width,
              col.sortable && 'hover:text-text-primary cursor-pointer'
            )}
          >
            {col.label}
            {col.sortable &&
              (sortBy === col.key ? (
                sortOrder === 'asc' ? (
                  <ArrowUp size={12} />
                ) : (
                  <ArrowDown size={12} />
                )
              ) : (
                <ArrowUpDown size={12} className="opacity-30" />
              ))}
          </button>
        ))}
      </div>

      {/* Body */}
      <div ref={parentRef} className="h-[calc(100vh-380px)] min-h-[320px] overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-text-muted">
            No audit logs match the current filters.
          </div>
        ) : (
          <div style={{ height: rowVirtualizer.getTotalSize(), position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const log = rows[virtualRow.index];
              return (
                <div
                  key={log._id}
                  onClick={() => openDrawer(log._id)}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: virtualRow.size,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                  className="flex items-center border-b border-border/60 px-4 cursor-pointer hover:bg-base-800/50 transition-colors"
                >
                  {visibleColumns.map((col) => (
                    <div key={col.key} className={cn('pr-4 shrink-0 overflow-hidden', col.width)}>
                      {col.key === 'timestamp' && (
                        <span className="text-xs text-text-secondary font-mono">
                          {formatDateTime(log.timestamp)}
                        </span>
                      )}
                      {col.key === 'severity' && <SeverityBadge severity={log.severity} />}
                      {col.key === 'status' && <StatusBadge status={log.status} />}
                      {col.key === 'actor' && (
                        <span className="text-sm text-text-primary truncate block">{log.actor}</span>
                      )}
                      {col.key === 'action' && (
                        <span className="text-sm text-text-secondary truncate block">{log.action}</span>
                      )}
                      {col.key === 'resource' && (
                        <span className="text-xs text-text-secondary font-mono truncate block">
                          {log.resource}
                        </span>
                      )}
                      {col.key === 'ipAddress' && <CopyableCell value={log.ipAddress} />}
                      {col.key === 'region' && (
                        <span className="text-xs text-text-secondary">{log.region}</span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {data?.meta && (
        <Pagination meta={data.meta} limit={limit} onPageChange={setPage} onLimitChange={setLimit} />
      )}
    </div>
  );
}
