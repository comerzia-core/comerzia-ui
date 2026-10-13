import { useState } from 'react';
import { ComerziaTable, type Column } from '../../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../../components/ui/ComerziaBadge';
import { ComerziaContextMenu, ContextMenuItem } from '../../../../components/ui/ComerziaContextMenu';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { BtnPairTerminal } from '../../../../components/ui/CrudButtons';
import { formatDateForUser, formatTimeForUser } from '../../../../utils/date';
import { useLoadDictionaries } from '../../../../hooks/useLoadDictionaries';
import { usePermission } from '../../../../hooks/usePermission';
import { DICTIONARIES } from '../../../../config/dictionaries';
import { PERMISSIONS } from '../../../../config/permissions';
import { HwAgentStatusCode, type HwAgentResponse } from '../../types/hardware';
import {
  Laptop,
  Cpu,
  Calendar,
  Edit2,
  Trash2,
  ShieldCheck,
  Power,
  KeyRound,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface Props {
  agents: HwAgentResponse[];
  isLoading: boolean;
  onRefresh: () => void;
  onPairTerminal: () => void;
  onEditAgent: (agent: HwAgentResponse) => void;
  onDeleteAgent: (agent: HwAgentResponse) => void;
  onToggleStatus?: (agent: HwAgentResponse) => void;
  onRegenerateCode?: (agent: HwAgentResponse) => void;
  onViewPin?: (agent: HwAgentResponse) => void;
}

export const AgentTerminalList = ({
  agents,
  isLoading,
  onPairTerminal,
  onEditAgent,
  onDeleteAgent,
  onToggleStatus,
  onRegenerateCode,
  onViewPin,
}: Props) => {
  const { can } = usePermission();
  const canManageAgents = can(PERMISSIONS.HARDWARE.AGENTS_MANAGE);
  const { options } = useLoadDictionaries([DICTIONARIES.HW_AGENT_STATUS]);
  const agentStatusOptions = options[DICTIONARIES.HW_AGENT_STATUS] || [];

  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered?: boolean;
    item: HwAgentResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    item: null,
  });

  const getStatusLabel = (statusCode: number | string) => {
    const num = Number(statusCode);
    const found = agentStatusOptions.find(o => Number(o.value) === num);
    if (found) return found.label;
    switch (num) {
      case HwAgentStatusCode.PENDING:
        return 'Pendiente';
      case HwAgentStatusCode.ACTIVE:
        return 'Activo';
      case HwAgentStatusCode.DISABLED:
        return 'Desactivado';
      case HwAgentStatusCode.REVOKED:
        return 'Revocado';
      default:
        return `Estado ${statusCode}`;
    }
  };

  const getStatusVariant = (statusCode: number | string) => {
    const num = Number(statusCode);
    switch (num) {
      case HwAgentStatusCode.ACTIVE:
        return 'success';
      case HwAgentStatusCode.PENDING:
        return 'warning';
      case HwAgentStatusCode.DISABLED:
        return 'neutral';
      case HwAgentStatusCode.REVOKED:
        return 'error';
      default:
        return 'ghost';
    }
  };

  const filteredAgents = agents.filter(agent => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      agent.name.toLowerCase().includes(q) ||
      (agent.machineName && agent.machineName.toLowerCase().includes(q)) ||
      (agent.branchName && agent.branchName.toLowerCase().includes(q))
    );
  });

  const totalElements = filteredAgents.length;
  const totalPages = Math.max(1, Math.ceil(totalElements / pageSize));
  const paginatedAgents = filteredAgents.slice(page * pageSize, (page + 1) * pageSize);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(0);
  };

  const handleContextMenu = (e: React.MouseEvent, item: HwAgentResponse) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      isCentered: false,
      item,
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, item: HwAgentResponse) => {
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      isCentered: true,
      item,
    });
  };

  const formatPin = (code?: string | null) => {
    if (!code) return '';
    const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length === 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return clean;
  };

  const columns: Column<HwAgentResponse>[] = [
    {
      header: 'Terminal',
      render: row => {
        const isPending = Number(row.status) === HwAgentStatusCode.PENDING || String(row.status) === 'PENDING';
        return (
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-xl text-primary shrink-0">
              <Laptop size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-base-content">{row.name}</p>
                {row.pairingCode && isPending && (
                  <span
                    title={
                      row.pairingExpiresAt
                        ? `Código PIN de enlace (expira a las ${formatTimeForUser(row.pairingExpiresAt)})`
                        : 'Código PIN de enlace'
                    }
                    className="badge badge-warning/15 border border-warning/30 text-warning font-mono text-[10px] font-bold px-1.5 py-0.5"
                  >
                    PIN: {formatPin(row.pairingCode)}
                  </span>
                )}
              </div>
              <p className="text-xs text-base-content/60 flex items-center gap-1 mt-0.5 font-mono">
                <Cpu size={12} className="text-primary/70 shrink-0" />
                {row.machineName || 'Sin host identificado'}
              </p>
            </div>
          </div>
        );
      },
    },
    {
      header: 'Conexión en Vivo',
      render: row => (
        <div className="flex items-center gap-2">
          {row.isConnected ? (
            <span className="badge badge-success badge-sm gap-1.5 py-2 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-success-content animate-pulse" />
              En línea
            </span>
          ) : (
            <span className="badge badge-error badge-sm gap-1.5 py-2 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-error-content" />
              Desconectado
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Sucursal',
      render: row => (
        <span className="text-xs text-base-content/80 flex items-center gap-1.5">
          <ShieldCheck size={13} className="text-primary/70 shrink-0" />
          {row.branchName || 'Todas las sucursales'}
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
      header: 'Última Señal',
      render: row => (
        <div className="flex items-center gap-1.5 text-xs text-base-content/70">
          <Calendar size={13} className="text-base-content/40 shrink-0" />
          <span>{row.lastSeen ? formatDateForUser(row.lastSeen) : 'Sin señal registrada'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* 2. BARRA DE BÚSQUEDA Y FILTROS */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row justify-between gap-3 sm:items-center">
          <div className="w-full sm:w-80">
            <ComerziaInput
              icon="Search"
              placeholder="Buscar por terminal, host o sucursal..."
              value={searchQuery}
              onChange={e => handleSearchChange(e.target.value)}
            />
          </div>
          {canManageAgents && (
            <BtnPairTerminal
              onClick={onPairTerminal}
              label="Vincular Terminal"
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
            data={paginatedAgents}
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
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
            No se encontraron terminales registradas.
          </div>
        ) : (
          paginatedAgents.map((agent, index) => (
            <article
              key={agent.id}
              onClick={e => handleMobileCardTap(e, agent)}
              className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
            >
              {/* FILA SUPERIOR: NUMERACIÓN, TÍTULO PRINCIPAL Y BADGE */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                    {page * pageSize + index + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                        {agent.name}
                      </h3>
                      {agent.isConnected ? (
                        <span className="badge badge-success badge-xs font-semibold py-0.5">En línea</span>
                      ) : (
                        <span className="badge badge-error badge-xs font-semibold py-0.5">Desconectado</span>
                      )}
                      {agent.pairingCode && (Number(agent.status) === HwAgentStatusCode.PENDING || String(agent.status) === 'PENDING') && (
                        <span
                          title={agent.pairingExpiresAt ? `Expira a las ${formatTimeForUser(agent.pairingExpiresAt)}` : undefined}
                          className="badge badge-warning/15 border border-warning/30 text-warning font-mono text-[10px] font-bold py-0.5"
                        >
                          PIN: {formatPin(agent.pairingCode)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-base-content/60 inline-flex items-center gap-1 mt-0.5 whitespace-nowrap">
                      <Cpu size={12} className="text-primary/70 shrink-0" />
                      {agent.machineName || 'Sin host'}
                    </p>
                  </div>
                </div>
                <div className="shrink-0">
                  <ComerziaBadge
                    label={getStatusLabel(agent.status)}
                    variant={getStatusVariant(agent.status)}
                  />
                </div>
              </div>

              {/* CONTENIDO SECUNDARIO CON SANGRÍA DE 26px */}
              <div className="pl-[26px] flex flex-col gap-1 text-xs text-base-content/70">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={13} className="text-primary/70 shrink-0" />
                  <span className="truncate">{agent.branchName || 'Todas las sucursales'}</span>
                </div>
              </div>

              {/* PIE DE TARJETA CON SANGRÍA DE 26px */}
              <div className="pl-[26px] pt-1.5 border-t border-base-100 flex items-center text-[11px] text-base-content/60">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-base-content/40 shrink-0" />
                <span>
                  Última señal:{' '}
                  <strong className="font-medium text-base-content/80">
                    {agent.lastSeen ? formatDateForUser(agent.lastSeen) : 'Sin señal registrada'}
                  </strong>
                </span>
              </div>
            </article>
          ))
        )}

        {/* 5. PAGINACIÓN MOBILE EN UNA SOLA FILA */}
        {filteredAgents.length > 0 && (
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
        {contextMenu.item && canManageAgents ? (
          <>
            {(Number(contextMenu.item.status) === HwAgentStatusCode.PENDING || String(contextMenu.item.status) === 'PENDING') && (
              <>
                {contextMenu.item.pairingCode && onViewPin && (
                  <ContextMenuItem
                    icon={KeyRound}
                    label="Ver Código PIN de Enlace"
                    onClick={() => {
                      if (contextMenu.item && onViewPin) onViewPin(contextMenu.item);
                    }}
                  />
                )}
                {onRegenerateCode && (
                  <ContextMenuItem
                    icon={RotateCcw}
                    label="Regenerar Código PIN (15 min)"
                    onClick={() => {
                      if (contextMenu.item && onRegenerateCode) onRegenerateCode(contextMenu.item);
                    }}
                  />
                )}
              </>
            )}
            <ContextMenuItem
              icon={Edit2}
              label="Editar terminal"
              onClick={() => {
                if (contextMenu.item) onEditAgent(contextMenu.item);
              }}
            />
            {onToggleStatus && (
              <ContextMenuItem
                icon={Power}
                label={Number(contextMenu.item.status) === HwAgentStatusCode.ACTIVE ? 'Desactivar terminal' : 'Activar terminal'}
                onClick={() => {
                  if (contextMenu.item && onToggleStatus) onToggleStatus(contextMenu.item);
                }}
              />
            )}
            <ContextMenuItem
              icon={Trash2}
              label="Revocar / Eliminar terminal"
              variant="error"
              onClick={() => {
                if (contextMenu.item) onDeleteAgent(contextMenu.item);
              }}
            />
          </>
        ) : (
          <div className="p-3 text-xs text-base-content/60 text-center">
            Solo lectura
          </div>
        )}
      </ComerziaContextMenu>
    </div>
  );
};

