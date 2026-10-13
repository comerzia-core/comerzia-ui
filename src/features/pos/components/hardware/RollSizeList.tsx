import { useState, useEffect } from 'react';
import {
  Edit,
  Trash2,
  Power,
  Ruler,
  Info,
  ChevronsLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsRight,
} from 'lucide-react';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaSwitch } from '../../../../components/ui/ComerziaSwitch';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
import { BtnCreate, BtnSave, BtnCancel } from '../../../../components/ui/CrudButtons';
import { ConfirmationModal } from '../../../../components/ui/ConfirmationModal';
import { useRollSizes } from '../../hooks/useRollSizes';
import { useRollSizeEditor } from '../../hooks/useRollSizeEditor';
import type { RollSize } from '../../types/labels';

interface RollSizeListProps {
  refreshKey: number;
  onTotalChange?: (count: number) => void;
}

export const RollSizeList = ({ refreshKey, onTotalChange }: RollSizeListProps) => {
  const rolls = useRollSizes(refreshKey);

  // Sincronizar el contador total con la vista principal
  useEffect(() => {
    onTotalChange?.(rolls.totalElements);
  }, [rolls.totalElements, onTotalChange]);

  const editor = useRollSizeEditor(rolls.save);
  const { editing, isEditorOpen, setIsEditorOpen, form, setForm, errors, shakeKey, save } = editor;

  const [deleting, setDeleting] = useState<RollSize | null>(null);
  const [menu, setMenu] = useState<{
    item: RollSize | null;
    x: number;
    y: number;
    centered: boolean;
  }>({ item: null, x: 0, y: 0, centered: false });

  const openEditor = (item: RollSize | null) => {
    setMenu(current => ({ ...current, item: null }));
    editor.openEditor(item);
  };

  const closeMenu = () => setMenu(current => ({ ...current, item: null }));

  const handleMobileCardTap = (e: React.MouseEvent, item: RollSize) => {
    e.stopPropagation();
    setMenu({
      item,
      x: 0,
      y: 0,
      centered: true,
    });
  };

  // Definición de columnas para la tabla Desktop
  const columns: Column<RollSize>[] = [
    {
      header: 'Nombre',
      accessorKey: 'name',
    },
    {
      header: 'Dimensiones',
      render: item => (
        <div className="text-xs">
          <span className="font-semibold text-base-content">
            {item.widthMm} × {item.heightMm} mm
          </span>
          <p className="text-base-content/60 font-mono mt-0.5">GAP: {item.gapMm} mm</p>
        </div>
      ),
    },
    {
      header: 'Columnas',
      render: item => (
        <div className="text-xs">
          <span className="font-medium text-base-content">{item.columns} col.</span>
          {item.columns > 1 && (
            <p className="text-base-content/60 font-mono mt-0.5">Sep: {item.columnGapMm} mm</p>
          )}
        </div>
      ),
    },
    {
      header: 'Ancho Total',
      render: item => (
        <span className="font-mono text-xs text-base-content/80">
          {item.columns * item.widthMm + (item.columns - 1) * item.columnGapMm} mm
        </span>
      ),
    },
    {
      header: 'Habilitado',
      render: item => (
        <ComerziaSwitch
          checked={item.active}
          disabled={rolls.isSaving}
          onChange={() => {
            void rolls.save(item.id, { ...item, active: !item.active });
          }}
        />
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 1. BARRA DE BÚSQUEDA Y ACCIONES */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar tamaños de rollos…"
              value={rolls.search}
              onChange={event => rolls.setSearch(event.target.value)}
            />
          </div>
          <BtnCreate
            label="Nuevo Tamaño"
            onClick={() => openEditor(null)}
            className="w-full sm:w-auto shrink-0"
          />
        </div>
      </div>

      {/* Nota explicativa minimalista */}
      <div className="flex items-center gap-2 text-xs text-base-content/70 px-1">
        <Info size={14} className="text-primary/70 shrink-0" />
        <span>
          Los tamaños iniciales del catálogo están deshabilitados por defecto. Active los rollos que
          utiliza su empresa.
        </span>
      </div>

      {rolls.error && (
        <p role="alert" className="text-sm text-error">
          {rolls.error}
        </p>
      )}

      {/* 2. CONTENEDOR DESKTOP */}
      <div className="hidden md:block md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:card-body md:p-0">
          <ComerziaTable
            data={rolls.items}
            columns={columns}
            isLoading={rolls.isLoading}
            showRowNumbers
            onRowContextMenu={(event, item) => {
              event.preventDefault();
              setMenu({ item, x: event.clientX, y: event.clientY, centered: false });
            }}
            pagination={{
              totalElements: rolls.totalElements,
              totalPages: rolls.totalPages,
              currentPage: rolls.page,
              pageSize: rolls.pageSize,
              onPageChange: rolls.setPage,
              onPageSizeChange: rolls.setPageSize,
            }}
          />
        </div>
      </div>

      {/* 3. CONTENEDOR MOBILE */}
      <div className="block md:hidden space-y-3">
        {rolls.isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : rolls.items.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron tamaños de rollos.
          </div>
        ) : (
          rolls.items.map((item, index) => (
            <article
              key={item.id}
              onClick={e => handleMobileCardTap(e, item)}
              className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
            >
              {/* FILA SUPERIOR: NUMERACIÓN, TÍTULO PRINCIPAL Y BADGE */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                    {rolls.page * rolls.pageSize + index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                      {item.name}
                    </h3>
                    <p className="text-xs font-mono text-base-content/60 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <Ruler size={12} className="text-primary/70 shrink-0" />
                      {item.widthMm} × {item.heightMm} mm
                    </p>
                  </div>
                </div>

                <div className="shrink-0">
                  <ComerziaBadge
                    label={item.active ? 'Habilitado' : 'Deshabilitado'}
                    variant={item.active ? 'success' : 'neutral'}
                  />
                </div>
              </div>

              {/* CONTENIDO SECUNDARIO CON SANGRÍA DE 26px */}
              <div className="pl-[26px] flex flex-col gap-1 text-xs text-base-content/70">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-base-content/50">GAP filas:</span>
                  <span className="font-mono">{item.gapMm} mm</span>
                  <span className="text-base-content/40">·</span>
                  <span className="text-base-content/50">Columnas:</span>
                  <span className="font-medium">{item.columns}</span>
                  {item.columns > 1 && (
                    <>
                      <span className="text-base-content/40">·</span>
                      <span className="text-base-content/50">Separación:</span>
                      <span className="font-mono">{item.columnGapMm} mm</span>
                    </>
                  )}
                </div>
              </div>

              {/* PIE DE TARJETA CON SANGRÍA DE 26px */}
              <div className="pl-[26px] pt-1.5 border-t border-base-100 flex items-center justify-between text-[11px] text-base-content/60">
                <span>Ancho total del rollo:</span>
                <strong className="font-mono font-medium text-base-content/80">
                  {item.columns * item.widthMm + (item.columns - 1) * item.columnGapMm} mm
                </strong>
              </div>
            </article>
          ))
        )}

        {/* 4. PAGINACIÓN MOBILE EN UNA SOLA FILA */}
        {rolls.items.length > 0 && (
          <footer
            className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs"
            data-purpose="mobile-pagination"
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span>Mostrar</span>
                <select
                  value={rolls.pageSize}
                  onChange={e => rolls.setPageSize(Number(e.target.value))}
                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="whitespace-nowrap">de {rolls.totalElements} registros</span>
              </div>
              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                Página {rolls.page + 1} de {Math.max(1, rolls.totalPages)}
              </span>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                aria-label="Primera página"
                disabled={rolls.page === 0 || rolls.isLoading}
                onClick={() => rolls.setPage(0)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                disabled={rolls.page === 0 || rolls.isLoading}
                onClick={() => rolls.setPage(Math.max(0, rolls.page - 1))}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={rolls.page >= rolls.totalPages - 1 || rolls.isLoading}
                onClick={() => rolls.setPage(rolls.page + 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Última página"
                disabled={rolls.page >= rolls.totalPages - 1 || rolls.isLoading}
                onClick={() => rolls.setPage(Math.max(0, rolls.totalPages - 1))}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </div>

      {/* 5. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu
        isOpen={!!menu.item}
        x={menu.x}
        y={menu.y}
        isCentered={menu.centered}
        onClose={closeMenu}
      >
        {menu.item && (
          <>
            <ContextMenuItem icon={Edit} label="Editar" onClick={() => openEditor(menu.item)} />
            <ContextMenuItem
              icon={Power}
              label={menu.item.active ? 'Deshabilitar' : 'Habilitar'}
              onClick={() => {
                if (menu.item) {
                  void rolls.save(menu.item.id, { ...menu.item, active: !menu.item.active });
                }
                closeMenu();
              }}
            />
            <ContextMenuItem
              icon={Trash2}
              label="Eliminar"
              variant="error"
              onClick={() => {
                setDeleting(menu.item);
                closeMenu();
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      {/* 6. MODAL DE CREACIÓN / EDICIÓN */}
      <ComerziaModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        title={editing ? 'Editar Tamaño de Rollo' : 'Nuevo Tamaño de Rollo'}
        size="sm"
        actions={
          <div className="flex gap-2 justify-end">
            <BtnCancel disabled={rolls.isSaving} onClick={() => setIsEditorOpen(false)} />
            <BtnSave onClick={save} isLoading={rolls.isSaving} />
          </div>
        }
      >
        <div className="space-y-3">
          <ComerziaInput
            label="Nombre"
            maxLength={100}
            value={form.name}
            onChange={event => setForm(current => ({ ...current, name: event.target.value }))}
            isRequired
            error={errors.name}
            shakeKey={shakeKey}
          />
          <ComerziaInput
            label="Ancho de cada etiqueta (mm)"
            type="number"
            min={12}
            max={108}
            step={1}
            value={form.widthMm}
            onChange={event => setForm(current => ({ ...current, widthMm: event.target.value }))}
            isRequired
            error={errors.widthMm}
            shakeKey={shakeKey}
          />
          <ComerziaInput
            label="Alto de cada etiqueta (mm)"
            type="number"
            min={12}
            max={200}
            step={1}
            value={form.heightMm}
            onChange={event => setForm(current => ({ ...current, heightMm: event.target.value }))}
            isRequired
            error={errors.heightMm}
            shakeKey={shakeKey}
          />
          <ComerziaInput
            label="GAP entre filas (mm)"
            type="number"
            min={0}
            max={20}
            step={1}
            value={form.gapMm}
            onChange={event => setForm(current => ({ ...current, gapMm: event.target.value }))}
            isRequired
            error={errors.gapMm}
            shakeKey={shakeKey}
          />
          <ComerziaInput
            label="Columnas"
            type="number"
            min={1}
            max={9}
            step={1}
            value={form.columns}
            onChange={event =>
              setForm(current => ({
                ...current,
                columns: event.target.value,
                columnGapMm: event.target.value === '1' ? '0' : current.columnGapMm,
              }))
            }
            isRequired
            error={errors.columns}
            shakeKey={shakeKey}
          />
          <ComerziaInput
            label="Separación entre columnas (mm)"
            type="number"
            min={0}
            max={20}
            step={0.01}
            value={form.columnGapMm}
            onChange={event => setForm(current => ({ ...current, columnGapMm: event.target.value }))}
            disabled={Number(form.columns) === 1}
            isRequired
            error={errors.columnGapMm}
            shakeKey={shakeKey}
          />
          <p className="text-xs text-base-content/70">
            Ancho total:{' '}
            {Number.isFinite(editor.totalWidthMm) ? editor.totalWidthMm : '—'} mm (máximo 108 mm). Las
            separaciones entre filas y columnas son independientes.
          </p>
          <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
            <ComerziaSwitch
              checked={form.active}
              onChange={() => setForm(current => ({ ...current, active: !current.active }))}
            />
            <span>Habilitado para impresión</span>
          </label>
          {rolls.error && (
            <p role="alert" className="text-sm text-error">
              {rolls.error}
            </p>
          )}
        </div>
      </ComerziaModal>

      {/* 7. CONFIRMACIÓN DE ELIMINACIÓN */}
      <ConfirmationModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        title="Eliminar Tamaño de Rollo"
        message={`¿Estás seguro de eliminar el tamaño de rollo "${deleting?.name}"? Esta acción no se puede deshacer.`}
        isLoading={rolls.isSaving}
        onConfirm={async () => {
          if (deleting && (await rolls.remove(deleting.id))) {
            setDeleting(null);
          }
        }}
      />
    </div>
  );
};
