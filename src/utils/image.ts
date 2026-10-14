/**
 * Utilidades para optimización, compresión y transformación de imágenes en Cloudinary.
 * Implementa las directrices de la 'Guía Estratégica para Frontend: Optimización y Consumo de Imágenes'.
 */

// ============================================================================
// 1. PRESETS OFICIALES DE CLOUDINARY PARA COMERZIA
// ============================================================================

export const CLOUDINARY_PRESETS = {
  /**
   * Thumbnail (120x120px): Recorte inteligente enfocado automáticamente (g_auto).
   * Peso promedio: 8 - 15 KB.
   * Usos: Filas en tablas de inventario y listados, resultados del buscador predictivo del POS,
   * ítems dentro del carrito de venta, miniaturas y avatares pequeños.
   */
  thumbnail: 'c_thumb,w_120,h_120,g_auto,f_auto,q_auto',

  /**
   * Card (400x400px): Límite proporcional sin recortar ni distorsionar (c_limit).
   * Peso promedio: 40 - 60 KB.
   * Usos: Tarjetas de catálogo y cuadrículas de productos, previsualizaciones medianas en formularios,
   * logotipos en paneles y encabezados, códigos QR de pago.
   */
  card: 'c_limit,w_400,h_400,f_auto,q_auto',

  /**
   * Full (1200x1200px): Escala en alta definición preservando la relación de aspecto (c_limit).
   * Peso promedio: 150 - 200 KB.
   * Usos: Modales de detalle y ficha ampliada, visor con zoom de producto, vistas a pantalla completa.
   */
  full: 'c_limit,w_1200,h_1200,f_auto,q_auto',
} as const;

export type CloudinaryPreset = keyof typeof CLOUDINARY_PRESETS;

/**
 * Verifica si una URL dada pertenece a un recurso de Cloudinary con ruta /image/upload/.
 */
export const isCloudinaryUrl = (url?: string | null): boolean => {
  if (!url || typeof url !== 'string') return false;
  return url.includes('res.cloudinary.com') && url.includes('/image/upload/');
};

/**
 * Transforma URLs de Cloudinary aplicando estrictamente uno de los 3 Presets Oficiales de Comerzia.
 *
 * Características:
 * - 100% Idempotente: Si la URL ya tiene una transformación previa o el mismo preset,
 *   la reemplaza limpiamente sin acumular parámetros ni duplicar transformaciones.
 * - Resiliente: Si la URL es nula, vacía, local (blob:, data:) o externa, la devuelve intacta.
 * - Caché CDN: Al usar únicamente los 3 presets oficiales, Cloudinary reutiliza la versión en caché
 *   consumiendo 0 créditos de transformación en visitas recurrentes.
 */
export const getOptimizedImageUrl = (
  url?: string | null,
  preset: CloudinaryPreset = 'card'
): string => {
  if (!url || typeof url !== 'string') return '';

  // Tratamiento seguro de origen: Si no es de Cloudinary, retornar tal cual
  if (!isCloudinaryUrl(url)) {
    return url;
  }

  const transformation = CLOUDINARY_PRESETS[preset] || CLOUDINARY_PRESETS.card;
  const uploadToken = '/image/upload/';
  const uploadIndex = url.indexOf(uploadToken);

  if (uploadIndex === -1) return url;

  const prefix = url.slice(0, uploadIndex + uploadToken.length);
  const rest = url.slice(uploadIndex + uploadToken.length);

  // Idempotencia: Si ya cuenta exactamente con la transformación deseada, retornar directo
  if (rest.startsWith(`${transformation}/`)) {
    return url;
  }

  // Caso A: Con versión (ej: .../upload/[transf]/v12345/products/arroz.jpg)
  // Limpia cualquier transformación previa entre /upload/ y /v12345/
  const versionRegex = /^(?:(?:[a-z]{1,4}_[^/]+|[a-z]{1,2}-[a-z0-9]+)\/)*(v\d+\/.+)$/i;
  const versionMatch = rest.match(versionRegex);
  if (versionMatch) {
    return `${prefix}${transformation}/${versionMatch[1]}`;
  }

  // Caso B: Sin versión pero con transformaciones previas (ej: .../upload/w_100,h_100/products/arroz.jpg)
  const nonVersionTransformRegex = /^(?:[a-z]{1,4}_[^/]+\/)+(.+)$/i;
  const nonVersionMatch = rest.match(nonVersionTransformRegex);
  if (nonVersionMatch) {
    return `${prefix}${transformation}/${nonVersionMatch[1]}`;
  }

  // Caso C: URL base limpia sin transformaciones previas
  return `${prefix}${transformation}/${rest}`;
};

/**
 * Shorthand oficial para miniatura ultra liviana (8 - 15 KB).
 * Compatible con código existente que llamaba a getThumbnailUrl(url).
 */
export const getThumbnailUrl = (url?: string | null): string => {
  return getOptimizedImageUrl(url, 'thumbnail');
};

/**
 * Shorthand oficial para tarjetas, logos y vistas medianas (40 - 60 KB).
 */
export const getCardImageUrl = (url?: string | null): string => {
  return getOptimizedImageUrl(url, 'card');
};

/**
 * Shorthand oficial para modales de detalle, zoom y alta fidelidad (150 - 200 KB).
 */
export const getFullImageUrl = (url?: string | null): string => {
  return getOptimizedImageUrl(url, 'full');
};

// ============================================================================
// 2. OPTIMIZACIÓN Y COMPRESIÓN EN EL CLIENTE ANTES DE LA SUBIDA (OBJETIVO 1)
// ============================================================================

export interface CompressImageOptions {
  /** Dimensión máxima en su lado más largo en píxeles (por defecto 1600px según la guía) */
  maxDimension?: number;
  /** Calidad de compresión WebP/JPEG (0.1 a 1.0, por defecto 0.82) */
  quality?: number;
  /** Formato de salida preferido (por defecto 'image/webp') */
  format?: 'image/webp' | 'image/jpeg';
  /** Límite superior objetivo en bytes (por defecto 300 KB = 307,200 bytes) */
  targetMaxSizeBytes?: number;
}

/**
 * Helper interno para cargar una imagen desde un archivo File
 * utilizando createImageBitmap cuando esté disponible (off-thread) o HTMLImageElement como fallback.
 */
const loadImageFromFile = (file: File): Promise<HTMLImageElement | ImageBitmap> => {
  if (typeof window !== 'undefined' && 'createImageBitmap' in window) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };

    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };

    img.src = objectUrl;
  });
};

/**
 * Comprime y acondiciona una imagen en el navegador del cliente antes de enviarla al backend.
 *
 * Metas del Negocio:
 * - Reduce fotografías pesadas tomadas desde celulares (3 a 8 MB) a un peso óptimo entre 150 KB y 300 KB.
 * - Limita la resolución máxima a 1600px en su lado más largo manteniendo nitidez profesional.
 * - Emplea WebP por defecto (o JPEG balanceado) para máxima ligereza sin saturar la red ni la cuota.
 * - No bloquea la UI y preserva la transparencia cuando el formato lo permite.
 */
export const compressImageFile = async (
  file: File,
  options: CompressImageOptions = {}
): Promise<File> => {
  // Entorno sin navegador (SSR o testing)
  if (typeof window === 'undefined') {
    return file;
  }

  // Si no es un archivo de imagen, retornar sin alterar
  if (!file.type.startsWith('image/')) {
    return file;
  }

  // Respetar formatos vectoriales SVG o animaciones GIF
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file;
  }

  const {
    maxDimension = 1600,
    quality = 0.82,
    format = 'image/webp',
    targetMaxSizeBytes = 300 * 1024, // 300 KB
  } = options;

  try {
    const img = await loadImageFromFile(file);
    const originalWidth = img.width;
    const originalHeight = img.height;

    // Si ya es un archivo WebP o JPEG liviano (< 200KB) y dentro de las dimensiones, no requiere recompresión
    if (
      file.size <= 200 * 1024 &&
      originalWidth <= maxDimension &&
      originalHeight <= maxDimension &&
      (file.type === 'image/webp' || file.type === 'image/jpeg')
    ) {
      if ('close' in img && typeof img.close === 'function') {
        img.close();
      }
      return file;
    }

    // Calcular escala proporcional conservando la relación de aspecto
    let targetWidth = originalWidth;
    let targetHeight = originalHeight;

    if (originalWidth > maxDimension || originalHeight > maxDimension) {
      const scaleRatio = Math.min(maxDimension / originalWidth, maxDimension / originalHeight);
      targetWidth = Math.round(originalWidth * scaleRatio);
      targetHeight = Math.round(originalHeight * scaleRatio);
    }

    // Crear canvas para el redimensionamiento
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      if ('close' in img && typeof img.close === 'function') {
        img.close();
      }
      return file;
    }

    // Configurar máxima calidad de suavizado en el escalado
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // Si se exporta a JPEG y la imagen original tenía transparencia, colocar fondo blanco
    if (format === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetWidth, targetHeight);
    }

    ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

    // Liberar memoria del ImageBitmap si aplica
    if ('close' in img && typeof img.close === 'function') {
      img.close();
    }

    // Exportar a Blob con el formato y calidad especificada
    let blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), format, quality);
    });

    // Fallback: Si el navegador no soporta WebP en toBlob, exportar en JPEG
    if (!blob && format === 'image/webp') {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/jpeg', quality);
      });
    }

    if (!blob) {
      return file;
    }

    // Si aún supera el objetivo deseado (> 300 KB), realizar un segundo pase con menor calidad (0.68)
    if (blob.size > targetMaxSizeBytes) {
      const secondPassBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), blob?.type || format, 0.68);
      });
      if (secondPassBlob && secondPassBlob.size < blob.size) {
        blob = secondPassBlob;
      }
    }

    // Generar el nuevo archivo con la extensión correspondiente
    const chosenType = blob.type || format;
    const extension = chosenType === 'image/webp' ? '.webp' : '.jpg';
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const newFileName = `${baseName}${extension}`;

    return new File([blob], newFileName, {
      type: chosenType,
      lastModified: Date.now(),
    });
  } catch (error) {
    // Si ocurre cualquier error en el procesamiento cliente, devolver el archivo original como red de seguridad
    console.warn('Image optimization skipped due to browser error, uploading original file:', error);
    return file;
  }
};
