import { Ruler } from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../../components/ui/ComerziaSwitch';
import { BtnCalibrate, BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { formatDateForUser } from '../../../../utils/date';
import { usePrinterRollCalibration } from '../../hooks/usePrinterRollCalibration';
import { HwPrintJobStatusCode, type HwDeviceResponse } from '../../types/hardware';

export const PrinterRollCalibrationModal = ({ deviceId, onClose, onUpdated, initialRollSizeId }: {
  deviceId: string; initialRollSizeId?: string; onClose: () => void; onUpdated?: (device: HwDeviceResponse) => void;
}) => {
  const calibration = usePrinterRollCalibration(deviceId, initialRollSizeId);
  const { device, roll } = calibration;
  return <ComerziaModal isOpen onClose={onClose} size="md" title={<><Ruler size={21} />Cambiar rollo / Calibrar</>}
    actions={
      <div className="flex flex-row items-center justify-center sm:justify-end gap-2 w-full">
        <BtnCancel label="Cerrar" onClick={onClose} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        {calibration.canConfirm ? (
          <BtnSave
            label="Confirmar"
            disabled={!calibration.feedAligned || calibration.isSubmitting}
            isLoading={calibration.isSubmitting}
            onClick={() => { void calibration.confirm().then(next => { if (next) onUpdated?.(next); }); }}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
        ) : (
          <BtnCalibrate
            label="Calibrar"
            isLoading={calibration.isSubmitting}
            disabled={calibration.pending || calibration.isSubmitting || !calibration.printerReady || !roll || roll.gapMm === 0}
            onClick={() => { void calibration.calibrate().then(next => { if (next) onUpdated?.(next); }); }}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
        )}
      </div>
    }>
    <div className="space-y-4">
      <p className="font-semibold">{device?.name || 'Consultando impresora…'}</p>
      <p className="text-sm text-base-content/70">Espera a que la impresora termine sus trabajos, coloca el rollo y ajusta las guías antes de calibrar. La impresora avanzará papel para medirlo, sin imprimir. Hazlo al cambiar de formato; después imprime normalmente.</p>
      {device?.loadedRollName && <div className="rounded-xl border border-base-200 p-3 text-sm space-y-1">
        <p>Rollo registrado: <strong>{device.loadedRollName}</strong></p>
        {device.lastCalibratedAt && <p className="text-xs text-base-content/70">Última calibración: {formatDateForUser(device.lastCalibratedAt)}</p>}
        {device.rollVerifiedAt && <p className="text-success">Avance confirmado. Puedes imprimir con este rollo.</p>}
      </div>}
      <ComerziaSelect label="Rollo instalado" options={calibration.rollOptions} value={calibration.rollSizeId}
        onChange={event => calibration.setRollSizeId(event.target.value)} isLoading={calibration.isLoadingRolls}
        disabled={calibration.pending || calibration.isSubmitting} isRequired shakeKey={calibration.shakeKey} />
      {roll && <p className="text-xs text-base-content/70">{roll.widthMm} × {roll.heightMm} mm por etiqueta · {roll.columns} columnas · GAP filas {roll.gapMm} mm · Separación columnas {roll.columnGapMm} mm</p>}
      {roll?.gapMm === 0 && <p className="text-sm text-warning">Este procedimiento requiere GAP entre filas; no corresponde a papel continuo.</p>}
      {!calibration.isLoadingRolls && calibration.rollOptions.length === 0 && <p className="text-sm text-warning">Habilita un tamaño en Impresoras → Tamaños de rollos.</p>}
      {device && !device.calibrationSupported && <p className="text-sm text-warning">Actualiza Comerzia Print Agent a la versión 1.3.0 o posterior y espera a que actualice el estado de la impresora.</p>}
      {device?.calibrationSupported && !calibration.printerReady && <p className="text-sm text-warning">La impresora o el agente no están disponibles. Revisa la conexión, papel y tapa.</p>}
      {calibration.jobStatusLabel && !calibration.pending && <p role="status" className="text-sm">Calibración: {calibration.jobStatusLabel}</p>}
      {calibration.pending && <p className="text-sm text-base-content/70">Calibración pendiente o en curso. Espera a que termine antes de retirar el rollo. Puedes cerrar esta ventana y consultar el resultado después.</p>}
      {calibration.canConfirm && <div className="rounded-xl border border-warning/40 p-4 space-y-3">
        <p className="text-sm">Pulsa FEED una sola vez. Debe avanzar una fila completa y detenerse alineada. Si avanza varias filas o queda dentro de una etiqueta, revisa el rollo y el sensor antes de volver a calibrar.</p>
        <label className="flex items-center gap-3 text-sm"><ComerziaSwitch checked={calibration.feedAligned}
          onChange={() => calibration.setFeedAligned(!calibration.feedAligned)} disabled={calibration.isSubmitting} />FEED avanza una fila y queda alineada</label>
        <BtnCalibrate label="Volver a calibrar" disabled={calibration.isSubmitting || !calibration.printerReady}
          onClick={() => { void calibration.calibrate().then(next => { if (next) onUpdated?.(next); }); }} />
      </div>}
      {calibration.job?.errorMessage && <p role="alert" className="text-sm text-error">{calibration.job.errorMessage}</p>}
      {calibration.error && <p role="alert" className="text-sm text-error">{calibration.error}</p>}
      {[HwPrintJobStatusCode.PENDING, HwPrintJobStatusCode.SENT].some(status => status === Number(device?.calibrationStatus)) && (
        <div className="flex flex-wrap gap-2">
          <BtnCancel label="Cancelar calibración" onClick={() => { void calibration.cancel(); }} disabled={calibration.isSubmitting} />
        </div>
      )}
    </div>
  </ComerziaModal>;
};
