import { ComerziaTable, type Column, type TablePaginationConfig, type ColumnSort } from '../../../components/ui/ComerziaTable';
import { CrudButtons } from '../../../components/ui/CrudButtons';
import type { EmployeeSummaryResponse } from '../types/employee';

interface Props {
  data: EmployeeSummaryResponse[];
  isLoading: boolean;
  pagination: TablePaginationConfig;
  sorting: ColumnSort[];
  onSortingChange: (newSorting: ColumnSort[]) => void;
  onEdit: (employee: EmployeeSummaryResponse) => void;
  onDelete: (employee: EmployeeSummaryResponse) => void;
}

export const EmployeeTable = ({
  data,
  isLoading,
  pagination,
  sorting,
  onSortingChange,
  onEdit,
  onDelete
}: Props) => {

  const columns: Column<EmployeeSummaryResponse>[] = [
    {
      header: 'Documento',
      accessorKey: 'documentNumber',
      sortable: true
    },
    {
      header: 'Nombre Completo',
      accessorKey: 'fullName',
      sortable: true
    },
    {
      header: 'Tienda/Sucursal',
      accessorKey: 'branchName',
      sortable: true
    },
    {
      header: 'Roles',
      render: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.roleNames?.map((role) => (
            <span key={role} className="badge badge-neutral badge-sm text-[10px]">
              {role}
            </span>
          ))}
        </div>
      )
    },
    {
      header: 'Usuario',
      render: (row) => (
        <div className="flex flex-col gap-1 items-start">
          <span className={`badge badge-sm text-xs text-white border-none ${row.userEnabled ? 'bg-emerald-500' : 'bg-rose-500'}`}>
            {row.userEnabled ? 'Activo' : 'Inactivo'}
          </span>
          {row.requiresPasswordChange && (
            <span className="badge badge-sm text-[10px] bg-amber-100 text-amber-800 border-amber-200">
              Req. Cambio Clave
            </span>
          )}
        </div>
      )
    },
    {
      header: 'Acciones',
      className: 'w-24 text-center',
      render: (row) => (
        <CrudButtons 
          onEdit={() => onEdit(row)} 
          onDelete={() => onDelete(row)} 
        />
      )
    }
  ];

  return (
    <ComerziaTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      showRowNumbers
      pagination={pagination}
      sorting={sorting}
      onSortingChange={onSortingChange}
    />
  );
};
