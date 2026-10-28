export function passwordFeedback(value: string): string | undefined {
  const length = Array.from(value).length;
  if (length < 15 || length > 64) return 'Usa de 15 a 64 caracteres.';
  if (Array.from(value).some(character => {
    const point = character.codePointAt(0)!;
    return point < 32 || (point >= 127 && point <= 159) || (point >= 0xd800 && point <= 0xdfff);
  })) return 'Revisa los caracteres de la contraseña.';
  if (new TextEncoder().encode(value).length > 72) return 'La contraseña ocupa demasiado espacio. Usa menos caracteres especiales.';
  return undefined;
}
