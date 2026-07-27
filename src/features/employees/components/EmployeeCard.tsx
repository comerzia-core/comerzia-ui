import { Building2, IdCard, Users, ChevronRight } from 'lucide-react';
import type { EmployeeSummaryResponse } from '../types/employee';

interface Props {
  employee: EmployeeSummaryResponse;
  index: number;
  onClick: (employee: EmployeeSummaryResponse) => void;
  onContextMenu?: (e: React.MouseEvent, employee: EmployeeSummaryResponse) => void;
}

export const EmployeeCard = ({ employee, index, onClick, onContextMenu }: Props) => {
  return (
    <div 
      className="bg-base-100 rounded-2xl p-5 border border-base-200 shadow-sm hover:shadow-md hover:border-primary/30 transition-all cursor-pointer relative group flex flex-col justify-between h-full select-none"
      onClick={() => onClick(employee)}
      onContextMenu={(e) => {
        if (onContextMenu) {
          e.preventDefault();
          e.stopPropagation();
          onContextMenu(e, employee);
        }
      }}
    >
      {/* Indicador numérico */}
      <span className="absolute top-4 right-4 text-xs font-bold text-base-content/20 group-hover:text-primary/40 transition-colors">
        #{index + 1}
      </span>

      <div>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
            {employee.fullName.charAt(0)}
          </div>
          <div className="pr-6">
            <h3 className="font-bold text-lg leading-tight text-base-content line-clamp-1" title={employee.fullName}>
              {employee.fullName}
            </h3>
            <div className="flex items-center gap-1.5 mt-1 text-sm text-base-content/60">
              <IdCard size={14} />
              <span>{employee.documentNumber}</span>
            </div>
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <div className="flex items-start gap-2 text-sm">
            <Building2 size={16} className="text-base-content/40 mt-0.5 shrink-0" />
            <span className="text-base-content/80 line-clamp-1">{employee.branchName || 'Sin sucursal'}</span>
          </div>

          <div className="flex items-start gap-2 text-sm">
            <Users size={16} className="text-base-content/40 mt-0.5 shrink-0" />
            <div className="flex flex-wrap gap-1">
              {employee.roleNames.length > 0 ? (
                employee.roleNames.map((role, idx) => (
                  <span key={idx} className="bg-base-200 text-xs px-2 py-0.5 rounded-full text-base-content/70">
                    {role}
                  </span>
                ))
              ) : (
                <span className="text-base-content/50 italic">Sin roles</span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 pt-3 border-t border-base-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${employee.userEnabled ? 'bg-success' : 'bg-error'}`}></span>
          <span className="text-xs font-medium text-base-content/60">
            {employee.userEnabled ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center text-sm font-semibold">
          Ver ficha <ChevronRight size={16} />
        </div>
      </div>
    </div>
  );
};
