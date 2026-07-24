import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { ChartDataPoint } from '@/types/auditLog.types';
import { Skeleton } from '@/components/ui/Skeleton';

export function ActivityTimelineChart({
  data,
  isLoading,
}: {
  data?: ChartDataPoint[];
  isLoading: boolean;
}) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={data} margin={{ left: -20, top: 4, right: 8 }}>
            <defs>
              <linearGradient id="timelineFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4CC9F0" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#4CC9F0" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F232C" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="#5F6575"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#5F6575" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: '#12141B',
                border: '1px solid #1F232C',
                borderRadius: 8,
                fontSize: 12,
              }}
              labelStyle={{ color: '#E8EAF0' }}
            />
            <Area
              type="monotone"
              dataKey="count"
              stroke="#4CC9F0"
              strokeWidth={2}
              fill="url(#timelineFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
