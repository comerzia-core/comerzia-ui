import { useAuthStore } from '../../../stores/useAuthStore';
import { usePermission } from '../../../hooks/usePermission';
import { PERMISSIONS } from '../../../config/permissions';
import { useState } from 'react';
import { PrinterRollCalibrationModal } from '../../pos/components/hardware/PrinterRollCalibrationModal';
import { Barcode } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { BtnCancel, BtnPrint, BtnRefresh, BtnCalibrate } from '../../../components/ui/CrudButtons';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { useProductLabelPrinting } from '../hooks/useProductLabelPrinting';
import type { ProductResponse } from '../types/commercial';

export const ProductLabelPrintDialog = ({ product, onClose }: { product: ProductResponse; onClose: () => void }) => {
  const printing = useProductLabelPrinting(product.id);
  const { can } = usePermission();
  const isOwner = useAuthStore(state => state.userProfile?.roles.includes('OWNER') ?? false);
  const canCalibrate = isOwner && can(PERMISSIONS.HARDWARE.DEVICES_MANAGE);
  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const { options } = useLoadDictionaries([DICTIONARIES.HW_PRINT_JOB_STATUS]);
  const jobStatus = options[DICTIONARIES.HW_PRINT_JOB_STATUS].find(option => Number(option.value) === Number(printing.job?.status))?.label;
  const locked = printing.isSubmitting || printing.job !== null;
  return (
    <><ComerziaModal isOpen onClose={() => { if (isCalibrationOpen) setIsCalibrationOpen(false); else onClose(); }} size="md" compact title={<span className="flex items-center gap-2"><Barcode size={22} className="shrink-0" />Imprimir etiquetas</span>}
      actions={
        <div className="flex flex-row items-center justify-center sm:justify-end gap-2 w-full">
          <BtnCancel
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
            onClick={onClose}
            disabled={printing.isSubmitting}
            label={printing.job ? 'Cerrar' : 'Cancelar'}
          />
          <BtnPrint
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
            onClick={printing.print}
            isLoading={printing.isSubmitting}
            disabled={locked || !printing.preview || printing.isPreviewLoading || !printing.quantityValid || !printing.deviceId || !printing.printerReady || !printing.rollReady}
            label="Imprimir"
          />
        </div>
      }>
      <div className="space-y-3 min-w-0">
        <p className="text-sm font-medium truncate" title={product.name}>{product.name}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <ComerziaSelect label="Variante" options={printing.variantOptions} value={printing.variantId} onChange={event => printing.setVariantId(event.target.value)} isLoading={printing.isLoadingLookups} disabled={locked} />
          <ComerziaSelect label="Tamaño del rollo" options={printing.rollOptions} value={printing.rollSizeId} onChange={event => printing.setRollSizeId(event.target.value)} isLoading={printing.isLoadingLookups} disabled={locked} isRequired shakeKey={printing.shakeKey} />
          {!printing.isLoadingLookups && printing.rollOptions.length === 0 && <p className="text-sm text-warning">Habilita un rollo en Impresoras.</p>}
          <ComerziaSelect label="Impresora" options={printing.printerOptions} value={printing.deviceId} onChange={event => printing.setDeviceId(event.target.value)} isLoading={printing.isLoadingLookups} disabled={locked} isRequired shakeKey={printing.shakeKey} />
        </div>
        {printing.device && <p role="status" className={`text-xs ${printing.device.ready ? 'text-base-content/70' : 'text-warning'}`}>
          {!printing.printerReady ? (printing.device.statusKnown && printing.device.readinessMessage || 'Revisa la conexión de la impresora.') : 'Conexión verificada.'}
          {printing.device.reachable && !printing.device.statusKnown && ' Comprueba papel y tapa.'}
        </p>}
        {printing.rollMessage && <div className="rounded-xl border border-warning/40 p-3 space-y-2">
          <p role="status" className="text-sm text-warning">{printing.rollMessage}</p>
          {printing.device && canCalibrate && <BtnCalibrate label="Calibrar" disabled={locked} onClick={() => setIsCalibrationOpen(true)} />}
        </div>}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1 text-sm">
          <label className="flex items-center gap-2 min-h-11"><ComerziaSwitch checked={printing.includeLogo} onChange={() => printing.setIncludeLogo(!printing.includeLogo)} disabled={locked || !printing.content?.logoAvailable || !printing.printOptions?.logoAllowed} />Logo</label>
          <label className="flex items-center gap-2 min-h-11"><ComerziaSwitch checked={printing.includePrice} onChange={() => printing.setIncludePrice(!printing.includePrice)} disabled={locked || !printing.content?.priceAvailable || !printing.printOptions?.priceAllowed} />Precio</label>
          <label className="flex items-center gap-2 min-h-11"><ComerziaSwitch checked={printing.includeName} onChange={() => printing.setIncludeName(!printing.includeName)} disabled={locked || !printing.printOptions?.nameAllowed} />Nombre del producto</label>
        </div>
        {printing.content && (!printing.content.logoAvailable || !printing.content.priceAvailable) && <p className="text-xs text-base-content/60">
          {[!printing.content.logoAvailable && 'Sin logo cargado', !printing.content.priceAvailable && 'Sin precio vigente'].filter(Boolean).join(' · ')}
        </p>}
        <ComerziaInput label="Cantidad total de etiquetas" type="number" min={printing.columns} max={printing.maximumQuantity} step={printing.columns} value={printing.quantity} onChange={event => printing.setQuantity(event.target.value)} disabled={locked || !printing.preview} isRequired shakeKey={printing.shakeKey} error={printing.quantityError} />
        {printing.preview && <p className="text-xs text-base-content/70">{printing.columns > 1 ? `Múltiplos de ${printing.columns}` : 'Etiquetas individuales'}{printing.rowCount !== null && ` · ${printing.rowCount} ${printing.rowCount === 1 ? 'fila' : 'filas'}`}</p>}
        <div className="rounded-2xl border border-base-200 bg-base-200/40 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold text-sm">Vista previa</span><BtnRefresh className="min-h-11" label="Actualizar" onClick={printing.refreshPreview} disabled={locked} isLoading={printing.isPreviewLoading} /></div>
          {printing.isPreviewLoading ? <div className="text-center py-8"><span className="loading loading-spinner text-primary" /></div> : printing.preview ? <>
            <img src={printing.preview.imageDataUrl} alt={`Etiqueta: ${printing.preview.displayName || printing.content?.barcode}`} className="mx-auto bg-white border border-base-300 max-w-full" style={{ maxHeight: 320, imageRendering: 'pixelated' }} />
            {printing.printOptions && <p className="text-xs text-center text-base-content/60">{printing.printOptions.codeFormatLabel}{printing.printOptions.numbersVisible === false && ' · Sin números'}</p>}
          </> : <p className="text-sm text-base-content/60 text-center py-6">Selecciona una variante y un rollo.</p>}
        </div>
        {printing.printOptions?.codeFormat === 'QR_CODE' && printing.printOptions.codeModuleDots <= 3 && <p className="text-xs text-warning">Prueba la lectura antes de imprimir un lote.</p>}
        {printing.error && <p role="alert" className="text-sm text-error">{printing.error}</p>}
        {printing.job && <div role="status" className="alert text-sm flex flex-col items-start gap-1">
          <span>Impresión: {jobStatus || 'Consultando estado…'}</span>
          {printing.job.errorMessage && <span className="text-error">{printing.job.errorMessage}</span>}
          <span className="text-xs text-base-content/70">Revisa las etiquetas en la impresora.</span>
        </div>}
      </div>
    </ComerziaModal>
    {isCalibrationOpen && printing.device && <PrinterRollCalibrationModal key={printing.device.id} deviceId={printing.device.id} initialRollSizeId={printing.rollSizeId}
      onUpdated={printing.updateDevice} onClose={() => { setIsCalibrationOpen(false); void printing.reloadDevice(); }} />}
    </>
  );
};
