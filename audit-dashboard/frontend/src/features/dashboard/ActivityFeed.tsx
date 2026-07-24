import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { SeverityBadge } from '@/components/SeverityBadge';
import { formatRelativeTime } from '@/utils/formatters';
import { AuditLog } from '@/types/auditLog.types';
import { Severity } from '@/constants/enums';

export function ActivityFeed({
  data,
  isLoading,
}: {
  data?: Partial<AuditLog>[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Latest Activity</CardTitle>
      </CardHeader>

      <div className="space-y-1 max-h-72 overflow-y-auto pr-1">
        {isLoading || !data
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full mb-2" />)
          : data.map((log, i) => (
              <motion.div
                key={log._id ?? i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 hover:bg-base-800/60 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-text-primary">
                    <span className="font-medium">{log.actor}</span>{' '}
                    <span className="text-text-muted">{log.action}</span>
                  </p>
                  <p className="text-xs text-text-muted">{formatRelativeTime(log.timestamp)}</p>
                </div>
                {log.severity && <SeverityBadge severity={log.severity as Severity} />}
              </motion.div>
            ))}
      </div>
    </Card>
  );
}
