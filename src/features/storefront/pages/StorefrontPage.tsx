import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, ChevronDown, Search, ShoppingBag, SlidersHorizontal, X, Sun, Moon } from 'lucide-react';
import { StoreButton } from '../../../components/ui/StoreButton';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { useStorefront } from '../hooks/useStorefront';
import { useStoreTheme } from '../hooks/useStoreTheme';
import { catalogError } from '../services/catalogService';
import { StoreDialog } from '../components/StoreDialog';
import { StoreImage } from '../components/StoreImage';
import { ProductDialog } from '../components/ProductDialog';
import { CartDialog } from '../components/CartDialog';
import '../storefront.css';

export function StorefrontPage({ preview = false }: { preview?: boolean }) {
  const { slug = '' } = useParams<{ slug: string }>();
  const state = useStorefront(slug, preview);
  const appearance = useStoreTheme();
  const { catalog, products, filters, filter, search, setSearch, cart } = state;
  const [product, setProduct] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const data = catalog.data;
  const money = (value: number) => new Intl.NumberFormat('es-BO', { style: 'currency', currency: data?.currency || 'BOB' }).format(value);
  useEffect(() => { if (data && !preview) document.title = data.title + ' · Catálogo'; }, [data, preview]);
  useEffect(() => { if (products.isError) { setProduct(null); setShowCart(false); } }, [products.isError]);
  if (catalog.isError || !data) return <main className="storefront" data-store-theme="light"><div className="store-state" role={catalog.isError ? 'alert' : 'status'}>{catalog.isError ? 'Este catálogo no está disponible.' : 'Preparando el catálogo…'}</div></main>;
  const segments = data.facets.segments.filter(item => !filters.category || item.parentId === filters.category);
  const brands = data.facets.brands.filter(item => !filters.segment || item.parentId === filters.segment);
  const count = cart.reduce((total, item) => total + item.quantity, 0);
  return <main className={'storefront store-template-' + data.template.toLowerCase() + (preview ? ' store-preview' : '')} data-store-theme={appearance.theme}>
    <header className="store-header"><a className="store-brand" href={preview ? undefined : '/c/' + data.canonicalSlug}>{data.logoUrl && <StoreImage url={data.logoUrl} alt="" preset="thumbnail" />}<span>{data.title}</span></a><div className="store-header-actions">
      <StoreButton className="store-icon" aria-label={appearance.theme === 'light' ? 'Activar modo oscuro' : 'Activar modo claro'} onClick={appearance.toggle}>{appearance.theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}</StoreButton>
      <StoreButton className="store-bag" aria-label={'Ver pedido, ' + count + ' unidades'} onClick={() => setShowCart(true)}><ShoppingBag size={21} /><span>Tu pedido</span>{count > 0 && <b>{count}</b>}</StoreButton></div></header>
    <section className="store-hero"><div><span className="store-eyebrow">SELECCIONADO PARA TI</span><h1>{data.title}<span>.</span></h1>{data.description && <p>{data.description}</p>}</div><a href="#store-products" className="store-explore">Explora el catálogo <ArrowDown size={18} /></a></section>
    <section className="store-toolbar" aria-label="Navegación del catálogo"><div className="store-category-list"><StoreButton className="store-category" aria-pressed={!filters.category} onClick={() => filter('category', '')}>Todo</StoreButton>{data.facets.categories.map(category => <StoreButton key={category.id} className="store-category" aria-pressed={filters.category === category.id} onClick={() => filter('category', category.id)}>{category.name}</StoreButton>)}</div>
      <div className="store-search-row"><label className="store-search"><Search size={18} /><input type="search" aria-label="Buscar productos" placeholder="Encuentra lo que buscas" maxLength={80} value={search} onChange={event => setSearch(event.target.value)} />{search && <StoreButton className="store-icon" aria-label="Limpiar búsqueda" onClick={() => setSearch('')}><X size={16} /></StoreButton>}</label><StoreButton className="store-filter-toggle" onClick={() => setShowFilters(true)}><SlidersHorizontal size={18} /><span>Filtros</span>{(filters.brand || filters.minPrice || filters.maxPrice) && <i />}</StoreButton></div>
      {filters.category && segments.length > 0 && <nav className="store-segments" aria-label="Rubros"><StoreButton aria-pressed={!filters.segment} onClick={() => filter('segment', '')}>Todos</StoreButton>{segments.map(segment => <StoreButton key={segment.id} aria-pressed={filters.segment === segment.id} onClick={() => filter('segment', segment.id)}>{segment.name}</StoreButton>)}</nav>}
    </section>
    <section className="store-products" id="store-products" aria-busy={products.isFetching}><div className="store-results"><span>{products.data?.totalElements ?? 0} productos</span>{products.isFetching && <span role="status">Actualizando…</span>}</div>
      {products.isError ? <div className="store-empty" role="alert"><h2>{catalogError(products.error)}</h2><StoreButton onClick={() => { void catalog.refetch(); void products.refetch(); }}>Intentar nuevamente <ArrowRight size={16} /></StoreButton></div> : products.isPending ? <div className="store-grid" aria-label="Cargando productos">{Array.from({ length: 8 }, (_, i) => <div key={i} className="store-skeleton" />)}</div> : !products.data?.content.length ? <div className="store-empty"><Search size={34} strokeWidth={1} /><h2>No encontramos productos.</h2><p>Prueba otra categoría o búsqueda.</p></div> : <div className="store-grid">{products.data.content.map((item, index) => <StoreButton className="store-product-card" key={item.id} onClick={() => setProduct(item.id)} aria-label={'Ver ' + item.name}>
        <div className="store-product-photo"><StoreImage url={item.imageUrl} alt={item.name} eager={index < 4} /><span className="store-card-open"><ArrowUpRight size={19} /></span>{item.variantCount > 1 && <small>{item.variantCount} variantes</small>}</div><div className="store-card-info"><span>{item.brand}</span><h2>{item.name}</h2><p>{item.variantCount > 1 && <small>Desde </small>}{money(item.fromPrice)}</p></div>
      </StoreButton>)}</div>}
      {products.data && products.data.totalPages > 1 && <nav className="store-pagination" aria-label="Páginas de productos"><StoreButton aria-label="Página anterior" disabled={filters.page === 0 || products.isFetching} onClick={() => filter('page', filters.page - 1)}><ArrowLeft size={18} /></StoreButton><span>{filters.page + 1} / {products.data.totalPages}</span><StoreButton aria-label="Página siguiente" disabled={filters.page + 1 >= products.data.totalPages || products.isFetching} onClick={() => filter('page', filters.page + 1)}><ArrowRight size={18} /></StoreButton></nav>}
    </section>
    <footer className="store-footer"><span>{data.title}</span><span>Elige. Consulta. Disfruta.</span></footer>
    {showFilters && <StoreDialog title="Encuentra tu selección" onClose={() => setShowFilters(false)}><div className="store-filter-content"><fieldset className="store-options"><legend>Marca</legend><div><StoreButton className="store-choice" aria-pressed={!filters.brand} onClick={() => filter('brand', '')}>Todas</StoreButton>{brands.map(brand => <StoreButton key={brand.id} className="store-choice" aria-pressed={filters.brand === brand.id} onClick={() => filter('brand', brand.id)}>{brand.name}</StoreButton>)}</div></fieldset>
      <div className="store-price-inputs"><ComerziaInput type="number" label="Precio desde" min="0" step="0.01" value={filters.minPrice} onChange={event => filter('minPrice', event.target.value)} /><ComerziaInput type="number" label="Hasta" min="0" step="0.01" value={filters.maxPrice} onChange={event => filter('maxPrice', event.target.value)} /></div>
      <fieldset className="store-options"><legend>Ordenar</legend><div><StoreButton className="store-choice" aria-pressed={filters.order === 'name'} onClick={() => filter('order', 'name')}>Nombre</StoreButton><StoreButton className="store-choice" aria-pressed={filters.order === 'price-asc'} onClick={() => filter('order', 'price-asc')}>Menor precio</StoreButton><StoreButton className="store-choice" aria-pressed={filters.order === 'price-desc'} onClick={() => filter('order', 'price-desc')}>Mayor precio</StoreButton></div></fieldset>
      <StoreButton className="store-primary" onClick={() => setShowFilters(false)}>Ver productos <Check size={17} /></StoreButton></div></StoreDialog>}
    {product && <ProductDialog key={product} slug={slug} preview={preview} id={product} currency={data.currency} onClose={() => setProduct(null)} onAdd={state.add} />}
    {showCart && <CartDialog slug={slug} preview={preview} currency={data.currency} lines={cart} quantity={state.quantity} onClose={() => setShowCart(false)} />}
    {count > 0 && !showCart && <StoreButton className="store-mobile-cart store-primary" onClick={() => setShowCart(true)}><ShoppingBag size={18} /><span>Ver mi pedido</span><b>{money(cart.reduce((total, item) => total + Math.round(item.unitPrice * 100) * item.quantity, 0) / 100)}</b><ChevronDown size={16} /></StoreButton>}
  </main>;
}
