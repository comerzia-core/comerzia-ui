import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { hardwareService } from '../../services/hardwareService';
import { useToast } from '../../../../context/ToastContext';
import { useLoadDictionaries } from '../../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../../config/dictionaries';
import type { HwAgentResponse, HwAgentStatus } from '../../types/hardware';

import { Laptop } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  agent: HwAgentResponse | null;
}

export const EditAgentModal = ({ isOpen, onClose, onSuccess, agent }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([DICTIONARIES.HW_AGENT_STATUS]);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState<{
    name: string;
    status: string;
  }>({
    name: '',
    status: '',
  });

  useEffect(() => {
    if (isOpen && agent) {
      setForm({
        name: agent.name,
        status: String(agent.status),
      });
    }
  }, [isOpen, agent]);

  const statusOptions = (options[DICTIONARIES.HW_AGENT_STATUS] || []).map(opt => ({
    value: opt.value.toString(),
    label: opt.label,
  }));

  const handleSubmit = async () => {
    if (!agent || !form.name.trim() || !form.status) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      await hardwareService.updateAgent(agent.id, {
        name: form.name.trim(),
        status: Number(form.status) as HwAgentStatus,
      });
      toastSuccess('Terminal actualizada exitosamente');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al actualizar el terminal');
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
          <Laptop size={22} className="shrink-0" />
          <span>Editar Terminal de Impresión</span>
        </div>
      }
      actions={modalActions}
      size="sm"
    >
      <div className="space-y-4 pt-1">
        {agent?.machineName && (
          <div className="p-2.5 bg-base-200/50 rounded-xl text-xs text-base-content/70">
            <span className="font-semibold text-base-content">Equipo Host: </span>
            <span className="font-mono">{agent.machineName}</span>
          </div>
        )}

        <ComerziaInput
          label="Nombre de la Terminal"
          value={form.name}
          onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
          isRequired
          error={!form.name.trim() ? 'El nombre es requerido' : undefined}
          shakeKey={shakeKey}
        />

        <ComerziaSelect
          label="Estado"
          options={statusOptions}
          value={form.status}
          onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
          isRequired
          placeholder={isLoadingDicts ? 'Cargando estados...' : 'Selecciona un estado'}
        />
      </div>
    </ComerziaModal>
  );
};

