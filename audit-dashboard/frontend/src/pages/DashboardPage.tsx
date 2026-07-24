import { AlertTriangle, ShieldAlert, Users, Database, Clock, CheckCircle2 } from 'lucide-react';
import { StatCard } from '@/features/dashboard/StatCard';
import { ActivityTimelineChart } from '@/features/dashboard/ActivityTimelineChart';
import { SeverityDonutChart } from '@/features/dashboard/SeverityDonutChart';
import { RegionBarChart } from '@/features/dashboard/RegionBarChart';
import { ActivityFeed } from '@/features/dashboard/ActivityFeed';
import { useDashboardStats, useDashboardCharts, useDashboardActivity } from '@/hooks/useDashboard';
import { formatRelativeTime } from '@/utils/formatters';

export function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: charts, isLoading: chartsLoading } = useDashboardCharts();
  const { data: activity, isLoading: activityLoading } = useDashboardActivity();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-text-primary">Overview</h1>
        <p className="mt-1 text-sm text-text-muted">
          Real-time visibility into audit activity across your organization.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Logs" value={stats?.totalLogs ?? 0} icon={Database} />
        <StatCard label="Today's Logs" value={stats?.todayLogs ?? 0} icon={Clock} />
        <StatCard
          label="Critical"
          value={stats?.bySeverity?.critical ?? 0}
          icon={ShieldAlert}
          accentClassName="bg-severity-critical/10 text-severity-critical"
        />
        <StatCard
          label="High"
          value={stats?.bySeverity?.high ?? 0}
          icon={AlertTriangle}
          accentClassName="bg-severity-high/10 text-severity-high"
        />
        <StatCard
          label="Resolved"
          value={stats?.byStatus?.resolved ?? 0}
          icon={CheckCircle2}
          accentClassName="bg-severity-low/10 text-severity-low"
        />
        <StatCard
          label="Pending"
          value={stats?.byStatus?.pending ?? 0}
          icon={Clock}
          accentClassName="bg-status-pending/10 text-status-pending"
        />
        <StatCard label="Unique Actors" value={stats?.uniqueActors ?? 0} icon={Users} />
        <div className="glass-panel flex flex-col justify-center p-5">
          <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
            Latest Upload
          </p>
          <p className="mt-2 text-sm text-text-primary">
            {statsLoading ? '—' : formatRelativeTime(stats?.latestUpload)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ActivityTimelineChart data={charts?.timeline} isLoading={chartsLoading} />
        <SeverityDonutChart data={charts?.severityDistribution} isLoading={chartsLoading} />
        <RegionBarChart data={charts?.regionBreakdown} isLoading={chartsLoading} />
        <ActivityFeed data={activity} isLoading={activityLoading} />
      </div>
    </div>
  );
}
