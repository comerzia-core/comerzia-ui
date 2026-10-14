/** Numeración visual de tarjetas; las tablas calculan su numeración en ComerziaTable. */
export function ComerziaRowNumber({ value }: { value: number }) {
  return <span className="text-xs text-base-content/50 shrink-0" aria-label={`Fila ${value}`}>{value}</span>;
}
