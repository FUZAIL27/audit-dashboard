import { FiltersBar } from '@/features/logs-table/FiltersBar';
import { LogsTable } from '@/features/logs-table/LogsTable';
import { LogDetailDrawer } from '@/features/logs-table/LogDetailDrawer';

export function LogsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Audit Logs</h1>
        <p className="mt-1 text-sm text-text-muted">
          Search, filter, and investigate every recorded security event.
        </p>
      </div>

      <FiltersBar />
      <LogsTable />
      <LogDetailDrawer />
    </div>
  );
}
