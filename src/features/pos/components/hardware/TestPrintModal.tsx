import { useState } from 'react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaButton } from '../../../../components/ui/ComerziaButton';
import { BtnCancel, BtnPrint } from '../../../../components/ui/CrudButtons';
import { hardwareService } from '../../services/hardwareService';
import { useToast } from '../../../../context/ToastContext';
import {
  HwDeviceTypeCode,
  HwPrintJobTypeCode,
  type HwDeviceResponse,
  type CreatePrintJobRequest,
} from '../../types/hardware';
import { Printer, Vault } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  device: HwDeviceResponse | null;
  onJobCreated?: () => void;
}

export const TestPrintModal = ({ isOpen, onClose, device, onJobCreated }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Determinar si es impresora de etiquetas o de recibos
  const isBarcodePrinter = Number(device?.deviceType) === HwDeviceTypeCode.BARCODE_PRINTER;

  // Estado para prueba de etiqueta
  const [labelData, setLabelData] = useState({
    title: 'Producto de Prueba',
    barcode: '7751234567890',
    price: '19.90',
  });

  // Estado para prueba de ticket
  const [receiptData, setReceiptData] = useState({
    businessName: 'Comerzia POS - Ticket Demo',
    customer: 'Cliente Mostrador',
    notes: 'Impresión de diagnóstico exitosa.',
  });

  if (!device) return null;

  const handleTestPrint = async () => {
    if (isBarcodePrinter) {
      if (!labelData.title.trim() || !labelData.barcode.trim()) {
        setShakeKey(prev => prev + 1);
        toastError('El título y código de barras son requeridos para la prueba.');
        return;
      }
    } else {
      if (!receiptData.businessName.trim()) {
        setShakeKey(prev => prev + 1);
        toastError('El encabezado del ticket es requerido para la prueba.');
        return;
      }
    }

    setIsLoading(true);
    try {
      let requestData: CreatePrintJobRequest;

      if (isBarcodePrinter) {
        requestData = {
          deviceId: device.id,
          jobType: HwPrintJobTypeCode.LABEL_PRINT,
          payload: {
            width: 50,
            height: 30,
            gap: 2,
            items: [
              {
                name: labelData.title.trim(),
                price: parseFloat(labelData.price) || 0,
                barcode: labelData.barcode.trim(),
                barcodeType: 'CODE128',
                quantity: 1,
              },
            ],
          },
        };
      } else {
        requestData = {
          deviceId: device.id,
          jobType: HwPrintJobTypeCode.RECEIPT_PRINT,
          payload: {
            invoiceNumber: 'TEST-0001',
            customer: receiptData.customer.trim() || 'Cliente Mostrador',
            items: [
              {
                description: receiptData.businessName.trim(),
                qty: 1,
                unitPrice: 10.0,
                total: 10.0,
              },
            ],
            total: 10.0,
            openDrawer: false,
          },
        };
      }

      await hardwareService.createPrintJob(requestData);
      toastSuccess('Trabajo de impresión enviado a la cola');
      onJobCreated?.();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al enviar la prueba de impresión');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDrawerTest = async () => {
    setIsLoading(true);
    try {
      await hardwareService.createPrintJob({
        deviceId: device.id,
        jobType: HwPrintJobTypeCode.OPEN_DRAWER,
        payload: {
          reason: 'Prueba manual de apertura de gaveta',
        },
      });
      toastSuccess('Comando de apertura de gaveta enviado');
      onJobCreated?.();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al enviar comando a la gaveta');
    } finally {
      setIsLoading(false);
    }
  };

  const modalActions = (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 w-full">
      {!isBarcodePrinter ? (
        <ComerziaButton
          type="button"
          variant="ghost"
          label="Probar Gaveta"
          icon={<Vault size={16} />}
          onClick={handleOpenDrawerTest}
          disabled={isLoading}
          responsive={true}
          className="flex-1 sm:flex-none sm:w-auto min-w-0"
        />
      ) : (
        <div />
      )}
      <div className="flex items-center gap-2 flex-1 sm:flex-none justify-end">
        <BtnCancel onClick={onClose} disabled={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        <BtnPrint
          onClick={handleTestPrint}
          isLoading={isLoading}
          responsive={true}
          label="Imprimir Prueba"
          className="flex-1 sm:flex-none sm:w-auto min-w-0"
        />
      </div>
    </div>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary">
          <Printer size={22} className="shrink-0" />
          <span>Prueba de Impresión</span>
        </div>
      }
      actions={modalActions}
      size="sm"
    >
      <div className="space-y-4 pt-1">
        {/* Cabecera de dispositivo */}
        <div className="flex items-center gap-3 p-3 bg-base-200/50 rounded-xl border border-base-200 text-xs text-base-content/70">
          <Printer size={18} className="text-primary shrink-0" />
          <div className="flex flex-col">
            <span className="font-semibold text-base-content">{device.name}</span>
            <span>
              {device.ipAddress ? `IP: ${device.ipAddress}:${device.port || 9100}` : 'Conexión local / USB'}
            </span>
          </div>
        </div>

        {isBarcodePrinter ? (
          /* Formulario para prueba de etiquetas */
          <div className="space-y-3">
            <ComerziaInput
              label="Nombre en Etiqueta"
              value={labelData.title}
              onChange={e => setLabelData(prev => ({ ...prev, title: e.target.value }))}
              isRequired
              error={!labelData.title.trim() ? 'El nombre es requerido' : undefined}
              shakeKey={shakeKey}
            />
            <div className="grid grid-cols-2 gap-2">
              <ComerziaInput
                label="Código de Barras"
                value={labelData.barcode}
                onChange={e => setLabelData(prev => ({ ...prev, barcode: e.target.value }))}
                isRequired
                error={!labelData.barcode.trim() ? 'El código es requerido' : undefined}
                shakeKey={shakeKey}
              />
              <ComerziaInput
                label="Precio"
                value={labelData.price}
                onChange={e => setLabelData(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
          </div>
        ) : (
          /* Formulario para prueba de tickets */
          <div className="space-y-3">
            <ComerziaInput
              label="Encabezado / Negocio"
              value={receiptData.businessName}
              onChange={e => setReceiptData(prev => ({ ...prev, businessName: e.target.value }))}
              isRequired
              error={!receiptData.businessName.trim() ? 'El encabezado es requerido' : undefined}
              shakeKey={shakeKey}
            />
            <ComerziaInput
              label="Cliente"
              value={receiptData.customer}
              onChange={e => setReceiptData(prev => ({ ...prev, customer: e.target.value }))}
            />
          </div>
        )}
      </div>
    </ComerziaModal>
  );
};
