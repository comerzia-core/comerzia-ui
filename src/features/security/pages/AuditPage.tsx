// src/features/security/pages/AuditPage.tsx
import { useState } from 'react';
import { Shield, RefreshCw } from 'lucide-react';
import { AuditLogTable } from '../components/audit/AuditLogTable';
import { AuditDetailsModal } from '../components/audit/AuditDetailsModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { useAuditLogs } from '../hooks/useAuditLogs';
import type { AuditLogResponse } from '../types/audit';

export const AuditPage = () => {
  // Hook personalizado que pre-carga 5 registros por página
  const {
    data,
    isLoading,
    page,
    pageSize,
    searchQuery,
    setSearchQuery,
    handlePageChange,
    handlePageSizeChange,
    refetch
  } = useAuditLogs({ initialPageSize: 5 });

  // Estado para el modal de detalles completos
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  const handleSelectLog = (log: AuditLogResponse) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Auditoría de Seguridad
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Bitácora en tiempo real de actividades, creaciones, modificaciones y accesos en la plataforma
          </p>
        </div>

        {/* BOTÓN RECARGAR */}
        <button
          type="button"
          onClick={refetch}
          className="btn btn-ghost btn-sm gap-2 border border-base-300 hover:bg-base-200"
          title="Recargar registros de auditoría"
        >
          <RefreshCw className={`w-4 h-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </button>
      </div>

      {/* BARRA DE BÚSQUEDA Y FILTRADO */}
      <div className="card bg-base-100 border border-base-200 shadow-xs p-4 rounded-2xl">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="w-full md:w-96">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por usuario, acción, módulo o IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <span className="text-xs text-base-content/60 italic font-medium">
            * Haz clic sobre cualquier fila para ver el detalle completo de la auditoría
          </span>
        </div>
      </div>

      {/* CONTENEDOR CON LA TABLA DE AUDITORÍA (PAGINADA DE A 5 REGISTROS) */}
      <div className="card bg-base-100 shadow-xs border border-base-200 rounded-2xl overflow-hidden">
        <div className="card-body p-0">
          <AuditLogTable
            data={data}
            isLoading={isLoading}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onSelectLog={handleSelectLog}
          />
        </div>
      </div>

      {/* MODAL DE DETALLES COMPLETOS DE AUDITORÍA */}
      <AuditDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        log={selectedLog}
      />
    </div>
  );
};
