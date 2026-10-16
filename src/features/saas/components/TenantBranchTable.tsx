import { useState } from 'react';
import { Pencil, Trash2, Store } from 'lucide-react';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { BtnCreate, BtnSave, BtnDelete } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import type { BranchResponse } from '../types/company';

export function TenantBranchTable({ companyId }: { companyId: string }) {
  const base = '/saas/companies/' + encodeURIComponent(companyId) + '/branches';
  const query = usePlatformPage<BranchResponse>(base);
  const context = useSaasContextMenu<BranchResponse>();
  const { can } = usePermission();

  const [editor, setEditor] = useState<BranchResponse | 'new' | null>(null);
  const [remove, setRemove] = useState<BranchResponse | null>(null);
  const [form, setForm] = useState({ name: '', address: '', code: '', status: true });
  const [shake, setShake] = useState(0);

  const save = usePlatformAction(() =>
    editor === 'new'
      ? platformService.post(base, form)
      : platformService.put(base + '/' + encodeURIComponent((editor as BranchResponse).id), form)
  );

  const deletion = usePlatformAction(() =>
    platformService.delete(base + '/' + encodeURIComponent(remove!.id))
  );

  const edit = (row: BranchResponse | 'new') => {
    setShake(0);
    setForm(
      row === 'new'
        ? { name: '', address: '', code: '', status: true }
        : { name: row.name, address: row.address ?? '', code: row.code ?? '', status: row.status }
    );
    setEditor(row);
  };

  return (
    <div className="space-y-4">
      {/* Barra de acción para nueva sucursal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Store className="w-5 h-5 text-primary shrink-0" />
          <h3 className="font-bold text-base text-base-content">
            Sucursales Físicas del Tenant
          </h3>
        </div>

        {can('SYS_COMPANIES_MANAGE') && (
          <BtnCreate responsive={false} label="Nueva sucursal" onClick={() => edit('new')} />
        )}
      </div>

      {query.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudieron consultar las sucursales de la empresa.</span>
        </div>
      )}

      <ComerziaResponsiveTable
        data={query.data?.content ?? []}
        isLoading={query.isPending}
        pagination={query.pagination}
        onActions={can('SYS_COMPANIES_MANAGE') ? context.open : undefined}
        columns={[
          { header: 'Código', render: row => <span className="font-mono text-xs font-semibold">{row.code || '—'}</span> },
          { header: 'Nombre', accessorKey: 'name' },
          { header: 'Dirección', render: row => row.address || 'Sin dirección' },
          {
            header: 'Estado',
            render: row => (
              <span className={`badge badge-sm font-semibold ${row.status ? 'badge-success text-success-content' : 'badge-error text-error-content'}`}>
                {row.status ? 'Habilitada' : 'Deshabilitada'}
              </span>
            ),
          },
        ]}
      />

      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        {can('SYS_COMPANIES_MANAGE') && (
          <>
            <ContextMenuItem
              icon={Pencil}
              label="Editar sucursal"
              onClick={() => {
                if (context.menu.item) edit(context.menu.item);
                context.close();
              }}
            />
            <ContextMenuItem
              icon={Trash2}
              label="Eliminar sucursal"
              variant="error"
              onClick={() => {
                setRemove(context.menu.item);
                context.close();
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      {/* MODAL: ALTA Y EDICIÓN DE SUCURSAL */}
      <ComerziaModal
        isOpen={!!editor}
        onClose={() => {
          if (!save.isPending) setEditor(null);
        }}
        title={editor === 'new' ? 'Nueva sucursal' : 'Editar sucursal'}
        actions={
          <BtnSave
            responsive={false}
            isLoading={save.isPending}
            onClick={() => {
              if (!form.name.trim() || (editor === 'new' && !form.code.trim())) {
                setShake(value => value + 1);
                return;
              }
              save.mutate(undefined, { onSuccess: () => setEditor(null) });
            }}
          />
        }
      >
        <div className="space-y-4">
          <ComerziaInput
            label="Nombre"
            isRequired
            maxLength={100}
            value={form.name}
            shakeKey={shake}
            error={shake && !form.name.trim() ? 'Indica el nombre.' : undefined}
            onChange={event => setForm(value => ({ ...value, name: event.target.value }))}
          />

          {editor === 'new' && (
            <ComerziaInput
              label="Código de sucursal"
              isRequired
              maxLength={10}
              value={form.code}
              shakeKey={shake}
              error={shake && !form.code.trim() ? 'Indica un código.' : undefined}
              onChange={event => setForm(value => ({ ...value, code: event.target.value }))}
            />
          )}

          <ComerziaInput
            label="Dirección"
            maxLength={200}
            value={form.address}
            onChange={event => setForm(value => ({ ...value, address: event.target.value }))}
          />

          {editor !== 'new' && (
            <ComerziaCheckbox
              label="Sucursal habilitada"
              checked={form.status}
              onChange={status => setForm(value => ({ ...value, status }))}
            />
          )}
        </div>
      </ComerziaModal>

      {/* MODAL: ELIMINACIÓN DE SUCURSAL */}
      <ComerziaModal
        isOpen={!!remove}
        onClose={() => {
          if (!deletion.isPending) setRemove(null);
        }}
        title="Eliminar sucursal"
        size="sm"
        actions={
          <BtnDelete
            responsive={false}
            isLoading={deletion.isPending}
            onClick={() => deletion.mutate(undefined, { onSuccess: () => setRemove(null) })}
          />
        }
      >
        <p className="text-sm">
          Se eliminará <strong>{remove?.name}</strong>. Se conservarán los registros históricos; una sucursal con ventas o transacciones asociadas debe deshabilitarse en lugar de eliminarse.
        </p>
      </ComerziaModal>
    </div>
  );
}
