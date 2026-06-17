// src/features/organization/components/branches/BranchesTable.tsx
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { CrudButtons } from '../../../../components/ui/CrudButtons';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable'; 
import type { BranchResponse } from '../../types/branch';
import type { PageResponse } from '../../../../types/api';

interface Props {
  data: PageResponse<BranchResponse> | null;
  isLoading: boolean;
  page: number;
  pageSize: number; // Requerido por tu nueva tabla
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newSize: number) => void; // Requerido por tu nueva tabla
  onEdit: (branch: BranchResponse) => void;
  onDelete: (branch: BranchResponse) => void;
}

export const BranchesTable = ({ 
  data, isLoading, page, pageSize, onPageChange, onPageSizeChange, onEdit, onDelete 
}: Props) => {
  
  // APLICADO: Usamos 'header' y 'accessorKey' según tu interfaz Column<T>
  const columns: Column<BranchResponse>[] = [
    {
      header: 'Branch Name',
      accessorKey: 'name',
      sortable: true, // Podemos habilitar el sortable si tu backend lo soporta
      render: (row) => <span className="font-semibold">{row.name}</span>
    },
    {
      header: 'Address',
      accessorKey: 'address',
      render: (row) => <span className="text-base-content/70">{row.address || 'N/A'}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      render: (row) => (
        <ComerziaBadge 
          label={row.status ? 'Active' : 'Inactive'} 
          variant={row.status ? 'success' : 'neutral'} 
        />
      )
    },
    {
      header: 'Actions',
      // Las acciones no necesitan accessorKey
      render: (row) => (
        <CrudButtons 
          onEdit={() => onEdit(row)} 
          onDelete={() => onDelete(row)} 
        />
      )
    }
  ];

  // APLICADO: Estructura exacta de TablePaginationConfig
  const paginationConfig = data ? {
    currentPage: page,
    pageSize: pageSize,
    totalElements: data.totalElements,
    totalPages: data.totalPages,
    onPageChange: onPageChange,
    onPageSizeChange: onPageSizeChange
  } : undefined;

  return (
    <ComerziaTable 
      columns={columns}
      data={data?.content || []}
      isLoading={isLoading}
      showRowNumbers={true}
      pagination={paginationConfig}
    />
  );
};