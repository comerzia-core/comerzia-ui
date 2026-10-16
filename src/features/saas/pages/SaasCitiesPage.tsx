import { useState } from 'react';
import { Pencil, Trash2, MapPin } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCreate, BtnSave, BtnDelete } from '../../../components/ui/CrudButtons';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';

interface City {
  id: string;
  name: string;
  country: string;
}

export function SaasCitiesPage() {
  const [search, setSearch] = useState('');
  const query = useDebounce(search, 300);
  const cities = usePlatformPage<City>('/saas/cities', { query });
  const context = useSaasContextMenu<City>();
  const { can } = usePermission();

  const [editor, setEditor] = useState<City | 'new' | null>(null);
  const [remove, setRemove] = useState<City | null>(null);
  const [form, setForm] = useState({ name: '', country: '' });
  const [shake, setShake] = useState(0);

  const save = usePlatformAction(() =>
    editor === 'new'
      ? platformService.post('/saas/cities', form)
      : platformService.put('/saas/cities/' + encodeURIComponent((editor as City).id), form)
  );

  const deletion = usePlatformAction(() =>
    platformService.delete('/saas/cities/' + encodeURIComponent(remove!.id))
  );

  const edit = (row: City | 'new') => {
    setShake(0);
    setForm(row === 'new' ? { name: '', country: '' } : { name: row.name, country: row.country });
    setEditor(row);
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <MapPin className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Ciudades
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Catálogo geográfico compartido para localización de empresas y sucursales.
            </p>
          </div>
        </div>

        {can('GEN_CITIES_MANAGE') && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <BtnCreate responsive={false} label="Nueva ciudad" onClick={() => edit('new')} />
          </div>
        )}
      </div>

      {/* 2. BARRA DE FILTROS ESTÁNDAR */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              aria-label="Buscar ciudad"
              icon="Search"
              placeholder="Buscar por ciudad o país"
              value={search}
              onChange={event => {
                setSearch(event.target.value);
                cities.pagination.onPageChange(0);
              }}
            />
          </div>
        </div>
      </div>

      {cities.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudieron consultar las ciudades del catálogo.</span>
        </div>
      )}

      {/* 3. TABLA RESPONSIVA */}
      <ComerziaResponsiveTable
        data={cities.data?.content ?? []}
        isLoading={cities.isPending}
        pagination={cities.pagination}
        onActions={context.open}
        columns={[
          { header: 'Ciudad', accessorKey: 'name' },
          { header: 'País', accessorKey: 'country' },
        ]}
      />

      {/* 4. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        {can('GEN_CITIES_MANAGE') && (
          <>
            <ContextMenuItem
              icon={Pencil}
              label="Editar ciudad"
              onClick={() => {
                if (context.menu.item) edit(context.menu.item);
                context.close();
              }}
            />
            <ContextMenuItem
              icon={Trash2}
              label="Eliminar ciudad"
              variant="error"
              onClick={() => {
                setRemove(context.menu.item);
                context.close();
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      {/* MODAL: ALTA Y EDICIÓN DE CIUDAD */}
      <ComerziaModal
        isOpen={!!editor}
        onClose={() => {
          if (!save.isPending) setEditor(null);
        }}
        title={editor === 'new' ? 'Nueva ciudad' : 'Editar ciudad'}
        actions={
          <BtnSave
            responsive={false}
            isLoading={save.isPending}
            onClick={() => {
              if (!form.name.trim() || !form.country.trim()) {
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
            label="Ciudad"
            aria-label="Ciudad"
            isRequired
            maxLength={100}
            value={form.name}
            shakeKey={shake}
            error={shake && !form.name.trim() ? 'Campo obligatorio.' : undefined}
            onChange={event => setForm(value => ({ ...value, name: event.target.value }))}
          />
          <ComerziaInput
            label="País"
            aria-label="País"
            isRequired
            maxLength={50}
            value={form.country}
            shakeKey={shake}
            error={shake && !form.country.trim() ? 'Campo obligatorio.' : undefined}
            onChange={event => setForm(value => ({ ...value, country: event.target.value }))}
          />
        </div>
      </ComerziaModal>

      {/* MODAL: ELIMINACIÓN DE CIUDAD */}
      <ComerziaModal
        isOpen={!!remove}
        onClose={() => {
          if (!deletion.isPending) setRemove(null);
        }}
        title="Eliminar ciudad"
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
          Se retirará a <strong>{remove?.name}</strong> del catálogo compartido. Los registros históricos que la utilicen conservarán su referencia.
        </p>
      </ComerziaModal>
    </div>
  );
}
