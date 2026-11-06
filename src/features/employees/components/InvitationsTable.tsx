// src/features/employees/components/InvitationsTable.tsx
import React, { useEffect, useState } from 'react';
import { Mail, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '../../../context/ToastContext';
import { invitationService } from '../services/invitationService';
import type { TenantEmployeeInvitationResponse } from '../types/invitation';
import { BtnRefresh, BtnCancel } from '../../../components/ui/CrudButtons';

interface Props {
  invitations: TenantEmployeeInvitationResponse[];
  isLoading: boolean;
  onRefresh: () => void;
  onRevokeRequest: (inv: TenantEmployeeInvitationResponse) => void;
}

export const InvitationsTable: React.FC<Props> = ({
  invitations,
  isLoading,
  onRefresh,
  onRevokeRequest
}) => {
  const { success, error: toastError } = useToast();
  const [resendingRef, setResendingRef] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);
  const canAct = (inv: TenantEmployeeInvitationResponse, timestamp: number) => inv.status === 'PENDING' && Date.parse(inv.expiresAt) > timestamp;

  const handleResend = async (inv: TenantEmployeeInvitationResponse, timestamp: number) => {
    if (resendingRef || !canAct(inv, timestamp)) return;
    setResendingRef(inv.publicReference);

    try {
      await invitationService.resendInvitation(inv.publicReference);
      success(`Reenvío solicitado para ${inv.email}. Revisa el estado de envío.`);
      onRefresh();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      const code = axiosErr.response?.data?.code;
      const apiMsg = axiosErr.response?.data?.message;

      if (code === 'invitation_resend_cooldown') {
        toastError('Debes esperar al menos 60 segundos antes de reenviar esta invitación.');
      } else if (apiMsg) {
        toastError(apiMsg);
      } else {
        toastError('No se pudo reenviar la invitación.');
      }
    } finally {
      setResendingRef(null);
    }
  };

  const formatExpiry = (expiresAtStr: string, currentTimestamp: number) => {
    try {
      const exp = new Date(expiresAtStr);
      const diffMs = exp.getTime() - currentTimestamp;
      if (diffMs <= 0) return <span className="text-error font-medium">Expirada</span>;
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      if (hours > 0) return <span>Vence en {hours}h {mins}m</span>;
      return <span className="text-warning font-medium">Vence en {mins}m</span>;
    } catch {
      return <span>-</span>;
    }
  };

  const renderDeliveryBadge = (deliveryStatus?: string | null) => {
    switch (deliveryStatus?.toUpperCase()) {
      case 'DELIVERED':
        return (
          <span className="badge badge-success badge-sm gap-1">
            <CheckCircle2 className="w-3 h-3" /> Entregado
          </span>
        );
      case 'SENT':
        return (
          <span className="badge badge-info badge-sm gap-1">
            <Send className="w-3 h-3" /> Enviado
          </span>
        );
      case 'FAILED':
        return (
          <span className="badge badge-error badge-sm gap-1">
            <AlertCircle className="w-3 h-3" /> Fallido
          </span>
        );
      case 'PENDING':
      default:
        return (
          <span className="badge badge-ghost badge-sm gap-1 text-base-content/60">
            <Clock className="w-3 h-3" /> En cola
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="card bg-base-100 p-8 rounded-2xl shadow-xs border border-base-200 text-center">
        <span className="loading loading-spinner loading-md text-primary mx-auto mb-2"></span>
        <p className="text-sm text-base-content/60">Cargando invitaciones...</p>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="card bg-base-100 p-12 rounded-2xl shadow-xs border border-base-200 text-center">
        <div className="w-12 h-12 bg-base-200 rounded-full flex items-center justify-center mx-auto mb-3 text-base-content/40">
          <Mail className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-base text-base-content">No hay invitaciones</h3>
        <p className="text-xs text-base-content/60 max-w-sm mx-auto mt-1">
          Cuando invites a nuevos colaboradores para unirse a la empresa, aparecerán aquí para que puedas darles seguimiento.
        </p>
      </div>
    );
  }

  return (
    <div className="card bg-base-100 rounded-2xl shadow-xs border border-base-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="table table-sm w-full">
          <thead>
            <tr className="bg-base-200/50 text-base-content/70">
              <th>Colaborador / Email</th>
              <th>Rol Asignado</th>
              <th>Sucursal</th>
              <th>Estado de invitación</th>
              <th>Estado de envío</th>
              <th>Vencimiento</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {invitations.map(inv => (
              <tr key={inv.publicReference} className="hover:bg-base-200/30">
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-primary/10 text-primary rounded-full flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="font-medium text-base-content text-sm">{inv.email}</span>
                      <span className="block text-[11px] text-base-content/50">Gen. {inv.generation}</span>
                    </div>
                  </div>
                </td>
                <td>
                  <span className="badge badge-outline badge-sm font-medium">
                    {inv.roleName}
                  </span>
                </td>
                <td>
                  <span className="text-xs text-base-content/70">
                    {inv.branchName || 'Todas las sucursales'}
                  </span>
                </td>
                <td><span className={`badge badge-sm ${inv.status === 'ACCEPTED' ? 'badge-success' : 'badge-outline'}`}>
                  {({ ACCEPTED: 'Aceptada', REVOKED: 'Revocada', EXPIRED: 'Vencida', PENDING: Date.parse(inv.expiresAt) <= now ? 'Vencida' : 'Pendiente' } as Record<string, string>)[inv.status] || 'Sin verificar'}
                </span></td>
                <td>{renderDeliveryBadge(inv.deliveryStatus)}</td>
                <td className="text-xs text-base-content/70">
                  {inv.status === 'ACCEPTED' ? 'Completada' : inv.status === 'REVOKED' ? 'Cancelada' : formatExpiry(inv.expiresAt, now)}
                </td>
                <td className="text-right">
                  {inv.status === 'PENDING' && Date.parse(inv.expiresAt) > now ? <div className="flex items-center justify-end gap-1">
                    <BtnRefresh label="Reenviar" responsive={false}
                      type="button"
                      className="btn btn-ghost btn-xs text-primary gap-1"
                      onClick={() => handleResend(inv, Date.now())}
                      disabled={resendingRef === inv.publicReference}
                      title="Reenviar correo de invitación"
                    />
                    <BtnCancel label="Revocar" responsive={false}
                      type="button"
                      className="btn btn-ghost btn-xs text-error gap-1"
                      onClick={() => { if (canAct(inv, Date.now())) onRevokeRequest(inv); }}
                      title="Revocar invitación"
                    />
                  </div> : <span className="text-xs text-base-content/50">Sin acciones pendientes</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

