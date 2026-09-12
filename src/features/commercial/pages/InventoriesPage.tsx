import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { InventoryResponse } from '../types/commercial';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { CreateInventoryModal } from '../components/CreateInventoryModal';
import { ExecuteInventoryModal } from '../components/ExecuteInventoryModal';
import { ApproveInventoryModal } from '../components/ApproveInventoryModal';
import { formatDateForUser } from '../../../utils/date';
import { ChevronLeft, ChevronRight, ClipboardList, User } from 'lucide-react';

export const InventoriesPage = () => {
  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];

  const isAdmin = roles.includes('OWNER') || roles.includes('BRANCH_MANAGER');
  const isExecutor = roles.includes('CASHIER') || roles.includes('SELLER');

  const [viewMode, setViewMode] = useState<'admin' | 'executor'>(isAdmin ? 'admin' : 'executor');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInventoryForExecute, setSelectedInventoryForExecute] = useState<InventoryResponse | null>(null);
  const [selectedInventoryForApprove, setSelectedInventoryForApprove] = useState<InventoryResponse | null>(null);

  // Data State
  const [data, setData] = useState<InventoryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    loadData();
  }, [page, size, viewMode]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (viewMode === 'admin') {
        const res = await commercialService.getInventories(page, size);
        setData(res.content);
        setTotalElements(res.totalElements);
      } else {
        const res = await commercialService.getMyInventoryTasks(page, size);
        setData(res.content);
        setTotalElements(res.totalElements);
      }
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCode = (status?: { code: number; label: string } | number): number => {
    if (status == null) return 0;
    return typeof status === 'object' ? status.code : status;
  };

  const statusBadge = (status?: { code: number; label: string } | number) => {
    const code = getStatusCode(status);
    if (code === 1) return <span className="badge badge-warning badge-sm">En Progreso</span>;
    if (code === 2) return <span className="badge badge-info badge-sm">En Revisión</span>;
    if (code === 3) return <span className="badge badge-success badge-sm">Completado</span>;
    return <span className="badge badge-ghost badge-sm">-</span>;
  };

  const adminColumns: Column<InventoryResponse>[] = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Segmento', accessorKey: 'segmentName' },
    { header: 'Ejecutor Asignado', render: (row) => row.assignedEmployeeId },
    { header: 'Fecha Asignación', render: (row) => formatDateForUser(row.assignedAt) },
    { header: 'Estado', render: (row) => statusBadge(row.statusType) },
    {
      header: 'Acciones',
      render: (row) => {
        const status = getStatusCode(row.statusType);
        return (
          <button
            className="btn btn-sm btn-outline"
            onClick={() => setSelectedInventoryForApprove(row)}
            disabled={status === 3}
          >
            {status === 2 ? 'Revisar' : 'Ver Detalles'}
          </button>
        );
      }
    }
  ];

  const executorColumns: Column<InventoryResponse>[] = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Segmento', accessorKey: 'segmentName' },
    { header: 'Fecha Asignación', render: (row) => formatDateForUser(row.assignedAt) },
    { header: 'Estado', render: (row) => statusBadge(row.statusType) },
    {
      header: 'Acciones',
      render: (row) => {
        const status = getStatusCode(row.statusType);
        return (
          <button
            className="btn btn-sm btn-primary"
            onClick={() => setSelectedInventoryForExecute(row)}
            disabled={status !== 1}
          >
            {status === 1 ? 'Ejecutar Conteo' : 'Ver Enviado'}
          </button>
        );
      }
    }
  ];

  const totalPages = Math.ceil(totalElements / size);

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages,
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-1 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content tracking-tight">Conteo Físico (Inventarios)</h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">Auditorías y cuadre de almacén</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {isAdmin && isExecutor && (
            <div className="tabs tabs-boxed">
              <a
                className={`tab tab-sm sm:tab-md ${viewMode === 'admin' ? 'tab-active' : ''}`}
                onClick={() => { setViewMode('admin'); setPage(0); }}
              >
                Panel Admin
              </a>
              <a
                className={`tab tab-sm sm:tab-md ${viewMode === 'executor' ? 'tab-active' : ''}`}
                onClick={() => { setViewMode('executor'); setPage(0); }}
              >
                Mis Tareas
              </a>
            </div>
          )}
          {viewMode === 'admin' && (
            <BtnCreate
              label="Nueva Orden"
              onClick={() => setIsCreateModalOpen(true)}
              responsive={true}
              className="flex-1 sm:flex-none sm:w-auto"
            />
          )}
        </div>
      </div>

      <div className="bg-base-100 p-4 sm:p-6 rounded-2xl shadow-sm border border-base-200">
        <h2 className="text-base sm:text-lg font-bold mb-4">
          {viewMode === 'admin' ? 'Todas las Órdenes de Inventario' : 'Mis Tareas de Conteo Asignadas'}
        </h2>

        {/* VISTA DESKTOP: TABLA */}
        <div className="hidden md:block">
          <ComerziaTable
            data={data}
            columns={viewMode === 'admin' ? adminColumns : executorColumns}
            isLoading={isLoading}
            pagination={pagination}
          />
        </div>

        {/* VISTA MOBILE: CARDS */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <div className="py-10 text-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs text-base-content/50 mt-2">Cargando inventarios...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
              <ClipboardList size={32} className="mx-auto text-base-content/30 mb-2" />
              No hay órdenes de inventario registradas.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.map((row) => {
                const status = getStatusCode(row.statusType);
                return (
                  <div key={row.id} className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="font-bold text-sm text-base-content block">
                          {row.segmentName || 'Inventario General'}
                        </span>
                        <span className="text-[10px] text-base-content/50">
                          Asignado: {formatDateForUser(row.assignedAt)}
                        </span>
                      </div>
                      {statusBadge(row.statusType)}
                    </div>

                    {viewMode === 'admin' && row.assignedEmployeeId && (
                      <div className="flex items-center gap-1.5 text-[11px] text-base-content/70 bg-base-200/40 p-2 rounded-lg">
                        <User size={12} className="text-base-content/50" />
                        <span>Ejecutor: <strong>{row.assignedEmployeeId}</strong></span>
                      </div>
                    )}

                    <div className="pt-2 border-t border-base-200/60 flex justify-end">
                      {viewMode === 'admin' ? (
                        <button
                          className="btn btn-sm btn-outline btn-primary w-full"
                          onClick={() => setSelectedInventoryForApprove(row)}
                          disabled={status === 3}
                        >
                          {status === 2 ? 'Revisar Conteo' : 'Ver Detalles'}
                        </button>
                      ) : (
                        <button
                          className="btn btn-sm btn-primary w-full"
                          onClick={() => setSelectedInventoryForExecute(row)}
                          disabled={status !== 1}
                        >
                          {status === 1 ? 'Ejecutar Conteo' : 'Ver Enviado'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Paginación Mobile */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center px-1 pt-2">
              <button
                type="button"
                className="btn btn-sm btn-outline gap-1"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
              >
                <ChevronLeft size={16} /> Ant.
              </button>
              <span className="text-xs font-semibold text-base-content/70">
                Pág. {page + 1} de {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-sm btn-outline gap-1"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(prev => prev + 1)}
              >
                Sig. <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateInventoryModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setPage(0);
          loadData();
        }}
      />

      <ExecuteInventoryModal
        isOpen={!!selectedInventoryForExecute}
        onClose={() => setSelectedInventoryForExecute(null)}
        inventory={selectedInventoryForExecute}
        onSuccess={() => {
          loadData();
        }}
      />

      <ApproveInventoryModal
        isOpen={!!selectedInventoryForApprove}
        onClose={() => setSelectedInventoryForApprove(null)}
        inventory={selectedInventoryForApprove}
        onSuccess={() => {
          loadData();
        }}
      />
    </div>
  );
};
