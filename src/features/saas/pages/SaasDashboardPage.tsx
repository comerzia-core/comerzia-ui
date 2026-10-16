import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, DollarSign, Activity, ArrowRight } from 'lucide-react';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { BtnDetails } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformData } from '../hooks/usePlatformData';
import { formatDateForUser } from '../../../utils/date';
import type { PlatformOverview } from '../types/platform';
import type { FinancialDashboard } from '../types/financial';

export function SaasDashboardPage() {
  const navigate = useNavigate();
  const { can } = usePermission();

  const hasFinance = can('SYS_FINANCE_READ');
  const hasOperations = can('SYS_DASHBOARD_READ');

  // Consultas paralelas condicionadas por permisos RBAC
  const financialQuery = usePlatformData<FinancialDashboard>(
    '/saas/dashboard/financial',
    undefined,
    hasFinance
  );
  const operationsQuery = usePlatformData<PlatformOverview>(
    '/saas/dashboard',
    undefined,
    hasOperations
  );

  const financialData = financialQuery.data;
  const operationsData = operationsQuery.data;

  const isPending = (hasFinance && financialQuery.isPending) || (hasOperations && operationsQuery.isPending);
  const isError = (hasFinance && financialQuery.isError) && (hasOperations && operationsQuery.isError);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <LayoutDashboard className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Plataforma Comerzia
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Monitoreo operativo y financiero integral del parque de clientes SaaS.
            </p>
          </div>
        </div>

        {/* Acciones rápidas de cabecera */}
        {hasFinance && financialData && financialData.pendingReviews > 0 && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/saas/billing/verification')}
              className="btn btn-sm btn-primary gap-2 shadow-xs cursor-pointer"
            >
              <span>Verificar pagos pendientes ({financialData.pendingReviews})</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}
      </div>

      {isPending && (
        <div className="flex items-center justify-center py-12 gap-3 text-base-content/60" role="status">
          <span className="loading loading-spinner loading-md text-primary" />
          <span className="text-sm font-medium">Cargando indicadores de plataforma…</span>
        </div>
      )}

      {isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudieron consultar los indicadores del dashboard.</span>
        </div>
      )}

      {/* 2. SECCIÓN FINANCIERA (Visible con SYS_FINANCE_READ) */}
      {hasFinance && financialData && (
        <section className="space-y-5 animate-fade-in" aria-label="Resumen financiero">
          <div className="flex items-center gap-2 border-b border-base-200 pb-2">
            <DollarSign className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-base-content tracking-tight">
              Resumen financiero de Comerzia
            </h2>
          </div>

          {/* Tarjetas de métricas financieras */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <ComerziaMetricCard
              label="MRR contratado"
              value={`${financialData.mrr.toFixed(2)} Bs`}
            />
            <ComerziaMetricCard
              label="ARR proyectado"
              value={`${financialData.arr.toFixed(2)} Bs`}
            />
            <ComerziaMetricCard
              label="Recaudado este mes (UTC)"
              value={`${financialData.collectedThisMonth.toFixed(2)} Bs`}
            />
            {financialData.churnRatePercentage != null ? (
              <ComerziaMetricCard
                label="Abandono de contratos (30 d)"
                value={`${financialData.churnRatePercentage.toFixed(2)} %`}
              />
            ) : (
              <ComerziaMetricCard
                label="Empresas de pago"
                value={String(financialData.activePaidTenants)}
              />
            )}
            <ComerziaMetricCard
              label="Ingreso medio mensual por empresa"
              value={`${financialData.arpu.toFixed(2)} Bs`}
            />
            <ComerziaMetricCard
              label="Recaudado mes anterior (UTC)"
              value={`${financialData.collectedLastMonth.toFixed(2)} Bs`}
            />
          </div>

          {/* Gráfico de recaudación de los últimos 12 meses */}
          <ComerziaSurface className="p-4 sm:p-5 rounded-2xl border border-base-200 bg-base-100 shadow-xs">
            <h3 className="text-sm sm:text-base font-bold text-base-content mb-4">
              Recaudación de los últimos 12 meses
            </h3>
            <div className="h-64 w-full min-w-0" role="img" aria-label="Gráfico mensual de cobros confirmados">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData.revenueHistory} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="yearMonth" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--color-base-100, #fff)',
                      borderColor: 'var(--color-base-300, #ccc)',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="amount" name="Cobrado (Bs)" fill="var(--color-primary, #6366f1)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </ComerziaSurface>

          {/* Distribución por planes y resumen de cobros pendientes */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComerziaSurface className="p-4 sm:p-5 rounded-2xl border border-base-200 bg-base-100 shadow-xs">
              <h3 className="text-sm sm:text-base font-bold text-base-content mb-3">
                Empresas por plan
              </h3>
              <ComerziaResponsiveTable
                data={financialData.planDistribution.map(row => ({ ...row, id: row.code }))}
                columns={[
                  { header: 'Plan', accessorKey: 'name' },
                  { header: 'Empresas', accessorKey: 'count' },
                  { header: 'MRR (Bs)', render: row => row.mrr.toFixed(2) },
                ]}
              />
            </ComerziaSurface>

            <ComerziaSurface className="p-4 sm:p-5 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-base-content">
                Cobros por revisar
              </h3>
              <p className="text-sm text-base-content/80 font-medium">
                {financialData.pendingReviews} solicitudes · {financialData.pendingAmount.toFixed(2)} Bs
              </p>
              <BtnDetails
                responsive={false}
                label="Verificar pagos"
                onClick={() => navigate('/saas/billing/verification')}
              />
              <p className="text-xs text-base-content/60">
                {financialData.expiredTenants} suscripciones vencidas.
              </p>
              <p className="text-xs text-base-content/50">
                MRR y ARR son proyecciones del período contratado; no equivalen a dinero cobrado.
              </p>
              {financialData.churnRatePercentage == null && (
                <p className="text-xs text-base-content/50">
                  La tasa de abandono aún no dispone de historial suficiente.
                </p>
              )}
            </ComerziaSurface>
          </div>

          {/* Suscripciones que vencen en los próximos 7 días */}
          {financialData.expiringTenants && financialData.expiringTenants.length > 0 && (
            <ComerziaSurface className="p-4 sm:p-5 rounded-2xl border border-base-200 bg-base-100 shadow-xs">
              <h3 className="text-sm sm:text-base font-bold text-base-content mb-3">
                Vencen en los próximos 7 días
              </h3>
              <ComerziaResponsiveTable
                data={financialData.expiringTenants.map(row => ({ ...row, id: row.companyId }))}
                columns={[
                  { header: 'Empresa', accessorKey: 'commercialName' },
                  { header: 'Plan', accessorKey: 'planName' },
                  { header: 'Vencimiento', render: row => formatDateForUser(row.validUntil) },
                  {
                    header: 'Consulta',
                    render: row => (
                      <BtnDetails
                        responsive={false}
                        label="Ver empresa"
                        onClick={() => navigate('/saas/tenants/' + encodeURIComponent(row.companyId))}
                      />
                    ),
                  },
                ]}
              />
            </ComerziaSurface>
          )}
        </section>
      )}

      {/* 3. SECCIÓN OPERATIVA (Visible con SYS_DASHBOARD_READ) */}
      {hasOperations && operationsData && (
        <section className="space-y-4 animate-fade-in" aria-label="Indicadores operativos">
          <div className="flex items-center gap-2 border-b border-base-200 pb-2">
            <Activity className="w-5 h-5 text-primary shrink-0" />
            <h2 className="text-base sm:text-lg font-bold text-base-content tracking-tight">
              Indicadores Operativos
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <ComerziaMetricCard
              label="Empresas"
              value={operationsData.companies}
            />
            <ComerziaMetricCard
              label="Habilitadas"
              value={operationsData.activeCompanies}
            />
            <ComerziaMetricCard
              label="Suspendidas"
              value={operationsData.suspendedCompanies}
            />
            <ComerziaMetricCard
              label="Suscripciones vencidas"
              value={operationsData.expiredSubscriptions}
            />
          </div>
        </section>
      )}
    </div>
  );
}
