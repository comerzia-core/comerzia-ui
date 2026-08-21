// src/components/ui/ComerziaSingleImageUploader.tsx
import { useRef } from "react";
import { ImagePlus, FileImage, AlertCircle } from "lucide-react";
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
  label = "Imagen del Producto",
  error,
  shakeKey,
  compact = false,
  helperText
}: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // 1. Validar Tipo
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
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
    // Reset input
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleRemove = () => {
    onChange(null);
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
          className={`relative w-full rounded-xl overflow-hidden border border-base-300 group bg-base-100 ${
            compact ? 'h-36' : 'h-52'
          }`}
        >
          <img
            src={value.preview}
            alt="Preview"
            className="w-full h-full object-contain bg-base-200/30"
          />

          {/* Overlay con acciones */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
            <BtnChange
              onClick={() => inputRef.current?.click()}
              type="button"
              className="btn-xs"
            />
            <BtnRemove
              onClick={handleRemove}
              type="button"
              className="btn-xs"
            />
          </div>

          {/* Badge informativo */}
          <div className="absolute bottom-2 right-2">
            {value.file ? (
              <span className="badge badge-warning text-[10px] font-bold shadow-sm">NUEVA IMAGEN</span>
            ) : (
              <span className="badge badge-neutral text-[10px] font-bold shadow-sm opacity-80">GUARDADA</span>
            )}
          </div>
        </div>
      ) : (
        // --- VISTA: ZONA DE CARGA (VACÍA) ---
        <div
          className={`border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${
            compact ? 'h-32 p-3' : 'h-44 p-4'
          } ${
            error
              ? 'border-error bg-error/5'
              : 'border-base-300 hover:bg-base-200/50 hover:border-primary/50'
          }`}
          onClick={() => inputRef.current?.click()}
        >
          <div className={`bg-base-200 rounded-full mb-2 ${compact ? 'p-2' : 'p-3'}`}>
            <ImagePlus size={compact ? 22 : 28} className="text-base-content/40" />
          </div>
          <p className="font-bold text-xs">Clic para subir imagen</p>
          <p className="text-[11px] text-base-content/50 mt-0.5">
            Máx. {MAX_FILE_SIZE_MB}MB (JPG, PNG, WEBP)
          </p>
        </div>
      )}

      {helperText && !error && (
        <p className="text-[11px] text-base-content/50">{helperText}</p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
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