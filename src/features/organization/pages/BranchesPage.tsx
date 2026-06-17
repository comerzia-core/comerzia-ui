// src/features/organization/pages/BranchesPage.tsx
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import { BranchesTable } from '../components/branches/BranchesTable';
import { BranchModal } from '../components/branches/BranchModal';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { branchService } from '../services/branchService';
import { useToast } from '../../../context/ToastContext';
import type { BranchResponse } from '../types/branch';
import type { PageResponse } from '../../../types/api';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';

export const BranchesPage = () => {
  const { addToast: showToast } = useToast();

  // Estados de la Tabla y Paginación
  const [data, setData] = useState<PageResponse<BranchResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0); 
  const [pageSize, setPageSize] = useState(10); // <--- AHORA ES UN ESTADO

  // Estados de Modales
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchResponse | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Cargar datos
  const loadBranches = async (currentPage: number, currentSize: number) => {
    try {
      setIsLoading(true);
      const response = await branchService.getBranches(currentPage, currentSize);
      setData(response);
    } catch (error) {
      console.error('Error loading branches:', error);
      showToast('Error al cargar los datos de las sucursales', 'error'); 
    } finally {
      setIsLoading(false);
    }
  };

  // Dependencia de Efecto: recargar si cambia la página o el tamaño
  useEffect(() => {
    loadBranches(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  // Acciones de Tabla
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setPage(0); // Regresamos a la página 0 al cambiar la cantidad de registros por seguridad
  };

  const handleCreateNew = () => {
    setBranchToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (branch: BranchResponse) => {
    setBranchToEdit(branch);
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (branch: BranchResponse) => {
    setBranchToDelete(branch);
    setIsDeleteModalOpen(true);
  };

  // Confirmar Eliminación
  const confirmDelete = async () => {
    if (!branchToDelete) return;
    
    try {
      setIsDeleting(true);
      await branchService.deleteBranch(branchToDelete.id);
      showToast('Sucursal eliminada exitosamente', 'success');
      setIsDeleteModalOpen(false);
      setBranchToDelete(null);
      // Recargar la misma página (o ir a la 0 si era el último elemento, pero lo mantenemos simple)
      loadBranches(page, pageSize);
    } catch (error) {
      console.error('Error deleting branch:', error);
      showToast('Error al eliminar la sucursal', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <MapPin className="w-6 h-6 text-primary" />
            Sucursales
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Administra las ubicaciones físicas o tiendas virtuales de tu empresa
          </p>
        </div>
        
        {/* BOTÓN CREAR */}
        <BtnCreate onClick={handleCreateNew} label="Nueva Sucursal" />
      </div>

      {/* CARD CON LA TABLA */}
      <div className="card bg-base-100 shadow-sm border border-base-200">
        <div className="card-body p-0">
            <BranchesTable
                data={data}
                isLoading={isLoading}
                page={page}
                pageSize={pageSize}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                onEdit={handleEdit}
                onDelete={handleDeleteRequest}
            />
        </div>
      </div>

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <BranchModal 
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        branchToEdit={branchToEdit}
        onSuccess={() => loadBranches(page, pageSize)}
      />

      {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Confirmar Eliminación"
        message={
          <>
            <p className="text-base-content/80">
              ¿Estás seguro de que deseas eliminar la sucursal <span className="font-bold text-base-content">"{branchToDelete?.name}"</span>?
            </p>
            <p className="text-sm text-error mt-2 font-medium">Esta acción no se puede deshacer.</p>
          </>
        }
        confirmText="Sí, Eliminar"
        cancelText="Cancelar"
        variant="danger"
        isLoading={isDeleting}
      />

    </div>
  );
};