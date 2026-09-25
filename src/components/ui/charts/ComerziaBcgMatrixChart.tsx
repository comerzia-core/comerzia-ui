// src/components/ui/charts/ComerziaBcgMatrixChart.tsx
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  ReferenceLine
} from 'recharts';
import { Star, Coins, HelpCircle, Skull } from 'lucide-react';
import type { DemandBcgItem } from '../../../features/commercial/types/commercial';

export interface ComerziaBcgMatrixChartProps {
  data: DemandBcgItem[];
  height?: number | string;
  currencyCode?: string;
  velocityThreshold?: number;
  marginThreshold?: number;
  onPointClick?: (point: DemandBcgItem) => void;
  className?: string;
}

export interface BcgClassification {
  quadrant: 'STARS' | 'CASH_COWS' | 'QUESTION_MARKS' | 'DOGS';
  label: string;
  icon: typeof Star;
  badgeClass: string;
  color: string;
  recommendation: string;
}

// Función para determinar el cuadrante BCG de un producto o categoría
export const getBcgClassification = (
  velocity: number,
  margin: number,
  velocityThreshold = 5,
  marginThreshold = 25
): BcgClassification => {
  const isHighVelocity = velocity >= velocityThreshold;
  const isHighMargin = margin >= marginThreshold;

  if (isHighVelocity && isHighMargin) {
    return {
      quadrant: 'STARS',
      label: 'Estrella',
      icon: Star,
      badgeClass: 'badge-success text-white',
      color: '#10b981', // Emerald
      recommendation: 'Asegurar disponibilidad constante y priorizar inventario.'
    };
  }

  if (isHighVelocity && !isHighMargin) {
    return {
      quadrant: 'CASH_COWS',
      label: 'Vaca Lechera',
      icon: Coins,
      badgeClass: 'badge-info text-white',
      color: '#0284c7', // Sky
      recommendation: 'Optimizar costos y aprovechar el alto volumen de ventas.'
    };
  }

  if (!isHighVelocity && isHighMargin) {
    return {
      quadrant: 'QUESTION_MARKS',
      label: 'Interrogante',
      icon: HelpCircle,
      badgeClass: 'badge-warning text-white',
      color: '#f59e0b', // Amber
      recommendation: 'Impulsar promociones para elevar su rotación comercial.'
    };
  }

  return {
    quadrant: 'DOGS',
    label: 'Stock Muerto',
    icon: Skull,
    badgeClass: 'badge-error text-white',
    color: '#ef4444', // Red
    recommendation: 'Liquidar, rematar o descontinuar para liberar capital.'
  };
};

export const ComerziaBcgMatrixChart = ({
  data,
  height = 360,
  currencyCode = 'USD',
  velocityThreshold,
  marginThreshold,
  onPointClick,
  className = ''
}: ComerziaBcgMatrixChartProps) => {
  if (!data || data.length === 0) {
    return (
      <div
        style={{ height }}
        className={`flex items-center justify-center text-base-content/40 text-xs italic ${className}`}
      >
        No hay datos suficientes para calcular la Matriz BCG
      </div>
    );
  }

  // Calcular umbrales dinámicos (si no se proporcionan) basados en los datos
  const velocities = data.map(d => Number(d.velocity) || 0);
  const margins = data.map(d => Number(d.marginPercentage) || 0);

  const avgVelocity = velocityThreshold ?? (
    velocities.length > 0
      ? Math.max(1, Math.round((velocities.reduce((a, b) => a + b, 0) / velocities.length) * 10) / 10)
      : 5
  );

  const avgMargin = marginThreshold ?? (
    margins.length > 0
      ? Math.max(5, Math.round((margins.reduce((a, b) => a + b, 0) / margins.length) * 10) / 10)
      : 25
  );

  return (
    <div
      className={`w-full select-none touch-pan-y relative ${className}`}
      style={{ height, WebkitTapHighlightColor: 'transparent', outline: 'none' }}
    >
      {/* Guías de cuadrantes en esquinas */}
      <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 p-8 opacity-35">
        <div className="flex flex-col justify-start items-start text-[11px] font-bold text-amber-500">
          <span className="inline-flex items-center gap-1.5">
            <HelpCircle size={13} className="shrink-0" />
            <span>Interrogantes</span>
          </span>
          <span className="text-[9px] font-normal text-base-content/60">Alto Margen • Baja Rotación</span>
        </div>
        <div className="flex flex-col justify-start items-end text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
          <span className="inline-flex items-center gap-1.5">
            <Star size={13} className="shrink-0 fill-emerald-500/20" />
            <span>Estrellas</span>
          </span>
          <span className="text-[9px] font-normal text-base-content/60">Alto Margen • Alta Rotación</span>
        </div>
        <div className="flex flex-col justify-end items-start text-[11px] font-bold text-rose-500">
          <span className="inline-flex items-center gap-1.5">
            <Skull size={13} className="shrink-0" />
            <span>Stock Muerto</span>
          </span>
          <span className="text-[9px] font-normal text-base-content/60">Bajo Margen • Baja Rotación</span>
        </div>
        <div className="flex flex-col justify-end items-end text-[11px] font-bold text-sky-500">
          <span className="inline-flex items-center gap-1.5">
            <Coins size={13} className="shrink-0" />
            <span>Volumen</span>
          </span>
          <span className="text-[9px] font-normal text-base-content/60">Bajo Margen • Alta Rotación</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{ top: 20, right: 30, bottom: 20, left: 10 }}
          style={{ outline: 'none' }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} />
          
          <XAxis
            type="number"
            dataKey="velocity"
            name="Velocidad"
            unit=" uds/día"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
            label={{
              value: 'Velocidad de Venta (uds/día) →',
              position: 'insideBottom',
              offset: -12,
              fill: 'currentColor',
              opacity: 0.7,
              fontSize: 11,
              fontWeight: 600
            }}
          />

          <YAxis
            type="number"
            dataKey="marginPercentage"
            name="Margen"
            unit="%"
            axisLine={false}
            tickLine={false}
            tick={{ fill: 'currentColor', opacity: 0.6, fontSize: 11 }}
            label={{
              value: 'Margen de Ganancia (%) ↑',
              angle: -90,
              position: 'insideLeft',
              offset: 0,
              fill: 'currentColor',
              opacity: 0.7,
              fontSize: 11,
              fontWeight: 600
            }}
          />

          <ZAxis type="number" dataKey="totalSales" range={[80, 400]} />

          {/* Líneas de referencia para dividir los 4 cuadrantes */}
          <ReferenceLine
            x={avgVelocity}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Umbral: ${avgVelocity} uds/d`,
              fill: '#94a3b8',
              fontSize: 10,
              position: 'insideTopRight'
            }}
          />
          <ReferenceLine
            y={avgMargin}
            stroke="#94a3b8"
            strokeDasharray="4 4"
            strokeWidth={1.5}
            label={{
              value: `Umbral: ${avgMargin}%`,
              fill: '#94a3b8',
              fontSize: 10,
              position: 'insideTopLeft'
            }}
          />

          <Tooltip
            wrapperStyle={{ outline: 'none', zIndex: 60 }}
            cursor={{ strokeDasharray: '3 3', stroke: 'oklch(var(--p))', strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const point = payload[0].payload as DemandBcgItem;
                const bcg = getBcgClassification(point.velocity, point.marginPercentage, avgVelocity, avgMargin);
                const BcgIcon = bcg.icon;
                
                return (
                  <div className="bg-base-100 p-4 rounded-2xl shadow-2xl border border-base-200 text-xs max-w-xs animate-fade-in pointer-events-none select-none">
                    <div className="flex items-center justify-between gap-2 pb-2 border-b border-base-200 mb-2">
                      <div className="min-w-0">
                        <span className="font-bold text-sm text-base-content block truncate">{point.name}</span>
                      </div>
                      <span className={`badge badge-sm font-bold shrink-0 inline-flex items-center gap-1.5 ${bcg.badgeClass}`}>
                        <BcgIcon size={12} className="shrink-0" />
                        <span>{bcg.label}</span>
                      </span>
                    </div>

                    <div className="space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-base-content/70">
                        <span>Velocidad Diaria:</span>
                        <strong className="text-base-content font-bold">{Number(point.velocity).toFixed(1)} uds/día</strong>
                      </div>
                      <div className="flex items-center justify-between text-base-content/70">
                        <span>Margen de Ganancia:</span>
                        <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{Number(point.marginPercentage).toFixed(1)}%</strong>
                      </div>
                      {point.totalSales !== undefined && (
                        <div className="flex items-center justify-between text-base-content/70">
                          <span>Ventas Totales:</span>
                          <strong className="text-primary font-bold">{currencyCode} {Number(point.totalSales).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-base-200/60 text-[10px] leading-snug text-base-content/70">
                      <span className="font-bold text-primary block mb-0.5">Acción Recomendada:</span>
                      {bcg.recommendation}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />

          <Scatter
            name="Productos"
            data={data}
            animationDuration={800}
            onClick={node => {
              if (onPointClick && node) {
                onPointClick(node as unknown as DemandBcgItem);
              }
            }}
          >
            {data.map((entry, index) => {
              const bcg = getBcgClassification(entry.velocity, entry.marginPercentage, avgVelocity, avgMargin);
              return (
                <Cell
                  key={`bcg-cell-${index}`}
                  fill={bcg.color}
                  stroke="oklch(var(--b1))"
                  strokeWidth={2}
                  style={{
                    cursor: onPointClick ? 'pointer' : 'default',
                    outline: 'none',
                    filter: 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))'
                  }}
                />
              );
            })}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
};
