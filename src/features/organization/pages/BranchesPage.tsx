// src/features/organization/pages/BranchesPage.tsx
import { useState } from 'react';
import { MapPin, Layers, CheckCircle2, XCircle } from 'lucide-react';
import { BranchesGrid } from '../components/branches/BranchesGrid';
import { BranchModal } from '../components/branches/BranchModal';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { branchService } from '../services/branchService';
import { useToast } from '../../../context/ToastContext';
import type { BranchResponse } from '../types/branch';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useBranchesInfinite, type BranchStatusFilter } from '../hooks/useBranchesInfinite';

export const BranchesPage = () => {
  const { addToast: showToast } = useToast();

  // Custom hook para scroll infinito y filtrado de sucursales (tamaño de lote = 20)
  const {
    branches,
    hasMore,
    isLoadingInitial,
    isLoadingMore,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    fetchNextPage,
    refetch
  } = useBranchesInfinite({ pageSize: 20 });

  // Estados para Modales de Formulario y Confirmación de Eliminación
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [branchToEdit, setBranchToEdit] = useState<BranchResponse | null>(null);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [branchToDelete, setBranchToDelete] = useState<BranchResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Manejadores de acciones de usuario
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

  // Confirmar eliminación de sucursal
  const confirmDelete = async () => {
    if (!branchToDelete) return;

    try {
      setIsDeleting(true);
      await branchService.deleteBranch(branchToDelete.id);
      showToast('Sucursal eliminada exitosamente', 'success');
      setIsDeleteModalOpen(false);
      setBranchToDelete(null);
      refetch(); // Recargar la lista desde el servidor
    } catch (error) {
      console.error('Error deleting branch:', error);
      showToast('Error al eliminar la sucursal', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <MapPin className="w-7 h-7 text-primary" />
            Sucursales
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Administra las ubicaciones físicas o tiendas virtuales de tu empresa mediante tarjetas y desplazamiento infinito
          </p>
        </div>

        {/* BOTÓN ESTANDARIZADO DE CREACIÓN */}
        <BtnCreate onClick={handleCreateNew} label="Nueva Sucursal" />
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="card bg-base-100 border border-base-200 shadow-xs p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* CAMPO DE BÚSQUEDA CON COMERZIAINPUT */}
          <div className="w-full md:w-80">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por nombre o dirección..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>

          {/* FILTROS POR ESTADO CON BOTONES DE PÍLDORA ANIMADOS */}
          <div className="flex items-center gap-2.5 w-full md:w-auto">
            <span className="text-xs font-semibold text-base-content/60 uppercase tracking-wider shrink-0">
              Estado:
            </span>

            <div className="flex items-center gap-1.5 bg-base-200/80 p-1.5 rounded-xl border border-base-300/50 shrink-0">
              {(
                [
                  { id: 'all', label: 'Todas', icon: Layers },
                  { id: 'active', label: 'Activas', icon: CheckCircle2 },
                  { id: 'inactive', label: 'Inactivas', icon: XCircle }
                ] as const
              ).map(filter => {
                const isActive = statusFilter === filter.id;
                const Icon = filter.icon;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() => setStatusFilter(filter.id as BranchStatusFilter)}
                    className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 cursor-pointer select-none ${
                      isActive
                        ? 'bg-primary text-primary-content shadow-md shadow-primary/25 scale-105'
                        : 'text-base-content/70 hover:bg-base-300/80 hover:text-base-content active:scale-95'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-primary-content' : 'text-base-content/50'}`} />
                    {filter.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* CUADRÍCULA DE TARJETAS CON SCROLL INFINITO */}
      <BranchesGrid
        branches={branches}
        isLoadingInitial={isLoadingInitial}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onFetchNextPage={fetchNextPage}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      {/* MODAL DE CREACIÓN / EDICIÓN */}
      <BranchModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        branchToEdit={branchToEdit}
        onSuccess={refetch}
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
              ¿Estás seguro de que deseas eliminar la sucursal{' '}
              <span className="font-bold text-base-content">"{branchToDelete?.name}"</span>?
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