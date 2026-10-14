import React, { useState, useEffect } from 'react';
import { Package, ImageOff } from 'lucide-react';
import { getOptimizedImageUrl, type CloudinaryPreset } from '../../utils/image';

interface ComerziaImageProps {
  /** URL de la imagen (Cloudinary, local blob o externa) */
  src?: string | null;
  /** Uno de los 3 Presets Oficiales de Comerzia ('thumbnail' | 'card' | 'full') */
  preset?: CloudinaryPreset;
  /** Texto alternativo para accesibilidad y SEO */
  alt?: string;
  /** Clases CSS para la etiqueta <img> */
  className?: string;
  /** Clases CSS opcionales para el contenedor envolvente de fallback */
  containerClassName?: string;
  /** Estrategia de carga bajo demanda ('lazy' por defecto para ahorro de red) */
  loading?: 'lazy' | 'eager';
  /** Icono o nodo personalizado cuando no hay imagen o falla la carga */
  fallbackIcon?: React.ReactNode;
  /** Evento al hacer clic en la imagen */
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void;
  /** Callback en caso de error de red o imagen rota */
  onError?: () => void;
  /** Tooltip nativo o título de la imagen */
  title?: string;
}

/**
 * Componente estándar de imagen para Comerzia UI ("Dumb Component").
 * Aplica automáticamente los 3 Presets Oficiales de Cloudinary ('thumbnail', 'card', 'full'),
 * soporte nativo de lazy loading, tratamiento seguro de origen y estados de fallback limpios.
 */
export const ComerziaImage: React.FC<ComerziaImageProps> = ({
  src,
  preset = 'card',
  alt = 'Imagen',
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full h-full flex items-center justify-center bg-base-200/50 text-base-content/40',
  loading = 'lazy',
  fallbackIcon,
  onClick,
  onError,
  title,
}) => {
  const [hasError, setHasError] = useState(false);

  // Reiniciar estado de error si cambia la URL
  useEffect(() => {
    setHasError(false);
  }, [src]);

  // Si no se proporcionó URL o la imagen falló en cargar
  if (!src || hasError) {
    return (
      <div className={containerClassName} title={title}>
        {fallbackIcon ? (
          fallbackIcon
        ) : hasError ? (
          <ImageOff size={18} className="text-base-content/30" />
        ) : (
          <Package size={18} className="text-base-content/30" />
        )}
      </div>
    );
  }

  const optimizedSrc = getOptimizedImageUrl(src, preset);

  return (
    <img
      src={optimizedSrc}
      alt={alt}
      title={title}
      loading={loading}
      className={className}
      onClick={onClick}
      onError={() => {
        setHasError(true);
        if (onError) onError();
      }}
    />
  );
};
