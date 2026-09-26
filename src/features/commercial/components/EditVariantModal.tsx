import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { ComerziaSingleImageUploader, type SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import { BarcodeScannerModal } from '../../../components/ui/BarcodeScannerModal';
import { BtnCancel, BtnSave, BtnScanIcon } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import { uploadFile } from '../../shared/services/storageService';
import { STORAGE_FOLDERS } from '../../../config/storage';
import type { ProductVariantResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { generateSku } from '../../../utils/skuGenerator';
import { getCatalogErrorMessage } from '../utils/catalogErrorMessages';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productId: string;
  productName: string;
  variant: ProductVariantResponse | null;
}

export const EditVariantModal = ({ isOpen, onClose, onSuccess, productId, productName, variant }: Props) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [sku, setSku] = useState('');
  const [barCode, setBarCode] = useState('');
  const [isInternalBarcode, setIsInternalBarcode] = useState(false);
  const [selectedImage, setSelectedImage] = useState<SingleImageValue | null>(null);
  const [status, setStatus] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [barcodeError, setBarcodeError] = useState('');
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      setShakeKey(0);
      setBarcodeError('');
      if (variant) {
        setName(variant.name);
        setDescription(variant.description || '');
        setSku(variant.sku);
        setBarCode(variant.barCode || '');
        setIsInternalBarcode(variant.isInternalBarcode || false);
        setSelectedImage(variant.imageUrl ? { preview: variant.imageUrl } : null);
        setStatus(variant.status);
      } else {
        setName('');
        setDescription('');
        setSku('');
        setBarCode('');
        setIsInternalBarcode(false);
        setSelectedImage(null);
        setStatus(true);
      }
    } else {
      setShakeKey(0);
      setBarcodeError('');
    }
  }, [isOpen, variant]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setShakeKey(prev => prev + 1);
      toastError("Ingresa el nombre o atributo de la variante.");
      return;
    }
    if (!isInternalBarcode && !barCode.trim()) {
      setShakeKey(prev => prev + 1);
      toastError("Ingresa el código de barras.");
      return;
    }
    if (!sku.trim()) {
      setShakeKey(prev => prev + 1);
      toastError("Ingresa el SKU de la variante.");
      return;
    }

    setIsSubmitting(true);
    try {
      let finalSku = sku.trim();

      // Verificar barcode y resolver conflictos de SKU al crear una nueva variante
      if (!variant) {
        if (!isInternalBarcode) {
          const checkBarcode = await commercialService.checkBarcode(barCode.trim());
          if (!checkBarcode.available) {
            const rawMsg = checkBarcode.message || '';
            const isAlreadyRegistered = rawMsg.toLowerCase().includes('registrado') || rawMsg.toLowerCase().includes('existe');
            setBarcodeError(isAlreadyRegistered ? "Código ya registrado" : (rawMsg || "Código no disponible"));
            toastError(rawMsg || "Código ya registrado");
            setShakeKey(prev => prev + 1);
            setIsSubmitting(false);
            return;
          }
        }

        let isSkuAvailable = false;
        let counter = 1;
        const maxAttempts = 100;
        
        while (!isSkuAvailable && counter < maxAttempts) {
          const checkSku = await commercialService.checkSku(finalSku);
          if (checkSku.available) {
            isSkuAvailable = true;
          } else {
            finalSku = `${sku.trim()}-${counter}`;
            counter++;
          }
        }
        setSku(finalSku);
      }

      let finalImageUrl: string | undefined = undefined;

      if (selectedImage) {
        if (selectedImage.file) {
          try {
            const cleanProd = (productName || 'prod').substring(0, 20);
            const cleanVar = (name || 'var').substring(0, 20);
            finalImageUrl = await uploadFile(
              selectedImage.file,
              STORAGE_FOLDERS.PRODUCTS,
              `${cleanProd}-${cleanVar}-${Date.now()}`
            );
          } catch (uploadErr) {
            console.error("Error al subir imagen:", uploadErr);
            throw new Error("No se pudo subir la imagen de la variante.");
          }
        } else if (selectedImage.preview) {
          finalImageUrl = selectedImage.preview;
        }
      }

      const payload = {
        name: name.trim(),
        description: description?.trim() || undefined,
        sku: finalSku,
        barCode: isInternalBarcode ? '' : barCode.trim(),
        isInternalBarcode,
        imageUrl: finalImageUrl || undefined,
        productId,
        status
      };

      if (variant) {
        await commercialService.updateProductVariant(variant.id, payload);
        toastSuccess("Variante actualizada exitosamente.");
      } else {
        await commercialService.createProductVariant(payload);
        toastSuccess("Variante creada exitosamente.");
      }
      setShakeKey(0);
      setBarcodeError('');
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(getCatalogErrorMessage(e, variant ? "Error al actualizar la variante." : "Error al crear la variante."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setShakeKey(0);
    setBarcodeError('');
    onClose();
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={handleModalClose}
      title={variant ? `Editar Variante: ${variant.name}` : "Nueva Variante"}
      size="lg"
    >
      <div className="space-y-4">
        <ComerziaInput
          label="Nombre/Atributo (Ej: Azul - XL)"
          value={name}
          uppercase
          onChange={(e) => {
            const val = e.target.value.toUpperCase();
            setName(val);
            if (!variant) {
              const prevAutoSku = generateSku(productName, name);
              if (!sku || sku === prevAutoSku) {
                setSku(generateSku(productName, val));
              }
            }
          }}
          error={!name && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
        />
        <ComerziaInput
          label="SKU Interno"
          value={sku}
          uppercase
          onChange={(e) => setSku(e.target.value.toUpperCase())}
          error={!sku && shakeKey > 0 ? "Requerido" : ""}
          shakeKey={shakeKey}
          isRequired
          disabled={!!variant}
        />
        
        <div className="flex items-center gap-4 py-1">
          <span className="label-text">Generar código de barras internamente</span> 
          <ComerziaSwitch 
            checked={isInternalBarcode} 
            onChange={() => {
              setIsInternalBarcode(!isInternalBarcode);
              if (!isInternalBarcode) { // it means we are setting it to true
                setBarCode('');
                setBarcodeError('');
              }
            }} 
            disabled={!!variant}
          />
        </div>

        {!isInternalBarcode && (
          <div className="flex items-end gap-1.5 w-full min-w-0">
            <div className="flex-1 min-w-0">
              <ComerziaInput
                label="Código de Barras"
                value={barCode}
                onChange={(e) => {
                  setBarCode(e.target.value);
                  setBarcodeError('');
                }}
                error={(!barCode && shakeKey > 0) ? "Requerido" : (barcodeError || "")}
                shakeKey={shakeKey}
                isRequired
                readOnly
              />
            </div>
            {!variant && (
              <BtnScanIcon
                onClick={() => setIsScannerOpen(true)}
                className="mb-0.5 h-[38px] w-[38px] min-h-0 shrink-0"
                title="Escanear con cámara"
              />
            )}
          </div>
        )}

        <ComerziaSingleImageUploader
          label="Imagen de la Variante (Opcional)"
          value={selectedImage}
          onChange={setSelectedImage}
          compact
        />
        <ComerziaTextarea
          label="Descripción (Opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        {variant && (
            <div className="flex items-center gap-4 py-2">
              <span className="label-text">Estado de la Variante (Activo/Inactivo)</span> 
              <ComerziaSwitch 
                checked={status} 
                onChange={() => setStatus(!status)} 
              />
            </div>
        )}

        <div className="flex flex-row items-center gap-2 mt-6 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel onClick={handleModalClose} disabled={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        </div>
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(detectedCode) => setBarCode(detectedCode)}
        title={`Escanear Código de Barras para ${name || 'Variante'}`}
      />
    </ComerziaModal>
  );
};
