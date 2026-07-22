// src/features/organization/components/branches/BranchCard.tsx
import React from 'react';
import { Store, MapPin } from 'lucide-react';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import type { BranchResponse } from '../../types/branch';

interface Props {
  branch: BranchResponse;
  onContextMenu: (e: React.MouseEvent, branch: BranchResponse) => void;
}

export const BranchCard = ({ branch, onContextMenu }: Props) => {
  return (
    <div
      onContextMenu={e => onContextMenu(e, branch)}
      title="Haz clic derecho para ver más opciones"
      className="card bg-base-100 border border-base-200 shadow-xs hover:shadow-md transition-all duration-300 hover:border-primary/40 rounded-2xl group overflow-hidden flex flex-col justify-between cursor-pointer select-none"
    >
      {/* CABECERA CON ICONO Y INSIGNIA DE ESTADO */}
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 flex items-center justify-between">
        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold group-hover:scale-105 transition-transform duration-300 shadow-xs">
          <Store className="w-5 h-5" />
        </div>

        <ComerziaBadge
          label={branch.status ? 'Activa' : 'Inactiva'}
          variant={branch.status ? 'success' : 'neutral'}
        />
      </div>

      {/* CUERPO DE LA TARJETA */}
      <div className="p-5 pt-2 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="font-bold text-base sm:text-lg text-base-content group-hover:text-primary transition-colors line-clamp-1">
            {branch.name}
          </h3>

          <div className="flex items-start gap-2 text-sm text-base-content/70 mt-2">
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
