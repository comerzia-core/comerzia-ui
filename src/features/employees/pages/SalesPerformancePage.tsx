// src/features/employees/pages/SalesPerformancePage.tsx
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useDebounce } from '../../../hooks/useDebounce';
import { useToast } from '../../../context/ToastContext';
import { branchService } from '../../organization/services/branchService';
import type { TenantActiveBranchResponse } from '../../organization/types/branch';
import { salesPerformanceService } from '../services/salesPerformanceService';
import type {
  SellerPerformanceAuditResponse,
  TeamPerformanceSummaryResponse,
  SalesPerformancePeriod
} from '../types/salesPerformance';
import { TeamPerformanceSummaryKpis } from '../components/sales-performance/TeamPerformanceSummaryKpis';
import { SalesPerformanceTable } from '../components/sales-performance/SalesPerformanceTable';
import { SellerRadiographyModal } from '../components/sales-performance/SellerRadiographyModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import {
  TrendingUp,
  ShieldAlert,
  Activity
} from 'lucide-react';
import { PERIOD_OPTIONS, getPeriodDescription } from '../../../utils/date';

export const SalesPerformancePage: React.FC = () => {
  const { hasPermission, userProfile } = useAuthStore();
  const { error: toastError } = useToast();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // 1. Control de Autorización: HUM_SALES_PERFORMANCE_READ
  const hasAuditPermission = hasPermission('HUM_SALES_PERFORMANCE_READ');
  const canReadBranches = hasPermission('ORG_BRANCHES_ACTIVE_READ');

  // 2. Estados de Filtros
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);

  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branches, setBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [period, setPeriod] = useState<SalesPerformancePeriod>('THIS_MONTH');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 3. Estados de Paginación y Datos
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [auditList, setAuditList] = useState<SellerPerformanceAuditResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingTable, setIsLoadingTable] = useState(false);

  const [summaryData, setSummaryData] = useState<TeamPerformanceSummaryResponse | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);

  // 4. Modal de Radiografía
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [isRadiographyOpen, setIsRadiographyOpen] = useState(false);

  // 5. Menú Contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered: boolean;
    item: SellerPerformanceAuditResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    item: null
  });

  // Helper para formatear fechas a YYYY-MM-DD
  const formatLocalDate = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Calcular rango de fechas efectivo
  const getDateRange = (): { start?: string; end?: string } => {
    const now = new Date();
    if (period === 'TODAY') {
      const todayStr = formatLocalDate(now);
      return { start: todayStr, end: todayStr };
    }
    if (period === 'THIS_WEEK') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Lunes
      const monday = new Date(now.setDate(diff));
      return { start: formatLocalDate(monday), end: formatLocalDate(new Date()) };
    }
    if (period === 'THIS_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: formatLocalDate(start), end: formatLocalDate(now) };
    }
    if (period === 'LAST_MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { start: formatLocalDate(start), end: formatLocalDate(end) };
    }
    if (period === 'THIS_YEAR') {
      const start = new Date(now.getFullYear(), 0, 1);
      return { start: formatLocalDate(start), end: formatLocalDate(now) };
    }
    if (period === 'CUSTOM') {
      return { start: customStartDate || undefined, end: customEndDate || undefined };
    }
    return {};
  };

  const { start: effectiveStartDate, end: effectiveEndDate } = getDateRange();

  // 6. Cargar sucursales activas si tiene permiso
  useEffect(() => {
    if (!canReadBranches) return;
    const loadBranches = async () => {
      try {
        const branchList = await branchService.getActiveBranches();
        setBranches(branchList);
      } catch (err) {
        console.error('Error loading branches for sales performance:', err);
      }
    };
    loadBranches();
  }, [canReadBranches]);

  // 7. Cargar Resumen Global del Equipo
  useEffect(() => {
    if (!hasAuditPermission) return;
    if (period === 'CUSTOM' && (!customStartDate || !customEndDate)) return;

    const loadSummary = async () => {
      setIsLoadingSummary(true);
      try {
        const data = await salesPerformanceService.getTeamSummary({
          branchId: selectedBranchId || undefined,
          startDate: effectiveStartDate,
          endDate: effectiveEndDate
        });
        setSummaryData(data);
      } catch (err) {
        console.error('Error loading team performance summary:', err);
        setSummaryData(null);
      } finally {
        setIsLoadingSummary(false);
      }
    };

    loadSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAuditPermission, selectedBranchId, period, customStartDate, customEndDate]);

  // 8. Cargar Tabla de Auditoría
  useEffect(() => {
    if (!hasAuditPermission) return;
    if (period === 'CUSTOM' && (!customStartDate || !customEndDate)) return;

    const loadAuditTable = async () => {
      setIsLoadingTable(true);
      try {
        const res = await salesPerformanceService.getPerformanceAudit({
          branchId: selectedBranchId || undefined,
          startDate: effectiveStartDate,
          endDate: effectiveEndDate,
          search: debouncedSearch || undefined,
          page,
          size: pageSize
        });
        setAuditList(res.content || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      } catch (err) {
        console.error('Error loading sales performance audit:', err);
        setAuditList([]);
        toastError('No se pudo cargar la auditoría de ventas.');
      } finally {
        setIsLoadingTable(false);
      }
    };

    loadAuditTable();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAuditPermission, selectedBranchId, period, customStartDate, customEndDate, debouncedSearch, page, pageSize]);

  // Reiniciar a página 0 cuando cambian los filtros
  useEffect(() => {
    setPage(0);
  }, [debouncedSearch, selectedBranchId, period, customStartDate, customEndDate]);

  // Handlers de interacción
  const handleOpenRadiography = (sellerId: string) => {
    setSelectedSellerId(sellerId);
    setIsRadiographyOpen(true);
  };

  const handleRowContextMenu = (e: React.MouseEvent, item: SellerPerformanceAuditResponse) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      isCentered: false,
      item
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, item: SellerPerformanceAuditResponse) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      isCentered: true,
      item
    });
  };

  // 9. Vista de Acceso Denegado
  if (!hasAuditPermission) {
    return (
      <div className="card bg-base-100 p-12 text-center border border-base-200 rounded-3xl max-w-lg mx-auto mt-12 space-y-4 animate-fade-in shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-warning/10 text-warning flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>
        <div>
          <h2 className="font-bold text-lg text-base-content">Acceso Restringido</h2>
          <p className="text-xs text-base-content/60 mt-1 max-w-sm mx-auto">
            Esta sección de auditoría de rendimiento y comisiones está restringida exclusivamente a la administración y gerencia general (<code>HUM_SALES_PERFORMANCE_READ</code>).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-fade-in pb-12">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp size={22} />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-base-content tracking-tight">
              Rendimiento y Auditoría de Ventas
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">
              Auditoría integral de ingresos, descuentos, costos COGS, margen de utilidad y penalizaciones por devoluciones.
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS PRINCIPALES */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            {/* Input de Búsqueda */}
            <div className="w-full sm:w-80">
              <ComerziaInput
                icon="Search"
                placeholder="Buscar vendedor por nombre..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {/* Selector de Sucursal (si tiene permiso) */}
            {canReadBranches && (
              <div className="w-full sm:w-60">
                <ComerziaSelect
                  value={selectedBranchId}
                  onChange={e => setSelectedBranchId(e.target.value)}
                  options={[
                    { value: '', label: 'Todas las sucursales' },
                    ...branches.map(b => ({
                      value: b.id,
                      label: b.name
                    }))
                  ]}
                />
              </div>
            )}
          </div>

          {/* Filtros de Fecha / Periodo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-start gap-2 w-full lg:w-auto">
            <div className="w-full sm:w-52">
              <ComerziaSelect
                value={period}
                onChange={e => setPeriod(e.target.value as SalesPerformancePeriod)}
                options={PERIOD_OPTIONS}
              />
              {period !== 'CUSTOM' && (
                <span className="text-[11px] text-base-content/60 font-medium block mt-1 pl-1">
                  {getPeriodDescription(period)}
                </span>
              )}
            </div>

            {period === 'CUSTOM' && (
              <div className="flex items-center gap-2 w-full sm:w-auto animate-fade-in">
                <div className="w-full sm:w-40">
                  <ComerziaInput
                    type="date"
                    value={customStartDate}
                    onChange={e => setCustomStartDate(e.target.value)}
                  />
                </div>
                <span className="text-xs text-base-content/40 font-bold shrink-0 mt-2">al</span>
                <div className="w-full sm:w-40">
                  <ComerziaInput
                    type="date"
                    value={customEndDate}
                    onChange={e => setCustomEndDate(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. RESUMEN GLOBAL DE NÓMINA COMERCIAL (KPIs) */}
      <TeamPerformanceSummaryKpis
        summary={summaryData}
        isLoading={isLoadingSummary}
        currencyCode={currencyCode}
      />

      {/* 4. TABLA Y CARDS DE AUDITORÍA */}
      <div className="md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:p-0">
          <SalesPerformanceTable
            data={auditList}
            isLoading={isLoadingTable}
            totalElements={totalElements}
            totalPages={totalPages}
            page={page}
            pageSize={pageSize}
            currencyCode={currencyCode}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            onRowContextMenu={handleRowContextMenu}
            onMobileCardTap={handleMobileCardTap}
            onViewDetails={item => handleOpenRadiography(item.employeeId)}
          />
        </div>
      </div>

      {/* 5. MENÚ CONTEXTUAL (PC Clic Derecho / Mobile Tap) */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.item && (
          <>
            <li className="menu-title px-3 py-1.5 text-xs text-base-content/50 border-b border-base-200">
              {contextMenu.item.sellerName}
            </li>
            <ContextMenuItem
              icon={Activity}
              label="Ver Radiografía Completa"
              onClick={() => {
                if (contextMenu.item) {
                  handleOpenRadiography(contextMenu.item.employeeId);
                }
              }}
            />
          </>
        )}
      </ComerziaContextMenu>

      {/* 6. MODAL DE RADIOGRAFÍA DEL VENDEDOR */}
      <SellerRadiographyModal
        isOpen={isRadiographyOpen}
        onClose={() => {
          setIsRadiographyOpen(false);
          setSelectedSellerId(null);
        }}
        employeeId={selectedSellerId}
        startDate={effectiveStartDate}
        endDate={effectiveEndDate}
        branchId={selectedBranchId || undefined}
        currencyCode={currencyCode}
      />
    </div>
  );
};
