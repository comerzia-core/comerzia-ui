/**
 * Normaliza y redondea un número a 2 decimales exactos evitando problemas
 * de precisión por aritmética de punto flotante en Javascript.
 */
export const roundToTwo = (num: number): number => {
  if (isNaN(num) || !isFinite(num)) return 0;
  return Number(Math.round(Number(num + 'e+2')) + 'e-2');
};

/**
 * Formatea un número como moneda con 2 decimales fijos.
 */
export const formatCurrency = (amount: number, currency = ''): string => {
  const rounded = roundToTwo(amount);
  const formatted = rounded.toFixed(2);
  return currency ? `${currency} ${formatted}` : formatted;
};
