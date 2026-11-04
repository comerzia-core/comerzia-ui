import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Key,
  Database,
  Clock,
  Users,
  LifeBuoy,
  Loader2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { useToast } from '../../../context/ToastContext';
import { useStepUp } from '../hooks/useStepUp';
import { MfaStepUpModal } from './MfaStepUpModal';
import { mfaPlatformPolicyService } from '../services/mfaPlatformPolicyService';
import type { MfaPolicyStatusResponse, MfaPreflightResponse } from '../types/mfaPolicy';
import { formatDateForUser } from '../../../utils/date';

export const MfaPreflightPanel: React.FC = () => {
  const { addToast } = useToast();

  const [policyStatus, setPolicyStatus] = useState<MfaPolicyStatusResponse | null>(null);
  const [preflight, setPreflight] = useState<MfaPreflightResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [isTogglingPolicy, setIsTogglingPolicy] = useState<boolean>(false);

  const {
    isStepUpOpen,
    stepUpAction,
    stepUpTitle,
    stepUpDescription,
    requestStepUp,
    handleSuccess: handleStepUpSuccess,
    handleCancel: handleStepUpCancel
  } = useStepUp();

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const [pStatus, pPreflight] = await Promise.all([
          mfaPlatformPolicyService.getPolicyStatus().catch(() => null),
          mfaPlatformPolicyService.getPreflight().catch(() => null)
        ]);
        if (isMounted) {
          setPolicyStatus(pStatus);
          setPreflight(pPreflight);
        }
      } catch (err) {
        console.error('Error fetching MFA platform status:', err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleRefreshPreflight = async () => {
    setIsEvaluating(true);
    try {
      const result = await mfaPlatformPolicyService.getPreflight();
      setPreflight(result);
      addToast('Diagnóstico preflight actualizado exitosamente.', 'info');
    } catch (err) {
      console.error('Error refreshing preflight:', err);
      addToast('Error al ejecutar el diagnóstico preflight.', 'error');
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleTogglePolicy = async () => {
    if (!policyStatus) return;
    const activating = !policyStatus.platformMandatory;

    try {
      const grantToken = await requestStepUp('MANAGE_SAAS_TEAM', {
        title: activating ? 'Confirmar Activación Global de MFA' : 'Confirmar Desactivación de MFA',
        description: activating
          ? 'Esta acción exigirá autenticación MFA obligatoria a todos los administradores SaaS y ROOT. Ingrese su código TOTP para confirmar.'
          : 'Está a punto de desactivar la obligatoriedad global de MFA en plataforma SaaS. Ingrese su código TOTP para confirmar.'
      });

      setIsTogglingPolicy(true);
      const updated = activating
        ? await mfaPlatformPolicyService.activatePolicy(grantToken)
        : await mfaPlatformPolicyService.deactivatePolicy(grantToken);

      setPolicyStatus(updated);
      addToast(
        activating
          ? 'Política activada: MFA es ahora obligatorio para todas las cuentas de plataforma SaaS.'
          : 'Política desactivada: MFA es ahora opt-in para nuevas cuentas de plataforma.',
        activating ? 'success' : 'warning'
      );
      // Actualizar preflight para reflejar sesiones revocadas o estado actual
      handleRefreshPreflight();
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('cancelado')) return;
      console.error('Error toggling MFA policy:', err);
      addToast('Error al modificar la política de plataforma MFA.', 'error');
    } finally {
      setIsTogglingPolicy(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={26} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-base-content leading-tight">
                Políticas y Preflight de MFA (Plataforma SaaS)
              </h2>
              <p className="text-xs text-base-content/60 mt-0.5">
                Evaluación técnica de preparación operativa y activación controlada de doble factor para ROOT y equipo SaaS.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleRefreshPreflight}
              disabled={isLoading || isEvaluating}
              className="btn btn-ghost btn-sm text-xs flex items-center gap-1.5"
            >
              <RefreshCw size={14} className={isEvaluating ? 'animate-spin' : ''} />
              Diagnóstico
            </button>
          </div>
        </div>

        {/* Global Policy Toggle Section */}
        <div className="p-4 rounded-xl bg-base-200/50 border border-base-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-base-content text-sm">
                Obligatoriedad Global en Plataforma SaaS:
              </span>
              {policyStatus?.platformMandatory ? (
                <ComerziaBadge label="ACTIVA (OBLIGATORIO)" variant="success" />
              ) : (
                <ComerziaBadge label="DESACTIVADA (OPT-IN)" variant="warning" />
              )}
            </div>
            <p className="text-base-content/70 text-[11px] leading-relaxed">
              {policyStatus?.platformMandatory
                ? 'Las cuentas ROOT y SAAS_* deben tener un factor MFA activo para acceder a funciones administrativas de plataforma. Nuevas sesiones sin factor son dirigidas exclusivamente al flujo de enrolamiento.'
                : 'MFA se encuentra en modo compatible/opt-in para cuentas sin factor. Las cuentas con factor previamente confirmado mantienen la exigencia de TOTP en todo momento.'}
            </p>
            {policyStatus?.updatedAt && (
              <span className="text-[10px] text-base-content/50 block font-mono">
                Último cambio: {formatDateForUser(policyStatus.updatedAt)} por @{policyStatus.updatedByUsername}
              </span>
            )}
          </div>

          <button
            onClick={handleTogglePolicy}
            disabled={isLoading || isTogglingPolicy}
            className={`btn btn-sm shrink-0 flex items-center gap-2 text-xs font-semibold ${
              policyStatus?.platformMandatory
                ? 'btn-outline btn-warning'
                : 'btn-primary text-primary-content'
            }`}
          >
            {isTogglingPolicy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : policyStatus?.platformMandatory ? (
              <>
                <ToggleRight size={18} />
                Desactivar Obligatoriedad
              </>
            ) : (
              <>
                <ToggleLeft size={18} />
                Activar Obligatoriedad
              </>
            )}
          </button>
        </div>
      </div>

      {/* Preflight Diagnostics Section */}
      {isLoading ? (
        <div className="bg-base-100 p-10 rounded-2xl border border-base-200 text-center space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-xs text-base-content/60">Ejecutando diagnóstico preflight en servidor...</p>
        </div>
      ) : preflight ? (
        <div className="space-y-4">
          {/* Status banner */}
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between text-xs ${
              preflight.status === 'READY'
                ? 'bg-success/10 border-success/30 text-success'
                : 'bg-error/10 border-error/30 text-error'
            }`}
          >
            <div className="flex items-center gap-2.5">
              {preflight.status === 'READY' ? (
                <CheckCircle2 className="w-5 h-5 shrink-0" />
              ) : (
                <XCircle className="w-5 h-5 shrink-0" />
              )}
              <div>
                <span className="font-bold text-sm block">
                  Estado Preflight: {preflight.status === 'READY' ? 'ENTORNO PREPARADO' : 'BLOQUEOS IDENTIFICADOS'}
                </span>
                <span className="text-[11px] opacity-80">
                  {preflight.status === 'READY'
                    ? 'Todos los componentes críticos de criptografía, persistencia y contingencia están operativos.'
                    : 'Existen impedimentos técnicos o de configuración que deben resolverse antes de activar la política.'}
                </span>
              </div>
            </div>
            <span className="font-mono text-[11px] opacity-70">
              {formatDateForUser(preflight.evaluatedAt)}
            </span>
          </div>

          {/* Blockers & Warnings */}
          {preflight.blockers && preflight.blockers.length > 0 && (
            <div className="p-4 bg-error/10 border border-error/30 rounded-xl space-y-2">
              <span className="text-xs font-bold text-error flex items-center gap-1.5 uppercase">
                <AlertTriangle size={15} /> Bloqueos Técnicos ({preflight.blockers.length}):
              </span>
              <ul className="list-disc list-inside text-xs text-error/90 space-y-1">
                {preflight.blockers.map((b, idx) => (
                  <li key={idx}>{b}</li>
                ))}
              </ul>
            </div>
          )}

          {preflight.warnings && preflight.warnings.length > 0 && (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-xl space-y-2">
              <span className="text-xs font-bold text-warning flex items-center gap-1.5 uppercase">
                <AlertTriangle size={15} /> Advertencias Operativas ({preflight.warnings.length}):
              </span>
              <ul className="list-disc list-inside text-xs text-base-content/80 space-y-1">
                {preflight.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Check Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {/* Keyring */}
            <div className="bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base-content flex items-center gap-1.5">
                  <Key size={14} className="text-primary" /> Keyring Criptográfico
                </span>
                {preflight.keyring.configured && preflight.keyring.roundTripCryptoOk ? (
                  <ComerziaBadge label="Operativo" variant="success" />
                ) : (
                  <ComerziaBadge label="Error" variant="error" />
                )}
              </div>
              <div className="space-y-1 text-base-content/70 text-[11px]">
                <p>Clave activa: <strong className="font-mono text-base-content">{preflight.keyring.activeKeyId}</strong></p>
                <p>Longitud: <strong className="font-mono text-base-content">{preflight.keyring.keyLengthBits} bits (AES-GCM)</strong></p>
                <p>Rotación histórica: {preflight.keyring.previousKeysCount} claves previas</p>
                <p>Cifrado/Descifrado prueba: {preflight.keyring.roundTripCryptoOk ? 'Correcto' : 'Falló'}</p>
              </div>
            </div>

            {/* Database */}
            <div className="bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base-content flex items-center gap-1.5">
                  <Database size={14} className="text-info" /> Base de Datos
                </span>
                {preflight.database.connectionOk && preflight.database.mfaFactorsTableExists ? (
                  <ComerziaBadge label="Esquema OK" variant="success" />
                ) : (
                  <ComerziaBadge label="Incompleto" variant="error" />
                )}
              </div>
              <div className="space-y-1 text-base-content/70 text-[11px]">
                <p>Conexión JDBC: {preflight.database.connectionOk ? 'Activa' : 'Error'}</p>
                <p>Tablas MFA: {preflight.database.mfaFactorsTableExists ? 'V11 sec_user_mfa_factors' : 'Faltante'}</p>
                <p>Códigos Respaldo: {preflight.database.recoveryCodesTableExists ? 'V11 recovery_codes' : 'Faltante'}</p>
                <p>Step-Up & Emergencia: {preflight.database.stepUpGrantsTableExists && preflight.database.emergencyRequestsTableExists ? 'V12/V13 presentes' : 'Faltante'}</p>
              </div>
            </div>

            {/* Clock */}
            <div className="bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base-content flex items-center gap-1.5">
                  <Clock size={14} className="text-warning" /> Reloj y Deriva UTC
                </span>
                {preflight.clock.utcSynchronized ? (
                  <ComerziaBadge label="Sincronizado" variant="success" />
                ) : (
                  <ComerziaBadge label="Desincronizado" variant="error" />
                )}
              </div>
              <div className="space-y-1 text-base-content/70 text-[11px]">
                <p>UTC servidor: <strong className="font-mono text-base-content">{formatDateForUser(preflight.clock.utcNow)}</strong></p>
                <p>Zona del host: <span className="font-mono">{preflight.clock.timezone}</span></p>
                <p>Sincronización RFC 6238: Conforme (paso 30s)</p>
              </div>
            </div>

            {/* Platform Accounts */}
            <div className="bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base-content flex items-center gap-1.5">
                  <Users size={14} className="text-purple-500" /> Cuentas de Plataforma
                </span>
                <ComerziaBadge
                  label={`${preflight.platformInventory.enrolledAccounts} / ${preflight.platformInventory.totalPlatformAccounts}`}
                  variant={preflight.platformInventory.unenrolledAccounts === 0 ? 'success' : 'neutral'}
                />
              </div>
              <div className="space-y-1 text-base-content/70 text-[11px]">
                <p>Total administradores: {preflight.platformInventory.totalPlatformAccounts}</p>
                <p>Enrolados con 2FA: {preflight.platformInventory.enrolledAccounts}</p>
                <p>Pendientes de enrolar: {preflight.platformInventory.unenrolledAccounts}</p>
                {preflight.platformInventory.unenrolledUsernames.length > 0 && (
                  <p className="text-[10px] text-base-content/50 truncate">
                    Sin factor: {preflight.platformInventory.unenrolledUsernames.join(', ')}
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Readiness */}
            <div className="bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-base-content flex items-center gap-1.5">
                  <LifeBuoy size={14} className="text-rose-500" /> Contingencia y Respaldo
                </span>
                {preflight.emergencyReadiness.breakGlassToolAvailable ? (
                  <ComerziaBadge label="Listo" variant="success" />
                ) : (
                  <ComerziaBadge label="No Configurado" variant="error" />
                )}
              </div>
              <div className="space-y-1 text-base-content/70 text-[11px]">
                <p>Control Dual: {preflight.emergencyReadiness.dualControlActive ? 'Activo (Two-Man Rule)' : 'Inactivo'}</p>
                <p>Herramienta Break-Glass: {preflight.emergencyReadiness.breakGlassToolAvailable ? 'Disponible en servidor' : 'No disponible'}</p>
                <p>Vía de emergencia: CLI out-of-band sin bypass web</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <MfaStepUpModal
        isOpen={isStepUpOpen}
        onCancel={handleStepUpCancel}
        onSuccess={handleStepUpSuccess}
        action={stepUpAction}
        title={stepUpTitle}
        description={stepUpDescription}
      />
    </div>
  );
};
