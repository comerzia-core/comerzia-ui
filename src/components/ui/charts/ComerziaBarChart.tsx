import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend
} from 'recharts';
import type { ComerziaChartProps } from './types';

export const ComerziaBarChart = ({
  data,
  series,
  xAxisDataKey,
  height = 300,
  valueFormatter,
  xTickFormatter
}: ComerziaChartProps) => {
  return (
    <div
      className="w-full select-none touch-pan-y"
      style={{ height, WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
          style={{ outline: 'none' }}
        >
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
            tickFormatter={valueFormatter}
          />
          <Tooltip
            wrapperStyle={{ outline: 'none', zIndex: 50 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const displayLabel = xTickFormatter ? xTickFormatter(label) : label;
                return (
                  <div className="bg-base-100 p-3.5 rounded-2xl shadow-xl border border-base-200 text-xs animate-fade-in pointer-events-none select-none">
                    <p className="font-bold text-base-content text-sm mb-2">{displayLabel}</p>
                    <div className="space-y-1.5 font-mono">
                      {payload.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
                            <span className="text-base-content/70 font-medium">{entry.name}:</span>
                          </div>
                          <span className="font-bold text-base-content">
                            {valueFormatter ? valueFormatter(Number(entry.value)) : entry.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
            cursor={{ fill: 'oklch(var(--b2) / 0.35)', rx: 8, ry: 8 }}
          />
          <Legend
            verticalAlign="top"
            align="right"
            iconType="circle"
            wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
          />
          {series.map(s => (
            <Bar
              key={s.dataKey}
              dataKey={s.dataKey}
              name={s.name || s.dataKey}
              fill={s.color || 'oklch(var(--p))'}
              radius={[6, 6, 0, 0]}
              maxBarSize={48}
              style={{ outline: 'none', cursor: 'pointer', WebkitTapHighlightColor: 'transparent' }}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
