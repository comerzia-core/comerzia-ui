import { useRef } from "react";
import { ImagePlus, FileImage, AlertCircle, Camera } from "lucide-react";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "../../config/storage";
import { useToast } from "../../context/ToastContext";
import { BtnChange, BtnRemove, BtnCamera, BtnGallery } from "./CrudButtons";
import { compressImageFile, getCardImageUrl } from "../../utils/image";
import { ComerziaZoomableImage } from './ComerziaZoomableImage';

export interface SingleImageValue {
  file?: File;
  preview: string;
}

interface Props {
  value?: SingleImageValue | null;
  onChange: (value: SingleImageValue | null) => void;
  label?: string;
  error?: string;
  shakeKey?: number;
  compact?: boolean;
  helperText?: string;
  enableImageZoom?: boolean;
}

export const ComerziaSingleImageUploader = ({
  value,
  onChange,
  label = "Imagen",
  error,
  shakeKey,
  compact = false,
  helperText,
  enableImageZoom = false
}: Props) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 1. Validar Tipo
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        toastError("Formato no válido. Usa JPG, PNG o WEBP.");
        return;
      }

      // 2. Límite de seguridad para evitar saturar memoria en archivos anormalmente grandes (>25MB)
      const MAX_PRE_COMPRESSION_BYTES = 25 * 1024 * 1024;
      if (file.size > MAX_PRE_COMPRESSION_BYTES) {
        toastError("La imagen original es demasiado pesada (máximo 25MB para fotos).");
        return;
      }

      // 3. Optimización en el cliente antes de la subida (150 - 300 KB, máx 1600px)
      const optimizedFile = await compressImageFile(file);

      // 4. Validar que cumpla con el límite de backend (5MB)
      if (optimizedFile.size > MAX_FILE_SIZE_BYTES) {
        toastError(`La imagen supera el límite de ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      // Crear objeto local con preview
      onChange({
        file: optimizedFile,
        preview: URL.createObjectURL(optimizedFile)
      });
    }
    // Reset inputs
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleRemove = () => {
    onChange(null);
  };

  const openGallery = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    galleryInputRef.current?.click();
  };

  const openCamera = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    cameraInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${shakeKey ? 'animate-shake' : ''}`}>
      {label && (
        <label className="label py-1">
          <span className="label-text font-medium flex items-center gap-2 text-sm text-base-content/80">
            <FileImage size={16} /> {label}
          </span>
        </label>
      )}

      {value ? (
        // --- VISTA: IMAGEN SELECCIONADA ---
        <div
          className={`relative w-full rounded-2xl overflow-hidden border border-base-300 group bg-base-100 ${
            compact ? 'h-40 sm:h-44' : 'h-52 sm:h-60'
          }`}
        >
          {enableImageZoom ? <ComerziaZoomableImage src={value.preview} alt={label || 'Imagen seleccionada'}
            preset="card" className="w-full h-full bg-base-200/40 p-1" fit="contain" /> : <img
            src={getCardImageUrl(value.preview)}
            alt="Preview"
            className="w-full h-full object-contain bg-base-200/40 p-1"
          />}

          {/* Overlay con acciones visibles en móvil y por hover en desktop */}
          <div className={`absolute ${enableImageZoom ? 'inset-x-0 bottom-0 pointer-events-none' : 'inset-0'} bg-black/40 sm:bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 sm:gap-2 p-2`}>
            <BtnCamera
              type="button"
              onClick={openCamera}
              label="Foto"
              responsive={true}
              className="pointer-events-auto btn-sm !min-w-0 !px-2.5 sm:!px-3 shadow-md gap-1.5"
              title="Tomar nueva foto con la cámara"
            />

            <BtnChange
              type="button"
              onClick={openGallery}
              responsive={true}
              className="pointer-events-auto btn-sm !min-w-0 !px-2.5 sm:!px-3 shadow-md gap-1.5"
              title="Elegir otra imagen de la galería"
            />

            <BtnRemove
              type="button"
              onClick={handleRemove}
              responsive={true}
              className="pointer-events-auto btn-sm !min-w-0 !px-2.5 sm:!px-3 shadow-md gap-1.5"
              title="Quitar imagen"
            />
          </div>

          {/* Badge informativo */}
          <div className="absolute bottom-2 right-2 pointer-events-none z-10">
            {value.file ? (
              <span className="badge badge-warning badge-sm text-[10px] font-bold shadow-sm">NUEVA IMAGEN</span>
            ) : (
              <span className="badge badge-neutral badge-sm text-[10px] font-bold shadow-sm opacity-90">GUARDADA</span>
            )}
          </div>
        </div>
      ) : (
        // --- VISTA: ZONA DE CARGA CON OPCIONES DUALES (CÁMARA / GALERÍA) ---
        <div
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-3.5 sm:p-4 transition-all ${
            compact ? 'py-3.5 px-3 min-h-[145px]' : 'py-5 px-4 min-h-[175px]'
          } ${
            error
              ? 'border-error bg-error/5'
              : 'border-base-300 hover:bg-base-200/50 hover:border-primary/50 bg-base-100'
          }`}
        >
          <div className="flex items-center gap-2.5 mb-2">
            <div className="p-2.5 rounded-2xl bg-primary text-primary-content shadow-xs">
              <Camera size={compact ? 20 : 22} />
            </div>
            <div className="p-2.5 rounded-2xl bg-base-200 text-base-content/70">
              <ImagePlus size={compact ? 20 : 22} />
            </div>
          </div>

          <p className="font-bold text-xs sm:text-sm text-base-content">
            Foto de la Variante
          </p>
          <p className="text-[11px] text-base-content/50 mt-0.5 mb-3">
            Toma una foto con tu cámara o sube desde tu galería
          </p>

          {/* BOTONES DIRECTOS: TOMAR FOTO O SUBIR DE GALERÍA */}
          <div className="flex items-center gap-2 w-full max-w-sm justify-center">
            <BtnCamera
              type="button"
              onClick={openCamera}
              label="Tomar Foto"
              className="flex-1 btn-sm min-h-[38px]"
              responsive={true}
            />

            <BtnGallery
              type="button"
              onClick={openGallery}
              label="Galería"
              className="flex-1 btn-sm min-h-[38px]"
              responsive={true}
            />
          </div>
        </div>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-base-content/50">{helperText}</p>
      )}

      {/* Input 1: Galería / Selector de Archivos (MIME + wildcard image/*) */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,image/jpeg,image/png,image/webp,image/jpg"
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Input 2: Cámara directa para dispositivos móviles con capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />

      {error && (
        <div className="flex items-center gap-1.5 text-error text-xs mt-1 animate-fade-in">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

// Export alias for compatibility
export const TravesiaSingleImageUploader = ComerziaSingleImageUploader;
