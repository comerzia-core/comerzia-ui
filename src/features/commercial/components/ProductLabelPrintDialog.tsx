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
    <><ComerziaModal isOpen onClose={() => { if (isCalibrationOpen) setIsCalibrationOpen(false); else onClose(); }} size="md" title={<span className="flex items-center gap-2"><Barcode size={22} />Imprimir etiquetas · {product.name}</span>}
      actions={<div className="flex gap-2 justify-end w-full">
        <BtnCancel onClick={onClose} disabled={printing.isSubmitting} label={printing.job ? 'Cerrar' : 'Cancelar'} />
        <BtnPrint onClick={printing.print} isLoading={printing.isSubmitting} disabled={locked || !printing.preview || printing.isPreviewLoading || !printing.quantityValid || !printing.deviceId || !printing.printerReady || !printing.rollReady} label="Imprimir etiquetas" />
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
        {printing.rollMessage && <div className="rounded-xl border border-warning/40 p-3 space-y-2">
          <p role="status" className="text-sm text-warning">{printing.rollMessage}</p>
          {printing.device && canCalibrate && <BtnCalibrate label="Cambiar rollo / Calibrar" disabled={locked} onClick={() => setIsCalibrationOpen(true)} />}
        </div>}
        <div className="flex flex-wrap gap-5 text-sm">
          <label className="flex items-center gap-2"><ComerziaSwitch checked={printing.includeLogo} onChange={() => printing.setIncludeLogo(!printing.includeLogo)} disabled={locked || !printing.content?.logoAvailable || !printing.printOptions?.logoAllowed} />Logo</label>
          <label className="flex items-center gap-2"><ComerziaSwitch checked={printing.includePrice} onChange={() => printing.setIncludePrice(!printing.includePrice)} disabled={locked || !printing.content?.priceAvailable || !printing.printOptions?.priceAllowed} />Precio</label>
          <label className="flex items-center gap-2"><ComerziaSwitch checked={printing.includeName} onChange={() => printing.setIncludeName(!printing.includeName)} disabled={locked || !printing.printOptions?.nameAllowed} />Nombre del producto</label>
        </div>
        {printing.printOptions && <p className="text-xs text-base-content/70">Formato: {printing.printOptions.codeFormatLabel}.{printing.printOptions.message && ` ${printing.printOptions.message}`}</p>}
        {printing.content?.priceMessage && <p className="text-xs text-warning">{printing.content.priceMessage}</p>}
        {printing.content && !printing.content.logoAvailable && <p className="text-xs text-base-content/60">Cargue el logo de tickets en la configuración de su empresa para incluirlo.</p>}
        <ComerziaInput label="Cantidad total de etiquetas" type="number" min={printing.columns} max={printing.maximumQuantity} step={printing.columns} value={printing.quantity} onChange={event => printing.setQuantity(event.target.value)} disabled={locked || !printing.preview} isRequired shakeKey={printing.shakeKey} error={printing.quantityError} />
        {printing.preview && <p className="text-xs text-base-content/70">{printing.columns} etiquetas por fila. Cantidades permitidas: {printing.columns}, {printing.columns * 2}, {printing.columns * 3}…{printing.rowCount !== null && ` Se imprimirán ${printing.rowCount} filas (${printing.quantity} etiquetas).`}</p>}
        <div className="rounded-2xl border border-base-200 bg-base-200/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2"><span className="font-semibold text-sm">Previsualización de impresión</span><BtnRefresh label="Actualizar" onClick={printing.refreshPreview} disabled={locked} isLoading={printing.isPreviewLoading} /></div>
          {printing.isPreviewLoading ? <div className="text-center py-8"><span className="loading loading-spinner text-primary" /></div> : printing.preview ? <>
            <img src={printing.preview.imageDataUrl} alt={`Etiqueta: ${printing.preview.displayName || printing.content?.barcode}`} className="mx-auto bg-white border border-base-300 max-w-full" style={{ maxHeight: 320, imageRendering: 'pixelated' }} />
            <p className="text-xs text-center text-base-content/70">Cada etiqueta: {printing.preview.widthMm} × {printing.preview.heightMm} mm · {printing.preview.columns} columnas · Ancho total {printing.preview.totalWidthMm} mm · GAP filas {printing.preview.gapMm} mm · Separación columnas {printing.preview.columnGapMm} mm{printing.preview.rotation === 90 ? ' · Giro automático 90° por etiqueta' : ''}</p>
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
    {isCalibrationOpen && printing.device && <PrinterRollCalibrationModal key={printing.device.id} deviceId={printing.device.id} initialRollSizeId={printing.rollSizeId}
      onUpdated={printing.updateDevice} onClose={() => { setIsCalibrationOpen(false); void printing.reloadDevice(); }} />}
    </>
  );
};
