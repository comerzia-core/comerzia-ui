import {
  ResponsiveContainer,
  AreaChart,
  Area,
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
  valueFormatter,
  xTickFormatter,
}: ComerziaChartProps) => {
  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
          <defs>
            {series.map((s, idx) => (
              <linearGradient id={`color${s.dataKey}`} x1="0" y1="0" x2="0" y2="1" key={idx}>
                <stop offset="5%" stopColor={s.color || '#4f46e5'} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={s.color || '#4f46e5'} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" strokeOpacity={0.1} />
          <XAxis 
            dataKey={xAxisDataKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12 }} 
            dy={10}
            tickFormatter={xTickFormatter}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 12 }} 
            domain={['auto', 'auto']}
            tickFormatter={valueFormatter}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const displayLabel = xTickFormatter ? xTickFormatter(label) : label;
                return (
                  <div className="bg-base-100 p-3 rounded-xl shadow-lg border border-base-200">
                    <p className="font-bold text-base-content/80 mb-2">{displayLabel}</p>
                    {payload.map((entry, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-sm font-medium">{entry.name}:</span>
                        <span className="text-sm font-bold text-primary">
                          {valueFormatter ? valueFormatter(entry.value) : entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            }}
          />
          {series.map((s) => (
            <Area
              key={s.dataKey}
              type="monotone"
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              stroke={s.color || '#4f46e5'}
              strokeWidth={3}
              fillOpacity={1}
              fill={`url(#color${s.dataKey})`}
              dot={{ r: 4, strokeWidth: 2, fill: 'oklch(var(--b1))', stroke: s.color || '#4f46e5' }}
              activeDot={{ r: 6, strokeWidth: 0, fill: s.color || '#4f46e5' }}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
