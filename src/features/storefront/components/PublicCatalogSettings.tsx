import { lazy, Suspense, useState } from 'react';
import { Check, ExternalLink, Eye, Globe } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BtnSave, BtnDetails } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useCatalogAdministration } from '../hooks/useCatalogAdministration';

const StorefrontPreview = lazy(() => import('../pages/StorefrontPage').then(module => ({ default: module.StorefrontPage })));

export function PublicCatalogSettings() {
  const canRead = useAuthStore(state => state.hasPermission('ORG_PUBLIC_CATALOG_READ'));
  return canRead ? <CatalogEditor /> : null;
}
function CatalogEditor() {
  const state = useCatalogAdministration();
  const { data, draft, busy } = state;
  const countries = useLoadDictionaries([DICTIONARIES.CATALOG_PHONE_COUNTRY]);
  const canManage = useAuthStore(store => store.hasPermission('ORG_PUBLIC_CATALOG_MANAGE'));
  const canPublish = useAuthStore(store => store.hasPermission('ORG_PUBLIC_CATALOG_PUBLISH'));
  const [preview, setPreview] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!data || !draft) return <section className="card bg-base-100 p-5 border border-base-200 rounded-2xl"><p role="status">{state.error || 'Cargando catálogo público…'}</p></section>;
  const changed = JSON.stringify(draft) !== JSON.stringify(data.draft);
  return <section className="card bg-base-100 p-5 sm:p-7 border border-base-200 rounded-2xl space-y-5" aria-label="Catálogo público">
    <header className="flex flex-wrap justify-between items-center gap-3"><div><h2 className="font-bold flex items-center gap-2"><Globe size={19} />Catálogo público</h2><p className="text-xs text-base-content/60 mt-1">{!data.eligible ? 'Disponible con una suscripción activa de pago o Perpetuo.' : data.published ? 'Publicado. Los cambios de diseño se guardan como borrador.' : 'Tu catálogo permanece privado hasta publicarlo.'}</p></div>{data.publicUrl && data.published && data.eligible && <a href={data.publicUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm gap-2"><ExternalLink size={15} />Abrir catálogo</a>}</header>
    <div className="grid sm:grid-cols-3 gap-3">{data.templates.map(template => <ComerziaButton key={template.code} variant={draft.template === template.code ? 'primary' : 'ghost'} className="!h-auto !min-h-24 !rounded-2xl !justify-start !text-left !whitespace-normal" disabled={!canManage || busy} aria-pressed={draft.template === template.code} onClick={() => state.change('template', template.code)}
      label={template.label + ' · ' + template.description} icon={draft.template === template.code ? <Check size={17} /> : <Eye size={17} />} />)}</div>
    <div className="grid sm:grid-cols-2 gap-4"><ComerziaInput label="Nombre público" maxLength={150} value={draft.title} onChange={event => state.change('title', event.target.value)} disabled={!canManage || busy} isRequired shakeKey={state.shakeKey} />
      <ComerziaInput label="Dirección del catálogo" maxLength={60} value={draft.slug} onChange={event => state.change('slug', event.target.value)} helperText="Ejemplo: mi-tienda" disabled={!canManage || busy} isRequired shakeKey={state.shakeKey} />
      <ComerziaInput label="Descripción breve" maxLength={500} value={draft.description} onChange={event => state.change('description', event.target.value)} disabled={!canManage || busy} />
      <ComerziaSelect label="País de WhatsApp" options={countries.options[DICTIONARIES.CATALOG_PHONE_COUNTRY] || []} value={draft.whatsappCountry || ''} onChange={event => state.change('whatsappCountry', event.target.value)} disabled={!canManage || busy} isLoading={countries.isLoading} isRequired shakeKey={state.shakeKey} />
      <ComerziaInput label="WhatsApp comercial" inputMode="tel" maxLength={14} placeholder="Número de contacto" value={draft.whatsapp || ''} onChange={event => state.change('whatsapp', event.target.value.replace(/[^0-9]/g, ''))} helperText="Solo el número local; el prefijo se agrega automáticamente." disabled={!canManage || busy} isRequired shakeKey={state.shakeKey} /></div>
    <div className="flex flex-wrap gap-6"><label className="flex items-center gap-3 text-sm"><ComerziaSwitch checked={draft.showPaymentQr} disabled={!canManage || busy} onChange={() => state.change('showPaymentQr', !draft.showPaymentQr)} />Mostrar QR de pago de mi empresa</label></div>
    <div className="flex flex-wrap gap-2">{canManage && <BtnSave label="Guardar borrador" onClick={() => { void state.save(); }} isLoading={busy} />}
      <BtnDetails label="Previsualizar" disabled={busy || changed || data.draft.revision === 0} onClick={() => setPreview(true)} />
      {canPublish && <ComerziaButton variant="primary" label={data.published ? 'Publicar cambios' : 'Publicar catálogo'} disabled={!data.eligible || changed || busy || data.draft.revision === 0} onClick={() => setConfirm(true)} />}
      {canPublish && data.published && <ComerziaButton variant="ghost" label="Despublicar" disabled={busy} onClick={() => { void state.publish(false); }} />}</div>
    {(state.error || state.notice) && <p className={'text-sm ' + (state.error ? 'text-error' : 'text-success')} role={state.error ? 'alert' : 'status'}>{state.error || state.notice}</p>}
    <ComerziaModal isOpen={preview} onClose={() => setPreview(false)} title="Previsualización privada" size="xl" compact variant="view"><Suspense fallback={<p className="p-8">Preparando vista…</p>}><StorefrontPreview preview /></Suspense></ComerziaModal>
    <ComerziaModal isOpen={confirm} onClose={() => setConfirm(false)} title="Publicar catálogo" size="sm" actions={<ComerziaButton variant="primary" label="Confirmar publicación" onClick={() => { setConfirm(false); void state.publish(true); }} />}><p className="text-sm">Los productos seleccionados, sus precios de venta y tu WhatsApp comercial serán públicos.</p></ComerziaModal>
  </section>;
}
