// src/features/shared/services/storageService.ts
import api from '../../../lib/axios';

interface UploadResponse {
  url: string;
}

export const uploadFile = async (
  file: File,
  folder: string,
  customName?: string
): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  let sanitizedCustomName: string | undefined;
  if (customName) {
    // Sanitizar nombre: "Producto Especial #1" -> "producto-especial-1"
    sanitizedCustomName = customName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Quitar tildes y diacríticos
      .replace(/\s+/g, '-') // Espacios a guiones
      .replace(/[^a-z0-9-]/g, ''); // Quitar caracteres especiales
  }

  // Llamada al backend con parámetros de consulta según OpenAPI spec
  const { data } = await api.post<UploadResponse>('/shared/storage/upload', formData, {
    params: {
      folder,
      ...(sanitizedCustomName ? { customName: sanitizedCustomName } : {})
    },
    headers: { 'Content-Type': 'multipart/form-data' }
  });

  return data.url;
};
