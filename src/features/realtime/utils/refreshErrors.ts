import { isAxiosError } from 'axios';

// Un fallo temporal no invalida los datos visibles; una respuesta 401/403/404 sigue sus reglas habituales.
export function isTransientRefreshFailure(error: unknown): boolean {
  return isAxiosError(error) && (!error.response || error.response.status >= 500 || error.response.status === 429);
}
