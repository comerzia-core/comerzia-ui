// src/components/ui/ComerziaSingleImageUploader.tsx
import { useRef } from "react";
import { ImagePlus, FileImage, AlertCircle, Camera, Upload } from "lucide-react";
import { MAX_FILE_SIZE_BYTES, MAX_FILE_SIZE_MB, ALLOWED_IMAGE_TYPES } from "../../config/storage";
import { useToast } from "../../context/ToastContext";
import { BtnChange, BtnRemove } from "./CrudButtons";

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
}

export const ComerziaSingleImageUploader = ({
  value,
  onChange,
  label = "Imagen",
  error,
  shakeKey,
  compact = false,
  helperText
}: Props) => {
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 1. Validar Tipo
      if (!ALLOWED_IMAGE_TYPES.includes(file.type) && !file.type.startsWith('image/')) {
        toastError("Formato no válido. Usa JPG, PNG o WEBP.");
        return;
      }

      // 2. Validar Tamaño
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toastError(`La imagen supera el límite de ${MAX_FILE_SIZE_MB}MB.`);
        return;
      }

      // Crear objeto local con preview
      onChange({
        file: file,
        preview: URL.createObjectURL(file)
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
            compact ? 'h-36 sm:h-40' : 'h-52 sm:h-60'
          }`}
        >
          <img
            src={value.preview}
            alt="Preview"
            className="w-full h-full object-contain bg-base-200/40 p-1"
          />

          {/* Overlay con acciones táctiles y de escritorio */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 sm:gap-3 p-2">
            <button
              type="button"
              onClick={openCamera}
              className="btn btn-xs sm:btn-sm btn-comerzia-primary text-white border-none gap-1 shadow-md font-semibold hover:brightness-110"
              title="Tomar nueva foto con la cámara"
            >
              <Camera size={14} />
              <span className="hidden xs:inline">Cámara</span>
            </button>

            <BtnChange
              onClick={openGallery}
              type="button"
              className="btn-xs sm:btn-sm"
              title="Elegir otra imagen de la galería"
            />

            <BtnRemove
              onClick={handleRemove}
              type="button"
              className="btn-xs sm:btn-sm"
            />
          </div>

          {/* Badge informativo */}
          <div className="absolute bottom-2 right-2 pointer-events-none">
            {value.file ? (
              <span className="badge badge-warning text-[10px] font-bold shadow-sm">NUEVA IMAGEN</span>
            ) : (
              <span className="badge badge-neutral text-[10px] font-bold shadow-sm opacity-80">GUARDADA</span>
            )}
          </div>
        </div>
      ) : (
        // --- VISTA: ZONA DE CARGA CON OPCIONES DUALES (CÁMARA / GALERÍA) ---
        <div
          className={`border-2 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-4 transition-all ${
            compact ? 'py-4 px-3 min-h-[140px]' : 'py-6 px-4 min-h-[170px]'
          } ${
            error
              ? 'border-error bg-error/5'
              : 'border-base-300 hover:bg-base-200/50 hover:border-primary/50 bg-base-100'
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Camera size={compact ? 20 : 24} />
            </div>
            <div className="p-2 rounded-xl bg-base-200 text-base-content/70">
              <ImagePlus size={compact ? 20 : 24} />
            </div>
          </div>

          <p className="font-bold text-xs sm:text-sm text-base-content">
            Subir o Capturar Imagen
          </p>
          <p className="text-[11px] text-base-content/50 mt-0.5 mb-3">
            Máx. {MAX_FILE_SIZE_MB}MB (JPG, PNG, WEBP)
          </p>

          {/* BOTONES DIRECTOS: TOMAR FOTO O SUBIR DE GALERÍA */}
          <div className="flex items-center gap-2 w-full max-w-xs justify-center">
            <button
              type="button"
              onClick={openCamera}
              className="btn btn-xs sm:btn-sm btn-comerzia-primary text-white border-none flex-1 gap-1.5 shadow-sm font-semibold hover:brightness-110 active:scale-95 transition-all"
            >
              <Camera size={15} />
              <span>Tomar Foto</span>
            </button>

            <button
              type="button"
              onClick={openGallery}
              className="btn btn-xs sm:btn-sm btn-outline flex-1 gap-1.5 font-semibold hover:bg-base-200 active:scale-95 transition-all"
            >
              <Upload size={15} />
              <span>Galería</span>
            </button>
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