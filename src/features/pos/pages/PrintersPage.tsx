import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { hardwareService } from '../services/hardwareService';
import type {
  HwAgentResponse,
  HwDeviceResponse,
  HwPrintJobResponse,
  HwAgentStatus,
  HwDeviceType,
  HwDeviceStatus,
} from '../types/hardware';
import { HwAgentStatusCode } from '../types/hardware';
import { AgentTerminalList } from '../components/hardware/AgentTerminalList';
import { DeviceList } from '../components/hardware/DeviceList';
import { PrintJobList } from '../components/hardware/PrintJobList';
import { PairAgentModal } from '../components/hardware/PairAgentModal';
import { EditAgentModal } from '../components/hardware/EditAgentModal';
import { DeviceModal } from '../components/hardware/DeviceModal';
import { PrinterRollCalibrationModal } from '../components/hardware/PrinterRollCalibrationModal';
import { TestPrintModal } from '../components/hardware/TestPrintModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { BtnRefresh } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { usePermission } from '../../../hooks/usePermission';
import { PERMISSIONS } from '../../../config/permissions';
import { Printer, Laptop, History, ShieldAlert, Ruler } from 'lucide-react';
import { RollSizeList } from '../components/hardware/RollSizeList';
import { labelService } from '../services/labelService';
import { useAuthStore } from '../../../stores/useAuthStore';

export const PrintersPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { success: toastSuccess, error: toastError } = useToast();
  const { canAny } = usePermission();
  const isOwner = useAuthStore(state => state.userProfile?.roles.includes('OWNER') ?? false);
  const [rollRefreshKey, setRollRefreshKey] = useState(0);
  const canViewRolls = isOwner && canAny([PERMISSIONS.HARDWARE.DEVICES_MANAGE]);

  const canViewAgents = isOwner && canAny([
    PERMISSIONS.HARDWARE.AGENTS_READ,
    PERMISSIONS.HARDWARE.AGENTS_MANAGE,
    PERMISSIONS.HARDWARE.PRINTERS_VIEW,
  ]);

  const canViewDevices = isOwner && canAny([
    PERMISSIONS.HARDWARE.DEVICES_READ,
    PERMISSIONS.HARDWARE.DEVICES_MANAGE,
    PERMISSIONS.HARDWARE.PRINTERS_VIEW,
  ]);

  const canViewJobs = isOwner && canAny([
    PERMISSIONS.HARDWARE.PRINT_JOBS_READ,
    PERMISSIONS.HARDWARE.PRINT_EXECUTE,
    PERMISSIONS.HARDWARE.PRINTERS_VIEW,
  ]);

  const showTabs = [canViewAgents, canViewDevices, canViewJobs, canViewRolls].filter(Boolean).length > 1;

  const getDefaultTab = (): 'agents' | 'devices' | 'jobs' | 'rolls' => {
    if (canViewAgents) return 'agents';
    if (canViewDevices) return 'devices';
    if (canViewJobs) return 'jobs';
    if (canViewRolls) return 'rolls';
    return 'agents';
  };

  const tabParam = searchParams.get('tab');
  const getInitialTab = (): 'agents' | 'devices' | 'jobs' | 'rolls' => {
    if (tabParam === 'rolls' && canViewRolls) return 'rolls';
    if (tabParam === 'devices' && canViewDevices) return 'devices';
    if (tabParam === 'jobs' && canViewJobs) return 'jobs';
    if (tabParam === 'agents' && canViewAgents) return 'agents';
    return getDefaultTab();
  };

  const [activeTab, setActiveTab] = useState<'agents' | 'devices' | 'jobs' | 'rolls'>(getInitialTab);

  // Estados de datos
  const [agents, setAgents] = useState<HwAgentResponse[]>([]);
  const [devices, setDevices] = useState<HwDeviceResponse[]>([]);
  const [jobs, setJobs] = useState<HwPrintJobResponse[]>([]);
  const [rollsCount, setRollsCount] = useState(0);

  // Estados de carga
  const [isLoadingAgents, setIsLoadingAgents] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [isLoadingRolls, setIsLoadingRolls] = useState(false);

  // Estados de modales
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [agentForPin, setAgentForPin] = useState<HwAgentResponse | null>(null);
  const [agentToEdit, setAgentToEdit] = useState<HwAgentResponse | null>(null);
  const [agentToDelete, setAgentToDelete] = useState<HwAgentResponse | null>(null);
  const [isDeletingAgent, setIsDeletingAgent] = useState(false);

  const [deviceToCalibrate, setDeviceToCalibrate] = useState<HwDeviceResponse | null>(null);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [deviceToEdit, setDeviceToEdit] = useState<HwDeviceResponse | null>(null);
  const [deviceToDelete, setDeviceToDelete] = useState<HwDeviceResponse | null>(null);
  const [isDeletingDevice, setIsDeletingDevice] = useState(false);

  const [deviceForTest, setDeviceForTest] = useState<HwDeviceResponse | null>(null);

  // Sincronizar tab con URL query params y permisos
  useEffect(() => {
    if (tabParam === 'rolls' && canViewRolls) {
      setActiveTab('rolls');
    } else if (tabParam === 'devices' && canViewDevices) {
      setActiveTab('devices');
    } else if (tabParam === 'agents' && canViewAgents) {
      setActiveTab('agents');
    } else if (tabParam === 'jobs' && canViewJobs) {
      setActiveTab('jobs');
    } else {
      const fallback = getDefaultTab();
      setActiveTab(fallback);
    }
  }, [tabParam, canViewAgents, canViewDevices, canViewJobs, canViewRolls]);

  const handleTabChange = (tab: 'agents' | 'devices' | 'jobs' | 'rolls') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  useEffect(() => {
    if (canViewAgents) loadAgents();
    if (canViewDevices) loadDevices();
    if (canViewJobs) loadJobs();
    if (canViewRolls) loadRollsCount();
  }, [canViewAgents, canViewDevices, canViewJobs, canViewRolls]);

  const loadRollsCount = async () => {
    setIsLoadingRolls(true);
    try {
      const data = await labelService.getRolls('', 0, 1);
      setRollsCount(data.totalElements || 0);
    } catch {
      // No alert required on background badge count
    } finally {
      setIsLoadingRolls(false);
    }
  };

  const loadAgents = async () => {
    setIsLoadingAgents(true);
    try {
      const data = await hardwareService.getAgents();
      setAgents(data.content || []);
    } catch {
      toastError('No se pudieron cargar las terminales físicas.');
    } finally {
      setIsLoadingAgents(false);
    }
  };

  const loadDevices = async () => {
    setIsLoadingDevices(true);
    try {
      const data = await hardwareService.getDevices();
      setDevices(data.content || []);
    } catch {
      toastError('No se pudieron cargar las impresoras.');
    } finally {
      setIsLoadingDevices(false);
    }
  };

  const loadJobs = async () => {
    setIsLoadingJobs(true);
    try {
      const data = await hardwareService.getPrintJobs();
      setJobs(data.content || []);
    } catch {
      toastError('No se pudo cargar la cola de impresión.');
    } finally {
      setIsLoadingJobs(false);
    }
  };

  // AGENTES: Eliminar
  const handleConfirmDeleteAgent = async () => {
    if (!agentToDelete) return;
    setIsDeletingAgent(true);
    try {
      await hardwareService.deleteAgent(agentToDelete.id);
      toastSuccess(`Terminal "${agentToDelete.name}" eliminada correctamente.`);
      setAgentToDelete(null);
      loadAgents();
      loadDevices();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al eliminar la terminal.');
    } finally {
      setIsDeletingAgent(false);
    }
  };

  // AGENTES: Activar / Desactivar
  const handleToggleAgentStatus = async (agent: HwAgentResponse) => {
    const isCurrentlyActive = Number(agent.status) === HwAgentStatusCode.ACTIVE;
    const nextStatus: HwAgentStatus = isCurrentlyActive ? HwAgentStatusCode.DISABLED : HwAgentStatusCode.ACTIVE;
    try {
      await hardwareService.updateAgent(agent.id, {
        name: agent.name,
        status: nextStatus,
      });
      toastSuccess(`Terminal ${isCurrentlyActive ? 'desactivada' : 'activada'} correctamente.`);
      loadAgents();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al cambiar estado de la terminal.');
    }
  };

  // DISPOSITIVOS: Eliminar
  const handleConfirmDeleteDevice = async () => {
    if (!deviceToDelete) return;
    setIsDeletingDevice(true);
    try {
      await hardwareService.deleteDevice(deviceToDelete.id);
      toastSuccess(`Impresora "${deviceToDelete.name}" eliminada correctamente.`);
      setDeviceToDelete(null);
      loadDevices();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al eliminar la impresora.');
    } finally {
      setIsDeletingDevice(false);
    }
  };

  // DISPOSITIVOS: Marcar como Predeterminada
  const handleSetDefaultDevice = async (device: HwDeviceResponse) => {
    try {
      await hardwareService.updateDevice(device.id, {
        name: device.name,
        deviceType: Number(device.deviceType) as HwDeviceType,
        ipAddress: device.ipAddress || undefined,
        port: device.port || undefined,
        isDefault: true,
        status: Number(device.status) as HwDeviceStatus,
      });
      toastSuccess(`"${device.name}" establecida como predeterminada.`);
      loadDevices();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al marcar la impresora como predeterminada.');
    }
  };

  // TRABAJOS: Cancelar
  const handleCancelJob = async (job: HwPrintJobResponse) => {
    try {
      await hardwareService.cancelPrintJob(job.id);
      toastSuccess('Trabajo de impresión cancelado.');
      loadJobs();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al cancelar el trabajo de impresión.');
    }
  };

  // AGENTES: Regenerar Código de Activación PIN (15 min)
  const handleRegenerateAgentCode = async (agent: HwAgentResponse) => {
    try {
      const updated = await hardwareService.regenerateAgentCode(agent.id);
      toastSuccess(`Nuevo código generado para "${agent.name}"`);
      setAgentForPin(updated);
      setIsPairModalOpen(true);
      loadAgents();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al regenerar código de activación');
    }
  };

  // AGENTES: Ver Código PIN existente
  const handleViewAgentPin = (agent: HwAgentResponse) => {
    setAgentForPin(agent);
    setIsPairModalOpen(true);
  };

  // TRABAJOS: Reintentar
  const handleRetryJob = async (job: HwPrintJobResponse) => {
    try {
      await hardwareService.retryPrintJob(job.id);
      toastSuccess('Trabajo reenviado a la cola de impresión.');
      loadJobs();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al reenviar el trabajo de impresión.');
    }
  };

  const isCurrentTabLoading =
    (activeTab === 'agents' && isLoadingAgents) ||
    (activeTab === 'devices' && isLoadingDevices) ||
    (activeTab === 'jobs' && isLoadingJobs) ||
    (activeTab === 'rolls' && isLoadingRolls);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Printer className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Impresoras y Hardware
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Administración de terminales físicas, tickeras de cobro y etiquetadoras.
            </p>
          </div>
        </div>
        {/* Botonera de cabecera */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BtnRefresh
            onClick={() => {
              if (activeTab === 'rolls') {
                setRollRefreshKey(value => value + 1);
                loadRollsCount();
              } else if (activeTab === 'agents') {
                loadAgents();
              } else if (activeTab === 'devices') {
                loadDevices();
              } else {
                loadJobs();
              }
            }}
            isLoading={isCurrentTabLoading}
            label="Actualizar"
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* 2. SELECTOR DE PESTAÑAS (TABS - Se muestra solo si tiene acceso a más de una sección) */}
      {showTabs && (
        <div className="border-b border-base-200">
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
            {canViewAgents && (
              <button
                type="button"
                onClick={() => handleTabChange('agents')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'agents'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                    : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
                }`}
              >
                <Laptop size={15} className="shrink-0" />
                <span>Terminales Vinculadas</span>
                <span className={`badge badge-sm font-mono font-bold ${activeTab === 'agents' ? 'badge-primary text-primary-content' : 'badge-neutral/80'}`}>
                  {agents.length}
                </span>
              </button>
            )}

            {canViewDevices && (
              <button
                type="button"
                onClick={() => handleTabChange('devices')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'devices'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                    : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
                }`}
              >
                <Printer size={15} className="shrink-0" />
                <span>Impresoras Configuradas</span>
                <span className={`badge badge-sm font-mono font-bold ${activeTab === 'devices' ? 'badge-primary text-primary-content' : 'badge-neutral/80'}`}>
                  {devices.length}
                </span>
              </button>
            )}

            {canViewJobs && (
              <button
                type="button"
                onClick={() => handleTabChange('jobs')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'jobs'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                    : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
                }`}
              >
                <History size={15} className="shrink-0" />
                <span>Cola de Impresión</span>
                <span className={`badge badge-sm font-mono font-bold ${activeTab === 'jobs' ? 'badge-primary text-primary-content' : 'badge-neutral/80'}`}>
                  {jobs.length}
                </span>
              </button>
            )}

            {canViewRolls && (
              <button
                type="button"
                onClick={() => handleTabChange('rolls')}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === 'rolls'
                    ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                    : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
                }`}
              >
                <Ruler size={15} className="shrink-0" />
                <span>Tamaños de Rollos</span>
                <span className={`badge badge-sm font-mono font-bold ${activeTab === 'rolls' ? 'badge-primary text-primary-content' : 'badge-neutral/80'}`}>
                  {rollsCount}
                </span>
              </button>
            )}

          </div>
        </div>
      )}

      {/* 3. CASO SIN PERMISOS */}
      {!canViewAgents && !canViewDevices && !canViewJobs && !canViewRolls && (
        <div className="card bg-base-100 p-12 text-center border border-base-200 rounded-3xl flex flex-col items-center justify-center gap-2">
          <ShieldAlert size={36} className="text-warning" />
          <h3 className="font-bold text-base text-base-content">Acceso Restringido</h3>
          <p className="text-xs text-base-content/60 max-w-md">
            No cuentas con los permisos requeridos para gestionar terminales de impresión, dispositivos, cola de trabajos o rollos de etiquetas.
          </p>
        </div>
      )}

      {/* 4. CONTENIDO DE LA PESTAÑA ACTIVA */}
      {canViewAgents && activeTab === 'agents' && (
        <AgentTerminalList
          agents={agents}
          isLoading={isLoadingAgents}
          onRefresh={loadAgents}
          onPairTerminal={() => {
            setAgentForPin(null);
            setIsPairModalOpen(true);
          }}
          onEditAgent={agent => setAgentToEdit(agent)}
          onDeleteAgent={agent => setAgentToDelete(agent)}
          onToggleStatus={handleToggleAgentStatus}
          onRegenerateCode={handleRegenerateAgentCode}
          onViewPin={handleViewAgentPin}
        />
      )}

      {canViewDevices && activeTab === 'devices' && (
        <DeviceList
          devices={devices}
          agents={agents}
          isLoading={isLoadingDevices}
          onRefresh={loadDevices}
          onCalibrateRoll={device => setDeviceToCalibrate(device)}
          onCreateDevice={() => {
            setDeviceToEdit(null);
            setIsDeviceModalOpen(true);
          }}
          onEditDevice={device => {
            setDeviceToEdit(device);
            setIsDeviceModalOpen(true);
          }}
          onDeleteDevice={device => setDeviceToDelete(device)}
          onTestPrint={device => setDeviceForTest(device)}
          onSetDefault={handleSetDefaultDevice}
        />
      )}

      {canViewJobs && activeTab === 'jobs' && (
        <PrintJobList
          jobs={jobs}
          isLoading={isLoadingJobs}
          onRefresh={loadJobs}
          onRetryJob={handleRetryJob}
          onCancelJob={handleCancelJob}
        />
      )}

      {canViewRolls && activeTab === 'rolls' && (
        <RollSizeList
          refreshKey={rollRefreshKey}
          onTotalChange={setRollsCount}
        />
      )}

      {/* Modales de Gestión */}
      <PairAgentModal
        isOpen={isPairModalOpen}
        onClose={() => {
          setIsPairModalOpen(false);
          setAgentForPin(null);
        }}
        initialAgent={agentForPin}
        onSuccess={() => {
          loadAgents();
          loadDevices();
        }}
      />

      <EditAgentModal
        isOpen={!!agentToEdit}
        onClose={() => setAgentToEdit(null)}
        agent={agentToEdit}
        onSuccess={loadAgents}
      />

      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        deviceToEdit={deviceToEdit}
        agents={agents}
        onSuccess={loadDevices}
      />

      {deviceToCalibrate && canViewRolls && <PrinterRollCalibrationModal key={deviceToCalibrate.id} deviceId={deviceToCalibrate.id}
        onClose={() => { setDeviceToCalibrate(null); void loadDevices(); }} onUpdated={() => { void loadDevices(); }} />}
      <TestPrintModal
        isOpen={!!deviceForTest}
        onClose={() => setDeviceForTest(null)}
        device={deviceForTest}
        onJobCreated={loadJobs}
      />

      {/* Confirmación Eliminar Agente */}
      <ConfirmationModal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        onConfirm={handleConfirmDeleteAgent}
        title="Revocar Terminal de Impresión"
        message={`¿Estás seguro de revocar la terminal "${agentToDelete?.name}"? Esta PC desconectará sus impresoras vinculadas de la plataforma.`}
        isLoading={isDeletingAgent}
      />

      {/* Confirmación Eliminar Dispositivo */}
      <ConfirmationModal
        isOpen={!!deviceToDelete}
        onClose={() => setDeviceToDelete(null)}
        onConfirm={handleConfirmDeleteDevice}
        title="Eliminar Impresora"
        message={`¿Estás seguro de eliminar la impresora "${deviceToDelete?.name}"? Ya no podrá recibir trabajos de tickets ni etiquetas.`}
        isLoading={isDeletingDevice}
      />
    </div>
  );
};
