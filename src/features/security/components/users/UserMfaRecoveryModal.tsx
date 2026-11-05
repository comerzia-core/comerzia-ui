import React, { useState, useEffect, useCallback } from 'react';
import { isAxiosError } from 'axios';
import {
  ShieldAlert,
  AlertTriangle,
  Clock,
  UserCheck,
  XCircle,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { BtnCancel, BtnSave, BtnDelete } from '../../../../components/ui/CrudButtons';
import { useToast } from '../../../../context/ToastContext';
import { useStepUp } from '../../hooks/useStepUp';
import { MfaStepUpModal } from '../MfaStepUpModal';
import { mfaAdminRecoveryService } from '../../services/mfaAdminRecoveryService';
import type { UserResponse } from '../../types/user';
import type { MfaEmergencyRequestResponse } from '../../types/mfaRecovery';
import { formatDateForUser } from '../../../../utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  user: UserResponse | null;
  isSaasScope?: boolean;
  onSuccess?: () => void;
}

export const UserMfaRecoveryModal: React.FC<Props> = (props) =>
  props.isOpen && props.user ? <UserMfaRecoveryModalContent key={props.user.id} {...props} /> : null;

function UserMfaRecoveryModalContent({ isOpen, onClose, user, isSaasScope = false, onSuccess }: Props) {
  const { addToast } = useToast();

  const [activeRequest, setActiveRequest] = useState<MfaEmergencyRequestResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [reason, setReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const {
    isStepUpOpen,
    stepUpAction,
    stepUpTarget,
    stepUpTitle,
    stepUpDescription,
    requestStepUp,
    handleSuccess: handleStepUpSuccess,
    handleCancel: handleStepUpCancel
  } = useStepUp();

  const loadActiveRequest = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const data = isSaasScope
        ? await mfaAdminRecoveryService.getActiveSaasRequest(user.id)
        : await mfaAdminRecoveryService.getActiveTenantRequest(user.id);
      setActiveRequest(data);
    } catch {
      console.error('Error fetching active recovery request:');
      setErrorMsg('No se pudo verificar el estado de solicitudes de recuperación.');
    } finally {
      setIsLoading(false);
    }
  }, [user, isSaasScope]);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchReq = isSaasScope
      ? mfaAdminRecoveryService.getActiveSaasRequest(user.id)
      : mfaAdminRecoveryService.getActiveTenantRequest(user.id);

    fetchReq
      .then((data) => {
        if (isMounted) setActiveRequest(data);
      })
      .catch(() => {
        if (isMounted) {
          console.error('Error fetching active recovery request:');
          setErrorMsg('No se pudo verificar el estado de solicitudes de recuperación.');
        }
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [user, isSaasScope]);

  const handleCreateRequest = async () => {
    if (!user) return;
    if (reason.trim().length < 10) {
      setErrorMsg('El motivo debe contener al menos 10 caracteres explicativos.');
      return;
    }
    setErrorMsg(null);

    try {
      const grantToken = await requestStepUp(isSaasScope ? 'MANAGE_SAAS_TEAM' : 'ADMIN_MFA_RECOVERY', {
        targetId: 'POST:' + (isSaasScope ? '/saas/team/' : '/tenant/users/') + user.id + '/mfa-recovery/request',
        body: { reason },
        title: 'Elevación de Privilegios requerida',
        description: 'Ingrese su código TOTP para iniciar la solicitud de recuperación administrativa.'
      });

      setIsSubmitting(true);
      const created = isSaasScope
        ? await mfaAdminRecoveryService.createSaasRequest(user.id, { reason }, grantToken)
        : await mfaAdminRecoveryService.createTenantRequest(user.id, { reason }, grantToken);

      setActiveRequest(created);
      setReason('');
      addToast('Solicitud de recuperación registrada con éxito.', 'success');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'step_up_cancelled') return;
      const backendMsg = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setErrorMsg(backendMsg || 'Error al registrar la solicitud de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveRequest = async () => {
    if (!user || !activeRequest) return;
    setErrorMsg(null);

    try {
      const grantToken = await requestStepUp(isSaasScope ? 'MANAGE_SAAS_TEAM' : 'ADMIN_MFA_RECOVERY', {
        targetId: 'POST:' + (isSaasScope ? '/saas/team/' : '/tenant/users/') + user.id + '/mfa-recovery/approve?reference=' + encodeURIComponent(activeRequest.publicReference),
        title: 'Aprobación de Control Dual',
        description: 'Ingrese su código TOTP para aprobar la recuperación como segundo operador.'
      });

      setIsSubmitting(true);
      const approved = isSaasScope
        ? await mfaAdminRecoveryService.approveSaasRequest(user.id, activeRequest.publicReference, grantToken)
        : await mfaAdminRecoveryService.approveTenantRequest(user.id, activeRequest.publicReference, grantToken);

      setActiveRequest(approved);
      addToast('Solicitud aprobada exitosamente por el segundo operador.', 'success');
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'step_up_cancelled') return;
      const backendMsg = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setErrorMsg(backendMsg || 'Error al aprobar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExecuteRequest = async () => {
    if (!user || !activeRequest) return;
    setErrorMsg(null);

    try {
      const grantToken = await requestStepUp(isSaasScope ? 'MANAGE_SAAS_TEAM' : 'ADMIN_MFA_RECOVERY', {
        targetId: 'POST:' + (isSaasScope ? '/saas/team/' : '/tenant/users/') + user.id + '/mfa-recovery/execute?reference=' + encodeURIComponent(activeRequest.publicReference),
        title: 'Ejecución de Restablecimiento MFA',
        description: 'Confirme con su TOTP para revocar factores y restablecer acceso.'
      });

      setIsSubmitting(true);
      const executed = isSaasScope
        ? await mfaAdminRecoveryService.executeSaasRequest(user.id, activeRequest.publicReference, grantToken)
        : await mfaAdminRecoveryService.executeTenantRequest(user.id, activeRequest.publicReference, grantToken);

      setActiveRequest(executed);
      addToast('Recuperación ejecutada: factores revocados y sesiones cerradas.', 'success');
      onSuccess?.();
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'step_up_cancelled') return;
      const backendMsg = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setErrorMsg(backendMsg || 'Error al ejecutar el restablecimiento de emergencia.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectRequest = async () => {
    if (!user || !activeRequest) return;
    if (rejectReason.trim().length < 10) {
      setErrorMsg('El motivo de rechazo debe contener al menos 10 caracteres.');
      return;
    }
    setErrorMsg(null);

    try {
      const grantToken = await requestStepUp(isSaasScope ? 'MANAGE_SAAS_TEAM' : 'ADMIN_MFA_RECOVERY', {
        targetId: 'POST:' + (isSaasScope ? '/saas/team/' : '/tenant/users/') + user.id + '/mfa-recovery/reject?reference=' + encodeURIComponent(activeRequest.publicReference),
        body: { rejectionReason: rejectReason },
      });
      setIsSubmitting(true);
      const rejected = isSaasScope
        ? await mfaAdminRecoveryService.rejectSaasRequest(user.id, activeRequest.publicReference, { reason: rejectReason }, grantToken)
        : await mfaAdminRecoveryService.rejectTenantRequest(user.id, activeRequest.publicReference, { reason: rejectReason }, grantToken);

      setActiveRequest(rejected);
      setShowRejectInput(false);
      setRejectReason('');
      addToast('Solicitud rechazada.', 'info');
    } catch (err: unknown) {
      const backendMsg = isAxiosError<{ message?: string }>(err) ? err.response?.data?.message : undefined;
      setErrorMsg(backendMsg || 'Error al rechazar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return <ComerziaBadge label="Pendiente de Aprobación" variant="warning" />;
      case 'APPROVED':
        return <ComerziaBadge label="Aprobada (Lista para Ejecutar)" variant="info" />;
      case 'EXECUTED':
        return <ComerziaBadge label="Ejecutada" variant="success" />;
      case 'REJECTED':
        return <ComerziaBadge label="Rechazada" variant="error" />;
      case 'EXPIRED':
        return <ComerziaBadge label="Expirada" variant="neutral" />;
      default:
        return <ComerziaBadge label={status} variant="neutral" />;
    }
  };

  return (
    <>
      <ComerziaModal
        isOpen={isOpen}
        onClose={onClose}
        title={
          <div className="flex items-center gap-2 text-warning font-bold">
            <ShieldAlert size={22} />
            Recuperación Administrativa de MFA
          </div>
        }
        size="lg"
      >
        <div className="space-y-4 pt-1">
          {/* Target user info */}
          <div className="p-3.5 bg-base-200/60 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-base-content block">
                {user?.fullName} (@{user?.username})
              </span>
            </div>
            <button
              onClick={loadActiveRequest}
              disabled={isLoading}
              className="btn btn-ghost btn-xs text-base-content/70 flex items-center gap-1"
              title="Actualizar estado"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              Actualizar
            </button>
          </div>

          {/* Dual Control Notice */}
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl text-xs text-base-content/80 flex items-start gap-2.5">
            <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-warning">Protocolo de Control Dual (Two-Man Rule)</p>
              <p className="text-[11px] leading-relaxed text-base-content/70">
                Por motivos de seguridad contra secuestro de cuentas, la recuperación requiere que un operador
                solicite el restablecimiento y un segundo operador distinto lo apruebe antes de la ejecución. Ningún
                operador puede autorizar su propia solicitud.
              </p>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error flex items-center gap-2">
              <XCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-8 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-warning" />
              <span className="text-xs text-base-content/60">Consultando estado de recuperación...</span>
            </div>
          ) : activeRequest && (activeRequest.status === 'REQUESTED' || activeRequest.status === 'APPROVED') ? (
            /* Active Request Status Card */
            <div className="border border-base-300 rounded-xl p-4 bg-base-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider">
                  Solicitud Activa
                </span>
                {getStatusBadge(activeRequest.status)}
              </div>

              <div className="space-y-2 text-xs">
                <div className="bg-base-200/50 p-2.5 rounded-lg">
                  <span className="text-base-content/50 block text-[10px] uppercase font-bold">Motivo:</span>
                  <p className="text-base-content font-medium mt-0.5">{activeRequest.reason}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-base-content/70 pt-1">

                  <div>
                    <span className="text-base-content/40 block text-[10px]">Expira en:</span>
                    <span className="font-mono flex items-center gap-1">
                      <Clock size={11} /> {formatDateForUser(activeRequest.expiresAt)}
                    </span>
                  </div>

                </div>
              </div>

              {/* Action Buttons depending on status */}
              <div className="pt-2 border-t border-base-200 flex flex-wrap gap-2 justify-end">
                {activeRequest.status === 'REQUESTED' && (
                  <>
                    {!showRejectInput ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setShowRejectInput(true)}
                          disabled={isSubmitting}
                          className="btn btn-outline btn-error btn-xs"
                        >
                          Rechazar Solicitud
                        </button>
                        <button
                          type="button"
                          onClick={handleApproveRequest}
                          disabled={isSubmitting}
                          className="btn btn-warning btn-xs text-warning-content flex items-center gap-1"
                        >
                          {isSubmitting ? <Loader2 size={12} className="animate-spin" /> : <UserCheck size={12} />}
                          Aprobar Solicitud (2° Operador)
                        </button>
                      </>
                    ) : (
                      <div className="w-full space-y-2 pt-1">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Indique el motivo detallado de rechazo..."
                          className="textarea textarea-bordered textarea-xs w-full"
                          rows={2}
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setShowRejectInput(false);
                              setRejectReason('');
                            }}
                            className="btn btn-ghost btn-xs"
                          >
                            Cancelar
                          </button>
                          <BtnDelete
                            onClick={handleRejectRequest}
                            isLoading={isSubmitting}
                            label="Confirmar Rechazo"
                            className="btn-xs"
                          />
                        </div>
                      </div>
                    )}
                  </>
                )}

                {activeRequest.status === 'APPROVED' && (
                  <BtnSave
                    onClick={handleExecuteRequest}
                    isLoading={isSubmitting}
                    label="Ejecutar Restablecimiento Inmediato"
                    className="btn-xs !bg-warning hover:!bg-warning/80 !text-warning-content border-none"
                  />
                )}
              </div>
            </div>
          ) : (
            /* No active request - form to initiate */
            <div className="space-y-3">
              {activeRequest && (activeRequest.status === 'EXECUTED' || activeRequest.status === 'REJECTED' || activeRequest.status === 'EXPIRED') && (
                <div className="p-3 bg-base-200/50 rounded-xl border border-base-300 text-xs flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-base-content/50 block">Última solicitud:</span>
                    <span className="text-base-content/70">
                      Finalizada el {formatDateForUser(activeRequest.executedAt || activeRequest.rejectedAt || activeRequest.createdAt)}
                    </span>
                  </div>
                  {getStatusBadge(activeRequest.status)}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-base-content">
                  Motivo de la solicitud de recuperación <span className="text-error">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explique detalladamente la razón (ej. Usuario extravió dispositivo autenticador y no cuenta con códigos de respaldo)..."
                  className="textarea textarea-bordered textarea-sm w-full text-xs"
                  rows={3}
                  disabled={isSubmitting}
                />
                <span className="text-[11px] text-base-content/50 block">
                  Mínimo 10 caracteres. Se registrará en la pista de auditoría forense con su identidad.
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <BtnSave
                  onClick={handleCreateRequest}
                  isLoading={isSubmitting}
                  disabled={reason.trim().length < 10}
                  label="Solicitar Recuperación MFA"
                  className="btn-sm !bg-warning hover:!bg-warning/80 !text-warning-content border-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="modal-action border-t border-base-200 pt-3 mt-4">
          <BtnCancel onClick={onClose} disabled={isSubmitting} className="btn-sm" />
        </div>
      </ComerziaModal>

      <MfaStepUpModal
        isOpen={isStepUpOpen}
        onCancel={handleStepUpCancel}
        onSuccess={handleStepUpSuccess}
        action={stepUpAction}
        targetId={stepUpTarget}
        title={stepUpTitle}
        description={stepUpDescription}
      />
    </>
  );
}
