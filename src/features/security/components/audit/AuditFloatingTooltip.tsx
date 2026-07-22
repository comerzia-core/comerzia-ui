// src/features/security/components/audit/AuditFloatingTooltip.tsx
import { createPortal } from 'react-dom';
import { Shield, User, Calendar, Network, Code2 } from 'lucide-react';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { formatDateForUser } from '../../../../utils/date';
import type { AuditLogResponse } from '../../types/audit';

interface Props {
  log: AuditLogResponse | null;
  pos: { x: number; y: number } | null;
}

export const AuditFloatingTooltip = ({ log, pos }: Props) => {
  if (!log || !pos) return null;

  // Ajuste inteligente para evitar que se salga de la ventana
  const top = Math.min(pos.y + 12, window.innerHeight - 340);
  const left = Math.min(pos.x + 12, window.innerWidth - 420);

  // Formatear JSON de newValues si es un JSON válido
  let formattedJson = log.newValues;
  try {
    if (log.newValues) {
      const parsed = JSON.parse(log.newValues);
      formattedJson = JSON.stringify(parsed, null, 2);
    }
  } catch {
    // Si no es un JSON válido, mostramos el texto crudo
  }

  // Asignar variante de badge según el tipo de acción
  const getBadgeVariant = (actionName: string) => {
    const act = actionName.toLowerCase();
    if (act.includes('crea') || act.includes('insert')) return 'success';
    if (act.includes('elimin') || act.includes('delete') || act.includes('borrar')) return 'error';
    if (act.includes('modific') || act.includes('updat') || act.includes('edit')) return 'info';
    return 'neutral';
  };

  return createPortal(
    <div
      style={{ top: `${Math.max(10, top)}px`, left: `${Math.max(10, left)}px` }}
      className="fixed z-[9999] pointer-events-none bg-base-100/95 backdrop-blur-md border border-primary/30 shadow-2xl rounded-2xl p-4 w-80 sm:w-96 text-xs transition-opacity duration-150 animate-fade-in space-y-3"
    >
      {/* CABECERA CON USUARIO Y ACCIÓN */}
      <div className="flex items-start justify-between gap-2 border-b border-base-200 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-base-content text-xs flex items-center gap-1">
              <User className="w-3 h-3 text-primary/70" />
              {log.userFullName || 'Usuario Sistema'}
            </span>
            <span className="text-[10px] text-base-content/60 flex items-center gap-1 mt-0.5">
              <Calendar className="w-3 h-3" />
              {formatDateForUser(log.date)}
            </span>
          </div>
        </div>

        <ComerziaBadge label={log.action} variant={getBadgeVariant(log.action)} />
      </div>

      {/* MÓDULO Y ENTIDAD */}
      <div className="flex items-center justify-between text-[11px] bg-base-200/50 p-2 rounded-xl border border-base-200/60">
        <span className="text-base-content/70">
          Módulo: <strong className="text-base-content font-semibold">{log.module}</strong>
        </span>
        <span className="text-base-content/70">
          Entidad: <strong className="text-base-content font-semibold">{log.entity}</strong>
        </span>
      </div>

      {/* DETALLES DE VALORES (JSON CLEAN PREVIEW) */}
      <div className="space-y-1">
        <div className="flex items-center gap-1 text-[10px] font-semibold text-primary uppercase tracking-wider">
          <Code2 className="w-3 h-3" />
          Valores Modificados (newValues)
        </div>
        <pre className="bg-base-300/40 p-2.5 rounded-xl font-mono text-[10px] max-h-36 overflow-y-auto leading-relaxed border border-base-300/60 text-base-content/90 whitespace-pre-wrap break-all shadow-inner">
          {formattedJson || 'Sin información de cambios'}
        </pre>
      </div>

      {/* DIRECCIÓN IP Y AGENTE */}
      {log.ipAddress && (
        <div className="flex items-center justify-between text-[10px] text-base-content/50 pt-1 border-t border-base-200/50">
          <span className="flex items-center gap-1">
            <Network className="w-3 h-3" />
            IP: {log.ipAddress}
          </span>
          <span className="truncate max-w-[150px]" title={log.userAgent}>
            {log.userAgent}
          </span>
        </div>
      )}
    </div>,
    document.body
  );
};
