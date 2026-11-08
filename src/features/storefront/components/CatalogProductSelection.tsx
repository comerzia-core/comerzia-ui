import { useState, type MouseEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Eye, EyeOff, Search, SlidersHorizontal } from 'lucide-react';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { getThumbnailUrl } from '../../../utils/image';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCatalogSelection } from '../hooks/useCatalogSelection';
import { catalogService, catalogError } from '../services/catalogService';
import type { ProductSelection, VariantSelection, ScopeVisibility } from '../types';

function ScopeSwitch({ label, summary, busy, disabled, onChange }: { label: string; summary?: ScopeVisibility | null; busy: boolean; disabled: boolean; onChange: () => void }) {
  return <div className="flex items-center gap-2 shrink-0 pt-6">
    <ComerziaSwitch ariaLabel={'Publicar grupo ' + label} checked={summary?.enabled === true} isLoading={busy} disabled={disabled || !summary?.total} onChange={onChange} />
    {summary?.total ? <span className="text-xs text-base-content/60">{summary.enabled === null ? 'Parcial' : summary.enabled ? 'Visible' : 'Oculto'}</span> : null}
  </div>;
}

export function CatalogProductSelection() {
  const state = useCatalogSelection();
  const canManage = useAuthStore(store => store.hasPermission('ORG_PUBLIC_CATALOG_MANAGE'));
  const [context, setContext] = useState<{ item: ProductSelection; x: number; y: number; centered: boolean } | null>(null);
  const [selected, setSelected] = useState<ProductSelection | null>(null);
  const openContext = (event: MouseEvent, item: ProductSelection, centered: boolean) => {
    event.preventDefault(); event.stopPropagation(); setContext({ item, x: centered ? 0 : event.clientX, y: centered ? 0 : event.clientY, centered });
  };
  const visible = (item: ProductSelection) => item.visible === null ? <span className="badge badge-ghost text-xs">Personalizado</span> :
    <ComerziaSwitch ariaLabel={'Publicar ' + item.name} checked={item.visible} isLoading={state.busy} disabled={!canManage} onChange={() => { void state.product(item.id, !item.visible); }} />;
  const columns: Column<ProductSelection>[] = [
    { header: 'Producto', render: item => <div className="flex items-center gap-3 min-w-0">{item.imageUrl && <img src={getThumbnailUrl(item.imageUrl)} alt="" loading="lazy" className="w-10 h-10 object-contain rounded-lg" />}<div><p className="font-medium">{item.name}</p><p className="text-xs text-base-content/50">{item.brand}</p></div></div> },
    { header: 'Variantes', render: item => <span className="text-xs">{item.visibleVariantCount} de {item.variantCount} visibles</span> },
    { header: 'Público', render: visible },
  ];
  const facets = state.facets.data;
  const segments = facets?.segments.filter(item => item.parentId === state.filters.category) || [];
  const brands = facets?.brands.filter(item => item.parentId === state.filters.segment) || [];
  const page = state.products.data;
  const summary = state.summary.data;
  return <section className="space-y-4" aria-label="Productos del catálogo público">
    <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200 space-y-4">
      <div className="w-full sm:w-80"><ComerziaInput type="search" icon={<Search size={17} />} aria-label="Buscar productos para publicar" placeholder="Buscar producto o variante" maxLength={80} value={state.search} onChange={event => state.setSearch(event.target.value)} /></div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="flex gap-3 min-w-0"><ComerziaSelect label="Categoría" enableDefaultOption placeholder="Todas" options={facets?.categories.map(item => ({ value: item.id, label: item.name })) || []} value={state.filters.category} onChange={event => state.filter('category', event.target.value)} />
          {state.filters.category && <ScopeSwitch label="categoría" summary={summary?.category} busy={state.busy} disabled={!canManage || state.summary.isFetching} onChange={() => { void state.scope('CATEGORY', state.filters.category, summary?.category?.enabled !== true); }} />}</div>
        <div className="flex gap-3 min-w-0"><ComerziaSelect label="Rubro" enableDefaultOption placeholder="Todos" disabled={!state.filters.category} options={segments.map(item => ({ value: item.id, label: item.name }))} value={state.filters.segment} onChange={event => state.filter('segment', event.target.value)} />
          {state.filters.segment && <ScopeSwitch label="rubro" summary={summary?.segment} busy={state.busy} disabled={!canManage || state.summary.isFetching} onChange={() => { void state.scope('SEGMENT', state.filters.segment, summary?.segment?.enabled !== true); }} />}</div>
        <div className="flex gap-3 min-w-0"><ComerziaSelect label="Marca" enableDefaultOption placeholder="Todas" disabled={!state.filters.segment} options={brands.map(item => ({ value: item.id, label: item.name }))} value={state.filters.brand} onChange={event => state.filter('brand', event.target.value)} />
          {state.filters.brand && <ScopeSwitch label="marca" summary={summary?.brand} busy={state.busy} disabled={!canManage || state.summary.isFetching} onChange={() => { void state.scope('BRAND', state.filters.brand, summary?.brand?.enabled !== true); }} />}</div>
      </div>
      <p className="text-xs text-base-content/50">Cada switch aplica al grupo completo, sin limitarse a esta página o búsqueda.</p>
    </div>
    {(state.error || state.products.isError || state.facets.isError || state.summary.isError) && <p className="text-error text-sm" role="alert">{state.error || catalogError(state.products.error || state.facets.error || state.summary.error)}</p>}
    <div className="hidden md:block"><ComerziaTable data={page?.content || []} columns={columns} showRowNumbers isLoading={state.products.isPending}
      onRowContextMenu={(event, item) => openContext(event, item, false)} pagination={page ? { totalElements: page.totalElements, totalPages: page.totalPages, currentPage: state.page, pageSize: state.pageSize, onPageChange: state.setPage, onPageSizeChange: size => { state.setPageSize(size); state.setPage(0); } } : undefined} /></div>
    <div className="md:hidden space-y-3">
      {state.products.isPending ? <p role="status">Cargando productos…</p> : !page?.content.length ? <p className="text-sm text-base-content/60 py-6 text-center">No se encontraron productos.</p> : page.content.map((item, index) => <article key={item.id} onClick={event => openContext(event, item, true)} onContextMenu={event => openContext(event, item, true)} className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs space-y-3 cursor-pointer">
        <div className="flex items-center gap-3"><span className="text-xs text-base-content/40">{state.page * state.pageSize + index + 1}</span>{item.imageUrl && <img src={getThumbnailUrl(item.imageUrl)} alt="" loading="lazy" className="w-10 h-10 object-contain rounded-lg" />}<div className="min-w-0 flex-1"><h3 className="text-sm font-semibold truncate">{item.name}</h3><p className="text-xs text-base-content/50">{item.brand}</p></div>{visible(item)}</div>
        <p className="text-xs text-base-content/60">{item.visibleVariantCount} de {item.variantCount} variantes visibles</p>
      </article>)}
      {page && page.totalPages > 1 && <footer className="flex items-center justify-between gap-2 whitespace-nowrap rounded-2xl border border-base-200 bg-base-100 p-3 text-xs">
        <ComerziaButton variant="ghost" isIconOnly aria-label="Productos anteriores" icon={<ArrowLeft size={16} />} disabled={state.page === 0 || state.products.isFetching} onClick={() => state.setPage(state.page - 1)} />
        <span>{page.totalElements} · Página {state.page + 1} de {page.totalPages}</span>
        <ComerziaButton variant="ghost" isIconOnly aria-label="Más productos" icon={<ArrowRight size={16} />} disabled={state.page + 1 >= page.totalPages || state.products.isFetching} onClick={() => state.setPage(state.page + 1)} />
      </footer>}
    </div>
    <ComerziaContextMenu isOpen={!!context} x={context?.x || 0} y={context?.y || 0} isCentered={context?.centered} onClose={() => setContext(null)}>
      {context && <><ContextMenuItem icon={SlidersHorizontal} label="Personalizar variantes" onClick={() => { setSelected(context.item); setContext(null); }} />
        {canManage && <><ContextMenuItem icon={Eye} label="Mostrar todas las variantes" disabled={state.busy} onClick={() => { void state.product(context.item.id, true); }} /><ContextMenuItem icon={EyeOff} label="Ocultar todas las variantes" disabled={state.busy} onClick={() => { void state.product(context.item.id, false); }} /></>}
      </>}
    </ComerziaContextMenu>
    {selected && <VariantEditor item={selected} canManage={canManage} busy={state.busy} onChange={state.variant} onClose={() => setSelected(null)} />}
  </section>;
}

function VariantEditor({ item, canManage, busy, onChange, onClose }: { item: ProductSelection; canManage: boolean; busy: boolean; onChange: (id: string, visible: boolean) => Promise<void>; onClose: () => void }) {
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const company = useAuthStore(state => state.userProfile?.companySettings?.id);
  const variants = useQuery({ queryKey: ['catalog-variants', company, item.id, page, pageSize], queryFn: ({ signal }) => catalogService.productVariants(item.id, page, pageSize, signal) });
  const columns: Column<VariantSelection>[] = [
    { header: 'Variante', render: variant => <span>{variant.name}{!variant.active && <small className="text-base-content/50"> · Inactiva</small>}</span> },
    { header: 'Público', render: variant => <ComerziaSwitch ariaLabel={'Publicar variante ' + variant.name} checked={variant.visible} disabled={!canManage} isLoading={busy} onChange={() => { void onChange(variant.id, !variant.visible); }} /> },
  ];
  return <ComerziaModal isOpen onClose={onClose} title={item.name} size="lg" variant="view">
    {variants.isError ? <p role="alert" className="text-error text-sm">{catalogError(variants.error)}</p> : <ComerziaTable data={variants.data?.content || []} columns={columns} showRowNumbers isLoading={variants.isPending} pagination={variants.data ? { totalElements: variants.data.totalElements, totalPages: variants.data.totalPages, currentPage: page, pageSize, onPageChange: setPage, onPageSizeChange: size => { setPageSize(size); setPage(0); } } : undefined} />}
  </ComerziaModal>;
}
