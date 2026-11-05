export function isValidTotpCode(value: string): boolean {
  return /^[0-9]{6}$/.test(value.trim());
}

export function isValidRecoveryCode(value: string): boolean {
  return /^(?:[A-Za-z0-9]{5}-?[A-Za-z0-9]{5}|[A-Za-z0-9]{4}-[A-Za-z0-9]{4}-[A-Za-z0-9]{2}|[A-Za-z0-9]{7}(?:-[A-Za-z0-9]{7}){3}|[A-Za-z0-9]{28})$/.test(value.trim());
}
