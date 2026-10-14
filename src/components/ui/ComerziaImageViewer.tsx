import { useState, useEffect, useRef } from "react";
import { createPortal } from 'react-dom';
import { ComerziaModal } from "./ComerziaModal";
import { ImageOff, Loader2 } from "lucide-react";
import { getFullImageUrl } from "../../utils/image";

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
  const containerRef = useRef<HTMLDivElement>(null);

  // Reseteamos estados cada vez que se abre una nueva imagen
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [isOpen, imageUrl]);

  // El visor anidado recibe Escape antes que el modal de venta o catálogo que lo contiene.
  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement;
    const focusable = () => Array.from(containerRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])') || []).filter(element => element.getClientRects().length);
    focusable()[0]?.focus();
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        const elements = focusable();
        if (!elements.length) return;
        const current = elements.indexOf(document.activeElement as HTMLElement);
        const next = current === -1 ? 0 : (current + (event.shiftKey ? -1 : 1) + elements.length) % elements.length;
        event.preventDefault(); event.stopImmediatePropagation(); elements[next].focus();
        return;
      }
      if (event.key !== 'Escape') return;
      event.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', escape, true);
    return () => {
      window.removeEventListener('keydown', escape, true);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    // El toque que abre el portal no debe cerrar el buscador que contiene la miniatura.
    <div ref={containerRef} onMouseDown={(event) => event.stopPropagation()}>
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      variant="view"
    >
      <div className="flex flex-col items-center justify-center min-h-[300px] bg-base-200/30 rounded-xl overflow-hidden relative border border-base-200">
        
        {/* 1. Estado de Carga (Spinner) */}
        {imageUrl && isLoading && !hasError && (
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
            src={getFullImageUrl(imageUrl)}
            alt={altText || title}
            decoding="async"
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
    </div>, document.body
  );
};

// Export alias for compatibility
export const TravesiaImageViewer = ComerziaImageViewer;
