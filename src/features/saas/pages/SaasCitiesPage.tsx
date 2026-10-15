import { useState } from 'react';
import { Pencil, Trash2, MapPin } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCreate, BtnSave, BtnDelete } from '../../../components/ui/CrudButtons';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';

interface City { id: string; name: string; country: string; }
export function SaasCitiesPage() {
  const [search, setSearch] = useState(''); const query = useDebounce(search, 300);
  const cities = usePlatformPage<City>('/saas/cities', { query }); const context = useSaasContextMenu<City>(); const { can } = usePermission();
  const [editor, setEditor] = useState<City | 'new' | null>(null); const [remove, setRemove] = useState<City | null>(null);
  const [form, setForm] = useState({ name: '', country: '' }); const [shake, setShake] = useState(0);
  const save = usePlatformAction(() => editor === 'new' ? platformService.post('/saas/cities', form)
    : platformService.put('/saas/cities/' + encodeURIComponent((editor as City).id), form));
  const deletion = usePlatformAction(() => platformService.delete('/saas/cities/' + encodeURIComponent(remove!.id)));
  const edit = (row: City | 'new') => { setShake(0); setForm(row === 'new' ? { name: '', country: '' } : { name: row.name, country: row.country }); setEditor(row); };
  return <div className="space-y-6 w-full animate-fade-in">
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"><div className="flex items-start gap-2.5">
      <MapPin className="w-6 h-6 text-primary shrink-0" /><div><h1 className="text-lg sm:text-2xl font-bold">Ciudades</h1><p className="text-xs text-base-content/60">Catálogo geográfico compartido.</p></div></div>
      {can('GEN_CITIES_MANAGE') && <BtnCreate responsive={false} label="Nueva ciudad" onClick={() => edit('new')} />}</div>
    <ComerziaSurface><ComerziaInput aria-label="Buscar ciudad" icon="Search" placeholder="Ciudad o país" className="w-full sm:w-80" value={search}
      onChange={event => { setSearch(event.target.value); cities.pagination.onPageChange(0); }} /></ComerziaSurface>
    {cities.isError && <p role="alert">No se pudieron consultar las ciudades.</p>}
    <ComerziaResponsiveTable data={cities.data?.content ?? []} isLoading={cities.isPending} pagination={cities.pagination} onActions={context.open}
      columns={[{ header: 'Ciudad', accessorKey: 'name' }, { header: 'País', accessorKey: 'country' }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}>{can('GEN_CITIES_MANAGE') && <>
      <ContextMenuItem icon={Pencil} label="Editar ciudad" onClick={() => { if (context.menu.item) edit(context.menu.item); context.close(); }} />
      <ContextMenuItem icon={Trash2} label="Eliminar ciudad" variant="error" onClick={() => { setRemove(context.menu.item); context.close(); }} /></>}</ComerziaContextMenu>
    <ComerziaModal isOpen={!!editor} onClose={() => { if (!save.isPending) setEditor(null); }} title={editor === 'new' ? 'Nueva ciudad' : 'Editar ciudad'}
      actions={<BtnSave responsive={false} isLoading={save.isPending} onClick={() => {
        if (!form.name.trim() || !form.country.trim()) { setShake(value => value + 1); return; }
        save.mutate(undefined, { onSuccess: () => setEditor(null) });
      }} />}><div className="space-y-4">{(['name', 'country'] as const).map((key, index) => <ComerziaInput key={key} label={['Ciudad', 'País'][index]}
        aria-label={['Ciudad', 'País'][index]} isRequired maxLength={key === 'name' ? 100 : 50} value={form[key]} shakeKey={shake}
        error={shake && !form[key].trim() ? 'Campo obligatorio.' : undefined} onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))} />)}</div></ComerziaModal>
    <ComerziaModal isOpen={!!remove} onClose={() => { if (!deletion.isPending) setRemove(null); }} title="Eliminar ciudad" size="sm"
      actions={<BtnDelete responsive={false} isLoading={deletion.isPending} onClick={() => deletion.mutate(undefined, { onSuccess: () => setRemove(null) })} />}>
      Se retirará {remove?.name} del catálogo. Se conservará su historial.
    </ComerziaModal>
  </div>;
}
