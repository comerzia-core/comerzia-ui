export function passwordChecks(value: string) {
  const length = Array.from(value).length;
  return [
    { id: 'length', label: 'Mínimo 8 caracteres (máx. 64)', isValid: length >= 8 && length <= 64 },
    { id: 'uppercase', label: 'Al menos una letra mayúscula (A-Z)', isValid: /[A-Z]/.test(value) },
    { id: 'lowercase', label: 'Al menos una letra minúscula (a-z)', isValid: /[a-z]/.test(value) },
    { id: 'number', label: 'Al menos un número (0-9)', isValid: /[0-9]/.test(value) },
    { id: 'special', label: 'Al menos un símbolo', isValid: /[^A-Za-z0-9]/.test(value) },
  ];
}

export function passwordFeedback(value: string): string | undefined {
  const failed = passwordChecks(value).find(check => !check.isValid);
  if (failed) return failed.label;
  if (Array.from(value).some(character => {
    const point = character.codePointAt(0)!;
    return point < 32 || (point >= 127 && point <= 159) || (point >= 0xd800 && point <= 0xdfff);
  })) return 'Revisa los caracteres de la contraseña.';
  if (new TextEncoder().encode(value).length > 72) return 'La contraseña ocupa demasiado espacio.';
  if (['passwordpassword', 'passwordpassword123', 'passwordpassword123!', '123456789012345', '1234567890123456', 'qwertyuiopasdfgh', 'letmeinletmein123'].includes(value.toLowerCase())) return 'Elige una contraseña menos común.';
  return undefined;
}
