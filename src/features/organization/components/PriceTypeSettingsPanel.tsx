import { useState, type MouseEvent } from 'react';
import { AlertTriangle, LockKeyhole, Pencil, Trash2 } from 'lucide-react';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { BtnCreate, BtnCancel, BtnSave, BtnRefresh, BtnBack, BtnNext } from '../../../components/ui/CrudButtons';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { usePriceTypeSettings } from '../hooks/usePriceTypeSettings';
import type { PriceTypeSettings } from '../types/priceType';

export function PriceTypeSettingsPanel() {
  const settings = usePriceTypeSettings();
  const { canManage, canRead, query, editor, deleting, form, busy, error } = settings;
  const [contextMenu, setContextMenu] = useState<{
    item: PriceTypeSettings | null; x: number; y: number; isCentered: boolean;
  }>({ item: null, x: 0, y: 0, isCentered: false });
  function openMenu(event: MouseEvent, item: PriceTypeSettings, isCentered: boolean) {
    if (!canManage) return;
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({ item, x: event.clientX, y: event.clientY, isCentered });
  }
  const columns: Column<PriceTypeSettings>[] = [
    { header: 'Nombre', accessorKey: 'name' },
    { header: 'Unidades por presentación', accessorKey: 'equivalenceFactor' },
    { header: 'Descripción', render: value => value.description || '—' },
    { header: 'Uso', render: value => value.inUse ? <span className="flex items-center gap-1 whitespace-nowrap"><LockKeyhole size={14} /> En uso</span> : 'Sin uso' },
  ];

  if (!canRead) return <p>No tienes permiso para ver esta configuración.</p>;
  return <section className="lg:col-span-3 space-y-4 min-w-0">
    <div role="note" className="alert alert-warning items-start">
      <AlertTriangle size={22} className="shrink-0" />
      <div><h2 className="font-bold">Configura con cuidado los tipos de precio</h2>
        <p className="text-sm">La equivalencia indica cuántas unidades representa una presentación. Modificarla puede afectar conversiones, montos y balances. Una vez utilizado un tipo en precios o ventas, su equivalencia y eliminación quedan bloqueadas. Puedes editar su nombre y descripción.</p>
      </div>
    </div>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="font-bold text-lg">Tipos de precio</h2>
      {canManage && <BtnCreate label="Nuevo tipo de precio" responsive={false} onClick={() => settings.openEditor(null)} />}
    </div>
    {query.isError ? <div role="alert" className="space-y-3"><p>No se pudo cargar la configuración.</p><BtnRefresh onClick={() => void query.refetch()} /></div> :
      <><div className="hidden md:block"><ComerziaTable data={query.data?.content ?? []} columns={columns} isLoading={query.isLoading} showRowNumbers
        onRowContextMenu={(event, item) => openMenu(event, item, false)}
        pagination={{ totalElements: query.data?.totalElements ?? 0, totalPages: query.data?.totalPages ?? 0,
          currentPage: settings.page, pageSize: settings.size, onPageChange: settings.setPage,
          onPageSizeChange: size => { settings.setSize(size); settings.setPage(0); } }} /></div>
        <div className="md:hidden space-y-3">
          {query.isLoading ? <p role="status">Cargando tipos de precio…</p> : !query.data?.content.length ?
            <p className="text-sm text-base-content/60 text-center py-6">No hay tipos de precio registrados.</p> :
            query.data.content.map((item, index) => <article key={item.id}
              role={canManage ? 'button' : undefined} tabIndex={canManage ? 0 : undefined}
              aria-label={canManage ? `Opciones de ${item.name}` : undefined}
              onClick={event => openMenu(event, item, true)}
              onKeyDown={event => {
                if (canManage && (event.key === 'Enter' || event.key === ' ')) {
                  event.preventDefault();
                  setContextMenu({ item, x: 0, y: 0, isCentered: true });
                }
              }}
              className={`bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs space-y-2 select-none ${canManage ? 'cursor-pointer active:scale-[0.99] transition-transform' : ''}`}>
              <div className="flex justify-between items-start gap-3">
                <h3 className="font-semibold break-words min-w-0"><span className="text-base-content/40 mr-2">{settings.page * settings.size + index + 1}.</span><span>{item.name}</span></h3>
                {item.inUse && <span className="text-xs flex gap-1 items-center whitespace-nowrap"><LockKeyhole size={13} />En uso</span>}
              </div>
              <p className="text-sm">Unidades por presentación: <strong>{item.equivalenceFactor}</strong></p>
              {item.description && <p className="text-xs text-base-content/60 break-words">{item.description}</p>}
            </article>)}
          <footer className="flex justify-between items-center gap-2 text-xs whitespace-nowrap pt-2">
            <span>{query.data?.totalElements ?? 0} registros · Página {settings.page + 1} de {Math.max(1, query.data?.totalPages ?? 0)}</span>
            <div className="flex gap-1">
              <BtnBack label="Anterior" aria-label="Página anterior" disabled={settings.page === 0 || query.isLoading}
                onClick={() => settings.setPage(settings.page - 1)} />
              <BtnNext label="Siguiente" aria-label="Página siguiente" disabled={settings.page >= (query.data?.totalPages ?? 0) - 1 || query.isLoading}
                onClick={() => settings.setPage(settings.page + 1)} />
            </div>
          </footer>
        </div></>}

    <ComerziaContextMenu isOpen={canManage && !!contextMenu.item} x={contextMenu.x} y={contextMenu.y}
      isCentered={contextMenu.isCentered} onClose={() => setContextMenu(previous => ({ ...previous, item: null }))}>
      {contextMenu.item && <>
        <ContextMenuItem icon={Pencil} label="Editar" onClick={() => settings.openEditor(contextMenu.item)} />
        {!contextMenu.item.inUse && <ContextMenuItem icon={Trash2} label="Eliminar" variant="error"
          onClick={() => settings.setDeleting(contextMenu.item)} />}
      </>}
    </ComerziaContextMenu>

    <ComerziaModal isOpen={editor !== undefined} onClose={() => { if (!busy) settings.setEditor(undefined); }}
      title={editor ? 'Editar tipo de precio' : 'Nuevo tipo de precio'} size="md">
      <form className="space-y-4" onSubmit={event => { event.preventDefault(); void settings.save(); }}>
        {error && <p role="alert" className="text-error text-sm">{error}</p>}
        <ComerziaInput label="Nombre" value={form.name} isRequired required maxLength={50} disabled={busy} shakeKey={settings.shakeKey}
          onChange={event => settings.setForm({ ...form, name: event.target.value })} />
        <ComerziaInput label="Unidades por presentación" type="number" min={1} max={1000000} step={1} required isRequired
          value={Number.isNaN(form.equivalenceFactor) ? '' : form.equivalenceFactor} disabled={busy} readOnly={editor?.inUse} shakeKey={settings.shakeKey}
          helperText={editor?.inUse ? 'Equivalencia protegida porque el tipo ya fue utilizado.' : 'Ejemplo: una docena equivale a 12 unidades.'}
          onChange={event => settings.setForm({ ...form, equivalenceFactor: event.target.valueAsNumber })} />
        <ComerziaInput label="Descripción" value={form.description ?? ''} maxLength={1000} disabled={busy} shakeKey={settings.shakeKey}
          onChange={event => settings.setForm({ ...form, description: event.target.value })} />
        <div className="flex justify-end gap-2 pt-3 border-t border-base-200">
          <BtnCancel disabled={busy} onClick={() => settings.setEditor(undefined)} />
          <BtnSave type="submit" isLoading={busy} />
        </div>
      </form>
    </ComerziaModal>
    <ConfirmationModal isOpen={!!deleting} onClose={() => { if (!busy) settings.setDeleting(null); }}
      onConfirm={() => void settings.remove()} title="Eliminar tipo de precio" confirmText="Eliminar" isLoading={busy}
      message={`¿Deseas eliminar «${deleting?.name ?? ''}»? El sistema comprobará que no tenga precios ni ventas asociados.`} />
  </section>;
}
