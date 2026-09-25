// src/features/dashboard/pages/DashboardPage.tsx
import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { dashboardService } from '../services/dashboardService';
import { branchService } from '../../organization/services/branchService';
import type { TenantActiveBranchResponse } from '../../organization/types/branch';
import type {
  DashboardPeriod,
  DashboardSellerSort,
  DashboardSummaryResponse,
  DashboardSellerRankingResponse,
  DashboardSellerPersonalResponse
} from '../types/dashboard';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaLineChart } from '../../../components/ui/charts';
import { PersonalStatsBanner } from '../components/PersonalStatsBanner';
import { SellerPodium } from '../components/SellerPodium';
import { SellerCard } from '../components/SellerCard';
import { BranchComparisonSection } from '../components/BranchComparisonSection';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import {
  LayoutDashboard,
  TrendingUp,
  Store,
  Calendar,
  DollarSign,
  Receipt,
  CreditCard,
  Percent,
  Trophy,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  LineChart as LineChartIcon,
  ShieldAlert,
  Lock
} from 'lucide-react';

const PERIOD_OPTIONS = [
  { value: 'TODAY', label: 'Hoy' },
  { value: 'THIS_WEEK', label: 'Esta semana' },
  { value: 'THIS_MONTH', label: 'Este mes' },
  { value: 'THIS_YEAR', label: 'Este año' },
  { value: 'CUSTOM', label: 'Rango personalizado' }
];

export const DashboardPage = () => {
  const { error: toastError } = useToast();
  const { userProfile, hasPermission, hasRole } = useAuthStore();

  // 1. Redirección exclusiva si el usuario es únicamente CASHIER
  const isCashierOnly =
    userProfile?.roles?.length === 1 && userProfile.roles[0] === 'CASHIER';

  if (isCashierOnly) {
    return <Navigate to="/pos/terminal" replace />;
  }

  // 2. Permisos y configuración de moneda
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';
  const hasSummaryRead = hasPermission('COM_DASHBOARD_READ_SUMMARY');
  const hasFinancialPermission = hasPermission('COM_DASHBOARD_FINANCIAL_READ');
  const hasGlobalBranchPermission = hasPermission('COM_DASHBOARD_GLOBAL_READ');
  const canReadBranches = hasPermission('ORG_BRANCHES_ACTIVE_READ');
  const hasDashboardRead = hasPermission('COM_DASHBOARD_READ');
  const isSeller = hasRole('SELLER');

  // Determinar vistas y filtros habilitados según permisos
  const canViewSummary = hasSummaryRead;
  const canViewRanking = hasDashboardRead;
  const showFiltersCard = hasGlobalBranchPermission || canReadBranches;
  const showTabs = canViewSummary && canViewRanking;

  // 3. Estados de Filtros Principales
  const [branches, setBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [period, setPeriod] = useState<DashboardPeriod>('THIS_MONTH');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isLoadingBranches, setIsLoadingBranches] = useState<boolean>(false);

  // Tab activo: 'summary' (Resumen Ejecutivo) | 'ranking' (Ranking de Vendedores)
  const [activeTab, setActiveTab] = useState<'summary' | 'ranking'>(() => {
    if (canViewSummary) return 'summary';
    return 'ranking';
  });

  // Sincronizar tab si cambian los permisos
  useEffect(() => {
    if (!canViewSummary && canViewRanking) {
      setActiveTab('ranking');
    } else if (canViewSummary && !canViewRanking) {
      setActiveTab('summary');
    }
  }, [canViewSummary, canViewRanking]);

  // 4. Estados de Datos
  const [summaryData, setSummaryData] = useState<DashboardSummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState<boolean>(false);

  const [personalStats, setPersonalStats] = useState<DashboardSellerPersonalResponse | null>(null);

  // Ranking de Vendedores
  const [sellerRanking, setSellerRanking] = useState<DashboardSellerRankingResponse[]>([]);
  const [sellerSortBy, setSellerSortBy] = useState<DashboardSellerSort>('SALES');
  const [sellerPage, setSellerPage] = useState<number>(0);
  const [sellerPageSize] = useState<number>(10);
  const [sellerTotalElements, setSellerTotalElements] = useState<number>(0);
  const [sellerTotalPages, setSellerTotalPages] = useState<number>(0);
  const [isLoadingRanking, setIsLoadingRanking] = useState<boolean>(false);

  // Helper de moneda
  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // 5. Cargar sucursales activas al montar (Solo si tiene ORG_BRANCHES_ACTIVE_READ)
  useEffect(() => {
    if (!canReadBranches) {
      setIsLoadingBranches(false);
      return;
    }
    const loadBranches = async () => {
      setIsLoadingBranches(true);
      try {
        const branchList = await branchService.getActiveBranches();
        setBranches(branchList || []);
        if (!hasGlobalBranchPermission && branchList && branchList.length > 0) {
          setSelectedBranchId(branchList[0].id);
        }
      } catch (err) {
        console.error('Error loading branches for dashboard:', err);
      } finally {
        setIsLoadingBranches(false);
      }
    };
    loadBranches();
  }, [canReadBranches, hasGlobalBranchPermission]);

  // 6. Cargar Resumen Ejecutivo (KPIs, Tendencias y Sucursales) - Solo si tiene COM_DASHBOARD_READ_SUMMARY
  const loadSummary = async () => {
    if (!canViewSummary) return;
    setIsLoadingSummary(true);
    try {
      const res = await dashboardService.getDashboardSummary({
        branchId: selectedBranchId || undefined,
        period,
        startDate: period === 'CUSTOM' ? startDate : undefined,
        endDate: period === 'CUSTOM' ? endDate : undefined
      });
      setSummaryData(res);
    } catch (err) {
      console.error('Error loading dashboard summary:', err);
      setSummaryData(null);
      toastError('No se pudo cargar el resumen del dashboard.');
    } finally {
      setIsLoadingSummary(false);
    }
  };

  // 7. Cargar Estadísticas Personales - Solo si tiene COM_DASHBOARD_READ y es vendedor
  const loadPersonalStats = async () => {
    if (!hasDashboardRead || !isSeller) return;
    try {
      const res = await dashboardService.getMyStats({
        period,
        startDate: period === 'CUSTOM' ? startDate : undefined,
        endDate: period === 'CUSTOM' ? endDate : undefined
      });
      setPersonalStats(res);
    } catch (err) {
      console.error('Error loading personal stats:', err);
      setPersonalStats(null);
    }
  };

  // 8. Cargar Leaderboard de Vendedores - Solo si tiene COM_DASHBOARD_READ
  const loadSellerRanking = async (targetPage = sellerPage) => {
    if (!hasDashboardRead) return;
    setIsLoadingRanking(true);
    try {
      const res = await dashboardService.getSellerRanking({
        branchId: selectedBranchId || undefined,
        period,
        startDate: period === 'CUSTOM' ? startDate : undefined,
        endDate: period === 'CUSTOM' ? endDate : undefined,
        sortBy: sellerSortBy,
        page: targetPage,
        size: sellerPageSize
      });
      setSellerRanking(res.content || []);
      setSellerTotalElements(res.totalElements || 0);
      setSellerTotalPages(res.totalPages || 0);
    } catch (err) {
      console.error('Error loading seller ranking:', err);
      toastError('No se pudo cargar el ranking de vendedores.');
    } finally {
      setIsLoadingRanking(false);
    }
  };

  // Disparar carga de resumen y personal stats al cambiar filtros
  useEffect(() => {
    if (period === 'CUSTOM' && (!startDate || !endDate)) return;
    if (canViewSummary) {
      loadSummary();
    }
    if (hasDashboardRead && isSeller) {
      loadPersonalStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, period, startDate, endDate, canViewSummary, hasDashboardRead, isSeller]);

  // Disparar carga de ranking al cambiar tab o parámetros de ranking
  useEffect(() => {
    if (!hasDashboardRead) return;
    if (period === 'CUSTOM' && (!startDate || !endDate)) return;
    loadSellerRanking(sellerPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedBranchId, period, startDate, endDate, sellerSortBy, sellerPage, hasDashboardRead]);

  // Reiniciar página al cambiar filtros principales o criterio de ordenación sin llamadas redundantes
  const handleSortChange = (newSort: DashboardSellerSort) => {
    if (newSort === sellerSortBy || isLoadingRanking) return;
    setSellerSortBy(newSort);
    setSellerPage(0);
  };

  // Separar los vendedores: Top 3 para el podio y el resto para las cards temáticas
  const top3Sellers = sellerRanking.slice(0, 3);
  const remainingSellers = sellerRanking.slice(3);

  // Series para el gráfico de tendencia de ventas
  const trendSeries = [
    {
      dataKey: 'grossSales',
      name: 'Ventas Brutas',
      color: '#4f46e5' // Indigo
    }
  ];

  if (hasFinancialPermission) {
    trendSeries.push({
      dataKey: 'netProfit',
      name: 'Ganancia Neta',
      color: '#10b981' // Emerald
    });
  }

  return (
    <div className="space-y-6 w-full animate-fade-in pb-12">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-primary" />
            Panel de Control Ejecutivo
          </h1>
          <p className="text-sm text-base-content/60 mt-1 leading-relaxed">
            Métricas comerciales en tiempo real, tendencias de ventas y desempeño del equipo.
          </p>
        </div>
      </div>

      {/* 2. TARJETA SUPERIOR DE RENDIMIENTO PERSONAL (Solo si tiene COM_DASHBOARD_READ) */}
      {hasDashboardRead && personalStats && (
        <PersonalStatsBanner stats={personalStats} currencyCode={currencyCode} />
      )}

      {/* 3. BARRA DE FILTROS (Se muestra solo si al menos un selector está disponible) */}
      {showFiltersCard && (
        <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4 flex-wrap">
            {/* Selector de Período solo si tiene permiso COM_DASHBOARD_GLOBAL_READ */}
            {hasGlobalBranchPermission && (
              <div className="w-full sm:w-60">
                <label className="text-xs font-bold text-base-content/70 block mb-1 flex items-center gap-1.5">
                  <Calendar size={14} className="text-primary" />
                  Período de Análisis:
                </label>
                <ComerziaSelect
                  value={period}
                  onChange={e => {
                    setPeriod(e.target.value as DashboardPeriod);
                    setSellerPage(0);
                  }}
                  options={PERIOD_OPTIONS}
                />
              </div>
            )}

            {/* Fechas personalizadas si tiene permiso global y period === 'CUSTOM' */}
            {hasGlobalBranchPermission && period === 'CUSTOM' && (
              <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                <div className="w-full sm:w-44">
                  <ComerziaInput
                    label="Desde:"
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </div>
                <div className="w-full sm:w-44">
                  <ComerziaInput
                    label="Hasta:"
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Selector de Sucursal solo si tiene permiso ORG_BRANCHES_ACTIVE_READ */}
            {canReadBranches && (
              <div className="w-full sm:w-72">
                <label className="text-xs font-bold text-base-content/70 block mb-1 flex items-center gap-1.5">
                  <Store size={14} className="text-primary" />
                  Sucursal:
                </label>
                <ComerziaSelect
                  placeholder="Todas las sucursales"
                  enableDefaultOption={hasGlobalBranchPermission}
                  value={selectedBranchId}
                  onChange={e => {
                    setSelectedBranchId(e.target.value);
                    setSellerPage(0);
                  }}
                  options={branches.map(b => ({
                    value: b.id,
                    label: b.name
                  }))}
                  disabled={!hasGlobalBranchPermission && branches.length <= 1}
                  isLoading={isLoadingBranches}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. TABS PRINCIPALES (Solo si tiene permisos para ver ambos: Resumen y Ranking) */}
      {showTabs && (
        <div className="flex items-center justify-between border-b border-base-200">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('summary')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'summary'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                  : 'border-transparent text-base-content/60 hover:text-base-content'
              }`}
            >
              <TrendingUp size={16} />
              <span>Resumen Ejecutivo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ranking')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold border-b-2 transition-all cursor-pointer ${
                activeTab === 'ranking'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                  : 'border-transparent text-base-content/60 hover:text-base-content'
              }`}
            >
              <Trophy size={16} />
              <span>Ranking de Vendedores</span>
              {sellerTotalElements > 0 && (
                <span className="badge badge-sm badge-neutral font-mono font-bold">
                  {sellerTotalElements}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* 5. CASO SIN PERMISOS (Ni Financiero ni Dashboard Read) */}
      {!canViewSummary && !canViewRanking && (
        <div className="card bg-base-100 p-12 text-center border border-base-200 rounded-3xl flex flex-col items-center justify-center gap-2">
          <ShieldAlert size={36} className="text-warning" />
          <h3 className="font-bold text-base text-base-content">Acceso Restringido</h3>
          <p className="text-xs text-base-content/60 max-w-md">
            No cuentas con los permisos requeridos para visualizar las métricas ejecutivas o los rankings comerciales.
          </p>
        </div>
      )}

      {/* 6. VISTA RESUMEN EJECUTIVO (Solo si tiene COM_DASHBOARD_READ_SUMMARY y tab activo o vista única) */}
      {canViewSummary && (activeTab === 'summary' || !canViewRanking) && (
        <div className="space-y-6 animate-fade-in">
          {isLoadingSummary ? (
            <div className="py-20 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-xs text-base-content/50 mt-2">Calculando métricas ejecutivas en tiempo real...</p>
            </div>
          ) : (
            <>
              {/* Tarjetas KPI Superiores */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {/* KPI 1: Ventas Totales (Brutas) */}
                <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        Ventas Brutas
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <TrendingUp size={16} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-base-content tracking-tight block truncate">
                        {formatMoney(summaryData?.kpis.totalGrossSales)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-base-content/50 mt-1 block">
                    {summaryData?.kpis.totalTransactions || 0} transacciones emitidas
                  </span>
                </div>

                {/* KPI 2: Ganancia Neta */}
                <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Ganancia Neta
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <DollarSign size={16} />
                      </div>
                    </div>
                    <div className="mt-2 flex items-baseline gap-1.5 flex-wrap">
                      {hasFinancialPermission && summaryData?.kpis.totalNetProfit != null ? (
                        <>
                          <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight block truncate">
                            {formatMoney(summaryData?.kpis.totalNetProfit)}
                          </span>
                          {summaryData?.kpis.marginPercentage != null && (
                            <span className="badge badge-sm badge-success text-white font-mono text-[10px] font-bold">
                              {Number(summaryData?.kpis.marginPercentage).toFixed(1)}%
                            </span>
                          )}
                        </>
                      ) : (
                        <div className="flex items-center gap-1.5 text-base-content/40 py-1">
                          <Lock size={15} />
                          <span className="text-sm font-semibold italic">Confidencial</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] text-base-content/50 mt-1 block">
                    Margen sobre ventas brutas
                  </span>
                </div>

                {/* KPI 3: Total Descuentos */}
                <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                        Descuentos
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                        <Percent size={16} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-amber-500 tracking-tight block truncate">
                        {formatMoney(summaryData?.kpis.totalDiscounts)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-base-content/50 mt-1 block">
                    Bonificaciones comerciales
                  </span>
                </div>

                {/* KPI 4: Ticket Promedio */}
                <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-violet-500 uppercase tracking-wider">
                        Ticket Promedio
                      </span>
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-500 flex items-center justify-center shrink-0">
                        <CreditCard size={16} />
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-base sm:text-xl lg:text-2xl font-bold font-mono text-violet-500 tracking-tight block truncate">
                        {formatMoney(summaryData?.kpis.averageTicket)}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] text-base-content/50 mt-1 block">
                    {summaryData?.kpis.totalUnitsSold || 0} unidades totales vendidas
                  </span>
                </div>
              </div>

              {/* Gráfico de Tendencia de Ventas */}
              <div className="card bg-base-100 p-4 sm:p-6 rounded-3xl border border-base-200 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-base-200 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      <LineChartIcon size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base sm:text-lg text-base-content">
                        Curva de Tendencia de Ventas
                      </h3>
                      <p className="text-xs text-base-content/60">
                        Evolución periódica de facturación y rentabilidad neta.
                      </p>
                    </div>
                  </div>

                  <span className="badge badge-ghost font-mono text-xs px-2.5 py-1 self-start sm:self-auto">
                    {summaryData?.salesTrend?.length || 0} puntos medidos
                  </span>
                </div>

                {!summaryData?.salesTrend || summaryData.salesTrend.length === 0 ? (
                  <div className="py-20 text-center text-xs text-base-content/40 italic">
                    No hay transacciones registradas en el período seleccionado.
                  </div>
                ) : (
                  <ComerziaLineChart
                    data={summaryData.salesTrend}
                    xAxisDataKey="dateGroup"
                    height={320}
                    series={trendSeries}
                    valueFormatter={val => formatMoney(val)}
                  />
                )}
              </div>

              {/* Desglose Comparativo por Sucursal */}
              {summaryData?.branchSales && summaryData.branchSales.length > 0 && (
                <BranchComparisonSection
                  branches={summaryData.branchSales}
                  currencyCode={currencyCode}
                  hasFinancialPermission={hasFinancialPermission}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 7. VISTA RANKING DE VENDEDORES (Solo si tiene COM_DASHBOARD_READ y tab activo o vista única) */}
      {canViewRanking && (activeTab === 'ranking' || !canViewSummary) && (
        <div className="space-y-6 animate-fade-in">
          {/* Barra de opciones de ordenación del leaderboard con componentes ComerziaButton */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-base-100 rounded-2xl border border-base-200 shadow-xs">
            <div className="flex items-center gap-2">
              <Users size={18} className="text-primary" />
              <span className="text-sm font-bold text-base-content">Ordenar Leaderboard por:</span>
              {isLoadingRanking && sellerRanking.length > 0 && (
                <span className="loading loading-spinner loading-xs text-primary ml-1"></span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <ComerziaButton
                variant={sellerSortBy === 'SALES' ? 'primary' : 'ghost'}
                icon={<TrendingUp size={14} />}
                label="Mayor Volumen ($)"
                onClick={() => handleSortChange('SALES')}
                className="btn-xs sm:btn-sm rounded-xl min-w-0"
              />

              <ComerziaButton
                variant={sellerSortBy === 'TRANSACTIONS' ? 'primary' : 'ghost'}
                icon={<Receipt size={14} />}
                label="Más Ventas (#)"
                onClick={() => handleSortChange('TRANSACTIONS')}
                className="btn-xs sm:btn-sm rounded-xl min-w-0"
              />

              {/* Opción de Ganancia solo si tiene permiso financiero */}
              {hasFinancialPermission && (
                <ComerziaButton
                  variant={sellerSortBy === 'PROFIT' ? 'primary' : 'ghost'}
                  icon={<DollarSign size={14} />}
                  label="Mayor Rentabilidad ($)"
                  onClick={() => handleSortChange('PROFIT')}
                  className="btn-xs sm:btn-sm rounded-xl min-w-0"
                />
              )}
            </div>
          </div>

          {isLoadingRanking && sellerRanking.length === 0 ? (
            <div className="py-20 text-center">
              <span className="loading loading-spinner loading-lg text-primary"></span>
              <p className="text-xs text-base-content/50 mt-2">Calculando posiciones y podio del equipo...</p>
            </div>
          ) : sellerRanking.length === 0 ? (
            <div className="card bg-base-100 p-12 text-center border border-base-200 rounded-3xl text-xs text-base-content/50">
              No se registraron ventas de colaboradores en el período seleccionado.
            </div>
          ) : (
            <div className="relative">
              {/* Overlay sutil para evitar colapso de layout o temblores durante peticiones */}
              {isLoadingRanking && (
                <div className="absolute inset-0 bg-base-100/40 backdrop-blur-[1px] z-20 rounded-3xl flex items-center justify-center transition-all duration-200">
                  <div className="bg-base-100 shadow-xl border border-base-200 px-4 py-2 rounded-full flex items-center gap-2.5 text-xs font-semibold text-base-content">
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                    <span>Actualizando leaderboard...</span>
                  </div>
                </div>
              )}

              <div className={`space-y-6 transition-opacity duration-200 ${isLoadingRanking ? 'opacity-40 pointer-events-none' : 'opacity-100'}`}>
                {/* PODIO OLÍMPICO VISUAL (Top 3) */}
                <SellerPodium
                  topSellers={top3Sellers}
                  currencyCode={currencyCode}
                  hasFinancialPermission={hasFinancialPermission}
                />

                {/* RESTO DEL EQUIPO: CARDS COLORIDAS Y DINÁMICAS (Puesto 4 en adelante) */}
                {remainingSellers.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
                          <Users size={18} className="text-primary" />
                          Resto del Equipo Comercial
                        </h3>
                        <p className="text-xs text-base-content/60">
                          Colaboradores a partir del 4º puesto en el ranking comercial.
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                      {remainingSellers.map((seller, idx) => (
                        <SellerCard
                          key={seller.employeeId}
                          seller={seller}
                          index={idx}
                          currencyCode={currencyCode}
                          hasFinancialPermission={hasFinancialPermission}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* PAGINACIÓN SERVER-SIDE ESTÁNDAR CON COMERZIA BUTTONS */}
                {sellerTotalPages > 1 && (
                  <div className="card bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs flex flex-row items-center justify-between gap-2 overflow-x-auto whitespace-nowrap text-xs">
                    <span className="text-base-content/60 shrink-0 font-medium">
                      Página <strong>{sellerPage + 1}</strong> de <strong>{sellerTotalPages}</strong> ({sellerTotalElements} vendedores en total)
                    </span>

                    <div className="flex items-center gap-1 shrink-0">
                      <ComerziaButton
                        variant="ghost"
                        isIconOnly
                        icon={<ChevronsLeft size={14} />}
                        onClick={() => setSellerPage(0)}
                        disabled={sellerPage === 0 || isLoadingRanking}
                        tooltip="Primera página"
                        className="btn-xs"
                      />
                      <ComerziaButton
                        variant="ghost"
                        isIconOnly
                        icon={<ChevronLeft size={14} />}
                        onClick={() => setSellerPage(p => Math.max(0, p - 1))}
                        disabled={sellerPage === 0 || isLoadingRanking}
                        tooltip="Página anterior"
                        className="btn-xs"
                      />
                      <span className="px-2 font-mono font-bold text-xs text-base-content">
                        {sellerPage + 1} / {sellerTotalPages}
                      </span>
                      <ComerziaButton
                        variant="ghost"
                        isIconOnly
                        icon={<ChevronRight size={14} />}
                        onClick={() => setSellerPage(p => Math.min(sellerTotalPages - 1, p + 1))}
                        disabled={sellerPage >= sellerTotalPages - 1 || isLoadingRanking}
                        tooltip="Página siguiente"
                        className="btn-xs"
                      />
                      <ComerziaButton
                        variant="ghost"
                        isIconOnly
                        icon={<ChevronsRight size={14} />}
                        onClick={() => setSellerPage(sellerTotalPages - 1)}
                        disabled={sellerPage >= sellerTotalPages - 1 || isLoadingRanking}
                        tooltip="Última página"
                        className="btn-xs"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};