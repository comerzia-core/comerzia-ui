export interface MfaDiagnostic {
  code: string;
  label: string;
  action: string;
}

const diagnostics: Record<string, readonly [string, string]> = {
  mfa_database_schema_not_verified: ['No se pudo verificar la base de datos de seguridad.', 'Revisa la conexión y las migraciones antes de repetir el diagnóstico.'],
  redis_connectivity_not_verified: ['No se pudo verificar Redis.', 'Revisa la conexión de la aplicación con Redis.'],
  redis_rate_controls_not_verified: ['Falta verificar el control de intentos.', 'Comprueba Redis y ejecuta una operación real protegida por el límite de intentos.'],
  mfa_maintenance_tool_unavailable: ['La herramienta de recuperación no está disponible.', 'Revisa el despliegue de la herramienta de emergencia con el responsable de infraestructura.'],
  totp_key_not_configured: ['Falta una clave de cifrado TOTP válida.', 'Configura el llavero según la guía de despliegue; conserva las claves que cifran factores existentes.'],
  totp_key_round_trip_failed: ['Falló la comprobación del cifrado TOTP.', 'Revisa el llavero y sus permisos antes de repetir el diagnóstico.'],
  totp_key_probe_failed: ['No se pudo comprobar el llavero TOTP.', 'Revisa la configuración de las claves en el servidor.'],
  existing_platform_factor_decryption_failed: ['No se pudo descifrar un autenticador existente.', 'Recupera la clave original correspondiente; no reemplaces los factores para ocultar el error.'],
  platform_accounts_require_mfa_enrollment: ['Hay cuentas de plataforma pendientes de activar 2FA.', 'Cada titular debe configurar y confirmar su autenticador desde la seguridad de su perfil.'],
  web_recovery_rehearsal_missing_or_expired: ['Falta un ensayo vigente de recuperación web.', 'Completa una recuperación con dos aprobadores y el nuevo enrolamiento del factor; la evidencia dura 30 días.'],
  cli_recovery_rehearsal_missing_or_expired: ['Falta un ensayo vigente de recuperación mediante CLI.', 'Ejecuta el procedimiento de emergencia documentado y confirma el nuevo factor; la evidencia dura 30 días.'],
  offline_custody_codes_insufficient: ['Faltan códigos de emergencia bajo custodia offline.', 'Repón la custodia mediante el procedimiento CLI; deben quedar al menos dos códigos disponibles.'],
  two_authorized_mfa_recovery_operators_required: ['Se requieren dos operadores autorizados con 2FA activo.', 'Autoriza dos personas distintas para recuperación y confirma sus autenticadores; crear cuentas por sí solo no basta.'],
  two_independent_root_recovery_operators_required: ['ROOT necesita dos operadores distintos de su propia cuenta.', 'Comprueba que cada cuenta ROOT tenga dos operadores autorizados, activos y con 2FA, sin contarse a sí misma.'],
  owner_recovery_evidence_approval_required: ['Falta la aprobación del propietario sobre las evidencias.', 'Una cuenta SAAS_OWNER debe revisar y aprobar la preparación de recuperación después de resolver los demás bloqueos.'],
  ntp_reference_offset_not_verified: ['No se pudo verificar el desfase frente a la referencia NTP.', 'Configura una referencia NTP real accesible desde el servidor y revisa su conectividad y el reloj del host.'],
  host_ntp_discipline_requires_infrastructure_verification: ['La sincronización permanente del host requiere revisión de infraestructura.', 'Verifica el servicio horario del host; una medición de desfase de la aplicación no acredita su sincronización permanente.'],
  ntp_synchronization_operational_attestation_recommended: ['Falta comprobar la sincronización horaria del servidor.', 'Revisa el servicio horario del host y conserva la evidencia operativa.'],
  emergency_procedure_requires_owner_approval_and_rehearsal: ['Falta comprobar la recuperación de emergencia.', 'Completa los ensayos web y CLI y solicita la aprobación del propietario.'],
};

function describe(code: string): MfaDiagnostic {
  const [label, action] = diagnostics[code] ?? [
    'Hay una comprobación pendiente que requiere revisión técnica.',
    'Solicita al responsable de seguridad revisar el diagnóstico del servidor y repite la evaluación.',
  ];
  return { code, label, action };
}

// La prioridad visual no altera el resultado READY/NOT_READY emitido por el servidor.
export function getMfaPreflightDiagnostics(blockers: readonly string[], warnings: readonly string[]) {
  const blockingCodes = new Set(blockers);
  return {
    blockers: [...blockingCodes].map(describe),
    warnings: [...new Set(warnings)].filter(code => !blockingCodes.has(code)).map(describe),
  };
}
