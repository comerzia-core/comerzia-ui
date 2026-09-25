// src/features/commercial/pages/DemandForecastingPage.tsx
import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { branchService } from '../../organization/services/branchService';
import type { TenantActiveBranchResponse } from '../../organization/types/branch';
import type {
  CategoryResponse,
  SegmentResponse,
  BrandResponse,
  DemandMetricsResponse,
  DemandChartsResponse,
  DemandReportResponse,
  DemandRotationStatus,
  DemandSuggestedAction
} from '../types/commercial';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaBcgMatrixChart, ComerziaLineChart } from '../../../components/ui/charts';
import { useToast } from '../../../context/ToastContext';
import { useDebounce } from '../../../hooks/useDebounce';
import { useAuthStore } from '../../../stores/useAuthStore';
import {
  BrainCircuit,
  Store,
  Calendar,
  Zap,
  Clock,
  Skull,
  RotateCw,
  Package,
  LineChart as LineChartIcon,
  ScatterChart as ScatterChartIcon,
  Table as TableIcon,
  X,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Sparkles,
  ShoppingBag,
  Tag,
  Star,
  Coins,
  HelpCircle
} from 'lucide-react';

export interface DemandReportRowItem extends DemandReportResponse {
  id: string;
}

// Opciones de período de análisis histórico
const HISTORY_PERIOD_OPTIONS = [
  { value: '30', label: 'Últimos 30 días' },
  { value: '90', label: 'Últimos 90 días' },
  { value: '180', label: 'Últimos 180 días' }
];

// Opciones de filtro por estado de rotación
const ROTATION_FILTER_OPTIONS = [
  { value: 'HIGH', label: 'Alta Rotación' },
  { value: 'MEDIUM', label: 'Rotación Moderada' },
  { value: 'LOW', label: 'Baja Rotación' },
  { value: 'DEAD', label: 'Stock Muerto' }
];

// Helper para determinar el badge y semáforo de días de cobertura
const getCoverageBadgeInfo = (days: number | null | undefined) => {
  if (days === null || days === undefined || !isFinite(days) || days < 0) {
    return {
      label: '∞ Sin mov.',
      variant: 'neutral' as const,
      description: 'Sin ventas en el período'
    };
  }

  if (days <= 7) {
    return {
      label: `${Math.round(days)} días`,
      variant: 'error' as const,
      description: 'Riesgo inminente de quiebre'
    };
  }

  if (days <= 14) {
    return {
      label: `${Math.round(days)} días`,
      variant: 'warning' as const,
      description: 'Stock bajo, planear reorden'
    };
  }

  if (days <= 60) {
    return {
      label: `${Math.round(days)} días`,
      variant: 'success' as const,
      description: 'Inventario saludable'
    };
  }

  return {
    label: `${Math.round(days)} días`,
    variant: 'warning' as const,
    description: 'Exceso de inventario'
  };
};

// Helper para traducir y estilizar la rotación comercial
const getRotationBadgeInfo = (status?: string | DemandRotationStatus) => {
  switch (status) {
    case 'HIGH':
      return { label: 'Alta Rotación', variant: 'success' as const };
    case 'MEDIUM':
      return { label: 'Rotación Media', variant: 'info' as const };
    case 'LOW':
      return { label: 'Baja Rotación', variant: 'warning' as const };
    case 'DEAD':
      return { label: 'Stock Muerto', variant: 'error' as const };
    default:
      return { label: status || 'General', variant: 'neutral' as const };
  }
};

// Helper para traducir la acción sugerida calculada por el backend
const getSuggestedActionInfo = (action?: string | DemandSuggestedAction) => {
  switch (action) {
    case 'REORDER':
      return {
        label: 'Reordenar Compra',
        icon: ShoppingBag,
        badgeClass: 'badge-error text-white font-bold',
        btnText: 'Pedir Mercadería'
      };
    case 'MAINTAIN':
      return {
        label: 'Mantener Stock',
        icon: CheckCircle2,
        badgeClass: 'badge-success text-white font-bold',
        btnText: 'Stock Óptimo'
      };
    case 'PROMOTE':
      return {
        label: 'Promocionar / Descuento',
        icon: Tag,
        badgeClass: 'badge-warning text-white font-bold',
        btnText: 'Impulsar Ventas'
      };
    case 'LIQUIDATE':
      return {
        label: 'Liquidar / Remate',
        icon: AlertTriangle,
        badgeClass: 'badge-error text-white font-bold',
        btnText: 'Liquidar Stock'
      };
    case 'HOLD':
    default:
      return {
        label: 'En Observación',
        icon: Sparkles,
        badgeClass: 'badge-neutral text-base-content font-bold',
        btnText: 'Monitorear'
      };
  }
};

export const DemandForecastingPage = () => {
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // Formateo de moneda
  const formatMoney = (amount: number | string | undefined | null): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Sucursales y Período
  const [branches, setBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [daysHistory, setDaysHistory] = useState<number>(90);
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(true);
  const [isBranchesInitialized, setIsBranchesInitialized] = useState<boolean>(false);

  // Categorías, Segmentos (Rubros) y Marcas
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [segments, setSegments] = useState<SegmentResponse[]>([]);
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [isLoadingSegments, setIsLoadingSegments] = useState<boolean>(false);
  const [brands, setBrands] = useState<BrandResponse[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');
  const [isLoadingBrands, setIsLoadingBrands] = useState<boolean>(false);

  // Filtros de tabla
  const [rotationFilter, setRotationFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');
  const debouncedSearch = useDebounce(search, 350);

  // Tab activo ('charts' | 'report')
  const [activeTab, setActiveTab] = useState<'charts' | 'report'>('charts');

  // Métricas / KPIs BI
  const [metrics, setMetrics] = useState<DemandMetricsResponse | null>(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState<boolean>(false);

  // Gráficas Analíticas BI
  const [chartsData, setChartsData] = useState<DemandChartsResponse | null>(null);
  const [isLoadingCharts, setIsLoadingCharts] = useState<boolean>(false);

  // Reporte Paginado
  const [reportData, setReportData] = useState<DemandReportRowItem[]>([]);
  const [isLoadingReport, setIsLoadingReport] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [size, setSize] = useState<number>(10);
  const [totalElements, setTotalElements] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  // 1. Cargar sucursales activas al montar
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
        console.error('Error loading active branches for demand forecasting:', err);
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

  // Búsqueda efectiva (mínimo 3 caracteres)
  const cleanSearch = debouncedSearch.trim();
  const effectiveSearch = cleanSearch.length >= 3 ? cleanSearch : '';

  // 5. Cargar KPIs de demanda
  const loadMetrics = async () => {
    setIsLoadingMetrics(true);
    try {
      const res = await commercialService.getDemandMetrics({
        branchId: selectedBranchId || undefined,
        daysHistory,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined
      });
      setMetrics(res);
    } catch (err) {
      console.error('Error loading demand metrics:', err);
      setMetrics(null);
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  // 6. Cargar Gráficas (Tendencia y Matriz BCG)
  const loadCharts = async () => {
    setIsLoadingCharts(true);
    try {
      const res = await commercialService.getDemandCharts({
        branchId: selectedBranchId || undefined,
        daysHistory,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined
      });
      setChartsData(res);
    } catch (err) {
      console.error('Error loading demand charts:', err);
      setChartsData(null);
    } finally {
      setIsLoadingCharts(false);
    }
  };

  // 7. Cargar Reporte Paginado
  const loadReport = async (targetPage = page, targetSize = size) => {
    setIsLoadingReport(true);
    try {
      const res = await commercialService.getDemandReport({
        branchId: selectedBranchId || undefined,
        categoryId: selectedCategoryId || undefined,
        segmentId: selectedSegmentId || undefined,
        brandId: selectedBrandId || undefined,
        daysHistory,
        page: targetPage,
        size: targetSize
      });
      let rows: DemandReportRowItem[] = (res.content || []).map((row: DemandReportResponse) => ({
        ...row,
        id: row.variantId
      }));

      // Filtrado client-side adicional si se aplica buscador o estado de rotación
      if (rotationFilter) {
        rows = rows.filter(r => r.rotationStatus === rotationFilter);
      }
      if (effectiveSearch) {
        const query = effectiveSearch.toLowerCase();
        rows = rows.filter(
          r =>
            r.productName?.toLowerCase().includes(query) ||
            r.variantName?.toLowerCase().includes(query) ||
            r.sku?.toLowerCase().includes(query) ||
            r.barCode?.toLowerCase().includes(query)
        );
      }

      setReportData(rows);
      setTotalElements(res.totalElements || 0);
      setTotalPages(res.totalPages || 0);
    } catch (err) {
      console.error('Error loading demand report:', err);
      setReportData([]);
      toastError('No se pudo cargar el reporte de pronóstico.');
    } finally {
      setIsLoadingReport(false);
    }
  };

  // Reiniciar página al cambiar filtros
  useEffect(() => {
    if (!isBranchesInitialized) return;
    setPage(0);
  }, [
    isBranchesInitialized,
    selectedBranchId,
    daysHistory,
    selectedCategoryId,
    selectedSegmentId,
    selectedBrandId,
    rotationFilter,
    effectiveSearch
  ]);

  // Consultar métricas y gráficas al cambiar contexto principal
  useEffect(() => {
    if (!isBranchesInitialized) return;
    loadMetrics();
    loadCharts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isBranchesInitialized,
    selectedBranchId,
    daysHistory,
    selectedCategoryId,
    selectedSegmentId,
    selectedBrandId
  ]);

  // Consultar reporte al cambiar cualquier filtro o paginación
  useEffect(() => {
    if (!isBranchesInitialized) return;
    loadReport(page, size);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    isBranchesInitialized,
    selectedBranchId,
    daysHistory,
    selectedCategoryId,
    selectedSegmentId,
    selectedBrandId,
    rotationFilter,
    effectiveSearch,
    page,
    size
  ]);

  // Columnas de la tabla Desktop
  const columns: Column<DemandReportRowItem>[] = [
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
      header: 'Stock Actual',
      className: 'text-center w-28',
      render: row => (
        <span className="font-mono text-xs font-bold text-base-content">
          {row.currentStock} uds
        </span>
      )
    },
    {
      header: 'Velocidad Diaria',
      className: 'text-center w-32',
      render: row => (
        <div className="text-xs font-mono">
          <span className="font-bold text-primary">
            {Number(row.dailyVelocity || 0).toFixed(1)}
          </span>
          <span className="text-[10px] text-base-content/50 block">uds/día</span>
        </div>
      )
    },
    {
      header: 'Cobertura (Días)',
      className: 'text-center w-36',
      render: row => {
        const info = getCoverageBadgeInfo(row.daysRemaining);
        return (
          <div className="flex flex-col items-center gap-0.5">
            <ComerziaBadge label={info.label} variant={info.variant} />
            <span className="text-[10px] text-base-content/50 truncate max-w-[130px]">
              {info.description}
            </span>
          </div>
        );
      }
    },
    {
      header: 'Rotación',
      className: 'text-center w-32',
      render: row => {
        const info = getRotationBadgeInfo(row.rotationStatus);
        return <ComerziaBadge label={info.label} variant={info.variant} />;
      }
    },
    {
      header: 'Acción Sugerida',
      className: 'text-center min-w-[200px] whitespace-nowrap',
      render: row => {
        const info = getSuggestedActionInfo(row.suggestedAction);
        const IconComponent = info.icon;
        return (
          <span className={`badge badge-sm inline-flex items-center gap-1.5 px-3 py-1 whitespace-nowrap shrink-0 ${info.badgeClass}`}>
            <IconComponent size={12} className="shrink-0" />
            <span className="whitespace-nowrap font-bold">{info.label}</span>
          </span>
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
            <BrainCircuit className="w-7 h-7 text-primary" />
            Pronóstico de Demanda & BI
          </h1>
          <p className="text-sm text-base-content/60 mt-1 leading-relaxed">
            Inteligencia predictiva para prevenir quiebres, detectar stock muerto y maximizar la rentabilidad del inventario.
          </p>
        </div>

        {/* Barra superior de controles: Sucursal y Período */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Selector de Período Histórico */}
          <div className="w-full sm:w-56">
            <label className="text-xs font-bold text-base-content/70 block mb-1 flex items-center gap-1.5">
              <Calendar size={14} className="text-primary" />
              Período de Análisis:
            </label>
            <ComerziaSelect
              value={String(daysHistory)}
              onChange={e => setDaysHistory(Number(e.target.value))}
              options={HISTORY_PERIOD_OPTIONS}
            />
          </div>

          {/* Selector de Sucursal */}
          <div className="w-full sm:w-64">
            <label className="text-xs font-bold text-base-content/70 block mb-1 flex items-center gap-1.5">
              <Store size={14} className="text-primary" />
              Sucursal Activa:
            </label>
            <ComerziaSelect
              placeholder="Todas las sucursales"
              enableDefaultOption={true}
              value={selectedBranchId}
              onChange={e => {
                setSelectedBranchId(e.target.value);
                setPage(0);
              }}
              options={branches.map(b => ({
                value: b.id,
                label: b.name
              }))}
              isLoading={isLoadingBranches}
            />
          </div>
        </div>
      </div>

      {/* 2. TARJETAS KPI DE INTELIGENCIA DE DEMANDA (Totales predictivos) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* KPI 1: Rotación General */}
        <div className="card bg-base-100 p-3.5 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-primary uppercase tracking-wider">
                Rotación de Stock
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                <RotateCw size={16} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-base-content tracking-tight leading-tight block break-words">
                {isLoadingMetrics ? '...' : `${Number(metrics?.turnoverRate || 0).toFixed(1)}x`}
              </span>
              <span className="text-[11px] text-base-content/50 font-medium">/año</span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Frecuencia de renovación
          </span>
        </div>

        {/* KPI 2: Velocidad de Venta Global */}
        <div className="card bg-base-100 p-3.5 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-sky-500 uppercase tracking-wider">
                Velocidad Global
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                <Zap size={16} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-sky-500 tracking-tight leading-tight block break-words">
                {isLoadingMetrics ? '...' : Number(metrics?.globalVelocity || 0).toFixed(1)}
              </span>
              <span className="text-[11px] text-base-content/50 font-medium">uds/día</span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Salida diaria promedio
          </span>
        </div>

        {/* KPI 3: Cobertura Promedio (Días Restantes) */}
        <div className="card bg-base-100 p-3.5 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                Días de Cobertura
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Clock size={16} />
              </div>
            </div>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight leading-tight block break-words">
                {isLoadingMetrics ? '...' : Math.round(Number(metrics?.averageDaysRemaining || 0))}
              </span>
              <span className="text-[11px] text-base-content/50 font-medium">días</span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Duración estimada del stock
          </span>
        </div>

        {/* KPI 4: Capital en Stock Muerto */}
        <div className="card bg-base-100 p-3.5 sm:p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[11px] sm:text-xs font-bold text-rose-500 uppercase tracking-wider">
                Stock Muerto
              </span>
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center shrink-0">
                <Skull size={16} />
              </div>
            </div>
            <div className="mt-2">
              <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-rose-500 tracking-tight leading-tight block break-words">
                {isLoadingMetrics ? '...' : formatMoney(metrics?.deadStockCapital)}
              </span>
            </div>
          </div>
          <span className="text-[10px] sm:text-[11px] text-base-content/50 block mt-1">
            Dinero sin movimiento en período
          </span>
        </div>
      </div>

      {/* 3. BARRA DE FILTROS (Categoría, Rubro, Marca, Estado de Rotación y Buscador) */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 items-center w-full">
          {/* Buscador de texto con debounce */}
          <div className="sm:col-span-2 lg:col-span-2">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar producto, SKU o código..."
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

          {/* Selector de Rubro / Segmento */}
          <div>
            <ComerziaSelect
              placeholder="Todos los rubros"
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

          {/* Selector de Rotación */}
          <div>
            <ComerziaSelect
              placeholder="Todos los estados"
              enableDefaultOption={true}
              value={rotationFilter}
              onChange={e => setRotationFilter(e.target.value)}
              options={ROTATION_FILTER_OPTIONS}
            />
          </div>
        </div>
      </div>

      {/* 4. TABS DE NAVEGACIÓN (Visualizaciones BI vs Detalle de Acciones) */}
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
            <ScatterChartIcon size={16} />
            <span>Matriz BCG & Análisis</span>
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
            <span>Reporte de Acción & Cobertura</span>
            {totalElements > 0 && (
              <span className="badge badge-sm badge-neutral font-mono font-bold">
                {totalElements}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 5. CONTENIDO DEL TAB 1: GRÁFICAS ANALÍTICAS Y MATRIZ BCG */}
      {activeTab === 'charts' && (
        <div className="space-y-6 animate-fade-in">
          {isLoadingCharts ? (
            <div className="py-16 text-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs text-base-content/50 mt-2">Cargando modelos analíticos y matriz BCG...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Gráfica 1: Matriz BCG de 4 Cuadrantes */}
              <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-base-200/60 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <ScatterChartIcon size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-base-content">
                          Matriz BCG de Inventario (BI)
                        </h3>
                        <p className="text-[11px] text-base-content/60">
                          Dispersión de productos: Rotación (X) vs Margen de Ganancia % (Y)
                        </p>
                      </div>
                    </div>
                  </div>

                  <ComerziaBcgMatrixChart
                    data={chartsData?.bcgMatrix || []}
                    height={340}
                    currencyCode={currencyCode}
                  />
                </div>

                {/* Leyenda y Explicación Estratégica de Cuadrantes */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-4 mt-2 border-t border-base-200/60 text-xs">
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-2 font-bold mb-1 text-emerald-600 dark:text-emerald-400">
                      <Star size={15} className="shrink-0 fill-emerald-500/20" />
                      <span className="text-xs">Estrellas</span>
                    </div>
                    <span className="text-[11px] opacity-80 leading-snug block">Alta rotación y alto margen. Priorizar compra.</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-900 dark:text-sky-200 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-2 font-bold mb-1 text-sky-600 dark:text-sky-400">
                      <Coins size={15} className="shrink-0" />
                      <span className="text-xs">Volumen</span>
                    </div>
                    <span className="text-[11px] opacity-80 leading-snug block">Alta rotación y bajo margen. Traen flujo continuo.</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-2 font-bold mb-1 text-amber-600 dark:text-amber-400">
                      <HelpCircle size={15} className="shrink-0" />
                      <span className="text-xs">Interrogantes</span>
                    </div>
                    <span className="text-[11px] opacity-80 leading-snug block">Alto margen y baja rotación. Impulsar promociones.</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-900 dark:text-rose-200 flex flex-col justify-between shadow-2xs">
                    <div className="flex items-center gap-2 font-bold mb-1 text-rose-600 dark:text-rose-400">
                      <Skull size={15} className="shrink-0" />
                      <span className="text-xs">Stock Muerto</span>
                    </div>
                    <span className="text-[11px] opacity-80 leading-snug block">Bajo margen y baja rotación. Liquidar o rematar.</span>
                  </div>
                </div>
              </div>

              {/* Gráfica 2: Curva de Tendencia y Estacionalidad */}
              <div className="card bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-base-200/60 mb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <LineChartIcon size={16} />
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-base-content">
                          Curva de Tendencia de Demanda
                        </h3>
                        <p className="text-[11px] text-base-content/60">
                          Comportamiento histórico y picos de venta de los últimos {daysHistory} días
                        </p>
                      </div>
                    </div>
                  </div>

                  {(!chartsData?.trendChart || chartsData.trendChart.length === 0) ? (
                    <div className="py-24 text-center text-xs text-base-content/40 italic">
                      No hay historial de ventas suficiente para proyectar la curva en este período.
                    </div>
                  ) : (
                    <ComerziaLineChart
                      data={chartsData.trendChart}
                      xAxisDataKey="dateGroup"
                      height={340}
                      series={[
                        {
                          dataKey: 'totalSales',
                          name: 'Ventas Totales',
                          color: '#4f46e5'
                        }
                      ]}
                      valueFormatter={val => formatMoney(val)}
                    />
                  )}
                </div>

                <div className="pt-3 border-t border-base-200/60 flex items-center justify-between text-xs text-base-content/60">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span>Volumen de salida acumulado</span>
                  </span>
                  <span className="font-mono text-[11px]">Intervalo: {daysHistory} días</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 6. CONTENIDO DEL TAB 2: DETALLE TABULAR DE DECISIÓN Y COBERTURA */}
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

          {/* VISTA MOBILE: CARDS RESPONSIVE MINIMALISTAS */}
          <div className="block md:hidden space-y-3">
            {isLoadingReport ? (
              <div className="py-12 text-center">
                <span className="loading loading-spinner loading-md text-primary"></span>
                <p className="text-xs text-base-content/50 mt-2">Cargando reporte de pronóstico...</p>
              </div>
            ) : reportData.length === 0 ? (
              <div className="text-center py-10 text-base-content/50 bg-base-100 border border-base-200 rounded-2xl text-xs">
                No se encontraron productos para los filtros seleccionados.
              </div>
            ) : (
              <div className="space-y-3">
                {reportData.map(row => {
                  const coverageInfo = getCoverageBadgeInfo(row.daysRemaining);
                  const rotationInfo = getRotationBadgeInfo(row.rotationStatus);
                  const actionInfo = getSuggestedActionInfo(row.suggestedAction);
                  const ActionIcon = actionInfo.icon;

                  return (
                    <article
                      key={row.variantId}
                      className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs space-y-2.5"
                    >
                      {/* Cabecera Mobile */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-bold text-sm text-base-content leading-snug truncate">
                            {row.productName}
                          </h3>
                          <p className="text-xs text-base-content/60 font-medium truncate mt-0.5">
                            {row.variantName}
                          </p>
                        </div>
                        <ComerziaBadge label={coverageInfo.label} variant={coverageInfo.variant} />
                      </div>

                      {/* Grilla 2x2 Financiera & Logística */}
                      <div className="grid grid-cols-2 gap-2 text-center pt-1">
                        <div className="bg-base-200/50 p-2 rounded-xl border border-base-200 text-left">
                          <span className="text-[10px] text-base-content/50 block">Stock Actual</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-base-content">
                            {row.currentStock} uds
                          </span>
                        </div>

                        <div className="bg-base-200/50 p-2 rounded-xl border border-base-200 text-left">
                          <span className="text-[10px] text-base-content/50 block">Velocidad Diaria</span>
                          <span className="text-xs sm:text-sm font-bold font-mono text-primary">
                            {Number(row.dailyVelocity || 0).toFixed(1)} uds/d
                          </span>
                        </div>

                        <div className="bg-base-200/50 p-2 rounded-xl border border-base-200 text-left">
                          <span className="text-[10px] text-base-content/50 block">Rotación</span>
                          <div className="mt-0.5">
                            <ComerziaBadge label={rotationInfo.label} variant={rotationInfo.variant} />
                          </div>
                        </div>

                        <div className="bg-base-200/50 p-2 rounded-xl border border-base-200 text-left">
                          <span className="text-[10px] text-base-content/50 block">Acción Sugerida</span>
                          <div className="mt-0.5 overflow-x-auto no-scrollbar">
                            <span className={`badge badge-xs inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] whitespace-nowrap shrink-0 ${actionInfo.badgeClass}`}>
                              <ActionIcon size={10} className="shrink-0" />
                              <span className="whitespace-nowrap font-bold">{actionInfo.label}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {/* Paginación Mobile Estándar */}
                {totalElements > 0 && (
                  <div className="card bg-base-100 p-3 rounded-2xl border border-base-200 shadow-xs flex flex-row items-center justify-between gap-2 overflow-x-auto whitespace-nowrap text-xs">
                    <span className="text-base-content/60 shrink-0">
                      Pág. <strong>{page + 1}</strong> de <strong>{totalPages || 1}</strong> ({totalElements} ítems)
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setPage(0)}
                        disabled={page === 0}
                        className="btn btn-xs btn-ghost btn-square"
                        title="Primera página"
                      >
                        <ChevronsLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                        disabled={page === 0}
                        className="btn btn-xs btn-ghost btn-square"
                        title="Página anterior"
                      >
                        <ChevronLeft size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                        disabled={page >= totalPages - 1}
                        className="btn btn-xs btn-ghost btn-square"
                        title="Página siguiente"
                      >
                        <ChevronRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPage(totalPages - 1)}
                        disabled={page >= totalPages - 1}
                        className="btn btn-xs btn-ghost btn-square"
                        title="Última página"
                      >
                        <ChevronsRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
