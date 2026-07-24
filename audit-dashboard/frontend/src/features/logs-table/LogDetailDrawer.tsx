import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { X, Copy, Check, MapPin, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useUIStore } from '@/store/ui.store';
import { useAuditLogDetail } from '@/hooks/useAuditLogDetail';
import { useUpdateLogStatus } from '@/hooks/useUpdateLogStatus';
import { useDeleteLog } from '@/hooks/useDeleteLog';
import { SeverityBadge } from '@/components/SeverityBadge';
import { StatusBadge } from '@/components/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { formatDateTime } from '@/utils/formatters';
import { LogStatus, STATUS_LABELS } from '@/constants/enums';
import { useToast } from '@/providers/ToastProvider';

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-border/60 sm:gap-4">
      <span className="text-xs text-text-muted shrink-0 w-24 sm:w-32">{label}</span>
      <span className={mono ? 'font-mono text-xs text-text-secondary text-right break-all min-w-0' : 'text-sm text-text-secondary text-right min-w-0'}>
        {value}
      </span>
    </div>
  );
}

export function LogDetailDrawer() {
  const drawerLogId = useUIStore((s) => s.drawerLogId);
  const closeDrawer = useUIStore((s) => s.closeDrawer);
  const { data: log, isLoading } = useAuditLogDetail(drawerLogId);
  const updateStatus = useUpdateLogStatus();
  const deleteLog = useDeleteLog();
  const { showToast } = useToast();
  const [jsonCopied, setJsonCopied] = useState(false);

  const isOpen = Boolean(drawerLogId);

  const handleCopyJson = () => {
    if (!log) return;
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
    setJsonCopied(true);
    showToast('Log JSON copied to clipboard', 'success');
    setTimeout(() => setJsonCopied(false), 1500);
  };

  const handleStatusChange = (status: LogStatus) => {
    if (!drawerLogId) return;
    updateStatus.mutate(
      { id: drawerLogId, status },
      {
        onSuccess: () => showToast(`Status updated to "${STATUS_LABELS[status]}"`, 'success'),
        onError: () => showToast('Failed to update status', 'error'),
      }
    );
  };

  const handleDelete = () => {
    if (!drawerLogId) return;
    deleteLog.mutate(drawerLogId, {
      onSuccess: () => {
        showToast('Audit log deleted', 'success');
        closeDrawer();
      },
      onError: () => showToast('Failed to delete log', 'error'),
    });
  };

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-base-950/60 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 300 }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-xl overflow-y-auto border-l border-border bg-base-900 shadow-2xl"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-base-900/95 backdrop-blur px-4 py-4 sm:px-6">
              <h2 className="font-display text-lg text-text-primary">Log Detail</h2>
              <button onClick={closeDrawer} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-6 sm:p-6">
              {isLoading || !log ? (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <SeverityBadge severity={log.severity} />
                    <StatusBadge status={log.status} />
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Update Status
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(LogStatus).map((s) => (
                        <button
                          key={s}
                          onClick={() => handleStatusChange(s)}
                          disabled={updateStatus.isPending || s === log.status}
                          className="rounded-md border border-border px-2.5 py-1 text-xs text-text-secondary hover:border-signal/40 hover:text-signal disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          {STATUS_LABELS[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
                      Metadata
                    </p>
                    <DetailRow label="Actor" value={log.actor} />
                    <DetailRow label="Role" value={log.role} />
                    <DetailRow label="Action" value={log.action} />
                    <DetailRow label="Resource" value={log.resource} mono />
                    <DetailRow label="Resource Type" value={log.resourceType} />
                    <DetailRow label="IP Address" value={log.ipAddress} mono />
                    <DetailRow label="Region" value={log.region} />
                    <DetailRow label="Timestamp" value={formatDateTime(log.timestamp)} />
                    <DetailRow label="Ingested" value={formatDateTime(log.createdAt)} />
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between">
                      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
                        Full JSON
                      </p>
                      <button
                        onClick={handleCopyJson}
                        className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary"
                      >
                        {jsonCopied ? <Check size={12} className="text-severity-low" /> : <Copy size={12} />}
                        Copy
                      </button>
                    </div>
                    <pre className="max-h-56 overflow-auto rounded-lg border border-border bg-base-800 p-3 font-mono text-xs text-text-secondary">
                      {JSON.stringify(log, null, 2)}
                    </pre>
                  </div>

                  {log.relatedLogs?.length > 0 && (
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
                        Related Logs ({log.relatedLogs.length})
                      </p>
                      <div className="space-y-2">
                        {log.relatedLogs.map((related) => (
                          <div
                            key={related._id}
                            className="flex items-center justify-between rounded-lg border border-border/60 px-3 py-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <MapPin size={12} className="text-text-muted shrink-0" />
                              <span className="truncate text-xs text-text-secondary">
                                {related.action} — {formatDateTime(related.timestamp)}
                              </span>
                            </div>
                            <SeverityBadge severity={related.severity} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="border-t border-border pt-4">
                    <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleteLog.isPending}>
                      <Trash2 size={14} />
                      Delete Log
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
