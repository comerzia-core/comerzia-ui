import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { ComerziaSwitch } from '../../../../components/ui/ComerziaSwitch';
import { BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { hardwareService } from '../../services/hardwareService';
import { useToast } from '../../../../context/ToastContext';
import { useLoadDictionaries } from '../../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../../config/dictionaries';
import type {
  HwDeviceResponse,
  HwDeviceType,
  HwDeviceStatus,
  HwAgentResponse,
} from '../../types/hardware';

import { Printer } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  deviceToEdit?: HwDeviceResponse | null;
  defaultAgentId?: string;
  agents: HwAgentResponse[];
}

export const DeviceModal = ({
  isOpen,
  onClose,
  onSuccess,
  deviceToEdit,
  defaultAgentId,
  agents,
}: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([
    DICTIONARIES.HW_DEVICE_TYPE,
    DICTIONARIES.HW_DEVICE_STATUS,
  ]);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState<{
    agentId: string;
    name: string;
    deviceType: string;
    ipAddress: string;
    port: string;
    isDefault: boolean;
    status: string;
  }>({
    agentId: '',
    name: '',
    deviceType: '',
    ipAddress: '',
    port: '9100',
    isDefault: false,
    status: '',
  });

  const typeOptions = (options[DICTIONARIES.HW_DEVICE_TYPE] || []).map(opt => ({
    value: opt.value.toString(),
    label: opt.label,
  }));

  const statusOptions = (options[DICTIONARIES.HW_DEVICE_STATUS] || []).map(opt => ({
    value: opt.value.toString(),
    label: opt.label,
  }));

  const agentOptions = agents.map(a => ({
    value: a.id,
    label: `${a.name} (${a.machineName || 'Terminal'})`,
  }));

  useEffect(() => {
    if (isOpen) {
      if (deviceToEdit) {
        setForm({
          agentId: deviceToEdit.agentId,
          name: deviceToEdit.name,
          deviceType: deviceToEdit.deviceType.toString(),
          ipAddress: deviceToEdit.ipAddress || '',
          port: deviceToEdit.port ? deviceToEdit.port.toString() : '9100',
          isDefault: deviceToEdit.isDefault,
          status: deviceToEdit.status.toString(),
        });
      } else {
        const initialAgent = defaultAgentId || (agents.length > 0 ? agents[0].id : '');
        const defaultType = typeOptions.length > 0 ? typeOptions[0].value : '';
        const defaultStatus = statusOptions.length > 0 ? statusOptions[0].value : '';
        setForm({
          agentId: initialAgent,
          name: '',
          deviceType: defaultType,
          ipAddress: '',
          port: '9100',
          isDefault: false,
          status: defaultStatus,
        });
      }
    }
  }, [isOpen, deviceToEdit, defaultAgentId, agents, typeOptions.length, statusOptions.length]);

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.deviceType || (!deviceToEdit && !form.agentId)) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      const parsedPort = form.port ? parseInt(form.port, 10) : undefined;

      if (deviceToEdit) {
        await hardwareService.updateDevice(deviceToEdit.id, {
          name: form.name.trim(),
          deviceType: Number(form.deviceType) as HwDeviceType,
          ipAddress: form.ipAddress.trim() || undefined,
          port: isNaN(parsedPort as number) ? undefined : parsedPort,
          isDefault: form.isDefault,
          status: Number(form.status) as HwDeviceStatus,
        });
        toastSuccess('Impresora actualizada exitosamente');
      } else {
        await hardwareService.createDevice({
          agentId: form.agentId,
          name: form.name.trim(),
          deviceType: Number(form.deviceType) as HwDeviceType,
          ipAddress: form.ipAddress.trim() || undefined,
          port: isNaN(parsedPort as number) ? undefined : parsedPort,
          isDefault: form.isDefault,
        });
        toastSuccess('Impresora registrada exitosamente');
      }
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al guardar la impresora');
    } finally {
      setIsLoading(false);
    }
  };

  const modalActions = (
    <div className="flex flex-row items-center gap-2 w-full sm:justify-end">
      <BtnCancel onClick={onClose} disabled={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
      <BtnSave onClick={handleSubmit} isLoading={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
    </div>
  );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-primary">
          <Printer size={22} className="shrink-0" />
          <span>{deviceToEdit ? 'Editar Impresora' : 'Nueva Impresora'}</span>
        </div>
      }
      actions={modalActions}
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Terminal Asociada (solo visible o editable si no estamos editando) */}
        {!deviceToEdit && (
          <ComerziaSelect
            label="Terminal Vinculada"
            options={agentOptions}
            value={form.agentId}
            onChange={e => setForm(prev => ({ ...prev, agentId: e.target.value }))}
            isRequired
            placeholder="Selecciona una terminal"
            error={!form.agentId ? 'La terminal es requerida' : undefined}
            shakeKey={shakeKey}
          />
        )}

        {/* Nombre de la Impresora */}
        <ComerziaInput
          label="Nombre de la Impresora"
          placeholder="Ej: Impresora Térmica Mostrador"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          isRequired
          error={!form.name.trim() ? 'El nombre es requerido' : undefined}
          shakeKey={shakeKey}
        />

        {/* Tipo de Dispositivo */}
        <ComerziaSelect
          label="Tipo de Dispositivo"
          options={typeOptions}
          value={form.deviceType}
          onChange={e => setForm(prev => ({ ...prev, deviceType: e.target.value }))}
          isRequired
          placeholder={isLoadingDicts ? 'Cargando tipos...' : 'Selecciona un tipo'}
          error={!form.deviceType ? 'El tipo es requerido' : undefined}
          shakeKey={shakeKey}
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* IP Address */}
          <div className="sm:col-span-2">
            <ComerziaInput
              label="Dirección IP (Red)"
              placeholder="Ej: 192.168.1.200"
              value={form.ipAddress}
              onChange={e => setForm(prev => ({ ...prev, ipAddress: e.target.value }))}
            />
          </div>

          {/* Puerto */}
          <div>
            <ComerziaInput
              label="Puerto"
              placeholder="9100"
              type="number"
              value={form.port}
              onChange={e => setForm(prev => ({ ...prev, port: e.target.value }))}
            />
          </div>
        </div>

        {/* Estado si está editando */}
        {deviceToEdit && (
          <ComerziaSelect
            label="Estado"
            options={statusOptions}
            value={form.status}
            onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
            isRequired
          />
        )}

        {/* Impresora por Defecto */}
        <div className="p-3 bg-base-200/40 rounded-xl flex items-center justify-between gap-3 border border-base-200">
          <span className="text-xs text-base-content/80 font-medium leading-relaxed">
            Establecer como impresora predeterminada para este tipo
          </span>
          <ComerziaSwitch
            checked={form.isDefault}
            onChange={() => setForm(prev => ({ ...prev, isDefault: !prev.isDefault }))}
          />
        </div>
      </div>
    </ComerziaModal>
  );
};

