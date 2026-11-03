import axios from 'axios';

const messages: Record<string, string> = {
  password_reset_unavailable: 'El enlace ya no está disponible. Solicita uno nuevo.',
  password_unchanged: 'Elige una contraseña diferente a la actual.',
  email_change_unavailable: 'No se pudo completar el cambio. Solicita un enlace nuevo.',
  email_change_session_mismatch: 'Cierra la otra sesión antes de confirmar este cambio.',
  email_change_not_pending: 'Ya no hay un cambio pendiente para cancelar.',
  current_password_incorrect: 'La contraseña actual no es correcta.',
  email_unchanged: 'Ingresa un correo diferente al actual.',
  email_unavailable: 'Ese correo no está disponible.',
  email_required: 'Ingresa un correo válido.',
  data_integrity_violation: 'Ese correo ya no está disponible.',
  bad_request: 'Revisa los datos e inténtalo nuevamente.',
};

export function securityChallengeErrorCode(error: unknown): string | undefined {
  return axios.isAxiosError<{ code?: string }>(error) ? error.response?.data?.code : undefined;
}

export function securityChallengeMessage(error: unknown): string {
  const code = securityChallengeErrorCode(error);
  if (code && messages[code]) return messages[code];
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Sin conexión. Intenta nuevamente.';
    if (error.response.status === 429) return 'Espera un momento antes de reintentar.';
    if (error.response.status === 503) return 'Servicio temporalmente no disponible.';
    if (error.response.status === 401) return 'Tu sesión venció. Ingresa nuevamente.';
    if (error.response.status === 403) return 'No tienes acceso a esta operación.';
  }
  return 'No se pudo completar la solicitud. Intenta nuevamente.';
}
