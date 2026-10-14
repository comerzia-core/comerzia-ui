import { useCallback, useState } from 'react';
import { useImageActivation } from '../../hooks/useImageActivation';
import type { CloudinaryPreset } from '../../utils/image';
import { ComerziaImage } from './ComerziaImage';
import { ComerziaImageViewer } from './ComerziaImageViewer';

interface Props {
  src?: string | null;
  alt: string;
  preset?: CloudinaryPreset;
  className?: string;
  loading?: 'lazy' | 'eager';
  fit?: 'cover' | 'contain';
}

/** Presentación compartida: la imagen ampliada se solicita solamente al abrir el visor. */
export function ComerziaZoomableImage({ src, alt, preset = 'thumbnail', className = 'w-10 h-10', loading = 'lazy', fit = 'cover' }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const canOpen = Boolean(src) && failedSource !== src;
  const activate = () => { if (canOpen) setIsOpen(true); };
  const close = useCallback(() => setIsOpen(false), []);
  const gestures = useImageActivation(activate);

  return (
    <span
      className={`inline-block align-middle shrink-0 rounded-lg overflow-hidden touch-manipulation ${className.replaceAll('group-hover:scale-105', '[@media(hover:hover)]:group-hover:scale-105')} ${canOpen ? 'cursor-zoom-in' : ''}`}
      role={canOpen ? 'button' : undefined}
      tabIndex={canOpen ? 0 : undefined}
      aria-label={canOpen ? `Ampliar imagen: ${alt}` : undefined}
      title={canOpen ? 'Doble clic o doble toque para ampliar' : undefined}
      {...gestures}
      onClick={(event) => event.stopPropagation()}
      onDoubleClick={(event) => { event.stopPropagation(); activate(); }}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault(); event.stopPropagation(); activate();
        }
      }}
    >
      <ComerziaImage src={src} preset={preset} alt={alt} loading={loading}
        className={`w-full h-full ${fit === 'contain' ? 'object-contain' : 'object-cover'}`}
        onError={() => setFailedSource(src || null)} />
      {isOpen && <ComerziaImageViewer isOpen onClose={close} imageUrl={src} title={alt} />}
    </span>
  );
}
