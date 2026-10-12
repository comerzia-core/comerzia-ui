import { useState, useEffect } from 'react';
import { Edit, Trash2, Power, Ruler } from 'lucide-react';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaSwitch } from '../../../../components/ui/ComerziaSwitch';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
import { BtnCreate, BtnSave, BtnCancel, BtnBack, BtnNext } from '../../../../components/ui/CrudButtons';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import { useRollSizes } from '../../hooks/useRollSizes';
import { useRollSizeEditor } from '../../hooks/useRollSizeEditor';
import type { RollSize } from '../../types/labels';

export const RollSizeList = ({
  refreshKey,
  onTotalChange,
}: {
  refreshKey: number;
  onTotalChange?: (count: number) => void;
}) => {
  const rolls = useRollSizes(refreshKey);

  useEffect(() => {
    onTotalChange?.(rolls.totalElements);
  }, [rolls.totalElements, onTotalChange]);
  const editor = useRollSizeEditor(rolls.save);
  const { editing, isEditorOpen, setIsEditorOpen, form, setForm, errors, shakeKey, save } = editor;
  const [deleting, setDeleting] = useState<RollSize | null>(null);
  const [menu, setMenu] = useState<{ item: RollSize | null; x: number; y: number; centered: boolean }>({ item: null, x: 0, y: 0, centered: false });
  const openEditor = (item: RollSize | null) => {
    setMenu(current => ({ ...current, item: null }));
    editor.openEditor(item);
  };
  const columns: Column<RollSize>[] = [
    { header: 'Nombre', accessorKey: 'name' },
    { header: 'Ancho × alto', render: item => `${item.widthMm} × ${item.heightMm} mm` },
    { header: 'GAP', render: item => `${item.gapMm} mm` },
    { header: 'Habilitado', render: item => <ComerziaSwitch checked={item.active} disabled={rolls.isSaving} onChange={() => { void rolls.save(item.id, { ...item, active: !item.active }); }} /> },
  ];
  const closeMenu = () => setMenu(current => ({ ...current, item: null }));
  return <div className="space-y-4">
    <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200 flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
      <div className="w-full sm:w-80"><ComerziaInput icon="Search" placeholder="Buscar tamaños de rollos…" value={rolls.search} onChange={event => rolls.setSearch(event.target.value)} /></div>
      <BtnCreate label="Nuevo tamaño" onClick={() => openEditor(null)} />
    </div>
    <p className="text-xs text-base-content/60">Los tamaños iniciales están deshabilitados. Habilite los rollos que utiliza su empresa.</p>
    {rolls.error && <p role="alert" className="text-sm text-error">{rolls.error}</p>}
    <div className="hidden md:block card bg-base-100 rounded-2xl border border-base-200 overflow-hidden">
      <ComerziaTable data={rolls.items} columns={columns} isLoading={rolls.isLoading} showRowNumbers
        onRowContextMenu={(event, item) => { event.preventDefault(); setMenu({ item, x: event.clientX, y: event.clientY, centered: false }); }}
        pagination={{ totalElements: rolls.totalElements, totalPages: rolls.totalPages, currentPage: rolls.page, pageSize: rolls.pageSize, onPageChange: rolls.setPage, onPageSizeChange: rolls.setPageSize }} />
    </div>
    <div className="md:hidden space-y-3">
      {rolls.isLoading ? <span className="loading loading-spinner" /> : rolls.items.map(item => <article key={item.id} onClick={() => setMenu({ item, x: 0, y: 0, centered: true })} className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs cursor-pointer">
        <div className="flex items-center justify-between gap-2"><span className="font-semibold">{item.name}</span><span className={item.active ? 'text-success text-xs' : 'text-base-content/50 text-xs'}>{item.active ? 'Habilitado' : 'Deshabilitado'}</span></div>
        <p className="text-xs flex items-center gap-2 mt-2"><Ruler size={14} />{item.widthMm} × {item.heightMm} mm · GAP {item.gapMm} mm</p>
      </article>)}
      {!rolls.isLoading && !rolls.items.length && <p className="text-sm text-base-content/60">No se encontraron tamaños.</p>}
      <div className="flex items-center justify-between gap-2 whitespace-nowrap text-xs"><span>{rolls.totalElements} registros · Página {rolls.page + 1} de {Math.max(1, rolls.totalPages)}</span><div className="flex gap-1"><BtnBack label="Anterior" disabled={rolls.page === 0 || rolls.isLoading} onClick={() => rolls.setPage(rolls.page - 1)} /><BtnNext label="Siguiente" disabled={rolls.page + 1 >= rolls.totalPages || rolls.isLoading} onClick={() => rolls.setPage(rolls.page + 1)} /></div></div>
    </div>
    <ComerziaContextMenu isOpen={!!menu.item} x={menu.x} y={menu.y} isCentered={menu.centered} onClose={closeMenu}>
      {menu.item && <>
        <ContextMenuItem icon={Edit} label="Editar" onClick={() => openEditor(menu.item)} />
        <ContextMenuItem icon={Power} label={menu.item.active ? 'Deshabilitar' : 'Habilitar'} onClick={() => { if (menu.item) void rolls.save(menu.item.id, { ...menu.item, active: !menu.item.active }); closeMenu(); }} />
        <ContextMenuItem icon={Trash2} label="Eliminar" variant="error" onClick={() => { setDeleting(menu.item); closeMenu(); }} />
      </>}
    </ComerziaContextMenu>
    <ComerziaModal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editing ? 'Editar tamaño de rollo' : 'Nuevo tamaño de rollo'} size="sm" actions={<div className="flex gap-2 justify-end"><BtnCancel disabled={rolls.isSaving} onClick={() => setIsEditorOpen(false)} /><BtnSave onClick={save} isLoading={rolls.isSaving} /></div>}>
      <div className="space-y-3">
        <ComerziaInput label="Nombre" maxLength={100} value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} isRequired error={errors.name} shakeKey={shakeKey} />
        <ComerziaInput label="Ancho (mm)" type="number" min={12} max={108} step={1} value={form.widthMm} onChange={event => setForm(current => ({ ...current, widthMm: event.target.value }))} isRequired error={errors.widthMm} shakeKey={shakeKey} />
        <ComerziaInput label="Alto (mm)" type="number" min={12} max={200} step={1} value={form.heightMm} onChange={event => setForm(current => ({ ...current, heightMm: event.target.value }))} isRequired error={errors.heightMm} shakeKey={shakeKey} />
        <ComerziaInput label="GAP (mm)" type="number" min={0} max={20} step={1} value={form.gapMm} onChange={event => setForm(current => ({ ...current, gapMm: event.target.value }))} isRequired error={errors.gapMm} shakeKey={shakeKey} />
        <label className="flex items-center gap-2 text-sm"><ComerziaSwitch checked={form.active} onChange={() => setForm(current => ({ ...current, active: !current.active }))} />Habilitado para impresión</label>
        {rolls.error && <p role="alert" className="text-sm text-error">{rolls.error}</p>}
      </div>
    </ComerziaModal>
    <ConfirmationModal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Eliminar tamaño de rollo" message={`¿Eliminar «${deleting?.name}»?`} isLoading={rolls.isSaving} onConfirm={async () => { if (deleting && await rolls.remove(deleting.id)) setDeleting(null); }} />
  </div>;
};
