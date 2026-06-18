import { useState, useEffect } from 'react';
import { EmployeeTable } from '../components/EmployeeTable';
import { EmployeeModal } from '../components/EmployeeModal';
import { employeeService } from '../services/employeeService';
import type { EmployeeSummaryResponse } from '../types/employee';
import type { TablePaginationConfig, ColumnSort } from '../../../components/ui/ComerziaTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export const EmployeePage = () => {
  const [data, setData] = useState<EmployeeSummaryResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [sorting, setSorting] = useState<ColumnSort[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummaryResponse | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeSummaryResponse | null>(null);

  const { success, error } = useToast();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const sortParams = sorting.map(s => `${s.id},${s.desc ? 'desc' : 'asc'}`);
      const response = await employeeService.getAll(page, size, sortParams);
      setData(response.content);
      setTotalElements(response.totalElements);
      setTotalPages(response.totalPages);
    } catch (err) {
      console.error("Error loading employees", err);
      error("No se pudo cargar la lista de empleados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, size, sorting]);

  const handleCreate = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEdit = (employee: EmployeeSummaryResponse) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleDeleteRequest = (employee: EmployeeSummaryResponse) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await employeeService.delete(employeeToDelete.id);
      success("Empleado eliminado exitosamente.");
      loadData();
    } catch (err) {
      console.error("Error deleting employee", err);
      error("Error al eliminar el empleado.");
    } finally {
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
    }
  };

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages,
    onPageChange: setPage,
    onPageSizeChange: (newSize) => {
      setSize(newSize);
      setPage(0);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-[1400px] mx-auto p-4 md:p-6 lg:p-8 animate-fade-in-up">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
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

      <div className="flex-1 w-full relative">
        <EmployeeTable
          data={data}
          isLoading={isLoading}
          pagination={pagination}
          sorting={sorting}
          onSortingChange={setSorting}
          onEdit={handleEdit}
          onDelete={handleDeleteRequest}
        />
      </div>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={loadData}
        employee={selectedEmployee}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Eliminar Empleado"
        message={`¿Estás seguro de que deseas eliminar al empleado "${employeeToDelete?.fullName}"? Esta acción revocará su acceso al sistema y no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </div>
  );
};
