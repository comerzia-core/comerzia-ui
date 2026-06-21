import { useState, useEffect } from 'react';
import { EmployeeModal } from '../components/EmployeeModal';
import { EmployeeCard } from '../components/EmployeeCard';
import { EmployeeDetailModal } from '../components/EmployeeDetailModal';
import { employeeService } from '../services/employeeService';
import type { EmployeeSummaryResponse, EmployeeCreatedResponse } from '../types/employee';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { EmployeeCredentialsModal } from '../components/EmployeeCredentialsModal';

export const EmployeePage = () => {
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

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<EmployeeSummaryResponse | null>(null);

  const [credentialsData, setCredentialsData] = useState<EmployeeCreatedResponse | null>(null);

  const { success, error } = useToast();

  const loadData = async (reset = false) => {
    setIsLoading(true);
    try {
      const targetPage = reset ? 0 : page;
      const response = await employeeService.getAll(targetPage, size, ['fullName,asc']);
      
      if (reset) {
        setData(response.content);
        setPage(0);
      } else {
        setData(prev => [...prev, ...response.content]);
      }
      
      setTotalElements(response.totalElements);
      setHasMore(!response.last);
    } catch (err) {
      console.error("Error loading employees", err);
      error("No se pudo cargar la lista de empleados.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData(page === 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

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

  const handleDeleteRequest = (employee: EmployeeSummaryResponse) => {
    setEmployeeToDelete(employee);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    try {
      await employeeService.delete(employeeToDelete.id);
      success("Empleado eliminado exitosamente.");
      loadData(true);
    } catch (err) {
      console.error("Error deleting employee", err);
      error("Error al eliminar el empleado.");
    } finally {
      setIsDeleteModalOpen(false);
      setEmployeeToDelete(null);
    }
  };

  // Filtros de cliente
  const uniqueBranches = Array.from(new Set(data.filter(e => e.branchName).map(e => e.branchName)));
  
  const filteredData = data.filter(employee => {
    const matchesSearch = search === '' || 
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
            onChange={(e) => setSearch(e.target.value)}
          />
          <select 
            className="select select-bordered w-full sm:w-48"
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
          >
            <option value="">Todas las sucursales</option>
            {uniqueBranches.map(branch => (
              <option key={branch} value={branch}>{branch}</option>
            ))}
          </select>
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

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSaved={(data) => {
          loadData(true);
          if (data) {
            setCredentialsData(data);
          }
        }}
        employee={selectedEmployee}
      />

      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        title="Eliminar Empleado"
        message={`¿Estás seguro de que deseas eliminar al empleado "${employeeToDelete?.fullName}"? Esta acción revocará su acceso al sistema y no se puede deshacer.`}
        onConfirm={handleConfirmDelete}
        onClose={() => setIsDeleteModalOpen(false)}
      />

      <EmployeeCredentialsModal
        isOpen={!!credentialsData}
        data={credentialsData}
        onClose={() => setCredentialsData(null)}
      />

      <EmployeeDetailModal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        employeeId={selectedDetailId}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />
    </div>
  );
};
