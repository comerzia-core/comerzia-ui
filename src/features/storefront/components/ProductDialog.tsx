import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, Minus, Plus } from 'lucide-react';
import { StoreButton } from '../../../components/ui/StoreButton';
import { StoreDialog } from './StoreDialog';
import { StoreImage } from './StoreImage';
import { catalogService, catalogError } from '../services/catalogService';
import type { SalePrice, Variant } from '../types';

export function ProductDialog({ slug, preview, id, currency, onClose, onAdd }: { slug: string; preview: boolean; id: string; currency: string;
  onClose: () => void; onAdd: (name: string, variant: Variant, price: SalePrice, quantity: number) => boolean }) {
  const [variantPage, setVariantPage] = useState(0);
  const { data, error, isPending } = useQuery({ queryKey: ['store-product', preview ? 'preview' : slug, id, variantPage], queryFn: ({ signal }) => catalogService.product(slug, preview, id, signal, variantPage), retry: false, staleTime: 0 });
  const [variantId, setVariantId] = useState('');
  const [priceId, setPriceId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [notice, setNotice] = useState('');
  const variant = data?.variants.find(item => item.id === variantId) || data?.variants[0];
  const price = variant?.prices.find(item => item.id === priceId) || variant?.prices[0];
  const money = (value: number) => new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(value);
  return <StoreDialog title="Detalle del producto" onClose={onClose} wide>
    {isPending ? <div className="store-state" role="status">Cargando producto…</div> : error || !data ? <p className="store-state" role="alert">{catalogError(error)}</p> : <div className="store-product-detail">
      <div className="store-detail-image"><StoreImage url={variant?.imageUrl || null} alt={data.name} preset="productDetail" sizes="(max-width: 700px) 90vw, 480px" eager /></div>
      <div className="store-detail-info"><p className="store-eyebrow">{data.brand}</p><h3>{data.name}</h3>{data.description && <p className="store-description">{data.description}</p>}
        {data.variants.length > 1 && <fieldset className="store-options"><legend>{data.variantTypeName}</legend><div>{data.variants.map(item => <StoreButton key={item.id} aria-pressed={variant?.id === item.id} className="store-choice" onClick={() => { setVariantId(item.id); setPriceId(''); setNotice(''); }}>{item.name}</StoreButton>)}</div></fieldset>}
        {data.variantPages > 1 && <nav className="store-pagination" aria-label="Páginas de variantes"><StoreButton aria-label="Variantes anteriores" disabled={variantPage === 0} onClick={() => { setVariantPage(variantPage - 1); setVariantId(''); setPriceId(''); }}><ArrowLeft size={16} /></StoreButton><span>{variantPage + 1} / {data.variantPages}</span><StoreButton aria-label="Más variantes" disabled={variantPage + 1 >= data.variantPages} onClick={() => { setVariantPage(variantPage + 1); setVariantId(''); setPriceId(''); }}><ArrowRight size={16} /></StoreButton></nav>}
        {variant && <><p className="store-variant-name">{data.variantTypeName} · {variant.name}</p>{variant.description && <p className="store-description">{variant.description}</p>}
          {variant.prices.length > 1 && <fieldset className="store-options"><legend>Presentación</legend><div>{variant.prices.map(item => <StoreButton key={item.id} aria-pressed={price?.id === item.id} className="store-choice" onClick={() => { setPriceId(item.id); setNotice(''); }}>{item.name}{item.equivalenceFactor > 1 && <small> × {item.equivalenceFactor} u.</small>}</StoreButton>)}</div></fieldset>}
        </>}
        {price && <><p className="store-detail-price">{money(price.salePrice)}<small>{price.name}</small></p>
          <div className="store-add-row"><div className="store-stepper"><StoreButton className="store-icon" aria-label="Disminuir cantidad" disabled={quantity <= 1} onClick={() => setQuantity(quantity - 1)}><Minus size={16} /></StoreButton><output aria-label="Cantidad">{quantity}</output><StoreButton className="store-icon" aria-label="Aumentar cantidad" disabled={quantity >= 999} onClick={() => setQuantity(quantity + 1)}><Plus size={16} /></StoreButton></div>
            <StoreButton className="store-primary" onClick={() => { if (variant) setNotice(onAdd(data.name, variant, price, quantity) ? 'Agregado a tu pedido' : 'Tu pedido alcanzó el máximo de productos'); }}>Agregar <ArrowRight size={17} /></StoreButton></div></>}
        {notice && <p className="store-inline-notice" role="status"><Check size={15} />{notice}</p>}
      </div>
    </div>}
  </StoreDialog>;
}
