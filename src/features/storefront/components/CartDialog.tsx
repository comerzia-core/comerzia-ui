import { useState } from 'react';
import { ArrowLeft, ArrowRight, Copy, MessageCircle, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { StoreButton } from '../../../components/ui/StoreButton';
import { StoreDialog } from './StoreDialog';
import { StoreImage } from './StoreImage';
import { catalogService, catalogError } from '../services/catalogService';
import type { CartLine, Checkout } from '../types';

export function CartDialog({ slug, preview, currency, lines, quantity, onClose }: { slug: string; preview: boolean; currency: string; lines: CartLine[];
  quantity: (variant: string, type: string, value: number) => void; onClose: () => void }) {
  const [checkout, setCheckout] = useState<Checkout | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const money = (value: number) => new Intl.NumberFormat('es-BO', { style: 'currency', currency }).format(value);
  const estimated = lines.reduce((total, item) => total + Math.round(item.unitPrice * 100) * item.quantity, 0) / 100;
  const review = async () => {
    if (preview) { setError('La previsualización no envía pedidos.'); return; }
    setBusy(true); setError('');
    try { setCheckout(await catalogService.checkout(slug, lines)); }
    catch (failure: unknown) { setError(catalogError(failure)); }
    finally { setBusy(false); }
  };
  const message = checkout?.message || '';
  const longMessage = message.length > 4500;
  const whatsapp = checkout ? 'https://wa.me/' + checkout.whatsapp + (longMessage ? '' : '?text=' + encodeURIComponent(message)) : '';
  return <StoreDialog title={checkout ? 'Finaliza con la tienda' : 'Tu pedido'} onClose={onClose}>
    {!lines.length ? <div className="store-empty"><ShoppingBag size={36} strokeWidth={1} /><h3>Elige algo que te guste.</h3><StoreButton onClick={onClose}>Seguir explorando <ArrowRight size={16} /></StoreButton></div> : checkout ? <div className="store-checkout">
      <StoreButton className="store-back" onClick={() => setCheckout(null)}><ArrowLeft size={15} />Volver al pedido</StoreButton>
      <div className="store-checkout-total"><span>Total estimado</span><strong>{money(checkout.total)}</strong></div>
      {checkout.items.map(item => <div className="store-checkout-line" key={item.variantId + item.priceTypeId}><span>{item.quantity} × {item.name}<small>{item.presentation}</small></span><b>{money(item.total)}</b></div>)}
      {checkout.paymentQrUrl && <div className="store-payment-qr"><StoreImage url={checkout.paymentQrUrl} alt="QR de pago de la tienda" preset="full" /><span>QR de la tienda</span></div>}
      <p className="store-checkout-note">Confirma disponibilidad y pago por WhatsApp.</p>
      {longMessage && <p className="store-checkout-note">Copia el resumen y pégalo en el chat.</p>}
      <a className="store-button store-primary" href={whatsapp} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} />{longMessage ? 'Abrir WhatsApp' : 'Enviar pedido por WhatsApp'}</a>
      <StoreButton onClick={() => { if (!navigator.clipboard) { setError('Tu navegador no permite copiar aquí.'); return; } void navigator.clipboard.writeText(message).then(() => setCopied(true)).catch(() => setError('No se pudo copiar el resumen.')); }}><Copy size={16} />{copied ? 'Resumen copiado' : 'Copiar resumen'}</StoreButton>
    </div> : <div className="store-cart-content"><div className="store-cart-lines">{lines.map(line => <div className="store-cart-line" key={line.variantId + line.priceTypeId}>
      <StoreImage url={line.imageUrl} alt={line.name} preset="thumbnail" /><div className="store-cart-line-info"><h3>{line.name}</h3><p>{line.presentation}</p><strong>{money(line.unitPrice)}</strong>
        <div className="store-cart-controls"><div className="store-stepper"><StoreButton className="store-icon" aria-label={'Quitar una unidad de ' + line.name} onClick={() => quantity(line.variantId, line.priceTypeId, line.quantity - 1)}><Minus size={14} /></StoreButton><output>{line.quantity}</output><StoreButton className="store-icon" aria-label={'Agregar una unidad de ' + line.name} disabled={line.quantity >= 999} onClick={() => quantity(line.variantId, line.priceTypeId, line.quantity + 1)}><Plus size={14} /></StoreButton></div>
          <StoreButton className="store-icon" aria-label={'Eliminar ' + line.name} onClick={() => quantity(line.variantId, line.priceTypeId, 0)}><Trash2 size={16} /></StoreButton></div></div></div>)}</div>
      <div className="store-cart-summary"><span>Total estimado<strong>{money(estimated)}</strong></span><StoreButton className="store-primary" disabled={busy} onClick={() => { void review(); }}>{busy ? 'Revisando…' : 'Continuar'}<ArrowRight size={17} /></StoreButton></div></div>}
    {error && <p className="store-alert" role="alert">{error}</p>}
  </StoreDialog>;
}
