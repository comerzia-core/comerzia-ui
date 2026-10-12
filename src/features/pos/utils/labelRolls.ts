export const getRollWidthMm = (widthMm: number, columns: number, columnGapMm: number): number =>
  Math.round((widthMm * columns + columnGapMm * (columns - 1)) * 100) / 100;

export const getLabelQuantityError = (quantity: string, columns: number): string | undefined => {
  if (!Number.isInteger(columns) || columns < 1 || columns > 9) return 'Seleccione un rollo válido.';
  const maximum = Math.floor(1000 / columns) * columns;
  if (!/^\d+$/.test(quantity) || Number(quantity) < columns || Number(quantity) > maximum || Number(quantity) % columns !== 0)
    return `Ingrese un múltiplo de ${columns} entre ${columns} y ${maximum} etiquetas.`;
  return undefined;
};
