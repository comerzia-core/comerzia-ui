import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import type { ComerziaChartProps } from './types';

export const ComerziaLineChart = ({
  data,
  series,
  xAxisDataKey,
  height = 300,
}: ComerziaChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(var(--bc) / 0.1)" />
          <XAxis 
            dataKey={xAxisDataKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'oklch(var(--bc) / 0.6)', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'oklch(var(--bc) / 0.6)', fontSize: 12 }} 
          />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'oklch(var(--b1))', 
              borderColor: 'oklch(var(--bc) / 0.1)',
              borderRadius: '1rem',
              color: 'oklch(var(--bc))',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)'
            }}
            itemStyle={{ color: 'oklch(var(--bc))' }}
          />
          {series.map((s) => (
            <Line
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.color || `oklch(var(--p))`}
              strokeWidth={3}
              dot={{ r: 4, strokeWidth: 2, fill: 'oklch(var(--b1))' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
