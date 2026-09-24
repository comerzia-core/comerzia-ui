import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip
} from 'recharts';

export interface DonutChartDataItem {
  name: string;
  value: number;
  percentage?: number;
  color?: string;
  [key: string]: unknown;
}

export interface ComerziaDonutChartProps {
  data: DonutChartDataItem[];
  height?: number | string;
  valueFormatter?: (value: number) => string;
  innerRadius?: number | string;
  outerRadius?: number | string;
  className?: string;
  onClick?: (item: DonutChartDataItem, index: number) => void;
}

const DEFAULT_COLORS = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1'  // Violet
];

export const ComerziaDonutChart = ({
  data,
  height = 280,
  valueFormatter,
  innerRadius = '60%',
  outerRadius = '85%',
  className = '',
  onClick
}: ComerziaDonutChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex items-center justify-center text-base-content/40 text-xs italic ${className}`}
      >
        No hay datos para mostrar en la gráfica
      </div>
    );
  }

  return (
    <div
      className={`w-full select-none touch-pan-y ${className}`}
      style={{ height, WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      <ResponsiveContainer width="100%" height="100%">
        <PieChart style={{ outline: 'none' }}>
          <Tooltip
            wrapperStyle={{ outline: 'none', zIndex: 50 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const item = payload[0].payload as DonutChartDataItem;
                const formattedVal = valueFormatter ? valueFormatter(item.value) : item.value;
                return (
                  <div className="bg-base-100 p-3 rounded-2xl shadow-xl border border-base-200 text-xs animate-fade-in pointer-events-none select-none">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: payload[0].color || item.color }}
                      />
                      <span className="font-bold text-base-content text-sm">{item.name}</span>
                    </div>
                    <div className="space-y-1 font-mono pl-4">
                      <div className="flex items-center justify-between gap-4 text-base-content/70">
                        <span>Valor:</span>
                        <strong className="text-primary font-bold">{formattedVal}</strong>
                      </div>
                      {item.percentage !== undefined && (
                        <div className="flex items-center justify-between gap-4 text-base-content/70">
                          <span>Participación:</span>
                          <strong className="text-base-content font-bold">{Number(item.percentage).toFixed(1)}%</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            dataKey="value"
            animationDuration={600}
            stroke="oklch(var(--b1))"
            strokeWidth={2}
            style={{ outline: 'none' }}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]}
                onClick={() => onClick && onClick(entry, index)}
                style={{
                  cursor: onClick ? 'pointer' : 'default',
                  outline: 'none',
                  WebkitTapHighlightColor: 'transparent'
                }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};
