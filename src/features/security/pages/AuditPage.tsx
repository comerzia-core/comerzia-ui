// src/features/security/pages/AuditPage.tsx
import { useState } from 'react';
import { Shield } from 'lucide-react';
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
    handlePageSizeChange
  } = useAuditLogs({ initialPageSize: 5 });

  // Estado para el modal de detalles completos
  const [selectedLog, setSelectedLog] = useState<AuditLogResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState<boolean>(false);

  const handleSelectLog = (log: AuditLogResponse) => {
    setSelectedLog(log);
    setIsDetailsModalOpen(true);
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* HEADER DE LA PÁGINA */}
      <div className="flex items-start gap-2.5">
        <Shield className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
        <div>
          <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
            Auditoría de Seguridad
          </h1>
          <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
            Bitácora en tiempo real de actividades, creaciones, modificaciones y accesos en la plataforma
          </p>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por usuario, acción, módulo o IP..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* CONTENEDOR CON LA TABLA DE AUDITORÍA */}
      <div className="md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:card-body md:p-0">
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
