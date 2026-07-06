export interface ChartSeries {
  dataKey: string;
  name?: string;
  color?: string; // Ejemplo: oklch(var(--p))
}

export interface ComerziaChartProps {
  /** Array de datos (ej. obtenido del backend) */
  data: any[];
  /** Configuración de las series (líneas o barras) a renderizar */
  series: ChartSeries[];
  /** Llave del objeto data que se usará para el eje X (ej. 'mes', 'fecha') */
  xAxisDataKey: string;
  /** Altura del contenedor del gráfico, por defecto 300px */
  height?: number | string;
  /** Función opcional para formatear los valores numéricos (ej. moneda) */
  valueFormatter?: (value: any) => string;
  /** Función opcional para formatear las etiquetas del eje X */
  xTickFormatter?: (value: any) => string;
}
