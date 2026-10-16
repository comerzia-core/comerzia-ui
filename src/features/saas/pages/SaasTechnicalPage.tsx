import { HardDrive, Server } from 'lucide-react';
import { ComerziaMetricCard } from '../../../components/ui/ComerziaMetricCard';
import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { usePlatformData } from '../hooks/usePlatformData';

interface TechnicalSummary {
  checkedAt: string;
  uptimeSeconds: number;
  processors: number;
  heapUsedBytes: number;
  heapMaxBytes: number;
}

export function SaasTechnicalPage() {
  const query = usePlatformData<TechnicalSummary>('/saas/technical');

  const heapUsedMb = query.data ? (query.data.heapUsedBytes / 1024 / 1024).toFixed(1) : '0';
  const heapMaxMb = query.data ? (query.data.heapMaxBytes / 1024 / 1024).toFixed(1) : '0';
  const heapPercentage =
    query.data && query.data.heapMaxBytes > 0
      ? Math.min(100, Math.round((query.data.heapUsedBytes / query.data.heapMaxBytes) * 100))
      : 0;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Server className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Diagnóstico técnico
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Telemetría y estado de salud de la infraestructura de backend y máquina virtual Java (JVM).
            </p>
          </div>
        </div>
      </div>

      {query.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo consultar el diagnóstico técnico del servidor.</span>
        </div>
      )}

      {query.isPending && (
        <div className="flex items-center justify-center py-16 gap-3 text-base-content/60" role="status">
          <span className="loading loading-spinner loading-md text-primary" />
          <span className="text-sm font-medium">Recuperando métricas del sistema…</span>
        </div>
      )}

      {/* 2. TARJETAS DE TELEMETRÍA */}
      {query.data && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <ComerziaMetricCard
              label="Tiempo activo"
              value={`${Math.floor(query.data.uptimeSeconds / 60)} min`}
            />
            <ComerziaMetricCard
              label="Procesadores disponibles"
              value={query.data.processors}
            />
            <ComerziaMetricCard
              label="Memoria JVM utilizada"
              value={`${heapUsedMb} MB`}
            />
            <ComerziaMetricCard
              label="Memoria JVM máxima"
              value={`${heapMaxMb} MB`}
            />
          </div>

          {/* Medidor visual de utilización de memoria Heap */}
          <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-base-content flex items-center gap-1.5">
                <HardDrive size={16} className="text-primary" /> Uso de Memoria Heap de la JVM
              </span>
              <span className="font-mono font-semibold text-primary">
                {heapPercentage}% ({heapUsedMb} MB / {heapMaxMb} MB)
              </span>
            </div>

            <progress
              className={`progress w-full h-3 ${
                heapPercentage > 85
                  ? 'progress-error'
                  : heapPercentage > 65
                  ? 'progress-warning'
                  : 'progress-primary'
              }`}
              value={heapPercentage}
              max="100"
            />

            <p className="text-xs text-base-content/50">
              Las cuotas de almacenamiento de Cloudinary y los registros de contenedores se administran directamente desde la consola de infraestructura.
            </p>
          </ComerziaSurface>
        </div>
      )}
    </div>
  );
}
