// src/features/commercial/pages/StockValuationPage.tsx
import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { branchService } from '../../organization/services/branchService';
import type { TenantActiveBranchResponse } from '../../organization/types/branch';
import type {
  CategoryResponse,
  SegmentResponse,
  BrandResponse,
  ValuationMetricsResponse,
  ValuationChartsResponse,
  ValuationReportResponse
} from '../types/commercial';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaDonutChart, ComerziaBarChart } from '../../../components/ui/charts';
import { useToast } from '../../../context/ToastContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useAuthStore } from '../../../stores/useAuthStore';
import {
  Coins,
  Store,
  DollarSign,
  TrendingUp,
  Percent,
  Boxes,
  X,
  PieChart as PieChartIcon,
  BarChart3,
  Table as TableIcon,
  Package,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpRight
} from 'lucide-react';

export interface ValuationReportRowItem extends ValuationReportResponse {
  id: string;
}

// Función auxiliar para determinar la variante del badge de margen
const getMarginBadgeVariant = (margin: number): 'success' | 'warning' | 'error' => {
  if (margin >= 30) return 'success';
  if (margin >= 10) return 'warning';
  return 'error';
};

export const StockValuationPage = () => {
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // Función auxiliar para formatear montos monetarios con el currency code de la empresa
  const formatMoney = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Función auxiliar para formatear montos con signo (+ / -)
  const formatSignedMoney = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    if (num >= 0) {
      return `+${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    return `-${currencyCode} ${Math.abs(num).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Sucursales
  const [branches, setBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);
  const [isBranchesInitialized, setIsBranchesInitialized] = useState<boolean>(false);

  // Categorías, Segmentos y Marcas
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [segments, setSegments] = useState<SegmentResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState<boolean>(false);

  // Filtros de búsqueda de texto
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 350);

  // Tab activo ('charts' | 'report')
  const [activeTab, setActiveTab] = useState<'charts' | 'report'>('charts');

  // Métricas / KPIs Financieros
  const [metrics, setMetrics] = useState<ValuationMetricsResponse | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Gráficas Analíticas
  const [chartsData, setChartsData] = useState<ValuationChartsResponse | null>(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState<boolean>(false);

  // Reporte Detallado Paginado
  const [reportData, setReportData] = useState<ValuationReportRowItem[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // 1. Cargar sucursales activas al montar la vista
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
        setIsBranchesInitialized(true);
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
  }, [selectedSegmentId]);

  // Búsqueda con validación de mínimo 3 caracteres
  const cleanSearch = debouncedSearch.trim();
  const effectiveSearch = cleanSearch.length >= 3 ? cleanSearch : '';

  // 5. Cargar métricas (KPIs)
  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await commercialService.getValuationMetrics({
        branchId: selectedBranchId || undefined,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined
      });
      setMetrics(res);
    } catch (err) {
      console.error('Error loading valuation metrics:', err);
      setMetrics(null);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // 6. Cargar gráficas analíticas
  const loadCharts = async () => {
    setIsLoadingCharts(true);
    try {
      const res = await commercialService.getValuationCharts({
        branchId: selectedBranchId || undefined,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined
      });
      setChartsData(res);
    } catch (err) {
      console.error('Error loading valuation charts:', err);
      setChartsData(null);
    } finally {
      setIsLoadingCharts(false);
    }
  };

  // 7. Cargar reporte paginado
  const loadReport = async (targetPage = page, targetSize = size) => {
    setIsLoadingReport(true);
    try {
      const res = await commercialService.getValuationReport({
        branchId: selectedBranchId || undefined,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined,
        search: effectiveSearch || undefined,
        page: targetPage,
        size: targetSize
      });
      const rows: ValuationReportRowItem[] = (res.content || []).map((row: ValuationReportResponse) => ({
        ...row,
        id: row.variantId
      }));
      setReportData(rows);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      console.error('Error loading valuation report:', err);
      setReportData([]);
      toastError('No se pudo cargar el reporte de valorización.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Reset de página al cambiar filtros
  useEffect(() => {
    if (!isBranchesInitialized) return;
    setPage(0);
  }, [isBranchesInitialized, selectedBranchId, selectedCategoryId, selectedSegmentId, selectedBrandId, effectiveSearch]);

  // Cargar métricas y gráficas al cambiar filtros principales
  useEffect(() => {
    if (!isBranchesInitialized) return;
    loadMetrics();
    loadCharts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBranchesInitialized, selectedBranchId, selectedCategoryId, selectedSegmentId, selectedBrandId]);

  // Cargar reporte paginado al cambiar cualquier filtro o página
  useEffect(() => {
    if (!isBranchesInitialized) return;
    loadReport(page, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isBranchesInitialized,
    selectedBranchId,
    selectedCategoryId,
    selectedSegmentId,
    selectedBrandId,
    effectiveSearch,
    page,
    size
  ]);

  // Metadatos y títulos según el nivel de jerarquía activo (CATEGORY, SEGMENT, BRAND, PRODUCT)
  const getDistributionMeta = (type?: string) => {
    switch (type) {
      case 'SEGMENT':
        return {
          title: 'Distribución por Segmentos',
          subtitle: 'Concentración de capital en los segmentos de la categoría',
          levelBadge: 'Nivel: Segmentos',
          canDrilldown: true
        };
      case 'BRAND':
        return {
          title: 'Distribución por Marcas',
          subtitle: 'Concentración de capital en las marcas del segmento',
          levelBadge: 'Nivel: Marcas',
          canDrilldown: true
        };
      case 'PRODUCT':
        return {
          title: 'Distribución por Productos',
          subtitle: 'Concentración de capital en los productos de la marca',
          levelBadge: 'Nivel: Productos',
          canDrilldown: false
        };
      case 'CATEGORY':
      default:
        return {
          title: 'Distribución por Categorías',
          subtitle: 'Concentración de capital detenido en categorías de inventario',
          levelBadge: 'Nivel: Categorías',
          canDrilldown: true
        };
    }
  };

  // Manejador de navegación interactiva por drilldown
  const handleDrilldown = (targetId?: string) => {
    if (!targetId) return;
    const type = chartsData?.distributionType || 'CATEGORY';
    if (type === 'CATEGORY') {
      setSelectedCategoryId(targetId);
    } else if (type === 'SEGMENT') {
      setSelectedSegmentId(targetId);
    } else if (type === 'BRAND') {
      setSelectedBrandId(targetId);
    }
  };

const DONUT_PALETTE = [
  '#4f46e5', // Indigo
  '#06b6d4', // Cyan
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#3b82f6', // Blue
  '#14b8a6', // Teal
  '#f97316', // Orange
  '#6366f1'  // Violet
];

  // Preparar datos para gráfica de donut con soporte de ID para drilldown
  const donutData = (chartsData?.categoryDistribution || []).map((item, idx) => ({
    id: item.categoryId,
    name: item.categoryName,
    value: Number(item.totalCost) || 0,
    percentage: Number(item.percentage) || 0,
    color: DONUT_PALETTE[idx % DONUT_PALETTE.length]
  }));

  // Preparar datos para gráfica de barras dobles (Sucursales)
  const barData = (chartsData?.branchDistribution || []).map(item => ({
    branchName: item.branchName,
    totalCost: Number(item.totalCost) || 0,
    potentialRevenue: Number(item.potentialRevenue) || 0,
    totalUnits: Number(item.totalUnits) || 0
  }));

  // Columnas de la tabla desktop
  const columns: Column<ValuationReportRowItem>[] = [
    {
      header: 'Producto / Variante',
      className: 'min-w-[240px]',
      render: row => (
        <div className="flex items-center gap-3">
          {row.imageUrl ? (
            <img
              src={row.imageUrl}
              alt={row.productName}
              className="w-10 h-10 rounded-xl object-cover border border-base-200 shrink-0"
            />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Package size={18} />
            </div>
          )}
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-base-content leading-snug truncate">
              {row.productName}
            </h4>
            <span className="text-xs text-base-content/60 font-medium block truncate">
              {row.variantName}
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-base-content/50 font-mono">
              {row.sku && <span>SKU: {row.sku}</span>}
              {row.barCode && <span>• {row.barCode}</span>}
            </div>
          </div>
        </div>
      )
    },
    {
      header: 'Stock Disp.',
      className: 'text-center w-24',
      render: row => (
        <span className="font-mono text-xs font-bold text-base-content">
          {row.totalQuantity} uds
        </span>
      )
    },
    {
      header: 'Costo Prom. Unit.',
      className: 'text-right w-28',
      render: row => (
        <span className="font-mono text-xs text-base-content/80 font-medium">
          {formatMoney(row.averageUnitCost)}
        </span>
      )
    },
    {
      header: 'Costo Total Invertido',
      className: 'text-right w-36',
      render: row => (
        <span className="font-mono text-xs font-bold text-base-content">
          {formatMoney(row.totalCost)}
        </span>
      )
    },
    {
      header: 'Precio Venta',
      className: 'text-right w-28',
      render: row => (
        <span className="font-mono text-xs text-base-content/80 font-medium">
          {formatMoney(row.salePrice)}
        </span>
      )
    },
    {
      header: 'Venta Potencial',
      className: 'text-right w-36',
      render: row => (
        <span className="font-mono text-xs font-bold text-primary">
          {formatMoney(row.potentialRevenue)}
        </span>
      )
    },
    {
      header: 'Ganancia Proyectada',
      className: 'text-right w-36',
      render: row => {
        const profit = Number(row.potentialProfit) || 0;
        return (
          <span className={`font-mono text-xs font-bold ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-error'}`}>
            {formatSignedMoney(profit)}
          </span>
        );
      }
    },
    {
      header: 'Margen %',
      className: 'text-center w-24',
      render: row => {
        const margin = Number(row.marginPercentage) || 0;
        const variant = getMarginBadgeVariant(margin);
        return (
          <ComerziaBadge
            label={`${margin.toFixed(1)}%`}
            variant={variant}
          />
        );
      }
    }
  ];

  // Configuración de paginación para ComerziaTable
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
            <Coins className="w-7 h-7 text-primary" />
            Valoración de Inventario
          </h1>
          <p className="text-sm text-base-content/60 mt-1 leading-relaxed">
            Supervisión financiera del capital inmovilizado, rentabilidad proyectada y márgenes de stock.
          </p>
        </div>

        {/* Selector de Sucursal */}
        <div className="w-full sm:w-72">
          <label className="text-xs font-bold text-base-content/70 block mb-1 flex items-center gap-1.5">
            <Store size={14} className="text-primary" />
            Sucursal / Tienda Activa:
          </label>
          <ComerziaSelect
            placeholder="Consolidado Corporativo (Todas)"
            value={selectedBranchId}
            onChange={e => {
              setSelectedBranchId(e.target.value);
              setPage(0);
            }}
            options={[
              { value: '', label: '🌐 Todas las Sucursales (Consolidado)' },
              ...branches.map(b => ({
                value: b.id,
                label: b.name
              }))
            ]}
            isLoading={isLoadingBranches}
          />
        </div>
      </div>

      {/* 2. TARJETAS KPI FINANCIERAS (Totales macroeconómicos) */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* KPI 1: Capital Inmovilizado (Costo Total) */}
        <div className="card bg-base-100 p-3 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-wider">
                Capital Invertido
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <DollarSign size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-base-content tracking-tight leading-tight block break-words">
                {isLoadingMetrics ? '...' : formatMoney(metrics?.totalCost)}
              </span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Costo de adquisición
          </span>
        </div>

        {/* KPI 2: Venta Potencial Estimada */}
        <div className="card bg-base-100 p-3 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-sky-500 uppercase tracking-wider">
                Venta Potencial
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-sky-500 tracking-tight leading-tight block break-words">
                {isLoadingMetrics ? '...' : formatMoney(metrics?.totalPotentialRevenue)}
              </span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Ingreso bruto proyectado
          </span>
        </div>

        {/* KPI 3: Ganancia Proyectada */}
        <div className="card bg-base-100 p-3 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Ganancia Bruta
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight leading-tight block break-words">
                {isLoadingMetrics ? '...' : formatSignedMoney(metrics?.totalPotentialProfit)}
              </span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Retorno potencial neto
          </span>
        </div>

        {/* KPI 4: Margen Promedio (%) */}
        <div className="card bg-base-100 p-3 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-amber-500 uppercase tracking-wider">
                Margen Global
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                <Percent size={16} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-amber-500 tracking-tight leading-tight">
                {isLoadingMetrics ? '...' : `${(Number(metrics?.averageMarginPercentage) || 0).toFixed(1)}%`}
              </span>
              {metrics && (
                <span className={`text-[10px] font-bold font-mono px-1.5 py-0.2 rounded-md ${
                  metrics.averageMarginPercentage >= 30
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                    : metrics.averageMarginPercentage >= 10
                    ? 'bg-amber-500/10 text-amber-500'
                    : 'bg-error/10 text-error'
                }`}>
                  {metrics.averageMarginPercentage >= 30 ? 'Óptimo' : metrics.averageMarginPercentage >= 10 ? 'Medio' : 'Bajo'}
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Rentabilidad media
          </span>
        </div>

        {/* KPI 5: Total Unidades Físicas */}
        <div className="card bg-base-100 p-3 sm:p-4 rounded-2xl border border-base-200 shadow-xs col-span-2 md:col-span-1 lg:col-span-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-base-content/70 uppercase tracking-wider">
                Unidades en Stock
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-base-200 text-base-content/70 flex items-center justify-center shrink-0">
                <Boxes size={16} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-base-content tracking-tight leading-tight">
                {isLoadingMetrics ? '...' : (metrics?.totalUnits || 0).toLocaleString()}
              </span>
              <span className="text-xs text-base-content/50 font-medium">uds</span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Total en inventario
          </span>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS (Categoría, Segmento, Marca y Buscador) */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 sm:gap-4 items-center w-full">
          {/* Buscador de texto con debounce */}
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
      </div>

      {/* 4. TABS DE NAVEGACIÓN (Gráficas vs Detalle de Tabla) */}
      <div className="flex items-center justify-between border-b border-base-200">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('charts')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'charts'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-base-content/60 hover:text-base-content'
            }`}
          >
            <BarChart3 size={16} />
            <span>Gráficas Analíticas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'report'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-base-content/60 hover:text-base-content'
            }`}
          >
            <TableIcon size={16} />
            <span>Detalle por Producto</span>
            {totalElements > 0 && (
              <span className="badge badge-sm badge-neutral font-mono font-bold">
                {totalElements}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 5. CONTENIDO DEL TAB 1: GRÁFICAS ANALÍTICAS */}
      {activeTab === 'charts' && (
        <div className="space-y-6 animate-fade-in">
          {isLoadingCharts ? (
            <div className="py-16 text-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs text-base-content/50 mt-2">Cargando visualizaciones analíticas...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfica 1: Distribución Dinámica de Capital (Donut Chart con Drilldown) */}
              {(() => {
                const meta = getDistributionMeta(chartsData?.distributionType);
                return (
                  <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-base-200/60 mb-4">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                            <PieChartIcon size={16} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-base-content truncate">
                                {meta.title}
                              </h3>
                              <span className="badge badge-sm badge-primary font-bold text-[10px] shrink-0">
                                {meta.levelBadge}
                              </span>
                            </div>
                            <p className="text-[11px] text-base-content/60 truncate">
                              {meta.subtitle}
                            </p>
                          </div>
                        </div>

                        {(selectedCategoryId || selectedSegmentId || selectedBrandId) && (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedCategoryId('');
                              setSelectedSegmentId('');
                              setSelectedBrandId('');
                            }}
                            className="text-[11px] text-primary font-bold hover:underline cursor-pointer flex items-center gap-1 shrink-0"
                          >
                            <X size={12} />
                            Restablecer a Categorías
                          </button>
                        )}
                      </div>

                      {donutData.length === 0 ? (
                        <div className="py-12 text-center text-xs text-base-content/40 italic">
                          No hay datos de distribución para los filtros seleccionados.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                          <div className="sm:col-span-7">
                            <ComerziaDonutChart
                              data={donutData}
                              height={260}
                              valueFormatter={formatMoney}
                            />
                            {meta.canDrilldown && (
                              <p className="text-[10px] text-center text-base-content/40 mt-1 italic">
                                💡 Toca o pasa el cursor sobre el gráfico para ver valores, o pulsa una tarjeta para filtrar
                              </p>
                            )}
                          </div>
                          <div className="sm:col-span-5 space-y-2.5 max-h-72 overflow-y-auto pr-1">
                            {donutData.map((item, idx) => {
                              const itemColor = item.color || DONUT_PALETTE[idx % DONUT_PALETTE.length];
                              return (
                                <div
                                  key={idx}
                                  onClick={() => {
                                    if (meta.canDrilldown && item.id) {
                                      handleDrilldown(item.id);
                                    }
                                  }}
                                  className={`group relative flex items-center justify-between text-xs p-3 rounded-2xl border transition-all duration-200 ${
                                    meta.canDrilldown
                                      ? 'bg-base-200/90 hover:bg-base-200 border-base-300/90 hover:border-primary/50 shadow-xs hover:shadow-md cursor-pointer hover:translate-x-0.5'
                                      : 'bg-base-200/90 border-base-300/90 shadow-xs cursor-default'
                                  }`}
                                  title={meta.canDrilldown ? `Filtrar por ${item.name}` : undefined}
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-2">
                                    {/* Indicador de color con píldora acentuada */}
                                    <span
                                      className="w-2 h-7 rounded-full shrink-0 shadow-2xs group-hover:scale-110 transition-transform"
                                      style={{ backgroundColor: itemColor }}
                                    />
                                    <div className="min-w-0">
                                      <span className="font-bold text-xs text-base-content block truncate group-hover:text-primary transition-colors">
                                        {item.name}
                                      </span>
                                      <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[11px] font-mono text-primary font-bold">
                                          {formatMoney(item.value)}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className="badge badge-sm bg-base-100 text-base-content border border-base-300 font-mono font-bold px-2 py-0.5 shadow-2xs">
                                      {item.percentage.toFixed(1)}%
                                    </span>
                                    {meta.canDrilldown && (
                                      <ChevronRight
                                        size={14}
                                        className="text-base-content/30 group-hover:text-primary group-hover:translate-x-0.5 transition-all"
                                      />
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Gráfica 2: Comparativa de Costo Invertido vs Venta Potencial por Sucursal (Grouped Bar Chart) */}
              <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-base-200/60 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                        <BarChart3 size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-base-content">
                          Costo Invertido vs Venta por Sucursal
                        </h3>
                        <p className="text-[11px] text-base-content/60">
                          Comparativa de retorno potencial por tienda
                        </p>
                      </div>
                    </div>
                  </div>

                  {barData.length === 0 ? (
                    <div className="py-12 text-center text-xs text-base-content/40 italic">
                      No hay información de sucursales disponible.
                    </div>
                  ) : (
                    <ComerziaBarChart
                      data={barData}
                      xAxisDataKey="branchName"
                      height={270}
                      valueFormatter={formatMoney}
                      series={[
                        {
                          dataKey: 'totalCost',
                          name: 'Costo Invertido',
                          color: '#4f46e5'
                        },
                        {
                          dataKey: 'potentialRevenue',
                          name: 'Venta Potencial',
                          color: '#0ea5e9'
                        }
                      ]}
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. CONTENIDO DEL TAB 2: DETALLE TABULAR POR PRODUCTO */}
      {activeTab === 'report' && (
        <div className="space-y-4 animate-fade-in">
          {/* VISTA DESKTOP: TABLA COMPLETA */}
          <div className="hidden md:block card bg-base-100 shadow-xs border border-base-200 rounded-2xl overflow-hidden">
            <ComerziaTable
              data={reportData}
              columns={columns}
              isLoading={isLoadingReport}
              pagination={pagination}
              showRowNumbers={false}
            />
          </div>

          {/* VISTA MOBILE: CARDS FINANCIERAS RESPONSIVE */}
          <div className="block md:hidden space-y-3">
            {isLoadingReport ? (
              <div className="py-12 text-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="text-xs text-base-content/50 mt-2">Cargando reporte financiero...</p>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-10 text-base-content/50 bg-base-100 border border-base-200 rounded-2xl text-xs">
                No se encontraron productos para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-3">
                {reportData.map(row => {
                  const profit = Number(row.potentialProfit) || 0;
                  const margin = Number(row.marginPercentage) || 0;
                  const badgeVariant = getMarginBadgeVariant(margin);

                  return (
                    <article
                      key={row.variantId}
                      className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs space-y-2.5"
                    >
                      {/* Cabecera: Producto, Variante y Badge de Margen */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-base-content leading-snug truncate">
                            {row.productName}
                          </h3>
                          <p className="text-xs text-base-content/60 font-medium truncate mt-0.5">
                            {row.variantName}
                          </p>
                        </div>
                        <ComerziaBadge label={`${margin.toFixed(1)}%`} variant={badgeVariant} />
                      </div>

                      {/* Grilla 2x2 Financiera */}
                      <div className="grid grid-cols-2 gap-2 text-center pt-1">
                        <div className="bg-base-200/50 p-2 rounded-xl border border-base-200 text-left">
                          <span className="text-[10px] text-base-content/50 block">Stock Disponible</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-base-content">
                            {row.totalQuantity} uds
                          </span>
                        </div>

                        <div className="bg-base-200/50 p-2 rounded-xl border border-base-200 text-left">
                          <span className="text-[10px] text-base-content/50 block">Costo Invertido</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-base-content">
                            {formatMoney(row.totalCost)}
                          </span>
                        </div>

                        <div className="bg-sky-500/10 p-2 rounded-xl border border-sky-500/20 text-left">
                          <span className="text-[10px] text-sky-600 dark:text-sky-400 font-semibold block">Venta Potencial</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-sky-600 dark:text-sky-400">
                            {formatMoney(row.potentialRevenue)}
                          </span>
                        </div>

                        <div className="bg-emerald-500/10 p-2 rounded-xl border border-emerald-500/20 text-left">
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">Ganancia Bruta</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                            {formatSignedMoney(profit)}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Footer de Paginación Mobile Estándar */}
                {totalElements > 0 && (
                  <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
                      <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <span>Mostrar</span>
                        <select
                          value={size}
                          onChange={e => {
                            const newSize = Number(e.target.value);
                            setSize(newSize);
                            setPage(0);
                          }}
                          className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                        </select>
                        <span className="whitespace-nowrap">de {totalElements} registros</span>
                      </div>
                      <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                        Página {page + 1} de {Math.max(1, totalPages)}
                      </span>
                    </div>

                    {/* BOTONES DE NAVEGACIÓN */}
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Primera página"
                        disabled={page === 0 || isLoadingReport}
                        onClick={() => setPage(0)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Página anterior"
                        disabled={page === 0 || isLoadingReport}
                        onClick={() => setPage(Math.max(0, page - 1))}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Página siguiente"
                        disabled={page >= totalPages - 1 || isLoadingReport}
                        onClick={() => setPage(page + 1)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Última página"
                        disabled={page >= totalPages - 1 || isLoadingReport}
                        onClick={() => setPage(totalPages - 1)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </footer>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
