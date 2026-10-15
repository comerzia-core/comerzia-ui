import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { usePlatformData } from '../hooks/usePlatformData';
import type { PlatformOverview } from '../types/platform';
export function SaasDashboardPage() {
  const { data, isPending, isError } = usePlatformData<PlatformOverview>('/saas/dashboard');
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Plataforma Comerzia</h1>
    {isPending && <p role="status">Cargando…</p>}{isError && <p role="alert">No se pudo cargar el resumen.</p>}
    {data && <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <ComerziaMetricCard label="Empresas" value={data.companies} /><ComerziaMetricCard label="Habilitadas" value={data.activeCompanies} />
      <ComerziaMetricCard label="Suspendidas" value={data.suspendedCompanies} /><ComerziaMetricCard label="Suscripciones vencidas" value={data.expiredSubscriptions} />
    </div>}
  </div>;
}
