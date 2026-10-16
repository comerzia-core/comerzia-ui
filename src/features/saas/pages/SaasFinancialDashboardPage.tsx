import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { BtnDetails } from '../../../components/ui/CrudButtons';
import { usePlatformData } from '../hooks/usePlatformData';
import { formatDateForUser } from '../../../utils/date';
import type { FinancialDashboard } from '../types/financial';
export function SaasFinancialDashboardPage() {
  const query = usePlatformData<FinancialDashboard>('/saas/dashboard/financial'); const navigate = useNavigate(); const data = query.data;
  if (!data) return <p role={query.isError ? 'alert' : 'status'}>{query.isError ? 'No se pudo cargar el resumen financiero.' : 'Cargando resumen financiero…'}</p>;
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Resumen financiero de Comerzia</h1>
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <ComerziaMetricCard label="MRR contratado" value={data.mrr.toFixed(2) + ' Bs'} />
      <ComerziaMetricCard label="ARR proyectado" value={data.arr.toFixed(2) + ' Bs'} />
      <ComerziaMetricCard label="Recaudado este mes (UTC)" value={data.collectedThisMonth.toFixed(2) + ' Bs'} />
      {data.churnRatePercentage != null && <ComerziaMetricCard label="Abandono de contratos (30 d)" value={data.churnRatePercentage.toFixed(2) + ' %'} />}
      <ComerziaMetricCard label="Empresas de pago" value={String(data.activePaidTenants)} />
      <ComerziaMetricCard label="Ingreso medio mensual por empresa" value={data.arpu.toFixed(2) + ' Bs'} />
      <ComerziaMetricCard label="Recaudado mes anterior (UTC)" value={data.collectedLastMonth.toFixed(2) + ' Bs'} />
    </div>
    <ComerziaSurface><h2 className="font-bold mb-4">Recaudación de los últimos 12 meses</h2><div className="h-64 w-full min-w-0" role="img" aria-label="Gráfico mensual de cobros confirmados">
      <ResponsiveContainer width="100%" height="100%"><BarChart data={data.revenueHistory}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="yearMonth" /><YAxis /><Tooltip /><Bar dataKey="amount" name="Cobrado (Bs)" fill="var(--color-primary)" /></BarChart></ResponsiveContainer>
    </div></ComerziaSurface>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"><ComerziaSurface><h2 className="font-bold mb-3">Empresas por plan</h2>
      <ComerziaResponsiveTable data={data.planDistribution.map(row => ({ ...row, id: row.code }))} columns={[{ header: 'Plan', accessorKey: 'name' }, { header: 'Empresas', accessorKey: 'count' }, { header: 'MRR (Bs)', render: row => row.mrr.toFixed(2) }]} />
    </ComerziaSurface><ComerziaSurface className="space-y-3"><h2 className="font-bold">Cobros por revisar</h2><p>{data.pendingReviews} solicitudes · {data.pendingAmount.toFixed(2)} Bs</p>
      <BtnDetails responsive={false} label="Verificar pagos" onClick={() => navigate('/saas/billing/verification')} /><p>{data.expiredTenants} suscripciones vencidas</p>
      <p className="text-sm text-base-content/60">MRR y ARR son proyecciones del período contratado; no equivalen a dinero cobrado.</p>
      {data.churnRatePercentage == null && <p className="text-sm text-base-content/60">La tasa de abandono aún no dispone de historial suficiente.</p>}
    </ComerziaSurface></div>
    <ComerziaSurface><h2 className="font-bold mb-3">Vencen en los próximos 7 días</h2><ComerziaResponsiveTable data={data.expiringTenants.map(row => ({ ...row, id: row.companyId }))}
      columns={[{ header: 'Empresa', accessorKey: 'commercialName' }, { header: 'Plan', accessorKey: 'planName' }, { header: 'Vencimiento', render: row => formatDateForUser(row.validUntil) },
        { header: 'Consulta', render: row => <BtnDetails responsive={false} label="Ver empresa" onClick={() => navigate('/saas/tenants/' + encodeURIComponent(row.companyId))} /> }]} /></ComerziaSurface>
  </div>;
}
