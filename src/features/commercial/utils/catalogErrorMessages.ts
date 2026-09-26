/**
 * Utilidad para traducir y formatear respuestas de error del catálogo
 * basándose en los contratos OpenAPI de TenantCatalogApiDoc.
 * 
 * Genera mensajes cortos, directos y en español para useToast().
 */

export const getCatalogErrorMessage = (
  error: any,
  fallback = "Error al procesar la solicitud"
): string => {
  if (!error) return fallback;

  // Si es un error manual lanzado en frontend (ej. throw new Error(...))
  if (error instanceof Error && !('response' in error) && error.message) {
    return error.message;
  }

  const response = error.response;
  const status = response?.status;
  const data = response?.data;
  const errorCode = (data?.errorCode || '').toString().toLowerCase();
  const rawMessage = (data?.message || error.message || '').toString();
  const lowerMsg = rawMessage.toLowerCase();

  // 1. CONFLICTOS (409 Conflict / resource_already_exists)
  // TenantCatalogApiDoc.CreateFullProduct: "Product name, SKU or BarCode already exists"
  // TenantCatalogApiDoc.CreateFamilyGroup: "Family already exists"
  if (status === 409 || errorCode === 'resource_already_exists') {
    if (lowerMsg.includes('sku')) {
      return "Ya existe una variante con este SKU";
    }
    if (lowerMsg.includes('barcode') || lowerMsg.includes('bar_code') || lowerMsg.includes('código de barras')) {
      return "Ya existe una variante con este código de barras";
    }
    if (lowerMsg.includes('family') || lowerMsg.includes('familia')) {
      return "Ya existe una familia con este nombre";
    }
    if (lowerMsg.includes('product') || lowerMsg.includes('producto') || lowerMsg.includes('name') || lowerMsg.includes('nombre')) {
      return "Ya existe un producto con este nombre";
    }
    return "El nombre, SKU o código de barras ya existe";
  }

  // 2. RECURSOS NO ENCONTRADOS (404 Not Found / resource_not_found)
  // TenantCatalogApiDoc.CreateFullProduct: "Brand or PriceType not found"
  // TenantCatalogApiDoc.CreateFamilyGroup: "Product not found"
  // TenantCatalogApiDoc.AddProductsToFamily: "Family or Product not found"
  if (status === 404 || errorCode === 'resource_not_found') {
    if (lowerMsg.includes('brand') || lowerMsg.includes('marca')) {
      return "Marca no encontrada";
    }
    if (lowerMsg.includes('pricetype') || lowerMsg.includes('price_type') || lowerMsg.includes('tipo de precio')) {
      return "Tipo de precio no encontrado";
    }
    if (lowerMsg.includes('family') && lowerMsg.includes('product')) {
      return "Familia o producto no encontrado";
    }
    if (lowerMsg.includes('family') || lowerMsg.includes('familia')) {
      return "Familia no encontrada";
    }
    if (lowerMsg.includes('product') || lowerMsg.includes('producto')) {
      return "Producto no encontrado";
    }
    if (lowerMsg.includes('variant') || lowerMsg.includes('variante')) {
      return "Variante no encontrada";
    }
    if (lowerMsg.includes('category') || lowerMsg.includes('categoría')) {
      return "Categoría no encontrada";
    }
    if (lowerMsg.includes('segment') || lowerMsg.includes('rubro')) {
      return "Rubro no encontrado";
    }
    return "Recurso no encontrado";
  }

  // 3. VALIDACIONES FALLIDAS (400 Bad Request / validation_failed)
  if (status === 400 || errorCode === 'validation_failed') {
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const firstErr = data.errors[0];
      if (firstErr.message) return firstErr.message;
    }
    if (lowerMsg.includes('discount') || lowerMsg.includes('descuento')) {
      return "El precio de descuento no puede ser mayor al de venta";
    }
    if (lowerMsg.includes('price') || lowerMsg.includes('precio')) {
      return "Los precios ingresados no son válidos";
    }
    return "Datos del formulario incompletos o inválidos";
  }

  // 4. PERMISOS (403 Forbidden)
  if (status === 403) {
    return "No cuentas con permisos para esta acción";
  }

  // 5. ERROR DE SERVIDOR (500)
  if (status >= 500) {
    return "Error en el servidor al procesar el catálogo";
  }

  return rawMessage || fallback;
};
