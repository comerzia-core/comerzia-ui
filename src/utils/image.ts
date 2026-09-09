/**
 * Utilidades para optimización y transformación de imágenes en Cloudinary.
 */

interface ImageTransformOptions {
  width?: number;
  height?: number;
  quality?: 'auto' | number;
  crop?: 'fill' | 'thumb' | 'fit' | 'limit' | 'scale';
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
}

/**
 * Transforma dinámicamente URLs de Cloudinary para solicitar imágenes redimensionadas,
 * comprimidas y convertidas a WebP/AVIF en lugar de descargar el archivo original pesado.
 */
export const getOptimizedImageUrl = (
  url?: string | null,
  options: ImageTransformOptions = {}
): string => {
  if (!url) return '';

  // Si no es de Cloudinary o no tiene /upload/, retornamos la URL tal cual
  if (!url.includes('cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const {
    width = 120,
    height = 120,
    quality = 'auto',
    crop = 'fill',
    format = 'auto'
  } = options;

  const transformations = [
    `w_${width}`,
    `h_${height}`,
    `c_${crop}`,
    `q_${quality}`,
    `f_${format}`
  ].join(',');

  // Inserta la transformación justo después de '/upload/'
  return url.replace('/upload/', `/upload/${transformations}/`);
};

/**
 * Helper rápido para obtener un thumbnail cuadrado ultraliviano (ej: 80x80px o 120x120px)
 */
export const getThumbnailUrl = (url?: string | null, size: number = 100): string => {
  return getOptimizedImageUrl(url, {
    width: size,
    height: size,
    crop: 'fill',
    quality: 'auto',
    format: 'auto'
  });
};
