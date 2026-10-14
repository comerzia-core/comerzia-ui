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
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' && parsed.hostname === 'res.cloudinary.com' &&
      !parsed.username && !parsed.password && /^\/[^/]+\/image\/upload\//.test(parsed.pathname);
  } catch { return false; }
};

/** URL estable por recurso y preset: permite reutilizar la caché HTTP del navegador y la CDN. */
export const getOptimizedImageUrl = (url?: string | null, preset: CloudinaryPreset = 'card'): string => {
  if (!url) return '';
  if (!isCloudinaryUrl(url)) return url;
  const parsed = new URL(url);
  const token = '/image/upload/';
  const index = parsed.pathname.indexOf(token) + token.length;
  const parts = parsed.pathname.slice(index).split('/');
  // Una firma o un token autoriza una URL concreta; no se puede modificar sin volver a firmarla.
  if (parts[0].startsWith('s--') || parsed.search) return url;
  const transformation = CLOUDINARY_PRESETS[preset];
  if (parts[0] === transformation) return url;
  // Solo eliminamos parámetros reconocidos, nunca carpetas arbitrarias de un public_id.
  const isTransformation = (part: string) => part.split(',').every(parameter =>
    /^(?:w|h|q|dpr)_\d+(?:\.\d+)?$/.test(parameter) ||
    /^c_(?:thumb|limit|fill|fit|pad|crop|scale|lfill|lpad|mfit|mpad)$/.test(parameter) ||
    /^(?:f_(?:auto|webp|avif|jpg|png)|q_auto(?::[a-z]+)?|g_(?:auto|center|face|faces))$/.test(parameter));
  while (parts.length > 1 && isTransformation(parts[0])) parts.shift();
  parsed.pathname = parsed.pathname.slice(0, index) + transformation + '/' + parts.join('/');
  return parsed.href;
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
const compressImageOnce = async (
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
      targetWidth = Math.max(1, Math.round(originalWidth * scaleRatio));
      targetHeight = Math.max(1, Math.round(originalHeight * scaleRatio));
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

    // Fallback: Si el navegador no soporta WebP en toBlob, exportar en PNG para conservar transparencia
    if (!blob && format === 'image/webp') {
      blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), 'image/png');
      });
    }

    if (!blob) {
      return file;
    }

    // Si aún supera el objetivo deseado (> 300 KB), realizar un segundo pase con menor calidad (0.68)
    if (blob.size > targetMaxSizeBytes) {
      const secondPassBlob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob((b) => resolve(b), blob?.type || format, Math.min(quality, 0.68));
      });
      if (secondPassBlob && secondPassBlob.size < blob.size) {
        blob = secondPassBlob;
      }
    }

    // Generar el nuevo archivo con la extensión correspondiente
    const chosenType = blob.type || format;
    const extension = chosenType === 'image/webp' ? '.webp' : chosenType === 'image/png' ? '.png' : '.jpg';
    const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
    const newFileName = `${baseName}${extension}`;

    // No aumentar el peso de un archivo que ya cumple el límite de dimensiones.
    if (blob.size >= file.size && originalWidth <= maxDimension && originalHeight <= maxDimension) return file;
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

// Referencias débiles: no retienen archivos al cerrar formularios. Comparten también el trabajo en curso.
const compressionCache = new WeakMap<File, Map<string, Promise<File>>>();
export const compressImageFile = (file: File, options: CompressImageOptions = {}): Promise<File> => {
  const key = JSON.stringify([options.maxDimension ?? 1600, options.quality ?? 0.82,
    options.format ?? 'image/webp', options.targetMaxSizeBytes ?? 300 * 1024]);
  const cached = compressionCache.get(file)?.get(key);
  if (cached) return cached;
  const jobs = compressionCache.get(file) ?? new Map<string, Promise<File>>();
  const job = compressImageOnce(file, options).then(result => {
    const completed = compressionCache.get(result) ?? new Map<string, Promise<File>>();
    completed.set(key, Promise.resolve(result));
    compressionCache.set(result, completed);
    return result;
  });
  jobs.set(key, job);
  compressionCache.set(file, jobs);
  return job;
};
