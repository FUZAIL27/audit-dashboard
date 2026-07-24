import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

export function RegionBarChart({
  data,
  isLoading,
}: {
  data?: { region: string; count: number }[];
  isLoading: boolean;
}) {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>Activity by Region</CardTitle>
      </CardHeader>
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data} margin={{ left: -20, top: 4, right: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1F232C" vertical={false} />
            <XAxis
              dataKey="region"
              stroke="#5F6575"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis stroke="#5F6575" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(76,201,240,0.06)' }}
              contentStyle={{
                background: '#12141B',
                border: '1px solid #1F232C',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Bar dataKey="count" fill="#4CC9F0" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}
