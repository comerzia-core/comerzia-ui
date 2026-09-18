import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import { UserCircle, MapPin, Briefcase, Mail, Phone, Calendar } from 'lucide-react';
import { employeeService } from '../services/employeeService';
import type { EmployeeDetailResponse } from '../types/employee';

import { useAuthStore } from '../../../stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string | null;
}

export const EmployeeDetailModal = ({ isOpen, onClose, employeeId }: Props) => {
  const [detail, setDetail] = useState<EmployeeDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  useEffect(() => {
    if (isOpen && employeeId) {
      loadDetail(employeeId);
    } else {
      setDetail(null);
    }
  }, [isOpen, employeeId]);

  const loadDetail = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await employeeService.getById(id);
      setDetail(data);
    } catch (error) {
      console.error("Error loading employee detail", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <ComerziaModal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Ficha del Personal" 
      size="lg"
      variant="view"
      actions={
        <div className="flex gap-2 w-full justify-end">
          <BtnCancel onClick={onClose} label="Cerrar" responsive={true} className="w-full sm:w-auto" />
        </div>
      }
    >
      {isLoading || !detail ? (
        <div className="flex justify-center items-center h-64">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : (
        <div className="space-y-6 pt-4 text-base-content/80">
          
          {/* Header Info */}
          <div className="flex items-center gap-4 border-b border-base-200 pb-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-2xl">
              {detail.firstName.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-base-content leading-tight">
                {detail.firstName} {detail.paternalSurname} {detail.maternalSurname}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${detail.employmentEndDate === null ? 'bg-success/20 text-success' : 'bg-error/20 text-error'}`}>
                  {detail.employmentEndDate === null ? 'Activo' : 'Inactivo'}
                </span>
                <span className="text-sm font-mono bg-base-200 px-2 rounded-md">CI: {detail.documentNumber}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Personales */}
            <div className="bg-base-100 shadow-sm border border-base-300 p-4 rounded-xl space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-base-content border-b border-base-300 pb-2">
                <UserCircle size={18} className="text-primary" /> Datos Personales
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="font-semibold w-28">Documento:</span>
                  <span>{detail.documentType?.label} {detail.documentNumber} {detail.documentExtension?.label ? `(${detail.documentExtension.label})` : ''}</span>
                </div>
                <div className="flex gap-2">
                  <Mail size={16} className="text-base-content/50" />
                  <span>{detail.email || <span className="text-base-content/30 italic">No registrado</span>}</span>
                </div>
                <div className="flex gap-2">
                  <Phone size={16} className="text-base-content/50" />
                  <span>{detail.phoneNumber || <span className="text-base-content/30 italic">No registrado</span>}</span>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-base-300">
                  <span className="font-semibold w-28">Usuario:</span>
                  <span className="font-mono">{detail.username}</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-semibold w-28">Acceso:</span>
                  <span className={detail.userEnabled ? 'text-success font-medium' : 'text-error font-medium'}>
                    {detail.userEnabled ? 'Habilitado' : 'Bloqueado'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contrato */}
            <div className="bg-base-100 shadow-sm border border-base-300 p-4 rounded-xl space-y-3">
              <h3 className="font-bold flex items-center gap-2 text-base-content border-b border-base-300 pb-2">
                <Briefcase size={18} className="text-primary" /> Contrato y Roles
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <MapPin size={16} className="text-base-content/50" />
                  <span className="font-medium">{detail.branchName || 'Administración Global'}</span>
                </div>
                <div className="flex gap-2">
                  <Calendar size={16} className="text-base-content/50" />
                  <span>Inicio: {detail.employmentStartDate ? new Date(detail.employmentStartDate).toLocaleDateString() : '-'}</span>
                </div>
                {detail.employmentEndDate !== null && (
                  <div className="flex gap-2 text-error">
                    <Calendar size={16} className="text-error/50" />
                    <span>Fin: {new Date(detail.employmentEndDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <span className="font-semibold w-28">Salario Base:</span>
                  <span>{detail.baseSalary ? `${currencyCode} ${detail.baseSalary} (${detail.paymentFrequency?.label})` : <span className="text-base-content/30 italic">No especificado</span>}</span>
                </div>
                <div className="flex gap-2 mt-2 pt-2 border-t border-base-300">
                  <span className="font-semibold w-28">Roles:</span>
                  <div className="flex flex-wrap gap-1">
                    {detail.roleNames && detail.roleNames.length > 0 ? (
                      detail.roleNames.map((r, i) => (
                        <span key={i} className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-medium">{r}</span>
                      ))
                    ) : (
                      <span className="text-base-content/30 italic">Sin roles</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </ComerziaModal>
  );
};
