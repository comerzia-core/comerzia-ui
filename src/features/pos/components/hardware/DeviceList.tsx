import { useState } from 'react';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { BtnCreate } from '../../../../components/ui/CrudButtons';
import { useLoadDictionaries } from '../../../../hooks/useLoadDictionaries';
import { usePermission } from '../../../../hooks/usePermission';
import { DICTIONARIES } from '../../../../config/dictionaries';
import { PERMISSIONS } from '../../../../config/permissions';
import {
  HwDeviceTypeCode,
  HwDeviceStatusCode,
  type HwDeviceResponse,
  type HwAgentResponse,
} from '../../types/hardware';
import {
  Printer,
  Barcode,
  Laptop,
  Network,
  Star,
  Edit2,
  Trash2,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface Props {
  devices: HwDeviceResponse[];
  agents: HwAgentResponse[];
  isLoading: boolean;
  onRefresh: () => void;
  onCreateDevice: () => void;
  onEditDevice: (device: HwDeviceResponse) => void;
  onDeleteDevice: (device: HwDeviceResponse) => void;
  onTestPrint: (device: HwDeviceResponse) => void;
  onSetDefault: (device: HwDeviceResponse) => void;
}

export const DeviceList = ({
  devices,
  agents,
  isLoading,
  onCreateDevice,
  onEditDevice,
  onDeleteDevice,
  onTestPrint,
  onSetDefault,
}: Props) => {
  const { can } = usePermission();
  const canManageDevices = can(PERMISSIONS.HARDWARE.DEVICES_MANAGE);
  const canPrintExecute = can(PERMISSIONS.HARDWARE.PRINT_EXECUTE);

  const { options } = useLoadDictionaries([DICTIONARIES.HW_DEVICE_TYPE, DICTIONARIES.HW_DEVICE_STATUS]);
  const deviceTypeOptions = options[DICTIONARIES.HW_DEVICE_TYPE] || [];
  const deviceStatusOptions = options[DICTIONARIES.HW_DEVICE_STATUS] || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'ALL' | 'RECEIPT' | 'BARCODE'>('ALL');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered?: boolean;
    item: HwDeviceResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    item: null,
  });

  const getDeviceTypeLabel = (typeCode: number | string) => {
    const num = Number(typeCode);
    const found = deviceTypeOptions.find(o => Number(o.value) === num);
    if (found) return found.label;
    return num === HwDeviceTypeCode.BARCODE_PRINTER ? 'Impresora de Etiquetas' : 'Impresora de Tickets';
  };

  const getDeviceStatusLabel = (statusCode: number | string) => {
    const num = Number(statusCode);
    const found = deviceStatusOptions.find(o => Number(o.value) === num);
    if (found) return found.label;
    return num === HwDeviceStatusCode.ACTIVE ? 'Activo' : 'Inactivo';
  };

  const filteredDevices = devices.filter(dev => {
    const isBarcode = Number(dev.deviceType) === HwDeviceTypeCode.BARCODE_PRINTER;
    const isReceipt = Number(dev.deviceType) === HwDeviceTypeCode.RECEIPT_PRINTER;

    if (typeFilter === 'RECEIPT' && !isReceipt) return false;
    if (typeFilter === 'BARCODE' && !isBarcode) return false;

    const matchesSearch =
      !searchQuery.trim() ||
      dev.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (dev.ipAddress && dev.ipAddress.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (dev.agentName && dev.agentName.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesAgent =
      !selectedAgentId || dev.agentId === selectedAgentId;

    return matchesSearch && matchesAgent;
  });

  const totalElements = filteredDevices.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const paginatedDevices = filteredDevices.slice(page * pageSize, (page + 1) * pageSize);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleAgentFilterChange = (agentId: string) => {
    setSelectedAgentId(agentId);
    setPage(0);
  };

  const handleTypeFilterChange = (filter: 'ALL' | 'RECEIPT' | 'BARCODE') => {
    setTypeFilter(filter);
    setPage(0);
  };

  const agentSelectOptions = [
    { value: '', label: 'Todas las terminales' },
    ...agents.map(a => ({ value: a.id, label: a.name })),
  ];

  const handleContextMenu = (e: React.MouseEvent, item: HwDeviceResponse) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      isCentered: false,
      item,
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, item: HwDeviceResponse) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      isCentered: true,
      item,
    });
  };

  const columns: Column<HwDeviceResponse>[] = [
    {
      header: 'Impresora',
      render: row => {
        const isBarcode = Number(row.deviceType) === HwDeviceTypeCode.BARCODE_PRINTER;
        return (
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl shrink-0 ${isBarcode ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
              {isBarcode ? <Barcode size={18} /> : <Printer size={18} />}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm text-base-content">{row.name}</span>
                {row.isDefault && (
                  <span className="badge badge-warning badge-xs gap-1 py-1 text-[10px] font-semibold text-warning-content">
                    <Star size={10} className="fill-current" />
                    Predeterminada
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 mt-0.5">
                {isBarcode ? 'Térmica TSPL / ZPL' : 'Térmica ESC/POS'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Terminal',
      render: row => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/80">
          <Laptop size={13} className="text-primary/70 shrink-0" />
          <span className="font-medium">{row.agentName}</span>
        </div>
      ),
    },
    {
      header: 'Tipo',
      render: row => (
        <ComerziaBadge
          label={getDeviceTypeLabel(row.deviceType)}
          variant={Number(row.deviceType) === HwDeviceTypeCode.BARCODE_PRINTER ? 'secondary' : 'info'}
        />
      ),
    },
    {
      header: 'Conexión / Red',
      render: row => (
        <div className="text-xs">
          {row.ipAddress ? (
            <p className="font-mono text-base-content/80 flex items-center gap-1">
              <Network size={12} className="text-primary/70 shrink-0" />
              {row.ipAddress}:{row.port || 9100}
            </p>
          ) : (
            <p className="text-base-content/60">Conexión Local / USB</p>
          )}
        </div>
      ),
    },
    {
      header: 'Estado',
      render: row => {
        const isActive = Number(row.status) === HwDeviceStatusCode.ACTIVE;
        return (
          <ComerziaBadge
            label={getDeviceStatusLabel(row.status)}
            variant={isActive ? 'success' : 'neutral'}
          />
        );
      },
    },
  ];

  const typeFilterOptions = [
    { value: 'ALL', label: 'Todos los tipos de impresora' },
    { value: 'RECEIPT', label: 'Tickets de Venta' },
    { value: 'BARCODE', label: 'Etiquetas de Código de Barras' },
  ];

  return (
    <div className="space-y-4">
      {/* 2. BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col lg:flex-row justify-between gap-3 lg:items-center">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto flex-1 flex-wrap">
            {/* Input de Búsqueda */}
            <div className="w-full sm:w-72">
              <ComerziaInput
                icon="Search"
                placeholder="Buscar por nombre, terminal o IP..."
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>

            {/* Selector de Tipo de Impresora */}
            <div className="w-full sm:w-60">
              <ComerziaSelect
                options={typeFilterOptions}
                value={typeFilter}
                onChange={e => handleTypeFilterChange(e.target.value as 'ALL' | 'RECEIPT' | 'BARCODE')}
              />
            </div>

            {/* Selector de Terminal */}
            <div className="w-full sm:w-64">
              <ComerziaSelect
                options={agentSelectOptions}
                value={selectedAgentId}
                onChange={e => handleAgentFilterChange(e.target.value)}
              />
            </div>
          </div>

          {canManageDevices && (
            <BtnCreate
              onClick={onCreateDevice}
              label="Nueva Impresora"
              className="w-full sm:w-auto shrink-0"
            />
          )}
        </div>
      </div>

      {/* 3. CONTENEDOR DESKTOP */}
      <div className="hidden md:block md:card md:bg-base-100 md:shadow-xs md:border md:border-base-200 md:rounded-2xl md:overflow-hidden">
        <div className="md:card-body md:p-0">
          <ComerziaTable
            columns={columns}
            data={paginatedDevices}
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
        ) : filteredDevices.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron impresoras configuradas.
          </div>
        ) : (
          paginatedDevices.map((device, index) => {
            const isBarcode = Number(device.deviceType) === HwDeviceTypeCode.BARCODE_PRINTER;
            return (
              <article
                key={device.id}
                onClick={e => handleMobileCardTap(e, device)}
                className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
              >
                {/* FILA SUPERIOR: NUMERACIÓN, TÍTULO PRINCIPAL Y BADGE */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                      {page * pageSize + index + 1}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                          {device.name}
                        </h3>
                        {device.isDefault && (
                          <span className="badge badge-warning badge-xs text-[10px] py-0.5">
                            Predeterminada
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-base-content/60 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                        {isBarcode ? (
                          <Barcode size={12} className="text-secondary shrink-0" />
                        ) : (
                          <Printer size={12} className="text-primary shrink-0" />
                        )}
                        {isBarcode ? 'Térmica TSPL / ZPL' : 'Térmica ESC/POS'}
                      </p>
                    </div>
                  </div>
                  <div className="shrink-0">
                    <ComerziaBadge
                      label={getDeviceTypeLabel(device.deviceType)}
                      variant={isBarcode ? 'secondary' : 'info'}
                    />
                  </div>
                </div>

                {/* CONTENIDO SECUNDARIO CON SANGRÍA DE 26px */}
                <div className="pl-[26px] flex flex-col gap-1 text-xs text-base-content/70">
                  <div className="flex items-center gap-1.5">
                    <Laptop size={13} className="text-primary/70 shrink-0" />
                    <span className="truncate">{device.agentName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <Network size={13} className="text-primary/70 shrink-0" />
                    <span>
                      {device.ipAddress ? `${device.ipAddress}:${device.port || 9100}` : 'Conexión local'}
                    </span>
                  </div>
                </div>
              </article>
            );
          })
        )}

        {/* 5. PAGINACIÓN MOBILE EN UNA SOLA FILA */}
        {filteredDevices.length > 0 && (
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
            {canPrintExecute && (
              <ContextMenuItem
                icon={Printer}
                label="Probar impresión"
                onClick={() => {
                  if (contextMenu.item) onTestPrint(contextMenu.item);
                }}
              />
            )}
            {canManageDevices && !contextMenu.item.isDefault && (
              <ContextMenuItem
                icon={CheckCircle2}
                label="Marcar como predeterminada"
                onClick={() => {
                  if (contextMenu.item) onSetDefault(contextMenu.item);
                }}
              />
            )}
            {canManageDevices && (
              <ContextMenuItem
                icon={Edit2}
                label="Editar impresora"
                onClick={() => {
                  if (contextMenu.item) onEditDevice(contextMenu.item);
                }}
              />
            )}
            {canManageDevices && (
              <ContextMenuItem
                icon={Trash2}
                label="Eliminar impresora"
                variant="error"
                onClick={() => {
                  if (contextMenu.item) onDeleteDevice(contextMenu.item);
                }}
              />
            )}
            {!canPrintExecute && !canManageDevices && (
              <div className="p-3 text-xs text-base-content/60 text-center">
                Solo lectura
              </div>
            )}
          </>
        )}
      </ComerziaContextMenu>
    </div>
  );
};

