import { useState, useEffect, useRef } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { ComerziaSingleImageUploader, type SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import { ProductFormBarcodeField } from '../../../components/ui/ProductFormBarcodeField';
import { commercialService } from '../services/commercialService';
import { uploadFile } from '../../shared/services/storageService';
import { STORAGE_FOLDERS } from '../../../config/storage';
import type { BulkUploadSummaryResponse, ProductVariantEnrichmentResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { 
  FileSpreadsheet, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  Image as ImageIcon,
  Barcode, 
  X,
  PackageCheck,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BulkUploadModal = ({ isOpen, onClose, onSuccess }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Estados de navegación interna
  const [activeTab, setActiveTab] = useState<'UPLOAD' | 'PENDING'>('UPLOAD');

  // Estados del archivo y subida
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [autoGenInternalBarcodes, setAutoGenInternalBarcodes] = useState<boolean>(true);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSummary, setUploadSummary] = useState<BulkUploadSummaryResponse | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Estados de la bandeja de pendientes
  const [pendingList, setPendingList] = useState<ProductVariantEnrichmentResponse[]>([]);
  const [totalPending, setTotalPending] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [isLoadingPending, setIsLoadingPending] = useState<boolean>(false);

  // Estados de enriquecimiento en curso por ID de variante
  const [editingData, setEditingData] = useState<Record<string, { barcode: string; image: SingleImageValue | null }>>({});
  const [savingVariantId, setSavingVariantId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadPendingEnrichment(0);
    } else {
      // Reset al cerrar
      setSelectedFile(null);
      setIsDragging(false);
      setUploadSummary(null);
      setActiveTab('UPLOAD');
    }
  }, [isOpen]);

  const loadPendingEnrichment = async (page = 0) => {
    setIsLoadingPending(true);
    try {
      const res = await commercialService.getPendingEnrichment(page, 10);
      setPendingList(res.content || []);
      setTotalPending(res.totalElements || 0);
      setTotalPages(res.totalPages || 0);
      setCurrentPage(res.number || 0);

      // Inicializar valores editables
      const initialMap: Record<string, { barcode: string; image: SingleImageValue | null }> = {};
      (res.content || []).forEach(v => {
        initialMap[v.id] = {
          barcode: v.isInternalBarcode ? '' : (v.barCode || ''),
          image: v.imageUrl ? { preview: v.imageUrl } : null
        };
      });
      setEditingData(prev => ({ ...prev, ...initialMap }));
    } catch (err) {
      console.error('Error al cargar variantes pendientes:', err);
    } finally {
      setIsLoadingPending(false);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validExtensions = ['.xlsx', '.xls'];
    const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExt)) {
      toastError('Por favor selecciona un archivo Excel (.xlsx o .xls).');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (isUploading) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const mapUploadError = (err: any): string => {
    const status = err?.response?.status;
    const rawMsg = err?.response?.data?.message || err?.message || '';
    const msgStr = typeof rawMsg === 'string' ? rawMsg.trim() : '';

    // 1. Missing mandatory columns/data at row X: ...
    const missingColumnsMatch = msgStr.match(/Missing mandatory (?:columns|data) at row (\d+):\s*(.*)/i);
    if (missingColumnsMatch) {
      const row = missingColumnsMatch[1];
      const cols = missingColumnsMatch[2];
      return `Faltan columnas obligatorias en la fila ${row}: ${cols}`;
    }

    // 2. Variant 'X' already exists in the system for product 'Y' at row Z
    const variantExistsMatch = msgStr.match(/Variant\s*['"]([^'"]+)['"]\s*already exists(?:\s+in the system)?\s+for product\s*['"]([^'"]+)['"](?:\s+at row\s*(\d+))?/i);
    if (variantExistsMatch) {
      const variantName = variantExistsMatch[1];
      const prodName = variantExistsMatch[2];
      const row = variantExistsMatch[3];
      return row 
        ? `La variante '${variantName}' ya existe en el sistema para el producto '${prodName}' (fila ${row}).`
        : `La variante '${variantName}' ya existe en el sistema para el producto '${prodName}'.`;
    }

    // 3. Variant 'X' already exists for product 'Y' at row Z (patrón alternativo)
    const variantDuplicateMatch = msgStr.match(/Variant\s*['"]([^'"]+)['"]\s*already exists.*product\s*['"]([^'"]+)['"].*row\s*(\d+)/i);
    if (variantDuplicateMatch) {
      return `La variante '${variantDuplicateMatch[1]}' ya existe para el producto '${variantDuplicateMatch[2]}' (fila ${variantDuplicateMatch[3]}).`;
    }

    // 4. Archivo vacío o formato inválido
    if (/empty|invalid format/i.test(msgStr)) {
      return 'El archivo Excel está vacío o tiene un formato no válido.';
    }

    // 5. Mapeo por estado HTTP
    if (status === 400) {
      return msgStr || 'Datos no válidos en el archivo Excel. Verifica el formato.';
    }
    if (status === 403) {
      return 'No tienes permisos para realizar la carga masiva.';
    }
    if (status === 500) {
      return 'Error en el servidor al procesar el archivo Excel.';
    }
    return msgStr || 'Error al procesar la carga masiva.';
  };

  const handleProcessUpload = async () => {
    if (!selectedFile) {
      toastError('Selecciona un archivo Excel antes de continuar.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    try {
      const summary = await commercialService.uploadProductsBulk(selectedFile, {
        autoGenerateInternalBarcodes: autoGenInternalBarcodes
      });

      setUploadSummary(summary);
      setUploadError(null);
      toastSuccess('Carga masiva procesada exitosamente.');
      onSuccess?.();

      // Recargar lista de pendientes
      await loadPendingEnrichment(0);

      // Si no quedan pendientes, limpiar archivo
      if (fileInputRef.current) fileInputRef.current.value = '';
      setSelectedFile(null);
    } catch (err: any) {
      const errorMsg = mapUploadError(err);
      setUploadError(errorMsg);
      toastError(errorMsg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveVariant = async (variant: ProductVariantEnrichmentResponse) => {
    const data = editingData[variant.id];
    const barcodeValue = data?.barcode?.trim();

    // 1. Validar solo si falta código de barras
    if (variant.missingBarcode && !barcodeValue) {
      toastError('Ingresa o escanea un código de barras físico para la variante.');
      return;
    }

    // 2. Validar solo si falta imagen
    if (variant.missingImage && !data?.image?.file && !data?.image?.preview) {
      toastError('Toma una foto o selecciona una imagen para la variante.');
      return;
    }

    setSavingVariantId(variant.id);
    try {
      let finalImageUrl: string | null = variant.imageUrl || null;

      // Subir imagen solo si faltaba y se seleccionó un archivo local
      if (variant.missingImage && data?.image?.file) {
        try {
          const cleanProd = variant.productName.substring(0, 15).replace(/\s+/g, '-');
          const cleanVar = variant.variantName.substring(0, 15).replace(/\s+/g, '-');
          finalImageUrl = await uploadFile(
            data.image.file,
            STORAGE_FOLDERS.PRODUCTS,
            `${cleanProd}-${cleanVar}-${Date.now()}`
          );
        } catch (uploadErr) {
          console.error('Error subiendo imagen:', uploadErr);
          toastError('Error al subir la imagen.');
          setSavingVariantId(null);
          return;
        }
      } else if (variant.missingImage && data?.image?.preview) {
        finalImageUrl = data.image.preview;
      }

      // Determinar código final (si faltaba se usa el nuevo, sino se mantiene el existente)
      const finalBarcode = variant.missingBarcode ? (barcodeValue || '') : (variant.barCode || '');

      await commercialService.updateProductVariant(variant.id, {
        productId: variant.productId,
        name: variant.variantName,
        sku: variant.sku,
        barCode: finalBarcode,
        imageUrl: finalImageUrl,
        status: true
      });

      toastSuccess(`Variante "${variant.variantName}" completada exitosamente.`);
      onSuccess?.();

      // Remover de la lista local inmediatamente y refrescar
      setPendingList(prev => prev.filter(item => item.id !== variant.id));
      setTotalPending(prev => Math.max(0, prev - 1));

      // Si la lista quedó vacía y hay más páginas, recargar
      if (pendingList.length <= 1) {
        await loadPendingEnrichment(currentPage > 0 ? currentPage - 1 : 0);
      }
    } catch (err: any) {
      const status = err?.response?.status;
      const msg = err?.response?.data?.message;
      if (status === 400) {
        toastError('Datos no válidos al actualizar la variante.');
      } else if (status === 403) {
        toastError('No tienes permisos para modificar variantes.');
      } else {
        toastError(msg || 'Error al guardar la variante.');
      }
    } finally {
      setSavingVariantId(null);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2 text-base sm:text-lg font-bold">
          <FileSpreadsheet size={22} className="text-primary" />
          Carga Masiva de Catálogo
        </span>
      }
      size="xl"
      variant="view"
    >
      <div className="space-y-5">
        {/* PESTAÑAS SUPERIORES */}
        <div className="flex border-b border-base-300 gap-1 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('UPLOAD')}
            className={`py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'UPLOAD'
                ? 'bg-base-100 text-primary border-base-300 -mb-[1px] border-b-base-100 shadow-xs'
                : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-300/30'
            }`}
          >
            1. Subir Archivo Excel
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('PENDING');
              loadPendingEnrichment(0);
            }}
            className={`py-2.5 px-3.5 sm:px-4 text-xs sm:text-sm font-bold rounded-t-xl transition-all flex items-center gap-2 border-t border-x ${
              activeTab === 'PENDING'
                ? 'bg-base-100 text-primary border-base-300 -mb-[1px] border-b-base-100 shadow-xs'
                : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-300/30'
            }`}
          >
            2. Actualizar Pendientes
            {totalPending > 0 && (
              <span className="badge badge-warning badge-xs sm:badge-sm font-mono font-bold">
                {totalPending}
              </span>
            )}
          </button>
        </div>

        {/* PESTAÑA 1: SUBIR EXCEL */}
        {activeTab === 'UPLOAD' && (
          <div className="space-y-5 animate-fade-in">
            {/* Zona de Selección y Arrastre de Archivo */}
            <div
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                isDragging
                  ? 'border-primary bg-primary/10 ring-4 ring-primary/20 scale-[1.01]'
                  : 'border-base-300 hover:border-primary/50 bg-base-100 shadow-sm'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx, .xls"
                className="hidden"
                id="excel-bulk-upload-input"
                disabled={isUploading}
              />
              
              {!selectedFile ? (
                <label
                  htmlFor="excel-bulk-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-2 py-4 select-none"
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                    isDragging ? 'bg-primary text-white scale-110 shadow-md' : 'bg-primary/10 text-primary'
                  }`}>
                    <FileSpreadsheet size={28} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-base-content">
                      {isDragging ? '¡Suelta tu archivo Excel aquí!' : 'Haz clic para seleccionar o arrastra tu archivo Excel aquí'}
                    </p>
                    <p className="text-xs text-base-content/50 mt-1">
                      Formatos compatibles: .xlsx, .xls
                    </p>
                  </div>
                </label>
              ) : (
                <div className="flex items-center justify-between bg-base-200/50 p-3.5 rounded-xl border border-base-300">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-2.5 rounded-lg bg-success/10 text-success shrink-0">
                      <FileSpreadsheet size={22} />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="font-bold text-sm text-base-content truncate">{selectedFile.name}</p>
                      <p className="text-xs text-base-content/50 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    disabled={isUploading}
                    className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10"
                    title="Quitar archivo"
                  >
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Opciones de Configuración */}
            <div 
              onClick={() => !isUploading && setAutoGenInternalBarcodes(prev => !prev)}
              className="flex items-center justify-between gap-3 bg-base-100 hover:bg-base-100/90 p-3.5 sm:p-4 rounded-2xl border border-base-300 shadow-sm cursor-pointer select-none transition-colors"
            >
              <div className="flex flex-col min-w-0 flex-1 pr-1 text-left">
                <span className="text-xs sm:text-sm font-bold text-base-content leading-tight">
                  Generar códigos de barras internos
                </span>
                <span className="text-[11px] text-base-content/60 mt-0.5 leading-normal">
                  Crea automáticamente códigos únicos para variantes sin código físico.
                </span>
              </div>
              <div className="shrink-0 pl-2">
                <ComerziaSwitch
                  checked={autoGenInternalBarcodes}
                  onChange={() => setAutoGenInternalBarcodes(prev => !prev)}
                  disabled={isUploading}
                />
              </div>
            </div>

            {/* Alerta de Error Detallado (Fila y Columnas Faltantes / Duplicados) */}
            {uploadError && (
              <div className="alert alert-error text-xs sm:text-sm p-3.5 rounded-xl shadow-xs flex items-start gap-2.5 animate-fade-in">
                <AlertTriangle size={18} className="shrink-0 mt-0.5 text-error-content" />
                <div className="min-w-0 flex-1 text-left">
                  <span className="font-bold block text-error-content mb-0.5">No se pudo procesar el archivo Excel:</span>
                  <p className="text-error-content/90 leading-relaxed font-medium break-words">
                    {uploadError}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadError(null)}
                  className="btn btn-ghost btn-xs btn-circle text-error-content hover:bg-error-content/20 shrink-0"
                  title="Cerrar advertencia"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Botón de Procesar */}
            <div className="flex justify-end gap-3 pt-2">
              <ComerziaButton
                variant="primary"
                label={isUploading ? 'Procesando Excel...' : 'Procesar Archivo Excel'}
                icon={isUploading ? undefined : <Upload size={18} />}
                isLoading={isUploading}
                disabled={!selectedFile || isUploading}
                onClick={handleProcessUpload}
                className="w-full sm:w-auto"
              />
            </div>

            {/* Tarjeta de Resumen Posterior a la Carga */}
            {uploadSummary && (
              <div className="bg-base-100 rounded-2xl border border-success/30 p-4 sm:p-5 shadow-xs space-y-4 animate-fade-in">
                <div className="flex items-center gap-2 text-success font-bold text-sm sm:text-base">
                  <CheckCircle2 size={20} />
                  <span>Resumen de Carga Masiva</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-base-content/50">Productos Creados</p>
                    <p className="text-xl font-black font-mono text-primary mt-0.5">
                      {uploadSummary.totalProductsCreated}
                    </p>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-base-content/50">Variantes Creadas</p>
                    <p className="text-xl font-black font-mono text-base-content mt-0.5">
                      {uploadSummary.totalVariantsCreated}
                    </p>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-base-content/50">Sin Código Real</p>
                    <p className="text-xl font-black font-mono text-warning mt-0.5">
                      {uploadSummary.missingBarcodesCount}
                    </p>
                  </div>

                  <div className="bg-base-200/50 p-3 rounded-xl text-center">
                    <p className="text-[10px] uppercase font-bold text-base-content/50">Sin Imagen</p>
                    <p className="text-xl font-black font-mono text-info mt-0.5">
                      {uploadSummary.missingImagesCount}
                    </p>
                  </div>
                </div>

                {(uploadSummary.missingBarcodesCount > 0 || uploadSummary.missingImagesCount > 0) && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-base-200">
                    <p className="text-xs text-base-content/70 text-center sm:text-left">
                      Hay variantes que requieren escanear su código físico o tomarles una foto.
                    </p>
                    <ComerziaButton
                      variant="secondary"
                      label="Ir a Actualizar Datos"
                      icon={<Sparkles size={16} />}
                      onClick={() => setActiveTab('PENDING')}
                      className="btn-sm w-full sm:w-auto"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: ACTUALIZAR PENDIENTES */}
        {activeTab === 'PENDING' && (
          <div className="space-y-4 animate-fade-in w-full overflow-x-hidden">
            {/* Cabecera de la Bandeja */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-1">
              <div>
                <h3 className="font-bold text-sm text-base-content flex items-center gap-2">
                  <Layers size={16} className="text-primary shrink-0" />
                  Productos Incompletas ({totalPending})
                </h3>
              </div>
            </div>

            {/* Listado de Variantes Pendientes */}
            {isLoadingPending ? (
              <div className="flex justify-center items-center py-12">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : pendingList.length === 0 ? (
              <div className="bg-base-200/40 rounded-2xl border border-base-300 p-8 text-center space-y-2">
                <PackageCheck size={40} className="text-success mx-auto stroke-[1.5]" />
                <h4 className="font-bold text-base-content text-sm sm:text-base">
                  ¡Excelente! No hay variantes pendientes de actualizar
                </h4>
                <p className="text-xs text-base-content/50 max-w-sm mx-auto">
                  Todas las variantes del catálogo cuentan con su código de barras físico e imagen asignada.
                </p>
              </div>
            ) : (
              <div className="space-y-4 w-full overflow-x-hidden">
                {pendingList.map((item) => {
                  const data = editingData[item.id] || { barcode: '', image: null };
                  const isSaving = savingVariantId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="bg-base-100 rounded-2xl border border-base-300 shadow-sm overflow-hidden space-y-0 transition-all hover:shadow-md"
                    >
                      {/* Cabecera del Item con fondo gris sombreado */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-base-200/80 px-4 py-3 border-b border-base-300">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-sm text-base-content break-words">
                              {item.productName}
                            </span>
                            <span className="text-xs font-semibold text-primary break-words">
                              · {item.variantName}
                            </span>
                          </div>
                        </div>

                        {/* Badges de Estado */}
                        <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                          {item.missingBarcode && (
                            <span className="badge badge-warning badge-xs sm:badge-sm font-semibold flex items-center gap-1 shadow-xs">
                              <Barcode size={12} /> Falta Código
                            </span>
                          )}
                          {item.missingImage && (
                            <span className="badge badge-error badge-xs sm:badge-sm font-semibold flex items-center gap-1 shadow-xs text-white">
                              <ImageIcon size={12} /> Falta Foto
                            </span>
                          )}
                          {item.isInternalBarcode && (
                            <span className="badge badge-ghost badge-xs sm:badge-sm font-mono text-base-content/70 border-base-300" title="Código interno autogenerado">
                              Interno: {item.barCode}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Cuerpo de la Tarjeta */}
                      <div className="p-4 space-y-3.5 bg-base-100">
                        {/* Formulario Rápido de Enriquecimiento (Condicional y Adaptable) */}
                        <div className={`grid gap-3.5 items-end ${
                          item.missingBarcode && item.missingImage ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'
                        }`}>
                          {/* 1. Código de Barras Físico con Escáner (Solo si falta) */}
                          {item.missingBarcode ? (
                            <div className="bg-base-200/40 rounded-xl p-3 border border-base-300/80 shadow-2xs">
                              <ProductFormBarcodeField
                                label="Código de Barras"
                                placeholder="Escanea o escribe el código"
                                value={data.barcode}
                                onChange={(val) => {
                                  setEditingData(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      barcode: val
                                    }
                                  }));
                                }}
                                disabled={isSaving}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/30 shadow-2xs">
                              <div className="p-2 rounded-lg bg-success/15 text-success shrink-0">
                                <Barcode size={18} />
                              </div>
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[10px] font-semibold uppercase text-base-content/60 tracking-wide">
                                  Código de Barras
                                </span>
                                <span className="font-mono text-xs font-bold text-base-content truncate">
                                  {item.barCode}
                                </span>
                              </div>
                              <span className="badge badge-success badge-xs font-semibold shrink-0">Asignado</span>
                            </div>
                          )}

                          {/* 2. Carga / Captura de Foto (Solo si falta) */}
                          {item.missingImage ? (
                            <div className="bg-base-200/40 rounded-xl p-3 border border-base-300/80 shadow-2xs">
                              <ComerziaSingleImageUploader
                                label="Foto de la Variante"
                                value={data.image}
                                compact={true}
                                onChange={(imgVal) => {
                                  setEditingData(prev => ({
                                    ...prev,
                                    [item.id]: {
                                      ...prev[item.id],
                                      image: imgVal
                                    }
                                  }));
                                }}
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-3 p-3 rounded-xl bg-success/5 border border-success/30 shadow-2xs">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl} 
                                  alt={item.variantName} 
                                  className="w-12 h-12 rounded-lg object-cover border border-success/30 shrink-0 bg-base-100" 
                                />
                              ) : (
                                <div className="w-12 h-12 rounded-lg bg-base-200 flex items-center justify-center shrink-0 border border-base-300">
                                  <ImageIcon size={20} className="text-base-content/40" />
                                </div>
                              )}
                              <div className="flex flex-col min-w-0 flex-1">
                                <span className="text-[10px] font-semibold uppercase text-base-content/60 tracking-wide">
                                  Foto de la Variante
                                </span>
                                <span className="text-xs font-bold text-success flex items-center gap-1 mt-0.5">
                                  <CheckCircle2 size={14} /> Foto asignada
                                </span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Botón de Guardar Variante */}
                        <div className="flex justify-end pt-2 border-t border-base-200/70">
                          <ComerziaButton
                            variant="save"
                            label={isSaving ? 'Guardando...' : 'Guardar y Completar'}
                            icon={<CheckCircle2 size={16} />}
                            isLoading={isSaving}
                            disabled={isSaving}
                            onClick={() => handleSaveVariant(item)}
                            className="btn-sm w-full sm:w-auto"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Paginación Estandarizada Comerzia */}
            {totalPages > 1 && (
              <footer className="mt-4 pt-3 pb-3 px-3 bg-base-200/60 border border-base-300 rounded-2xl shadow-xs">
                <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-base-content/70 gap-2.5">
                  <span className="font-semibold text-base-content/80 whitespace-nowrap">
                    Página {currentPage + 1} de {Math.max(1, totalPages)} ({totalPending} pendientes)
                  </span>

                  {/* BOTONES DE NAVEGACIÓN */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Primera página"
                      disabled={currentPage === 0 || isLoadingPending}
                      onClick={() => loadPendingEnrichment(0)}
                      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      title="Primera página"
                    >
                      <ChevronsLeft size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Página anterior"
                      disabled={currentPage === 0 || isLoadingPending}
                      onClick={() => loadPendingEnrichment(Math.max(0, currentPage - 1))}
                      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      title="Página anterior"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Página siguiente"
                      disabled={currentPage >= totalPages - 1 || isLoadingPending}
                      onClick={() => loadPendingEnrichment(currentPage + 1)}
                      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      title="Página siguiente"
                    >
                      <ChevronRight size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Última página"
                      disabled={currentPage >= totalPages - 1 || isLoadingPending}
                      onClick={() => loadPendingEnrichment(totalPages - 1)}
                      className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      title="Última página"
                    >
                      <ChevronsRight size={16} />
                    </button>
                  </div>
                </div>
              </footer>
            )}
          </div>
        )}
      </div>
    </ComerziaModal>
  );
};
