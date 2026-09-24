import { useState, useEffect, useMemo } from 'react';
import { isAxiosError } from 'axios';
import { commercialService } from '../services/commercialService';
import { branchService } from '../../organization/services/branchService';
import type { TenantActiveBranchResponse } from '../../organization/types/branch';
import type {
  CategoryResponse,
  SegmentResponse,
  BrandResponse,
  ReplenishmentMetricsResponse,
  ReplenishmentReportResponse
} from '../types/commercial';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BtnSaveIcon } from '../../../components/ui/CrudButtons';
import { BulkStockLimitsModal } from '../components/BulkStockLimitsModal';
import { useToast } from '../../../context/ToastContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { useAuthStore } from '../../../stores/useAuthStore';
import {
  Boxes,
  Store,
  PackageX,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  Package,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  TrendingDown,
  X
} from 'lucide-react';

export interface ReplenishmentReportRowItem extends ReplenishmentReportResponse {
  id: string;
}

interface InlineRowEditState {
  minStock: number | '';
  idealStock: number | '';
  isSaving: boolean;
  hasChanged: boolean;
}

export const StockReportsPage = () => {
  const { hasPermission } = useAuthStore();
  const canManageStock = hasPermission('COM_STOCK_MANAGE') || hasPermission('COM_STOCK_WRITE');
  const { error: toastError, success: toastSuccess } = useToast();

  // Diccionarios
  const { options: dictOptions } = useLoadDictionaries([DICTIONARIES.REPLENISHMENT_STATUS]);
  const replenishmentStatusOptions = dictOptions[DICTIONARIES.REPLENISHMENT_STATUS] || [];

  // Sucursales
  const [branches, setBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(false);

  // Categorías, Segmentos y Marcas
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [segments, setSegments] = useState<SegmentResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState<boolean>(false);

  // Filtros de búsqueda y estado
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 350);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Métricas / KPIs
  const [metrics, setMetrics] = useState<ReplenishmentMetricsResponse | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Datos de la Tabla
  const [reportData, setReportData] = useState<ReplenishmentReportRowItem[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // Selección múltiple para actualización masiva
  const [selectedVariantIds, setSelectedVariantIds] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);

  // Estado de edición individual en línea
  const [inlineEdits, setInlineEdits] = useState<Record<string, InlineRowEditState>>({});

  // 1. Cargar sucursales activas al inicio
  useEffect(() => {
    const loadBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const branchList = await branchService.getActiveBranches();
        setBranches(branchList || []);
        if (branchList && branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
        }
      } catch (err) {
        console.error('Error loading active branches:', err);
        toastError('No se pudieron cargar las sucursales disponibles.');
      } finally {
        setIsLoadingBranches(false);
      }
    };
    loadBranches();
  }, []);

  // 2. Cargar categorías activas
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const catList = await commercialService.getCategories(true);
        setCategories(catList || []);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  // 3. Cargar segmentos cuando cambia categoría
  useEffect(() => {
    if (selectedCategoryId) {
      setIsLoadingSegments(true);
      commercialService
        .getSegmentsByCategory(selectedCategoryId, true)
        .then(res => setSegments(res || []))
        .catch(err => console.error('Error loading segments:', err))
        .finally(() => setIsLoadingSegments(false));
    } else {
      setSegments([]);
    }
    setSelectedSegmentId('');
    setSelectedBrandId('');
    setBrands([]);
    setPage(0);
  }, [selectedCategoryId]);

  // 4. Cargar marcas cuando cambia segmento
  useEffect(() => {
    if (selectedSegmentId) {
      setIsLoadingBrands(true);
      commercialService
        .getBrandsBySegment(selectedSegmentId, true)
        .then(res => setBrands(res || []))
        .catch(err => console.error('Error loading brands:', err))
        .finally(() => setIsLoadingBrands(false));
    } else {
      setBrands([]);
    }
    setSelectedBrandId('');
    setPage(0);
  }, [selectedSegmentId]);

  // 5. Cargar métricas (KPIs)
  const loadMetrics = async () => {
    if (!selectedBranchId) return;
    setIsLoadingMetrics(true);
    try {
      const res = await commercialService.getReplenishmentMetrics({
        branchId: selectedBranchId,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined
      });
      setMetrics(res);
    } catch (err) {
      console.error('Error loading replenishment metrics:', err);
      setMetrics(null);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // Búsqueda con validación de mínimo 3 caracteres
  const cleanSearch = debouncedSearch.trim();
  const effectiveSearch = cleanSearch.length >= 3 ? cleanSearch : '';

  // 6. Cargar reporte paginado
  const loadReport = async (targetPage = page, targetSize = size) => {
    if (!selectedBranchId) return;
    setIsLoadingReport(true);
    try {
      const res = await commercialService.getReplenishmentReport({
        branchId: selectedBranchId,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined,
        search: effectiveSearch || undefined,
        status: selectedStatus || undefined,
        page: targetPage,
        size: targetSize
      });
      const rows: ReplenishmentReportRowItem[] = (res.content || []).map(row => ({
        ...row,
        id: row.variantId
      }));
      setReportData(rows);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 0);

      // Inicializar el estado de edición en línea con los valores cargados
      const initialEdits: Record<string, InlineRowEditState> = {};
      rows.forEach(row => {
        initialEdits[row.variantId] = {
          minStock: row.minStock,
          idealStock: row.idealStock,
          isSaving: false,
          hasChanged: false
        };
      });
      setInlineEdits(initialEdits);
    } catch (err) {
      console.error('Error loading replenishment report:', err);
      setReportData([]);
      toastError('No se pudo cargar el reporte de reabastecimiento.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // 1. Efecto: Cargar métricas solo cuando cambia la sucursal o los filtros de jerarquía (Categoría, Segmento, Marca)
  useEffect(() => {
    if (selectedBranchId) {
      loadMetrics();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, selectedCategoryId, selectedSegmentId, selectedBrandId]);

  // 2. Reset de paginación al cambiar filtros o búsqueda efectiva
  useEffect(() => {
    setPage(0);
  }, [selectedBranchId, selectedCategoryId, selectedSegmentId, selectedBrandId, effectiveSearch, selectedStatus]);

  // 3. Efecto: Cargar reporte cuando cambia cualquier filtro, búsqueda efectiva, estado o paginación
  useEffect(() => {
    if (selectedBranchId) {
      loadReport(page, size);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedBranchId,
    selectedCategoryId,
    selectedSegmentId,
    selectedBrandId,
    effectiveSearch,
    selectedStatus,
    page,
    size
  ]);

  // Manejador para togglear filtros rápidos por KPI
  const handleKpiFilterToggle = (statusCode: string) => {
    setSelectedStatus(prev => (prev === statusCode ? '' : statusCode));
    setPage(0);
  };

  // Manejador de cambios en inputs en línea (minStock o idealStock)
  const handleInlineChange = (
    variantId: string,
    field: 'minStock' | 'idealStock',
    value: number | ''
  ) => {
    setInlineEdits(prev => {
      const current = prev[variantId] || { minStock: 0, idealStock: 1, isSaving: false, hasChanged: false };
      const updated = {
        ...current,
        [field]: value,
        hasChanged: true
      };
      return { ...prev, [variantId]: updated };
    });
  };

  // Guardar cambio individual de una fila
  const handleSaveInlineRow = async (variantId: string) => {
    const edit = inlineEdits[variantId];
    if (!edit || !selectedBranchId) return;

    const minStockNum = edit.minStock === '' ? 0 : Number(edit.minStock);
    const idealStockNum = edit.idealStock === '' ? 1 : Number(edit.idealStock);

    if (minStockNum < 0) {
      toastError('El stock mínimo no puede ser negativo.');
      return;
    }
    if (idealStockNum < 1) {
      toastError('El stock ideal debe ser al menos 1 unidad.');
      return;
    }
    if (minStockNum > idealStockNum) {
      toastError('El stock mínimo no puede superar el stock ideal.');
      return;
    }

    setInlineEdits(prev => ({
      ...prev,
      [variantId]: { ...prev[variantId], isSaving: true }
    }));

    try {
      await commercialService.updateBranchStockSettings({
        branchId: selectedBranchId,
        settings: [
          {
            variantId,
            minStock: minStockNum,
            idealStock: idealStockNum
          }
        ]
      });
      toastSuccess('Límites de stock actualizados correctamente.');
      setInlineEdits(prev => ({
        ...prev,
        [variantId]: { ...prev[variantId], minStock: minStockNum, idealStock: idealStockNum, isSaving: false, hasChanged: false }
      }));
      // Recargar reporte y métricas
      loadReport(page, size);
      loadMetrics();
    } catch (err: unknown) {
      let message = 'Error al guardar los límites de stock.';
      if (isAxiosError(err)) {
        const data = err.response?.data as { errorCode?: string; code?: string; message?: string } | undefined;
        const errorCode = data?.errorCode || data?.code;
        if (errorCode === 'invalid_stock_settings') {
          message = 'El stock mínimo no puede superar el stock ideal.';
        } else if (data?.message) {
          message = data.message;
        }
      }
      toastError(message);
      setInlineEdits(prev => ({
        ...prev,
        [variantId]: { ...prev[variantId], isSaving: false }
      }));
    }
  };

  // Selección de filas
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedVariantIds(reportData.map(r => r.variantId));
    } else {
      setSelectedVariantIds([]);
    }
  };

  const handleToggleSelectRow = (variantId: string) => {
    setSelectedVariantIds(prev =>
      prev.includes(variantId) ? prev.filter(id => id !== variantId) : [...prev, variantId]
    );
  };

  const selectedVariantsForBulk = useMemo(() => {
    return reportData
      .filter(r => selectedVariantIds.includes(r.variantId))
      .map(r => ({
        variantId: r.variantId,
        productName: r.productName,
        variantName: r.variantName
      }));
  }, [reportData, selectedVariantIds]);

  const selectedBranchName = useMemo(() => {
    return branches.find(b => b.id === selectedBranchId)?.name || '';
  }, [branches, selectedBranchId]);

  // Helper para resolver etiqueta y variante de status
  const getStatusInfo = (status: { code: number; label: string } | number | string) => {
    let code: number | string = typeof status === 'object' && status !== null ? status.code : status;
    let label = '';

    if (typeof status === 'object' && status !== null) {
      label = status.label;
    } else if (typeof status === 'string') {
      if (status === 'OUT_OF_STOCK') code = 341;
      else if (status === 'LOW_STOCK') code = 342;
      else if (status === 'HEALTHY') code = 343;
      else if (status === 'OVER_STOCK') code = 344;
    }

    if (!label) {
      const found = replenishmentStatusOptions.find(o => String(o.value) === String(code));
      if (found) label = found.label;
      else if (code === 341 || code === 'OUT_OF_STOCK') label = 'Agotado';
      else if (code === 342 || code === 'LOW_STOCK') label = 'Stock Bajo';
      else if (code === 343 || code === 'HEALTHY') label = 'Saludable';
      else if (code === 344 || code === 'OVER_STOCK') label = 'Sobre Stock';
      else label = String(code);
    }

    let variant: 'error' | 'warning' | 'success' | 'info' | 'ghost' = 'ghost';
    if (code === 341 || code === 'OUT_OF_STOCK') variant = 'error';
    else if (code === 342 || code === 'LOW_STOCK') variant = 'warning';
    else if (code === 343 || code === 'HEALTHY') variant = 'success';
    else if (code === 344 || code === 'OVER_STOCK') variant = 'info';

    return { code, label, variant };
  };

  // Configuración de columnas para ComerziaTable
  const columns: Column<ReplenishmentReportRowItem>[] = [
    {
      header: (
        <div className="flex items-center justify-center">
          <ComerziaCheckbox
            checked={reportData.length > 0 && selectedVariantIds.length === reportData.length}
            indeterminate={selectedVariantIds.length > 0 && selectedVariantIds.length < reportData.length}
            onChange={checked => handleSelectAll(checked)}
            title="Seleccionar todos los productos de la página"
            size="md"
          />
        </div>
      ),
      className: 'w-12 text-center',
      render: row => (
        <div className="flex items-center justify-center" onClick={e => e.stopPropagation()}>
          <ComerziaCheckbox
            checked={selectedVariantIds.includes(row.variantId)}
            onChange={() => handleToggleSelectRow(row.variantId)}
            title={`Seleccionar ${row.productName}`}
            size="md"
          />
        </div>
      )
    },
    {
      header: 'Producto / Variante',
      className: 'min-w-[240px]',
      render: row => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.productName}
              className="w-10 h-10 object-cover rounded-xl border border-base-200 shrink-0 bg-base-200/50"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-base-200 flex items-center justify-center text-base-content/40 shrink-0 border border-base-200">
              <Package size={20} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h4 className="font-bold text-xs sm:text-sm text-base-content truncate leading-tight">
              {row.productName}
            </h4>
            <span className="text-[11px] text-base-content/60 font-medium block truncate">
              {row.variantName}
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              {row.sku && (
                <span className="text-[10px] font-mono text-base-content/50 bg-base-200 px-1.5 py-0.2 rounded">
                  {row.sku}
                </span>
              )}
              {row.barCode && (
                <span className="text-[10px] font-mono text-base-content/40">
                  {row.barCode}
                </span>
              )}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Categoría / Marca',
      render: row => (
        <div className="text-xs space-y-0.5">
          <span className="font-medium text-base-content block truncate">{row.categoryName || '-'}</span>
          <span className="text-base-content/50 text-[11px] block truncate">{row.brandName || '-'}</span>
        </div>
      )
    },
    {
      header: 'Stock Actual',
      className: 'text-center',
      render: row => {
        const isOut = row.currentStock <= 0;
        const isLow = row.currentStock > 0 && row.currentStock <= row.minStock;
        return (
          <div className="text-center font-mono">
            <span
              className={`text-sm font-bold ${
                isOut ? 'text-error' : isLow ? 'text-warning' : 'text-base-content'
              }`}
            >
              {row.currentStock}
            </span>{' '}
            <span className="text-[11px] text-base-content/50">uds</span>
          </div>
        );
      }
    },
    {
      header: 'Estado de Salud',
      className: 'text-center',
      render: row => {
        const { label, variant } = getStatusInfo(row.status);
        return <ComerziaBadge label={label} variant={variant} />;
      }
    },
    {
      header: 'Stock Mín.',
      className: 'w-24 text-center',
      render: row => {
        const edit = inlineEdits[row.variantId] || { minStock: row.minStock, idealStock: row.idealStock };
        if (!canManageStock) {
          return <span className="font-mono text-xs font-semibold">{row.minStock} uds</span>;
        }
        return (
          <div className="flex items-center justify-center w-20 mx-auto">
            <ComerziaInput
              type="number"
              min={0}
              placeholder="0"
              value={edit.minStock}
              onChange={e => handleInlineChange(row.variantId, 'minStock', e.target.value === '' ? '' : Number(e.target.value))}
              className="input-xs text-center font-mono font-semibold"
              title="Umbral de alerta para Stock Bajo"
            />
          </div>
        );
      }
    },
    {
      header: 'Stock Ideal',
      className: 'w-24 text-center',
      render: row => {
        const edit = inlineEdits[row.variantId] || { minStock: row.minStock, idealStock: row.idealStock };
        if (!canManageStock) {
          return <span className="font-mono text-xs font-semibold">{row.idealStock} uds</span>;
        }
        return (
          <div className="flex items-center justify-center w-20 mx-auto">
            <ComerziaInput
              type="number"
              min={1}
              placeholder="1"
              value={edit.idealStock}
              onChange={e => handleInlineChange(row.variantId, 'idealStock', e.target.value === '' ? '' : Number(e.target.value))}
              className="input-xs text-center font-mono font-semibold"
              title="Meta de stock para sugerencia de pedidos"
            />
          </div>
        );
      }
    },
    {
      header: 'Pedido Sugerido',
      className: 'text-center',
      render: row => {
        const toOrder = row.suggestedOrderQuantity;
        return (
          <div className="text-center font-mono">
            {toOrder > 0 ? (
              <span className="badge badge-primary badge-sm font-bold gap-1 px-2.5">
                <TrendingDown size={12} />
                +{toOrder} uds
              </span>
            ) : (
              <span className="text-xs text-base-content/40 font-medium">0 uds</span>
            )}
          </div>
        );
      }
    },
    ...(canManageStock
      ? [
          {
            header: 'Acción',
            className: 'w-16 text-center',
            render: (row: ReplenishmentReportRowItem) => {
              const edit = inlineEdits[row.variantId];
              const hasChanged = edit?.hasChanged;
              const isSaving = edit?.isSaving;

              if (!hasChanged) {
                return <span className="text-base-content/20 text-xs font-mono">-</span>;
              }

              return (
                <div className="flex items-center justify-center animate-pulse">
                  <BtnSaveIcon
                    onClick={() => handleSaveInlineRow(row.variantId)}
                    isLoading={isSaving}
                    title="Guardar cambios de stock mínimo e ideal"
                  />
                </div>
              );
            }
          }
        ]
      : [])
  ];

  const pagination: TablePaginationConfig = {
    currentPage: page,
    totalPages,
    totalElements,
    pageSize: size,
    onPageChange: newPage => setPage(newPage),
    onPageSizeChange: newSize => {
      setSize(newSize);
      setPage(0);
    }
  };

  return (
    <div className="space-y-6 w-full animate-fade-in pb-12">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2.5">
            <Boxes className="w-7 h-7 text-primary" />
            Reporte de Stock y Reabastecimiento
          </h1>
          <p className="text-sm text-base-content/60 mt-1 leading-relaxed">
            Supervisa el estado del inventario por tienda, detecta productos críticos y calcula pedidos sugeridos.
          </p>
        </div>

        {/* Selector de Sucursal Principal */}
        <div className="w-full sm:w-72">
          <label className="text-xs font-bold text-base-content/70 block mb-1 flex items-center gap-1.5">
            <Store size={14} className="text-primary" />
            Sucursal / Tienda Activa:
          </label>
          <ComerziaSelect
            placeholder="Seleccione sucursal..."
            value={selectedBranchId}
            onChange={e => {
              setSelectedBranchId(e.target.value);
              setPage(0);
              setSelectedVariantIds([]);
            }}
            options={branches.map(b => ({
              value: b.id,
              label: b.name
            }))}
            isLoading={isLoadingBranches}
            isRequired
          />
        </div>
      </div>

      {/* 2. TARJETAS RESUMEN DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Agotados */}
        <div
          onClick={() => handleKpiFilterToggle('341')}
          className={`card p-4 rounded-2xl transition-all cursor-pointer select-none outline-none ${
            selectedStatus === '341'
              ? 'bg-red-500/10 border-2 !border-red-500 shadow-sm shadow-red-500/10'
              : 'bg-base-100 border border-base-200 hover:border-red-500/50 hover:bg-red-500/5 shadow-xs'
          }`}
          style={selectedStatus === '341' ? { borderColor: '#ef4444' } : undefined}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Agotados</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedStatus === '341' ? 'bg-red-500 text-white shadow-xs' : 'bg-red-500/10 text-red-500'
              }`}
              style={selectedStatus === '341' ? { backgroundColor: '#ef4444', color: '#ffffff' } : undefined}
            >
              <PackageX size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-red-500">
              {isLoadingMetrics ? '...' : metrics?.outOfStockCount || 0}
            </span>
            <span className="text-xs text-base-content/50">productos</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-base-content/60">
              Stock disponible = 0 uds
            </span>
            {selectedStatus === '341' && (
              <span className="badge bg-red-500 border-none text-white text-[10px] font-bold py-1 px-1.5 shadow-2xs">
                Filtro activo
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Stock Bajo */}
        <div
          onClick={() => handleKpiFilterToggle('342')}
          className={`card p-4 rounded-2xl transition-all cursor-pointer select-none outline-none ${
            selectedStatus === '342'
              ? 'bg-amber-500/10 border-2 !border-amber-500 shadow-sm shadow-amber-500/10'
              : 'bg-base-100 border border-base-200 hover:border-amber-500/50 hover:bg-amber-500/5 shadow-xs'
          }`}
          style={selectedStatus === '342' ? { borderColor: '#f59e0b' } : undefined}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Stock Bajo</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedStatus === '342' ? 'bg-amber-500 text-white shadow-xs' : 'bg-amber-500/10 text-amber-500'
              }`}
              style={selectedStatus === '342' ? { backgroundColor: '#f59e0b', color: '#ffffff' } : undefined}
            >
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-500">
              {isLoadingMetrics ? '...' : metrics?.lowStockCount || 0}
            </span>
            <span className="text-xs text-base-content/50">productos</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-base-content/60">
              Por debajo del Stock Mínimo
            </span>
            {selectedStatus === '342' && (
              <span className="badge bg-amber-500 border-none text-white text-[10px] font-bold py-1 px-1.5 shadow-2xs">
                Filtro activo
              </span>
            )}
          </div>
        </div>

        {/* KPI 3: Saludable */}
        <div
          onClick={() => handleKpiFilterToggle('343')}
          className={`card p-4 rounded-2xl transition-all cursor-pointer select-none outline-none ${
            selectedStatus === '343'
              ? 'bg-emerald-500/10 border-2 !border-emerald-500 shadow-sm shadow-emerald-500/10'
              : 'bg-base-100 border border-base-200 hover:border-emerald-500/50 hover:bg-emerald-500/5 shadow-xs'
          }`}
          style={selectedStatus === '343' ? { borderColor: '#10b981' } : undefined}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Saludable</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedStatus === '343' ? 'bg-emerald-500 text-white shadow-xs' : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              }`}
              style={selectedStatus === '343' ? { backgroundColor: '#10b981', color: '#ffffff' } : undefined}
            >
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
              {isLoadingMetrics ? '...' : metrics?.healthyStockCount || 0}
            </span>
            <span className="text-xs text-base-content/50">productos</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-base-content/60">
              Dentro del rango óptimo
            </span>
            {selectedStatus === '343' && (
              <span className="badge bg-emerald-500 border-none text-white text-[10px] font-bold py-1 px-1.5 shadow-2xs">
                Filtro activo
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: Sobre Stock */}
        <div
          onClick={() => handleKpiFilterToggle('344')}
          className={`card p-4 rounded-2xl transition-all cursor-pointer select-none outline-none ${
            selectedStatus === '344'
              ? 'bg-sky-500/10 border-2 !border-sky-500 shadow-sm shadow-sky-500/10'
              : 'bg-base-100 border border-base-200 hover:border-sky-500/50 hover:bg-sky-500/5 shadow-xs'
          }`}
          style={selectedStatus === '344' ? { borderColor: '#0ea5e9' } : undefined}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-sky-500 uppercase tracking-wider">Sobre Stock</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                selectedStatus === '344' ? 'bg-sky-500 text-white shadow-xs' : 'bg-sky-500/10 text-sky-500'
              }`}
              style={selectedStatus === '344' ? { backgroundColor: '#0ea5e9', color: '#ffffff' } : undefined}
            >
              <Layers size={18} />
            </div>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-sky-500">
              {isLoadingMetrics ? '...' : metrics?.overStockCount || 0}
            </span>
            <span className="text-xs text-base-content/50">productos</span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[11px] text-base-content/60">
              Supera el Stock Ideal
            </span>
            {selectedStatus === '344' && (
              <span className="badge bg-sky-500 border-none text-white text-[10px] font-bold py-1 px-1.5 shadow-2xs">
                Filtro activo
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-center w-full">
          {/* Buscador de texto */}
          <div className="sm:col-span-2 md:col-span-2">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por producto, SKU o código de barra..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              rightAction={
                search ? (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="btn btn-ghost btn-xs btn-circle text-base-content/50 hover:text-base-content"
                    title="Limpiar búsqueda"
                  >
                    <X size={14} />
                  </button>
                ) : undefined
              }
            />
          </div>

          {/* Selector de Categoría */}
          <div>
            <ComerziaSelect
              placeholder="Todas las categorías"
              enableDefaultOption={true}
              value={selectedCategoryId}
              onChange={e => setSelectedCategoryId(e.target.value)}
              options={categories.map(c => ({
                value: c.id,
                label: c.name
              }))}
            />
          </div>

          {/* Selector de Segmento */}
          <div>
            <ComerziaSelect
              placeholder="Todos los segmentos"
              enableDefaultOption={true}
              value={selectedSegmentId}
              onChange={e => setSelectedSegmentId(e.target.value)}
              options={segments.map(s => ({
                value: s.id,
                label: s.name
              }))}
              disabled={!selectedCategoryId || segments.length === 0}
              isLoading={isLoadingSegments}
            />
          </div>

          {/* Selector de Marca */}
          <div>
            <ComerziaSelect
              placeholder="Todas las marcas"
              enableDefaultOption={true}
              value={selectedBrandId}
              onChange={e => setSelectedBrandId(e.target.value)}
              options={brands.map(b => ({
                value: b.id,
                label: b.name
              }))}
              disabled={!selectedSegmentId || brands.length === 0}
              isLoading={isLoadingBrands}
            />
          </div>
        </div>

        {/* Indicador de Filtro de Estado Activo */}
        {selectedStatus && (
          <div className="mt-3 pt-3 border-t border-base-200/60 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="text-base-content/60">Filtro de salud aplicado:</span>
              {(() => {
                const { label, variant } = getStatusInfo(selectedStatus);
                return <ComerziaBadge label={label} variant={variant} />;
              })()}
            </div>
            <button
              type="button"
              onClick={() => setSelectedStatus('')}
              className="text-primary font-bold hover:underline cursor-pointer"
            >
              Limpiar filtro de estado
            </button>
          </div>
        )}
      </div>

      {/* 4. BARRA DE ACCIÓN MASIVA (SI HAY PRODUCTOS SELECCIONADOS) */}
      {selectedVariantIds.length > 0 && canManageStock && (
        <div className="p-4 sm:p-5 bg-primary/10 border-2 border-primary/30 rounded-2xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 animate-fade-in backdrop-blur-sm">
          <div className="flex items-center gap-3 text-sm font-bold text-primary">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shadow-xs shrink-0"
              style={{ backgroundColor: '#432ad5', color: '#ffffff' }}
            >
              <Sliders size={18} />
            </div>
            <div>
              <p className="text-sm sm:text-base font-black leading-tight text-primary">
                {selectedVariantIds.length} producto{selectedVariantIds.length > 1 ? 's' : ''} seleccionado{selectedVariantIds.length > 1 ? 's' : ''}
              </p>
              <span className="text-xs text-base-content/70 font-medium block mt-0.5">
                Sucursal activa: <strong className="text-base-content">{selectedBranchName}</strong>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <ComerziaButton
              variant="ghost"
              label="Deseleccionar"
              onClick={() => setSelectedVariantIds([])}
              className="px-4 py-2 h-auto min-h-[38px] text-xs font-semibold rounded-xl"
            />
            <ComerziaButton
              variant="primary"
              label="Actualizar Límites"
              icon={<Sliders size={16} />}
              onClick={() => setIsBulkModalOpen(true)}
              className="px-5 py-2.5 h-auto min-h-[40px] rounded-xl font-bold gap-2 shadow-md shadow-[#432ad5]/25"
            />
          </div>
        </div>
      )}

      {/* 5. VISTA DESKTOP: TABLA PAGINADA */}
      <div className="hidden md:block card bg-base-100 shadow-xs border border-base-200 rounded-2xl overflow-hidden">
        <ComerziaTable
          data={reportData}
          columns={columns}
          isLoading={isLoadingReport}
          pagination={pagination}
          showRowNumbers={false}
        />
      </div>

      {/* 6. VISTA MOBILE: CARDS RESPONSIVE */}
      <div className="block md:hidden space-y-3">
        {isLoadingReport ? (
          <div className="py-12 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-base-content/50 mt-2">Cargando reporte...</p>
          </div>
        ) : reportData.length === 0 ? (
          <div className="text-center py-10 text-base-content/50 bg-base-100 border border-base-200 rounded-2xl text-xs">
            No se encontraron productos para los filtros seleccionados.
          </div>
        ) : (
          <div className="space-y-3">
            {reportData.map(row => {
              const { label, variant } = getStatusInfo(row.status);
              const edit = inlineEdits[row.variantId] || { minStock: row.minStock, idealStock: row.idealStock };
              const isSelected = selectedVariantIds.includes(row.variantId);
              const isOut = row.currentStock <= 0;
              const isLow = row.currentStock > 0 && row.currentStock <= row.minStock;

              return (
                <article
                  key={row.variantId}
                  className={`bg-base-100 p-4 rounded-2xl border transition-all ${
                    isSelected ? 'border-primary/50 bg-primary/5 shadow-xs' : 'border-base-200 shadow-xs'
                  }`}
                >
                  {/* Fila 1: Checkbox, Nombre y Badge */}
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                      <ComerziaCheckbox
                        checked={isSelected}
                        onChange={() => handleToggleSelectRow(row.variantId)}
                        size="md"
                        className="mt-0.5 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-sm text-base-content leading-snug">
                          {row.productName}
                        </h3>
                        <span className="text-xs text-base-content/60 block font-medium">
                          {row.variantName}
                        </span>
                      </div>
                    </div>

                    <ComerziaBadge label={label} variant={variant} />
                  </div>

                  {/* Fila 2: SKU, Barcode, Categoría y Marca */}
                  <div className="pl-6 pt-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-base-content/60">
                    <div className="flex items-center gap-1.5 font-mono">
                      {row.sku && <span className="bg-base-200 px-1.5 py-0.5 rounded font-bold">{row.sku}</span>}
                      {row.barCode && <span>{row.barCode}</span>}
                    </div>
                    <span>{row.categoryName} • {row.brandName}</span>
                  </div>

                  {/* Fila 3: Grilla de Stock y Límites */}
                  <div className="pl-6 pt-3 grid grid-cols-4 gap-2 text-center">
                    <div className="bg-base-200/50 p-2 rounded-xl border border-base-200">
                      <span className="text-[10px] text-base-content/50 block">Actual</span>
                      <span
                        className={`text-sm font-bold font-mono ${
                          isOut ? 'text-error' : isLow ? 'text-warning' : 'text-base-content'
                        }`}
                      >
                        {row.currentStock}
                      </span>
                    </div>

                    <div className="bg-base-200/50 p-2 rounded-xl border border-base-200">
                      <span className="text-[10px] text-base-content/50 block">Mínimo</span>
                      <span className="text-sm font-bold font-mono text-base-content">
                        {edit.minStock === '' ? 0 : edit.minStock}
                      </span>
                    </div>

                    <div className="bg-base-200/50 p-2 rounded-xl border border-base-200">
                      <span className="text-[10px] text-base-content/50 block">Ideal</span>
                      <span className="text-sm font-bold font-mono text-base-content">
                        {edit.idealStock === '' ? 1 : edit.idealStock}
                      </span>
                    </div>

                    <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
                      <span className="text-[10px] text-primary font-semibold block">Sugerido</span>
                      <span className="text-sm font-bold font-mono text-primary">
                        {row.suggestedOrderQuantity > 0 ? `+${row.suggestedOrderQuantity}` : '0'}
                      </span>
                    </div>
                  </div>

                  {/* Fila 4: Edición Rápida si tiene permisos */}
                  {canManageStock && (
                    <div className="pl-6 pt-3 flex items-center justify-between gap-2 border-t border-base-200/50 mt-3">
                      <span className="text-[11px] text-base-content/50 italic">
                        Límites de esta sucursal
                      </span>
                      <ComerziaButton
                        variant="ghost"
                        label="Editar Límites"
                        icon={<Sliders size={13} />}
                        onClick={() => {
                          setSelectedVariantIds([row.variantId]);
                          setIsBulkModalOpen(true);
                        }}
                        className="btn-xs text-primary font-bold rounded-lg border-primary/20 hover:bg-primary/10"
                      />
                    </div>
                  )}
                </article>
              );
            })}

            {/* Paginación Mobile */}
            {totalElements > 0 && (
              <div className="card bg-base-100 p-3 rounded-2xl border border-base-200 shadow-xs flex items-center justify-between text-xs">
                <span className="text-base-content/60 font-mono whitespace-nowrap">
                  {page * size + 1}-{Math.min((page + 1) * size, totalElements)} de {totalElements}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square"
                    disabled={page === 0}
                    onClick={() => setPage(0)}
                  >
                    <ChevronsLeft size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square"
                    disabled={page === 0}
                    onClick={() => setPage(p => Math.max(0, p - 1))}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="px-2 font-mono font-bold text-primary">
                    {page + 1}/{totalPages || 1}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  >
                    <ChevronRight size={14} />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs btn-square"
                    disabled={page >= totalPages - 1}
                    onClick={() => setPage(totalPages - 1)}
                  >
                    <ChevronsRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 7. MODAL DE ACTUALIZACIÓN MASIVA DE LÍMITES */}
      <BulkStockLimitsModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        branchId={selectedBranchId}
        branchName={selectedBranchName}
        selectedVariants={selectedVariantsForBulk}
        onSuccess={() => {
          setSelectedVariantIds([]);
          loadReport(page, size);
          loadMetrics();
        }}
      />
    </div>
  );
};
