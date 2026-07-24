import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { Severity, SEVERITY_LABELS } from '@/constants/enums';

const COLORS: Record<string, string> = {
  [Severity.CRITICAL]: '#F0465C',
  [Severity.HIGH]: '#F5A524',
  [Severity.MEDIUM]: '#F5D90A',
  [Severity.LOW]: '#34D399',
};

export function SeverityDonutChart({
  data,
  isLoading,
}: {
  data?: { severity: string; count: number }[];
  isLoading: boolean;
}) {
  const chartData = data?.map((d) => ({ ...d, label: SEVERITY_LABELS[d.severity as Severity] ?? d.severity }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Severity Distribution</CardTitle>
      </CardHeader>
      {isLoading || !chartData ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={chartData}
              dataKey="count"
              nameKey="label"
              innerRadius={62}
              outerRadius={90}
              paddingAngle={3}
              stroke="none"
            >
              {chartData.map((entry) => (
                <Cell key={entry.severity} fill={COLORS[entry.severity] ?? '#5F6575'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: '#12141B',
                border: '1px solid #1F232C',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              formatter={(value) => <span className="text-xs text-text-secondary">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
