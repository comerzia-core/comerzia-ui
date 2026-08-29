// src/features/organization/components/branches/BranchCard.tsx
import React, { useRef } from 'react';
import { Store, MapPin } from 'lucide-react';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import type { BranchResponse } from '../../types/branch';

interface Props {
  branch: BranchResponse;
  onContextMenu: (e: React.MouseEvent | { clientX: number; clientY: number; preventDefault: () => void }, branch: BranchResponse) => void;
}

export const BranchCard = ({ branch, onContextMenu }: Props) => {
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      onContextMenu(
        {
          clientX: touchStartPosRef.current.x,
          clientY: touchStartPosRef.current.y,
          preventDefault: () => {}
        },
        branch
      );
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const moveX = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const moveY = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (moveX > 10 || moveY > 10) {
      handleTouchEnd();
    }
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onContextMenu={e => onContextMenu(e, branch)}
      title="Mantén presionado o haz clic derecho para ver más opciones"
      className="card bg-base-100 border border-base-200 shadow-xs hover:shadow-md transition-all duration-300 hover:border-primary/40 rounded-2xl group overflow-hidden flex flex-col justify-between cursor-pointer select-none"
    >
      {/* CABECERA CON ICONO, CÓDIGO Y INSIGNIA DE ESTADO */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold group-hover:scale-105 transition-transform duration-300 shadow-xs">
            <Store className="w-5 h-5" />
          </div>

          {branch.code && (
            <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-base-100/90 border border-primary/20 text-primary shadow-2xs uppercase tracking-wide">
              {branch.code}
            </span>
          )}
        </div>

        <ComerziaBadge
          label={branch.status ? 'Activa' : 'Inactiva'}
          variant={branch.status ? 'success' : 'neutral'}
        />
      </div>

      {/* CUERPO DE LA TARJETA */}
      <div className="p-4 sm:p-5 pt-2 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-base-content group-hover:text-primary transition-colors line-clamp-1">
            {branch.name}
          </h3>

          <div className="flex items-start gap-2 text-xs sm:text-sm text-base-content/70 mt-2">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">
              {branch.address ? branch.address : 'Sin dirección registrada'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
