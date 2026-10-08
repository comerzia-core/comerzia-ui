import { useState } from 'react';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { formatDateForUser } from '../../../../utils/date';
import { useLoadDictionaries } from '../../../../hooks/useLoadDictionaries';
import { usePermission } from '../../../../hooks/usePermission';
import { DICTIONARIES } from '../../../../config/dictionaries';
import { PERMISSIONS } from '../../../../config/permissions';
import {
  HwPrintJobStatusCode,
  HwPrintJobTypeCode,
  type HwPrintJobResponse,
} from '../../types/hardware';
import {
  FileText,
  Printer,
  Calendar,
  AlertCircle,
  RotateCcw,
  XCircle,
  Eye,
  Barcode,
  Vault,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { BtnCancel } from '../../../../components/ui/CrudButtons';

interface Props {
  jobs: HwPrintJobResponse[];
  isLoading: boolean;
  onRefresh: () => void;
  onRetryJob: (job: HwPrintJobResponse) => void;
  onCancelJob: (job: HwPrintJobResponse) => void;
}

export const PrintJobList = ({
  jobs,
  isLoading,
  onRetryJob,
  onCancelJob,
}: Props) => {
  const { can } = usePermission();
  const canPrintExecute = can(PERMISSIONS.HARDWARE.PRINT_EXECUTE);

  const { options } = useLoadDictionaries([
    DICTIONARIES.HW_PRINT_JOB_STATUS,
    DICTIONARIES.HW_PRINT_JOB_TYPE,
  ]);
  const jobStatusOptions = options[DICTIONARIES.HW_PRINT_JOB_STATUS] || [];
  const jobTypeOptions = options[DICTIONARIES.HW_PRINT_JOB_TYPE] || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [detailJob, setDetailJob] = useState<HwPrintJobResponse | null>(null);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered?: boolean;
    item: HwPrintJobResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    item: null,
  });

  const getStatusLabel = (statusCode: number | string) => {
    const num = Number(statusCode);
    const found = jobStatusOptions.find(o => Number(o.value) === num);
    if (found) return found.label;
    switch (num) {
      case HwPrintJobStatusCode.PENDING:
        return 'Pendiente';
      case HwPrintJobStatusCode.SENT:
        return 'Enviado';
      case HwPrintJobStatusCode.PRINTING:
        return 'Imprimiendo';
      case HwPrintJobStatusCode.COMPLETED:
        return 'Completado';
      case HwPrintJobStatusCode.FAILED:
        return 'Fallido';
      case HwPrintJobStatusCode.CANCELLED:
        return 'Cancelado';
      default:
        return `Estado ${statusCode}`;
    }
  };

  const getStatusVariant = (statusCode: number | string) => {
    const num = Number(statusCode);
    switch (num) {
      case HwPrintJobStatusCode.COMPLETED:
        return 'success';
      case HwPrintJobStatusCode.PRINTING:
      case HwPrintJobStatusCode.SENT:
        return 'info';
      case HwPrintJobStatusCode.PENDING:
        return 'warning';
      case HwPrintJobStatusCode.FAILED:
        return 'error';
      case HwPrintJobStatusCode.CANCELLED:
        return 'neutral';
      default:
        return 'ghost';
    }
  };

  const getJobTypeLabel = (jobTypeCode: number | string) => {
    const num = Number(jobTypeCode);
    const found = jobTypeOptions.find(o => Number(o.value) === num);
    if (found) return found.label;
    switch (num) {
      case HwPrintJobTypeCode.LABEL_PRINT:
        return 'Etiquetas';
      case HwPrintJobTypeCode.RECEIPT_PRINT:
        return 'Ticket de Venta';
      case HwPrintJobTypeCode.OPEN_DRAWER:
        return 'Apertura de Gaveta';
      default:
        return `Trabajo ${jobTypeCode}`;
    }
  };

  const filteredJobs = jobs.filter(job => {
    const jobTypeStr = getJobTypeLabel(job.jobType).toLowerCase();
    const matchesSearch =
      !searchQuery.trim() ||
      jobTypeStr.includes(searchQuery.toLowerCase()) ||
      (job.deviceName && job.deviceName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.agentName && job.agentName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (job.requestedByEmployeeName && job.requestedByEmployeeName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      !selectedStatus || String(job.status) === selectedStatus;

    return matchesSearch && matchesStatus;
  });

  const totalElements = filteredJobs.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const paginatedJobs = filteredJobs.slice(page * pageSize, (page + 1) * pageSize);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setPage(0);
  };

  const statusSelectOptions = [
    { value: '', label: 'Todos los estados' },
    ...jobStatusOptions.map(opt => ({ value: String(opt.value), label: opt.label })),
  ];

  const handleContextMenu = (e: React.MouseEvent, item: HwPrintJobResponse) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      isCentered: false,
      item,
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, item: HwPrintJobResponse) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      isCentered: true,
      item,
    });
  };

  const getJobTypeIcon = (typeCode: number | string) => {
    const num = Number(typeCode);
    if (num === HwPrintJobTypeCode.LABEL_PRINT) {
      return <Barcode size={16} className="text-secondary" />;
    }
    if (num === HwPrintJobTypeCode.OPEN_DRAWER) {
      return <Vault size={16} className="text-warning" />;
    }
    return <FileText size={16} className="text-primary" />;
  };

  const columns: Column<HwPrintJobResponse>[] = [
    {
      header: 'Tipo de Trabajo',
      render: row => (
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-base-200 rounded-xl shrink-0">
            {getJobTypeIcon(row.jobType)}
          </div>
          <div>
            <p className="font-semibold text-sm text-base-content">{getJobTypeLabel(row.jobType)}</p>
            <p className="text-xs text-base-content/60 font-mono">ID: {row.id.slice(0, 8)}...</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Destino',
      render: row => (
        <div className="text-xs">
          <p className="font-medium text-base-content flex items-center gap-1">
            <Printer size={12} className="text-primary/70 shrink-0" />
            {row.deviceName || 'Impresora predeterminada'}
          </p>
          <p className="text-base-content/60 mt-0.5">Terminal: {row.agentName || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: 'Solicitante',
      render: row => (
        <span className="text-xs text-base-content/80">
          {row.requestedByEmployeeName || 'Sistema'}
        </span>
      ),
    },
    {
      header: 'Estado',
      render: row => (
        <ComerziaBadge
          label={getStatusLabel(row.status)}
          variant={getStatusVariant(row.status)}
        />
      ),
    },
    {
      header: 'Fecha',
      render: row => (
        <div className="flex items-center gap-1 text-xs text-base-content/70">
          <Calendar size={12} className="text-base-content/40 shrink-0" />
          <span>{row.createdAt ? formatDateForUser(row.createdAt) : '-'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 2. BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="w-full sm:w-80">
              <ComerziaInput
                icon="Search"
                placeholder="Buscar por tipo, impresora o solicitante..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-60">
              <ComerziaSelect
                options={statusSelectOptions}
                value={selectedStatus}
                onChange={e => handleStatusChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 3. CONTENEDOR DESKTOP */}
      <div className="hidden md:block md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:card-body md:p-0">
          <ComerziaTable
            columns={columns}
            data={paginatedJobs}
            isLoading={isLoading}
            showRowNumbers
            pagination={{
              currentPage: page,
              pageSize,
              totalElements,
              totalPages,
              onPageChange: setPage,
              onPageSizeChange: newSize => {
                setPageSize(newSize);
                setPage(0);
              },
            }}
            onRowContextMenu={handleContextMenu}
          />
        </div>
      </div>

      {/* 4. CONTENEDOR MOBILE */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron trabajos de impresión.
          </div>
        ) : (
          paginatedJobs.map((job, index) => (
            <article
              key={job.id}
              onClick={e => handleMobileCardTap(e, job)}
              className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
            >
              {/* FILA SUPERIOR: NUMERACIÓN, TÍTULO PRINCIPAL Y BADGE */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                    {page * pageSize + index + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                      {getJobTypeLabel(job.jobType)}
                    </h3>
                    <p className="text-xs font-mono text-base-content/60 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <FileText size={12} className="text-primary/70 shrink-0" />
                      ID: {job.id.slice(0, 8)}...
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <ComerziaBadge
                    label={getStatusLabel(job.status)}
                    variant={getStatusVariant(job.status)}
                  />
                </div>
              </div>

              {/* CONTENIDO SECUNDARIO CON SANGRÍA DE 26px */}
              <div className="pl-[26px] flex items-center gap-1.5 text-xs text-base-content/70">
                <Printer size={13} className="text-primary/70 shrink-0" />
                <span className="truncate">
                  {job.deviceName || 'Predeterminada'} • {job.agentName}
                </span>
              </div>

              {/* PIE DE TARJETA CON SANGRÍA DE 26px */}
              <div className="pl-[26px] pt-1.5 border-t border-base-100 flex items-center justify-between text-[11px] text-base-content/60">
                <span>Por: <strong className="font-medium text-base-content/80">{job.requestedByEmployeeName || 'Sistema'}</strong></span>
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-base-content/40 shrink-0" />
                  {job.createdAt ? formatDateForUser(job.createdAt) : '-'}
                </span>
              </div>
            </article>
          ))
        )}

        {/* 5. PAGINACIÓN MOBILE EN UNA SOLA FILA */}
        {filteredJobs.length > 0 && (
          <footer
            className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs"
            data-purpose="mobile-pagination"
          >
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span>Mostrar</span>
                <select
                  value={pageSize}
                  onChange={e => {
                    setPageSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="whitespace-nowrap">de {totalElements} registros</span>
              </div>
              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                Página {page + 1} de {totalPages}
              </span>
            </div>

            {/* BOTONES DE NAVEGACIÓN */}
            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                aria-label="Primera página"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(0)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(Math.max(0, page - 1))}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(page + 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Última página"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(totalPages - 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </div>


      {/* Menú Contextual */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.item && (
          <>
            <ContextMenuItem
              icon={Eye}
              label="Ver detalle del trabajo"
              onClick={() => {
                if (contextMenu.item) setDetailJob(contextMenu.item);
              }}
            />
            {canPrintExecute &&
              (Number(contextMenu.item.status) === HwPrintJobStatusCode.FAILED ||
                Number(contextMenu.item.status) === HwPrintJobStatusCode.CANCELLED) && (
              <ContextMenuItem
                icon={RotateCcw}
                label="Reintentar impresión"
                onClick={() => {
                  if (contextMenu.item) onRetryJob(contextMenu.item);
                }}
              />
            )}
            {canPrintExecute &&
              (Number(contextMenu.item.status) === HwPrintJobStatusCode.PENDING ||
                Number(contextMenu.item.status) === HwPrintJobStatusCode.SENT ||
                Number(contextMenu.item.status) === HwPrintJobStatusCode.PRINTING) && (
              <ContextMenuItem
                icon={XCircle}
                label="Cancelar trabajo"
                variant="error"
                onClick={() => {
                  if (contextMenu.item) onCancelJob(contextMenu.item);
                }}
              />
            )}
          </>
        )}
      </ComerziaContextMenu>

      {/* Modal de Detalle */}
      {detailJob && (
        <ComerziaModal
          isOpen={!!detailJob}
          onClose={() => setDetailJob(null)}
          title={
            <div className="flex items-center gap-2 text-primary">
              <FileText size={22} className="shrink-0" />
              <span>Detalle de Trabajo de Impresión</span>
            </div>
          }
          actions={
            <div className="flex justify-end w-full">
              <BtnCancel
                label="Cerrar"
                onClick={() => setDetailJob(null)}
                responsive={true}
                className="w-full sm:w-auto"
              />
            </div>
          }
          size="md"
        >
          <div className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-base-200/50 rounded-xl">
                <span className="text-base-content/60 block">Tipo:</span>
                <span className="font-semibold text-sm text-base-content">{getJobTypeLabel(detailJob.jobType)}</span>
              </div>
              <div className="p-3 bg-base-200/50 rounded-xl">
                <span className="text-base-content/60 block">Estado:</span>
                <ComerziaBadge
                  label={getStatusLabel(detailJob.status)}
                  variant={getStatusVariant(detailJob.status)}
                  className="mt-1"
                />
              </div>
              <div className="p-3 bg-base-200/50 rounded-xl">
                <span className="text-base-content/60 block">Impresora:</span>
                <span className="font-semibold text-base-content">{detailJob.deviceName || 'Predeterminada'}</span>
              </div>
              <div className="p-3 bg-base-200/50 rounded-xl">
                <span className="text-base-content/60 block">Terminal:</span>
                <span className="font-semibold text-base-content">{detailJob.agentName}</span>
              </div>
            </div>

            {detailJob.errorMessage && (
              <div className="p-3 bg-error/10 border border-error/20 rounded-xl text-xs text-error">
                <p className="font-bold flex items-center gap-1.5 mb-1">
                  <AlertCircle size={14} /> Detalle del error:
                </p>
                <p className="font-mono whitespace-pre-wrap">{detailJob.errorMessage}</p>
              </div>
            )}

            {detailJob.payload && (
              <div>
                <span className="text-xs font-semibold text-base-content/70 block mb-1">
                  Contenido / Payload enviado:
                </span>
                <pre className="p-3 bg-base-200 rounded-xl text-[11px] font-mono overflow-x-auto max-h-48 whitespace-pre-wrap">
                  {typeof detailJob.payload === 'object'
                    ? JSON.stringify(detailJob.payload, null, 2)
                    : String(detailJob.payload)}
                </pre>
              </div>
            )}
          </div>
        </ComerziaModal>
      )}
    </div>
  );
};
