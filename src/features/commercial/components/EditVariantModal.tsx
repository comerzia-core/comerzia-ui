import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { ComerziaSingleImageUploader, type SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import { BarcodeScannerModal } from '../../../components/ui/BarcodeScannerModal';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { commercialService } from '../services/commercialService';
import { uploadFile } from '../../shared/services/storageService';
import { STORAGE_FOLDERS } from '../../../config/storage';
import type { ProductVariantResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { generateSku } from '../../../utils/skuGenerator';
import { ScanBarcode } from 'lucide-react';

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
  const [selectedImage, setSelectedImage] = useState<SingleImageValue | null>(null);
  const [status, setStatus] = useState(true);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  
  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
      if (variant) {
        setName(variant.name);
        setDescription(variant.description || '');
        setSku(variant.sku);
        setBarCode(variant.barCode);
        setSelectedImage(variant.imageUrl ? { preview: variant.imageUrl } : null);
        setStatus(variant.status);
      } else {
        setName('');
        setDescription('');
        setSku('');
        setBarCode('');
        setSelectedImage(null);
        setStatus(true);
      }
    }
  }, [isOpen, variant]);

  const handleSubmit = async () => {
    if (!name || !sku || !barCode) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsSubmitting(true);
    try {
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
        name,
        description: description || undefined,
        sku,
        barCode,
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
      onSuccess();
      onClose();
    } catch (e: any) {
      toastError(e.message || e.response?.data?.message || "Error al procesar la variante.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
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
        
        <div className="flex items-end gap-1.5">
          <div className="flex-1">
            <ComerziaInput
              label="Código de Barras"
              value={barCode}
              onChange={(e) => setBarCode(e.target.value)}
              error={!barCode && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
              disabled={!!variant}
            />
          </div>
          {!variant && (
            <button
              type="button"
              onClick={() => setIsScannerOpen(true)}
              className="btn btn-outline btn-primary btn-sm mb-0.5 h-[38px] px-2.5"
              title="Escanear con cámara"
            >
              <ScanBarcode size={18} />
            </button>
          )}
        </div>

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

        <div className="flex justify-end gap-2 mt-8 pt-4 border-t border-base-200">
          <BtnCancel onClick={onClose} disabled={isSubmitting} />
          <BtnSave onClick={handleSubmit} isLoading={isSubmitting} />
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
