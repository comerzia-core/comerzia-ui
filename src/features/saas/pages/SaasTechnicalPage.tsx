import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { usePlatformData } from '../hooks/usePlatformData';
interface TechnicalSummary { checkedAt: string; uptimeSeconds: number; processors: number; heapUsedBytes: number; heapMaxBytes: number; }
export function SaasTechnicalPage() {
  const query = usePlatformData<TechnicalSummary>('/saas/technical');
  return <div className="space-y-6"><h1 className="text-2xl font-bold">Diagnóstico técnico</h1>
    {query.isError && <p role="alert">No se pudo consultar el diagnóstico.</p>}
    {query.data && <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <ComerziaMetricCard label="Tiempo activo" value={Math.floor(query.data.uptimeSeconds / 60) + ' min'} />
      <ComerziaMetricCard label="Procesadores disponibles" value={query.data.processors} />
      <ComerziaMetricCard label="Memoria JVM utilizada" value={(query.data.heapUsedBytes / 1024 / 1024).toFixed(1) + ' MB'} />
      <ComerziaMetricCard label="Memoria JVM máxima" value={(query.data.heapMaxBytes / 1024 / 1024).toFixed(1) + ' MB'} />
    </div>}
    <p className="text-sm text-base-content/60">Las cuotas de Cloudinary y los logs del contenedor se consultan en sus herramientas de administración.</p>
  </div>;
}
