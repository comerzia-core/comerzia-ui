export function invitationLink(href: string): { token: string | null; cleanPath: string } {
  const url = new URL(href);
  const token = new URLSearchParams(url.hash.slice(1)).get('token') ?? url.searchParams.get('token');
  url.searchParams.delete('token');
  return { token, cleanPath: url.pathname + url.search };
}

export function isVisibleInvitationRole(role: { name: string }): boolean {
  const name = role.name.toUpperCase();
  return name !== 'ROOT' && name !== 'OWNER' && !name.startsWith('SAAS_');
}

export function invitationErrorMessage(code: string | undefined): string {
  const messages: Record<string, string> = {
    account_link_required: 'Ya existe una cuenta con este correo. Inicia sesión con tu método habitual y vuelve a abrir la invitación.',
    invitation_conflict: 'No se pudo completar la invitación con esos datos. Revisa el usuario o contacta al administrador.',
    invitation_capacity_unavailable: 'La empresa ha alcanzado el límite de usuarios de su suscripción. El propietario también ocupa un cupo. Revisa el plan con el administrador.',
    invitation_subscription_unavailable: 'La empresa no tiene una suscripción activa disponible. Contacta al administrador.',
    no_active_subscription: 'La empresa no tiene una suscripción activa disponible. Contacta al administrador.',
    invitation_resend_cooldown: 'Espera al menos 60 segundos antes de reenviar esta invitación.',
    invitation_role_not_delegable: 'No tienes permisos suficientes para delegar este rol.',
    invitation_rate_limited: 'Has alcanzado el límite de invitaciones permitidas por ahora.',
    invitation_already_accepted: 'Esta invitación ya fue aceptada anteriormente.',
    invitation_expired: 'Esta invitación ha expirado. Solicita un nuevo enlace a tu administrador.',
    invitation_revoked: 'Esta invitación ha sido revocada por un administrador.',
    invitation_email_mismatch: 'El correo de tu cuenta no coincide con el de la invitación.',
    invitation_not_found: 'Invitación no encontrada o enlace no válido.',
    invitation_unavailable: 'El sistema de invitaciones no está disponible ahora. Intenta más tarde.',
    invitation_invalid_state: 'No se puede completar esta invitación. Contacta al administrador.',
    oidc_transaction_invalid: 'La verificación con Google venció. Vuelve a abrir el enlace de invitación.',
  };
  return (code && messages[code]) || 'No se pudo procesar la invitación. Inténtalo nuevamente o contacta al administrador.';
}
