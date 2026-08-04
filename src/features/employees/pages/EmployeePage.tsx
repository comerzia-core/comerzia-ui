// src/features/employees/pages/EmployeePage.tsx
import { useState, useEffect } from 'react';
import { Pencil, Trash2, Users } from 'lucide-react';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeCard } from '../components/EmployeeCard';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import { employeeService } from '../services/employeeService';
import type { EmployeeSummaryResponse, EmployeeCreatedResponse } from '../types/employee';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { EmployeeCredentialsModal } from '../components/EmployeeCredentialsModal';
import { useAuthStore } from '../../../stores/useAuthStore';

type EmployeeActionType = 'DELETE' | null;

export const EmployeePage = () => {
  const { hasRole } = useAuthStore();
  const isOwner = hasRole('OWNER');
  const [data, setData] = useState<EmployeeSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);

  const [page, setPage] = useState(0);
  const size = 10;
  const [hasMore, setHasMore] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummaryResponse | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  // Menú Contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    employee: EmployeeSummaryResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    employee: null
  });

  // Estado de Acciones Administrativas con Modal de Confirmación
  const [pendingAction, setPendingAction] = useState<EmployeeActionType>(null);
  const [targetEmployee, setTargetEmployee] = useState<EmployeeSummaryResponse | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [credentialsData, setCredentialsData] = useState<EmployeeCreatedResponse | null>(null);

  const { success, error } = useToast();

  const loadData = async (reset = false) => {
    setIsLoading(true);
    try {
      const targetPage = reset ? 0 : page;
      const response = await employeeService.getAll(targetPage, size, ['branchName,asc', 'fullName,asc']);

      if (reset) {
        setData(response.content);
        setPage(0);
      } else {
        setData(prev => [...prev, ...response.content]);
      }

      setTotalElements(response.totalElements);
      setHasMore(!response.last);
    } catch (err) {
      console.error('Error loading employees:', err);
      error('No se pudo cargar la lista de empleados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(page === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Cierre de menú contextual al interactuar fuera
  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
    };
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', handleClickOutside);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', handleClickOutside);
    };
  }, [contextMenu.isOpen]);

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: EmployeeSummaryResponse) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleCardClick = (employee: EmployeeSummaryResponse) => {
    setSelectedDetailId(employee.id);
    setDetailModalOpen(true);
  };

  const handleContextMenu = (e: React.MouseEvent, employee: EmployeeSummaryResponse) => {
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      employee
    });
  };

  const handleConfirmAction = async () => {
    if (!targetEmployee || !pendingAction) return;

    try {
      setIsProcessingAction(true);
      if (pendingAction === 'DELETE') {
        await employeeService.delete(targetEmployee.id);
        success(`Empleado "${targetEmployee.fullName}" eliminado exitosamente.`);
        loadData(true);
      }
      setPendingAction(null);
      setTargetEmployee(null);
    } catch (err: any) {
      console.error('Error executing employee administrative action:', err);
      const apiMsg = err.response?.data?.message || err.response?.data?.error;
      error(apiMsg || 'Error al ejecutar la acción en el empleado.');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getConfirmationContent = () => {
    if (!targetEmployee || !pendingAction) {
      return { title: '', message: '', variant: 'warning' as const, confirmText: 'Confirmar' };
    }

    if (pendingAction === 'DELETE') {
      return {
        title: 'Eliminar Empleado',
        message: (
          <div className="space-y-2">
            <p className="text-base-content/80">
              ¿Estás seguro de que deseas eliminar al empleado{' '}
              <span className="font-bold text-primary">"{targetEmployee.fullName}"</span>?
            </p>
            <p className="text-xs text-error font-medium">
              * Se eliminará lógicamente su registro, persona y usuario asociado revocando su acceso.
            </p>
          </div>
        ),
        variant: 'danger' as const,
        confirmText: 'Sí, Eliminar'
      };
    }

    return { title: '', message: '', variant: 'warning' as const, confirmText: 'Confirmar' };
  };

  const confirmationContent = getConfirmationContent();

  // Filtros de cliente
  const uniqueBranches = Array.from(new Set(data.filter(e => e.branchName).map(e => e.branchName)));

  const filteredData = data.filter(employee => {
    const matchesSearch =
      search === '' ||
      (employee.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
      (employee.documentNumber || '').includes(search);

    const matchesBranch = selectedBranch === '' || employee.branchName === selectedBranch;

    return matchesSearch && matchesBranch;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <Users className="w-7 h-7 text-primary" />
            Gestión de Empleados
          </h1>
          <p className="text-sm text-base-content/60 mt-1">
            Administra el personal, asigna sucursales y configura sus accesos.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BtnCreate onClick={handleCreate} label="Nuevo Empleado" />
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Buscar por Nombre o CI..."
            className="input input-bordered w-full sm:w-64"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {isOwner && (
            <select
              className="select select-bordered w-full sm:w-48"
              value={selectedBranch}
              onChange={e => setSelectedBranch(e.target.value)}
            >
              <option value="">Todas las sucursales</option>
              {uniqueBranches.map(branch => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="text-base-content/60 font-semibold px-2">
          {totalElements} {totalElements === 1 ? 'empleado' : 'empleados'}
        </div>
      </div>

      <div className="flex-1 w-full relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredData.map((employee, index) => (
            <EmployeeCard
              key={employee.id}
              employee={employee}
              index={index}
              onClick={handleCardClick}
              onContextMenu={handleContextMenu}
            />
          ))}
        </div>

        {filteredData.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-base-content/40">
            <p>No se encontraron empleados con los filtros aplicados.</p>
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center mt-10 mb-8">
            <button
              className="btn btn-outline btn-primary px-8 rounded-full"
              onClick={() => setPage(p => p + 1)}
              disabled={isLoading}
            >
              {isLoading ? <span className="loading loading-spinner"></span> : 'Cargar más empleados'}
            </button>
          </div>
        )}
      </div>

      {/* MENÚ CONTEXTUAL ESTANDARIZADO DEL UI KIT AL HACER CLIC DERECHO EN UNA TARJETA */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.employee && (
          <>
            <ContextMenuItem
              icon={Pencil}
              label="Modificar"
              onClick={() => {
                if (contextMenu.employee) handleEdit(contextMenu.employee);
              }}
            />
            <ContextMenuItem
              icon={Trash2}
              label="Eliminar"
              variant="error"
              onClick={() => {
                if (contextMenu.employee) {
                  setTargetEmployee(contextMenu.employee);
                  setPendingAction('DELETE');
                }
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      {/* MODAL DE ADVERTENCIA PARA CONFIRMAR ELIMINACIÓN */}
      <ConfirmationModal
        isOpen={!!pendingAction}
        onClose={() => {
          setPendingAction(null);
          setTargetEmployee(null);
        }}
        onConfirm={handleConfirmAction}
        title={confirmationContent.title}
        message={confirmationContent.message}
        confirmText={confirmationContent.confirmText || 'Confirmar'}
        cancelText="Cancelar"
        variant={confirmationContent.variant}
        isLoading={isProcessingAction}
      />

      {/* MODAL PARA CREACIÓN Y EDICIÓN DE EMPLEADOS */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={data => {
          loadData(true);
          if (data) {
            setCredentialsData(data);
          }
        }}
        employee={selectedEmployee}
      />

      {/* MODAL DE CREDENCIALES TEMPORALES AL CREAR UN EMPLEADO */}
      <EmployeeCredentialsModal
        isOpen={!!credentialsData}
        data={credentialsData}
        onClose={() => setCredentialsData(null)}
      />

      {/* MODAL DE FICHA DEL PERSONAL */}
      <EmployeeDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        employeeId={selectedDetailId}
      />
    </div>
  );
};
