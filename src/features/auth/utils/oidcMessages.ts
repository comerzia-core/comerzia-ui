export const OIDC_ERROR_MESSAGES: Record<string, string> = {
  oidc_cancelled: 'Has cancelado la autenticación con Google.',
  oidc_validation_failed: 'No se pudo verificar la autenticidad de la cuenta de Google. Reintenta.',
  oidc_transaction_invalid: 'La sesión de autenticación con Google ha expirado o no es válida. Por favor, reintenta.',
  oidc_unavailable: 'El acceso con Google no está disponible en este momento.',
  account_link_required: 'Ya existe una cuenta con este correo electrónico. Inicia sesión con tu contraseña habitual y vincula tu cuenta de Google desde Perfil > Seguridad.',
  registration_token_invalid: 'La sesión de registro con Google ha expirado. Por favor, vuelve a iniciar el registro.',
  registration_already_completed: 'Esta solicitud de registro ya fue procesada. Inicia sesión con tus credenciales.',
  external_identity_conflict: 'Esta cuenta de Google ya está vinculada a otro usuario.',
  last_sign_in_method: 'No puedes desvincular tu cuenta de Google porque es tu único método de acceso. Configura una contraseña primero.',
  authentication_rate_limited: 'Demasiados intentos. Espera unos momentos e intenta de nuevo.',
  invalid_client_address: 'Dirección de red no autorizada o no confiable.',
  registration_busy: 'El sistema está ocupado procesando solicitudes. Por favor, intenta de nuevo en unos segundos.'
};

export function resolveOidcMessage(code?: string | null, fallback = 'Ocurrió un problema con la autenticación de Google.'): string {
  if (!code) return fallback;
  return OIDC_ERROR_MESSAGES[code] || fallback;
}

