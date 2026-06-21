import { useState, useEffect } from 'react';
import { posService } from '../services/posService';
import type { CashRegisterResponse } from '../types/pos';
import { BtnCreate, BtnEdit } from '../../../components/ui/CrudButtons';
import { RegisterModal } from '../components/RegisterModal';
import { useToast } from '../../../context/ToastContext';
import { Monitor, AlertCircle } from 'lucide-react';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';

export const RegistersPage = () => {
  const { error: toastError } = useToast();

  const [registers, setRegisters] = useState<CashRegisterResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerToEdit, setRegisterToEdit] = useState<CashRegisterResponse | null>(null);

  useEffect(() => {
    loadRegisters();
  }, []);

  const loadRegisters = async () => {
    setIsLoading(true);
    try {
      // Assuming one page of max 100 registers for simplicity
      const data = await posService.getAllCashRegisters(0, 100);
      setRegisters(data.content);
    } catch (error) {
      toastError("Error al cargar las cajas registradoras");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Cajas Registradoras</h1>
          <p className="text-base-content/60 mt-1">Administración de puntos de cobro físicos</p>
        </div>
        <BtnCreate 
          label="Nueva Caja" 
          onClick={() => {
            setRegisterToEdit(null);
            setIsModalOpen(true);
          }}
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 bg-base-100 rounded-xl shadow-sm border border-base-200">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : registers.length === 0 ? (
        <div className="text-center p-10 text-base-content/60 bg-base-100 rounded-xl shadow-sm border border-base-200">
          No hay cajas registradoras configuradas.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {registers.map(register => (
            <div 
              key={register.id} 
              className={`
                bg-base-100 rounded-2xl p-6 shadow-sm border flex flex-col justify-between
                ${register.status ? 'border-base-200' : 'border-error/30 opacity-75'}
                transition-all duration-300 hover:shadow-md
              `}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${register.status ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/40'}`}>
                    <Monitor size={24} />
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <ComerziaBadge 
                      label={register.status ? 'ACTIVO' : 'INACTIVO'} 
                      variant={register.status ? 'success' : 'neutral'} 
                    />
                    {register.hasActiveShift && (
                      <span className="badge badge-warning badge-sm flex items-center gap-1 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-warning-content animate-pulse" />
                        Turno Abierto
                      </span>
                    )}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold text-base-content mb-1 truncate" title={register.name}>
                  {register.name}
                </h3>
                <p className="text-sm text-base-content/60 font-mono">
                  ID: {register.id}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-base-200 flex justify-between items-center">
                <span className="text-xs text-base-content/50">
                  {register.hasActiveShift ? "Ocupada" : "Libre"}
                </span>
                <BtnEdit 
                  onClick={() => {
                    setRegisterToEdit(register);
                    setIsModalOpen(true);
                  }} 
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <RegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadRegisters}
        registerToEdit={registerToEdit}
      />
    </div>
  );
};
