// src/features/security/components/audit/AuditDetailsModal.tsx
import { useState } from 'react';
import { Shield, User, Calendar, Network, Laptop, Copy, Check } from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { BtnCancel } from '../../../../components/ui/CrudButtons';
import { formatDateForUser } from '../../../../utils/date';
import { useToast } from '../../../../context/ToastContext';
import type { AuditLogResponse } from '../../types/audit';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  log: AuditLogResponse | null;
}

export const AuditDetailsModal = ({ isOpen, onClose, log }: Props) => {
  const { addToast: showToast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!log) return null;

  let formattedJson = log.newValues;
  try {
    if (log.newValues) {
      const parsed = JSON.parse(log.newValues);
      formattedJson = JSON.stringify(parsed, null, 2);
    }
  } catch {
    // Si no es un JSON parseable, mostramos la cadena cruda
  }

  const handleCopyJson = () => {
    if (!formattedJson) return;
    navigator.clipboard.writeText(formattedJson);
    setCopied(true);
    showToast('JSON de auditoría copiado al portapapeles', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  const getBadgeVariant = (actionName: string) => {
    const act = actionName.toLowerCase();
    if (act.includes('crea') || act.includes('insert')) return 'success';
    if (act.includes('elimin') || act.includes('delete')) return 'error';
    if (act.includes('modific') || act.includes('update')) return 'info';
    return 'neutral';
  };

  const modalActions = (
    <div className="flex items-center justify-between w-full">
      <button
        type="button"
        onClick={handleCopyJson}
        className="btn btn-sm btn-ghost gap-2 text-primary hover:bg-primary/10"
      >
        {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
        {copied ? '¡Copiado!' : 'Copiar JSON'}
      </button>
      <BtnCancel onClick={onClose} label="Cerrar" />
    </div>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary font-bold">
          <Shield size={22} />
          Detalles de Registro #{log.id}
        </div>
      }
      actions={modalActions}
      size="lg"
    >
      <div className="space-y-5 pt-2">
        {/* RESUMEN DE REGISTRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-base-200/50 rounded-2xl border border-base-200">
          <div className="space-y-1">
            <span className="text-xs text-base-content/60 flex items-center gap-1 font-medium">
              <User className="w-3.5 h-3.5 text-primary" />
              Usuario
            </span>
            <p className="font-bold text-sm text-base-content">{log.userFullName || 'Sistema'}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-base-content/60 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              Fecha y Hora
            </span>
            <p className="font-semibold text-sm text-base-content">{formatDateForUser(log.date)}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-base-content/60 font-medium block">Acción</span>
            <ComerziaBadge label={log.action} variant={getBadgeVariant(log.action)} />
          </div>

          <div className="space-y-1">
            <span className="text-xs text-base-content/60 font-medium block">Módulo</span>
            <span className="badge badge-neutral text-xs font-semibold">{log.module}</span>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-base-content/60 font-medium block">Entidad Afectada</span>
            <p className="font-medium text-sm text-base-content">{log.entity}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-base-content/60 flex items-center gap-1 font-medium">
              <Network className="w-3.5 h-3.5 text-primary" />
              Dirección IP
            </span>
            <p className="font-mono text-sm text-base-content">{log.ipAddress || 'N/A'}</p>
          </div>
        </div>

        {/* AGENTE DE NAVEGADOR */}
        {log.userAgent && (
          <div className="p-3 bg-base-200/30 rounded-xl border border-base-200 flex items-start gap-2 text-xs text-base-content/70">
            <Laptop className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-base-content block">Navegador / Dispositivo:</span>
              <span className="font-mono text-[11px] break-all">{log.userAgent}</span>
            </div>
          </div>
        )}

        {/* VISOR DE JSON CLEAN (newValues) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-base-content uppercase tracking-wider">
              Datos Registrados (Nuevos Valores):
            </span>
          </div>
          <div className="relative group">
            <pre className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs max-h-72 overflow-y-auto border border-slate-800 leading-relaxed shadow-lg whitespace-pre-wrap break-all">
              {formattedJson || 'Sin datos de modificación'}
            </pre>
          </div>
        </div>
      </div>
    </ComerziaModal>
  );
};
