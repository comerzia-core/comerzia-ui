// src/components/ui/ComerziaImageViewer.tsx
import { useState, useEffect } from "react";
import { ComerziaModal } from "./ComerziaModal";
import { ImageOff, Loader2 } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title: string;
  altText?: string;
}

export const ComerziaImageViewer = ({ isOpen, onClose, imageUrl, title, altText }: Props) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Reseteamos estados cada vez que se abre una nueva imagen
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, imageUrl]);

  if (!isOpen) return null;

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="md"
    >
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-base-200/30 rounded-xl overflow-hidden relative border border-base-200">
        
        {/* 1. Estado de Carga (Spinner) */}
        {isLoading && !hasError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-base-content/50 bg-base-100/60 z-10 backdrop-blur-xs">
            <Loader2 className="animate-spin text-primary" size={32} />
            <span className="text-xs font-bold animate-pulse">Cargando imagen...</span>
          </div>
        )}

        {/* 2. Estado de Error (Si el link está roto) */}
        {hasError && (
          <div className="flex flex-col items-center justify-center gap-2 text-error/70 py-12">
            <ImageOff size={48} />
            <span className="text-sm font-bold">No se pudo cargar la imagen</span>
          </div>
        )}

        {/* 3. La Imagen Real */}
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={altText || title}
            className={`w-full h-auto object-contain max-h-[60vh] rounded-lg shadow-sm transition-opacity duration-300 ${
              isLoading ? "opacity-0" : "opacity-100"
            }`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setHasError(true);
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 text-base-content/40 py-12">
            <ImageOff size={48} />
            <span className="text-sm font-medium">No hay imagen disponible</span>
          </div>
        )}
      </div>

      {/* Footer Informativo */}
      <div className="mt-4 text-center text-xs text-base-content/60 font-medium truncate">
        {title}
      </div>
    </ComerziaModal>
  );
};

// Export alias for compatibility
export const TravesiaImageViewer = ComerziaImageViewer;