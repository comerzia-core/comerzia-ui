// src/features/pos/pages/RegistersPage.tsx
import { useState, useEffect } from 'react';
import { posService } from '../services/posService';
import { branchService } from '../../organization/services/branchService';
import type { CashRegisterResponse } from '../types/pos';
import type { BranchResponse } from '../../organization/types/branch';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { RegisterModal } from '../components/RegisterModal';
import { useToast } from '../../../context/ToastContext';
import { Monitor, MapPin, History, Pencil, Building2 } from 'lucide-react';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { CashRegisterHistoryView } from './CashRegisterHistoryView';

export const RegistersPage = () => {
  const { error: toastError } = useToast();

  const [registers, setRegisters] = useState<CashRegisterResponse[]>([]);
  const [branches, setBranches] = useState<BranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [registerToEdit, setRegisterToEdit] = useState<CashRegisterResponse | null>(null);

  const [selectedRegister, setSelectedRegister] = useState<CashRegisterResponse | null>(null);

  // Estado del Menú Contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    register: CashRegisterResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    register: null
  });

  useEffect(() => {
    loadBranches();
  }, []);

  useEffect(() => {
    loadRegisters();
  }, [selectedBranchId]);

  const loadBranches = async () => {
    try {
      const data = await branchService.getBranches(0, 100, true);
      setBranches(data.content || []);
    } catch (error) {
      console.error('Error loading branches:', error);
      toastError('No se pudieron cargar las sucursales.');
    }
  };

  const loadRegisters = async () => {
    setIsLoading(true);
    try {
      const data = await posService.getAllCashRegisters(0, 100, ['b.name,asc', 'c.name,asc']);
      const allRegisters = data.content || [];
      const filtered = selectedBranchId
        ? allRegisters.filter(r => r.branchId === selectedBranchId)
        : allRegisters;
      setRegisters(filtered);
    } catch (error) {
      console.error('Error loading cash registers:', error);
      toastError('No se pudieron cargar las cajas registradoras.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, register: CashRegisterResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      register
    });
  };

  if (selectedRegister) {
    return (
      <CashRegisterHistoryView
        register={selectedRegister}
        onBack={() => setSelectedRegister(null)}
      />
    );
  }

  const branchOptions = [
    { value: '', label: 'Todas las sucursales' },
    ...branches.map(b => ({ value: b.id, label: b.name }))
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Cajas Registradoras</h1>
          <p className="text-base-content/60 mt-1">Administración de puntos de cobro físicos</p>
        </div>
        <div className="flex items-center gap-3">
          <BtnCreate
            label="Nueva Caja"
            onClick={() => {
              setRegisterToEdit(null);
              setIsModalOpen(true);
            }}
          />
        </div>
      </div>

      {/* Barra de Filtro por Sucursales */}
      <div className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-3 w-full sm:w-80">
          <Building2 size={20} className="text-primary shrink-0" />
          <ComerziaSelect
            label=""
            options={branchOptions}
            value={selectedBranchId}
            onChange={e => setSelectedBranchId(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="text-xs text-base-content/60 font-medium">
          {registers.length} {registers.length === 1 ? 'caja registrada' : 'cajas registradas'}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-10 bg-base-100 rounded-xl shadow-sm border border-base-200">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : registers.length === 0 ? (
        <div className="text-center p-10 text-base-content/60 bg-base-100 rounded-xl shadow-sm border border-base-200">
          No hay cajas registradoras configuradas para el filtro seleccionado.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {registers.map(register => (
            <div
              key={register.id}
              className={`
                bg-base-100 rounded-2xl p-6 shadow-sm border select-none flex flex-col justify-between
                ${register.status ? 'border-base-200 hover:border-primary/40' : 'border-error/30 opacity-75'}
                transition-all duration-300 hover:shadow-lg cursor-pointer relative group
              `}
              onClick={() => setSelectedRegister(register)}
              onContextMenu={e => handleContextMenu(e, register)}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                      register.status
                        ? 'bg-primary/10 text-primary'
                        : 'bg-base-200 text-base-content/40'
                    }`}
                  >
                    <Monitor size={24} />
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex flex-col items-end gap-1.5">
                      <ComerziaBadge
                        label={register.status ? 'ACTIVA' : 'INACTIVA'}
                        variant={register.status ? 'success' : 'neutral'}
                      />
                      {register.hasActiveShift ? (
                        <span className="badge badge-warning badge-sm flex items-center gap-1 font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-warning-content animate-pulse" />
                          Turno Abierto
                        </span>
                      ) : (
                        <span className="badge badge-ghost badge-sm text-base-content/50 font-medium">
                          Sin Turno
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <h3
                  className="text-xl font-bold text-base-content mb-1 truncate group-hover:text-primary transition-colors"
                  title={register.name}
                >
                  {register.name}
                </h3>
                <p className="text-sm text-base-content/60 font-medium flex items-center gap-1.5 mt-2">
                  <MapPin size={15} className="text-base-content/40 shrink-0" />
                  <span className="truncate">{register.branchName || 'Sin sucursal'}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MENÚ CONTEXTUAL ESTANDARIZADO */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.register && (
          <>
            <ContextMenuItem
              icon={History}
              label="Ver Historial"
              onClick={() => {
                if (contextMenu.register) setSelectedRegister(contextMenu.register);
              }}
            />
            <ContextMenuItem
              icon={Pencil}
              label="Modificar"
              onClick={() => {
                if (contextMenu.register) {
                  setRegisterToEdit(contextMenu.register);
                  setIsModalOpen(true);
                }
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      <RegisterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadRegisters}
        registerToEdit={registerToEdit}
      />
    </div>
  );
};
