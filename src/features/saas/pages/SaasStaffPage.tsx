import { useState } from 'react';
import { Users, Pencil, Trash2 } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { BtnCreate, BtnDelete } from '../../../components/ui/CrudButtons';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import { SaasStaffEditor } from '../components/SaasStaffEditor';
import type { SaasStaffSummary } from '../types/staff';

export function SaasStaffPage() {
  const [search, setSearch] = useState('');
  const q = useDebounce(search, 300);
  const query = usePlatformPage<SaasStaffSummary>('/saas/team/members', { query: q });
  const context = useSaasContextMenu<SaasStaffSummary>();
  const [editor, setEditor] = useState<string | null>(null);
  const [removal, setRemoval] = useState<SaasStaffSummary | null>(null);

  const remove = usePlatformAction(() =>
    platformService.delete('/saas/team/members/' + encodeURIComponent(removal!.id))
  );

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Users className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Colaboradores de Comerzia
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Directorio de colaboradores y personal interno de la empresa matriz.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BtnCreate label="Colaborador" onClick={() => setEditor('new')} />
        </div>
      </div>

      {/* 2. BARRA DE FILTROS ESTÁNDAR */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              label="Buscar colaborador"
              aria-label="Buscar colaborador"
              placeholder="Nombre, cargo o correo"
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                query.pagination.onPageChange(0);
              }}
            />
          </div>
        </div>
      </div>

      {query.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar el directorio de colaboradores.</span>
        </div>
      )}

      {/* 3. TABLA RESPONSIVA */}
      <ComerziaResponsiveTable
        data={query.data?.content ?? []}
        pagination={query.pagination}
        isLoading={query.isPending}
        onActions={context.open}
        columns={[
          { header: 'Nombre', accessorKey: 'fullName' },
          { header: 'Cargo', accessorKey: 'jobTitle' },
          { header: 'Correo', accessorKey: 'email' },
          { header: 'Teléfono', render: row => row.phoneNumber || '—' },
          {
            header: 'Estado',
            render: row => (
              <span className={`badge badge-sm font-semibold ${row.active ? 'badge-success text-success-content' : 'badge-error text-error-content'}`}>
                {row.active ? 'Activo' : 'Inactivo'}
              </span>
            ),
          },
        ]}
      />

      {/* 4. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        <ContextMenuItem
          icon={Pencil}
          label="Editar colaborador"
          onClick={() => {
            setEditor(context.menu.item?.id ?? null);
            context.close();
          }}
        />
        <ContextMenuItem
          icon={Trash2}
          label="Eliminar colaborador"
          variant="error"
          onClick={() => {
            setRemoval(context.menu.item);
            context.close();
          }}
        />
      </ComerziaContextMenu>

      {/* MODAL EDITOR */}
      {editor && (
        <SaasStaffEditor
          key={editor}
          id={editor === 'new' ? null : editor}
          onClose={() => setEditor(null)}
        />
      )}

      {/* MODAL DE ELIMINACIÓN */}
      <ComerziaModal
        isOpen={!!removal}
        onClose={() => {
          if (!remove.isPending) setRemoval(null);
        }}
        title="Eliminar colaborador"
        size="sm"
        actions={
          <BtnDelete
            isLoading={remove.isPending}
            onClick={() =>
              remove.mutate(undefined, { onSuccess: () => setRemoval(null) })
            }
          />
        }
      >
        <p className="text-sm">
          Se eliminará a <strong>{removal?.fullName}</strong> del directorio y se revocará su acceso al panel SaaS si posee una cuenta activa.
        </p>
      </ComerziaModal>
    </div>
  );
}
