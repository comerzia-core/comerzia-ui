// src/features/employees/pages/EmployeePage.tsx
import { useState, useEffect } from 'react';
import { Users } from 'lucide-react';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import { employeeService } from '../services/employeeService';
import type { EmployeeSummaryResponse, EmployeeCreatedResponse } from '../types/employee';
import type { PageResponse } from '../../../types/api';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { EmployeeCredentialsModal } from '../components/EmployeeCredentialsModal';

type EmployeeActionType = 'DELETE' | null;

export const EmployeePage = () => {
  const [data, setData] = useState<PageResponse<EmployeeSummaryResponse> | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummaryResponse | null>(null);

  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailId, setSelectedDetailId] = useState<string | null>(null);

  // Estado de Acciones Administrativas con Modal de Confirmación
  const [pendingAction, setPendingAction] = useState<EmployeeActionType>(null);
  const [targetEmployee, setTargetEmployee] = useState<EmployeeSummaryResponse | null>(null);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  const [credentialsData, setCredentialsData] = useState<EmployeeCreatedResponse | null>(null);

  const { success, error } = useToast();

  const loadData = async (targetPage = page, targetSize = pageSize) => {
    setIsLoading(true);
    try {
      const response = await employeeService.getAll(targetPage, targetSize, ['branchName,asc', 'fullName,asc']);
      setData(response);
    } catch (err) {
      console.error('Error loading employees:', err);
      error('No se pudo cargar la lista de empleados.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0);
  };

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: EmployeeSummaryResponse) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleViewDetails = (employee: EmployeeSummaryResponse) => {
    setSelectedDetailId(employee.id);
    setDetailModalOpen(true);
  };

  const handleDeleteRequest = (employee: EmployeeSummaryResponse) => {
    setTargetEmployee(employee);
    setPendingAction('DELETE');
  };

  const handleConfirmAction = async () => {
    if (!targetEmployee || !pendingAction) return;

    try {
      setIsProcessingAction(true);
      if (pendingAction === 'DELETE') {
        await employeeService.delete(targetEmployee.id);
        success(`Empleado "${targetEmployee.fullName}" eliminado exitosamente.`);
        loadData(page, pageSize);
      }
      setPendingAction(null);
      setTargetEmployee(null);
    } catch (err: any) {
      console.error('Error handling employee action:', err);
      const apiMsg = err.response?.data?.message || err.response?.data?.error;
      error(apiMsg || 'Ocurrió un error al procesar la acción del empleado.');
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

  // Filtrado reactivo en cliente (si aplica)
  const filteredData = data
    ? {
      ...data,
      content: data.content.filter(employee => {
        return (
          search === '' ||
          (employee.fullName || '').toLowerCase().includes(search.toLowerCase()) ||
          (employee.documentNumber || '').includes(search)
        );
      })
    }
    : null;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
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
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BtnCreate onClick={handleCreate} label="Nuevo Empleado" className="w-full sm:w-auto" />
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por Nombre o CI..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* CONTENEDOR DE LA TABLA PAGINADA DE EMPLEADOS */}
      <div className="md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:card-body md:p-0">
          <EmployeeTable
            data={filteredData}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onViewDetails={handleViewDetails}
            onEdit={handleEdit}
            onDelete={handleDeleteRequest}
          />
        </div>
      </div>

      {/* MODAL CREAR / EDITAR EMPLEADO */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        employee={selectedEmployee}
        onSaved={newEmpCreds => {
          setIsModalOpen(false);
          loadData(page, pageSize);
          if (newEmpCreds && newEmpCreds.temporaryPassword) {
            setCredentialsData(newEmpCreds);
          }
        }}
      />

      {/* MODAL DETALLES DEL EMPLEADO */}
      <EmployeeDetailModal
        isOpen={detailModalOpen}
        onClose={() => {
          setDetailModalOpen(false);
          setSelectedDetailId(null);
        }}
        employeeId={selectedDetailId}
      />

      {/* MODAL DE CREDENCIALES GENERADAS */}
      {credentialsData && (
        <EmployeeCredentialsModal
          isOpen={!!credentialsData}
          onClose={() => setCredentialsData(null)}
          data={credentialsData}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmationModal
        isOpen={!!pendingAction}
        onClose={() => setPendingAction(null)}
        onConfirm={handleConfirmAction}
        title={confirmationContent.title}
        message={confirmationContent.message}
        confirmText={confirmationContent.confirmText || 'Confirmar'}
        cancelText="Cancelar"
        variant={confirmationContent.variant}
        isLoading={isProcessingAction}
      />
    </div>
  );
};
