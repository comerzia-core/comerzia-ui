import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { InventoryResponse } from '../types/commercial';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { CreateInventoryModal } from '../components/CreateInventoryModal';
import { ExecuteInventoryModal } from '../components/ExecuteInventoryModal';
import { ApproveInventoryModal } from '../components/ApproveInventoryModal';

export const InventoriesPage = () => {
  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];
  
  // According to requirements: Admin = OWNER, BRANCH_MANAGER
  // Executor = CASHIER, SELLER (Vendedor). Owner can be executor if they have CASHIER or SELLER role too.
  const isAdmin = roles.includes('OWNER') || roles.includes('BRANCH_MANAGER');
  const isExecutor = roles.includes('CASHIER') || roles.includes('SELLER');
  
  // We determine what view to show by default. If they are admin, show admin board.
  // We can add a toggle if they have both roles, but let's default to Admin if they have it.
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
  }, [viewMode, page, size]);

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

  const statusBadge = (status: number) => {
    if (status === 1) return <span className="badge badge-warning">En Progreso</span>;
    if (status === 2) return <span className="badge badge-info">En Revisión</span>;
    return <span className="badge badge-success">Completado</span>;
  };

  const adminColumns: Column<InventoryResponse>[] = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Segmento', accessorKey: 'segmentName' },
    { header: 'Ejecutor Asignado', render: (row) => row.assignedEmployeeId },
    { header: 'Fecha Asignación', render: (row) => new Date(row.assignedAt).toLocaleString() },
    { header: 'Estado', render: (row) => statusBadge(row.statusType) },
    {
      header: 'Acciones',
      render: (row) => (
        <button 
          className="btn btn-sm btn-outline"
          onClick={() => setSelectedInventoryForApprove(row)}
          disabled={row.statusType === 3}
        >
          {row.statusType === 2 ? 'Revisar' : 'Ver Detalles'}
        </button>
      )
    }
  ];

  const executorColumns: Column<InventoryResponse>[] = [
    { header: 'ID', accessorKey: 'id' },
    { header: 'Segmento', accessorKey: 'segmentName' },
    { header: 'Fecha Asignación', render: (row) => new Date(row.assignedAt).toLocaleString() },
    { header: 'Estado', render: (row) => statusBadge(row.statusType) },
    {
      header: 'Acciones',
      render: (row) => (
        <button 
          className="btn btn-sm btn-primary"
          onClick={() => setSelectedInventoryForExecute(row)}
          disabled={row.statusType !== 1}
        >
          {row.statusType === 1 ? 'Ejecutar Conteo' : 'Ver Enviado'}
        </button>
      )
    }
  ];

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Conteo Físico (Inventarios)</h1>
          <p className="text-base-content/60 mt-1">Auditorías y cuadre de almacén</p>
        </div>
        <div className="flex gap-4">
          {isAdmin && isExecutor && (
            <div className="tabs tabs-boxed mr-4 self-center">
              <a 
                className={`tab ${viewMode === 'admin' ? 'tab-active' : ''}`}
                onClick={() => { setViewMode('admin'); setPage(0); }}
              >
                Panel Admin
              </a>
              <a 
                className={`tab ${viewMode === 'executor' ? 'tab-active' : ''}`}
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
            />
          )}
        </div>
      </div>

      <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
        <h2 className="text-lg font-bold mb-4">
          {viewMode === 'admin' ? 'Todas las Órdenes de Inventario' : 'Mis Tareas de Conteo Asignadas'}
        </h2>
        <ComerziaTable
          data={data}
          columns={viewMode === 'admin' ? adminColumns : executorColumns}
          isLoading={isLoading}
          pagination={pagination}
        />
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
