import { Barcode } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { BtnCancel, BtnPrint, BtnRefresh } from '../../../components/ui/CrudButtons';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { useProductLabelPrinting } from '../hooks/useProductLabelPrinting';
import type { ProductResponse } from '../types/commercial';

export const ProductLabelPrintDialog = ({ product, onClose }: { product: ProductResponse; onClose: () => void }) => {
  const printing = useProductLabelPrinting(product.id);
  const { options } = useLoadDictionaries([DICTIONARIES.HW_PRINT_JOB_STATUS]);
  const jobStatus = options[DICTIONARIES.HW_PRINT_JOB_STATUS].find(option => Number(option.value) === Number(printing.job?.status))?.label;
  const locked = printing.isSubmitting || printing.job !== null;
  return (
    <ComerziaModal isOpen onClose={onClose} size="md" title={<span className="flex items-center gap-2"><Barcode size={22} />Imprimir etiquetas · {product.name}</span>}
      actions={<div className="flex gap-2 justify-end w-full">
        <BtnCancel onClick={onClose} disabled={printing.isSubmitting} label={printing.job ? 'Cerrar' : 'Cancelar'} />
        <BtnPrint onClick={printing.print} isLoading={printing.isSubmitting} disabled={locked || !printing.preview || printing.isPreviewLoading || !printing.quantityValid || !printing.deviceId || !printing.printerReady} label="Imprimir etiquetas" />
      </div>}>
      <div className="space-y-4">
        <ComerziaSelect label="Variante" options={printing.variantOptions} value={printing.variantId} onChange={event => printing.setVariantId(event.target.value)} isLoading={printing.isLoadingLookups} disabled={locked} />
        <ComerziaSelect label="Tamaño del rollo" options={printing.rollOptions} value={printing.rollSizeId} onChange={event => printing.setRollSizeId(event.target.value)} isLoading={printing.isLoadingLookups} disabled={locked} isRequired shakeKey={printing.shakeKey} />
        {!printing.isLoadingLookups && printing.rollOptions.length === 0 && <p className="text-sm text-warning">Habilite un tamaño de rollo en Impresoras → Tamaños de rollos.</p>}
        <ComerziaSelect label="Impresora" options={printing.printerOptions} value={printing.deviceId} onChange={event => printing.setDeviceId(event.target.value)} isLoading={printing.isLoadingLookups} disabled={locked} isRequired shakeKey={printing.shakeKey} />
        {printing.device && <p role="status" className={`text-xs ${printing.device.ready ? 'text-base-content/70' : 'text-warning'}`}>
          {!printing.printerReady ? 'La impresora no está lista o el agente debe actualizar su estado.' : printing.device.readinessMessage || 'El agente aún no verificó la conexión de esta impresora.'}
          {printing.device.reachable && !printing.device.statusKnown && ' Revise que tenga papel y la tapa esté cerrada antes de imprimir.'}
        </p>}
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2"><ComerziaSwitch checked={printing.includeLogo} onChange={() => printing.setIncludeLogo(!printing.includeLogo)} disabled={locked || !printing.content?.logoAvailable} />Logo</label>
          <label className="flex items-center gap-2"><ComerziaSwitch checked={printing.includePrice} onChange={() => printing.setIncludePrice(!printing.includePrice)} disabled={locked || !printing.content?.priceAvailable} />Precio</label>
          <label className="flex items-center gap-2"><ComerziaSwitch checked={printing.includeName} onChange={() => printing.setIncludeName(!printing.includeName)} disabled={locked} />Nombre del producto</label>
        </div>
        {printing.content?.priceMessage && <p className="text-xs text-warning">{printing.content.priceMessage}</p>}
        {printing.content && !printing.content.logoAvailable && <p className="text-xs text-base-content/60">Cargue el logo de tickets en la configuración de su empresa para incluirlo.</p>}
        <ComerziaInput label="Cantidad de etiquetas" type="number" min={1} max={1000} step={1} value={printing.quantity} onChange={event => printing.setQuantity(event.target.value)} disabled={locked} isRequired shakeKey={printing.shakeKey} error={printing.quantityValid ? undefined : 'Ingrese un número entero entre 1 y 1000.'} />
        <div className="rounded-2xl border border-base-200 bg-base-200/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold text-sm">Previsualización de impresión</span><BtnRefresh label="Actualizar" onClick={printing.refreshPreview} disabled={locked} isLoading={printing.isPreviewLoading} /></div>
          {printing.isPreviewLoading ? <div className="text-center py-8"><span className="loading loading-spinner text-primary" /></div> : printing.preview ? <>
            <img src={printing.preview.imageDataUrl} alt={`Etiqueta: ${printing.preview.displayName || printing.content?.barcode}`} className="mx-auto bg-white border border-base-300 max-w-full" style={{ maxHeight: 320, imageRendering: 'pixelated' }} />
            <p className="text-xs text-center text-base-content/70">{printing.preview.widthMm} × {printing.preview.heightMm} mm · GAP {printing.preview.gapMm} mm{printing.preview.rotation === 90 ? ' · Giro automático 90°' : ''}</p>
          </> : <p className="text-sm text-base-content/60 text-center py-6">Seleccione una variante y un rollo para revisar la etiqueta.</p>}
        </div>
        {printing.error && <p role="alert" className="text-sm text-error">{printing.error}</p>}
        {printing.job && <div role="status" className="alert text-sm flex flex-col items-start gap-1">
          <span>Trabajo de impresión: {jobStatus || 'Consultando estado…'}</span>
          {printing.job.errorMessage && <span className="text-error">{printing.job.errorMessage}</span>}
          <span className="text-xs text-base-content/70">El estado completado confirma que el agente transmitió la etiqueta. Revise la salida en la impresora.</span>
        </div>}
      </div>
    </ComerziaModal>
  );
};
