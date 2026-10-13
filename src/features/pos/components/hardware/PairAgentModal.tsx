import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { ComerziaButton } from '../../../../components/ui/ComerziaButton';
import { BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { hardwareService } from '../../services/hardwareService';
import { branchService } from '../../../organization/services/branchService';
import { useToast } from '../../../../context/ToastContext';
import type { HwAgentResponse } from '../../types/hardware';
import { Laptop, Copy, Check, Clock, Info, ShieldCheck } from 'lucide-react';
import { formatTimeForUser } from '../../../../utils/date';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAgent?: HwAgentResponse | null;
}

export const PairAgentModal = ({ isOpen, onClose, onSuccess, initialAgent }: Props) => {
  const { error: toastError, success: toastSuccess } = useToast();

  const [step, setStep] = useState<'form' | 'pin'>('form');
  const [createdAgent, setCreatedAgent] = useState<HwAgentResponse | null>(null);
  const [copied, setCopied] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [form, setForm] = useState({
    name: '',
    branchId: '',
  });

  const [branches, setBranches] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCopied(false);
      if (initialAgent && initialAgent.pairingCode) {
        setCreatedAgent(initialAgent);
        setStep('pin');
      } else {
        setCreatedAgent(null);
        setStep('form');
        setForm({
          name: '',
          branchId: '',
        });
        loadBranches();
      }
    }
  }, [isOpen, initialAgent]);

  const loadBranches = async () => {
    setIsLoadingBranches(true);
    try {
      const data = await branchService.getBranches(0, 100);
      const branchOptions = data.content.map(b => ({ value: b.id, label: b.name }));
      setBranches(branchOptions);
      if (branchOptions.length === 1) {
        setForm(prev => ({ ...prev, branchId: branchOptions[0].value }));
      }
    } catch {
      toastError('Error al cargar sucursales');
    } finally {
      setIsLoadingBranches(false);
    }
  };

  const formatPin = (code?: string | null) => {
    if (!code) return '';
    const clean = code.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    if (clean.length === 8) {
      return `${clean.slice(0, 4)}-${clean.slice(4)}`;
    }
    return clean;
  };

  const handleCopyCode = async () => {
    const rawCode = createdAgent?.pairingCode || '';
    if (!rawCode) return;
    try {
      await navigator.clipboard.writeText(rawCode);
      setCopied(true);
      toastSuccess('Código PIN copiado al portapapeles');
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toastError('No se pudo copiar automáticamente.');
    }
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      const res = await hardwareService.createAgent({
        name: form.name.trim(),
        branchId: form.branchId || undefined,
      });
      setCreatedAgent(res);
      setStep('pin');
      toastSuccess('Terminal creada. Código PIN generado exitosamente.');
      onSuccess();
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } } };
      toastError(errorObj.response?.data?.message || 'Error al generar enlace de terminal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
  };

  const modalActions =
    step === 'form' ? (
      <div className="flex flex-row items-center justify-center sm:justify-end gap-2 w-full">
        <BtnCancel onClick={handleClose} disabled={isLoading} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
        <BtnSave
          onClick={handleSubmit}
          isLoading={isLoading}
          responsive={true}
          label="Vincular"
          className="flex-1 sm:flex-none sm:w-auto min-w-0"
        />
      </div>
    ) : (
      <div className="flex flex-row items-center justify-center sm:justify-end gap-2 w-full">
        <ComerziaButton
          variant="primary"
          label="Finalizar"
          onClick={handleClose}
          responsive={true}
          className="w-full sm:w-auto"
        />
      </div>
    );

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={handleClose}
      title={
        <div className="flex items-center gap-2 text-primary">
          <Laptop size={22} className="shrink-0" />
          <span>
            {step === 'form' ? 'Nueva Terminal' : 'PIN de Enlace'}
          </span>
        </div>
      }
      actions={modalActions}
      size="sm"
    >
      {step === 'form' ? (
        <div className="space-y-4 pt-1">
          {/* Banner informativo minimalista */}
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-xl border border-primary/20 text-xs text-base-content/80">
            <Info size={18} className="text-primary shrink-0 mt-0.5" />
            <span>
              Registra los datos de la terminal física para generar un código PIN de vinculación segura para tu tienda.
            </span>
          </div>

          {/* Nombre amigable de la terminal */}
          <ComerziaInput
            label="Nombre de la Terminal"
            placeholder="Ej: PC Caja Central - Mostrador"
            value={form.name}
            onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
            isRequired
            error={!form.name.trim() ? 'El nombre es requerido' : undefined}
            shakeKey={shakeKey}
            autoFocus
          />

          {/* Sucursal asignada */}
          <ComerziaSelect
            label="Sucursal Asignada"
            options={branches}
            value={form.branchId}
            onChange={e => setForm(prev => ({ ...prev, branchId: e.target.value }))}
            placeholder={isLoadingBranches ? 'Cargando sucursales...' : 'Selecciona una sucursal (opcional)'}
          />
        </div>
      ) : (
        <div className="space-y-4 pt-1">
          {/* Datos de la Terminal */}
          <div className="p-3 bg-base-200/50 rounded-xl border border-base-200 text-xs flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="font-bold text-sm text-base-content block truncate">
                {createdAgent?.name || form.name}
              </span>
              <span className="text-base-content/60 flex items-center gap-1 mt-0.5">
                <ShieldCheck size={12} className="text-primary" />
                {createdAgent?.branchName || 'Sucursal Asignada'}
              </span>
            </div>
            <span className="badge badge-warning badge-xs font-semibold py-1">
              Pendiente de Activación
            </span>
          </div>

          {/* Tarjeta Destacada del PIN */}
          <div className="p-5 bg-base-200/70 border-2 border-primary/30 rounded-2xl flex flex-col items-center justify-center gap-3 text-center shadow-xs">
            <span className="text-xs uppercase font-bold tracking-wider text-base-content/60">
              PIN de Enlace
            </span>
            <div className="text-3xl sm:text-4xl font-mono font-extrabold text-primary tracking-widest selection:bg-primary selection:text-white">
              {formatPin(createdAgent?.pairingCode)}
            </div>

            <ComerziaButton
              type="button"
              variant={copied ? 'success' : 'neutral'}
              icon={copied ? <Check size={15} /> : <Copy size={15} />}
              label={copied ? '¡Copiado!' : 'Copiar PIN'}
              onClick={handleCopyCode}
              className="btn-sm mt-1"
            />
          </div>

          {/* Indicador de Vigencia */}
          <div className="flex items-center justify-center gap-1.5 text-xs text-warning font-medium">
            <Clock size={14} className="shrink-0" />
            <span>
              {createdAgent?.pairingExpiresAt
                ? `Código válido hasta las ${formatTimeForUser(createdAgent.pairingExpiresAt)}`
                : 'Este código expira en 15 minutos'}
            </span>
          </div>

          {/* Instrucciones Claras */}
          <div className="p-3.5 bg-primary/5 rounded-xl border border-primary/15 text-xs text-base-content/80 leading-relaxed flex items-start gap-2.5">
            <Info size={16} className="text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-base-content mb-0.5">Pasos en la computadora:</p>
              <p>
                Abre la aplicación <strong>ComerziaPrintAgent.exe</strong> en la PC de la tienda, ingresa este código PIN y pulsa <em>&quot;Vincular y Conectar&quot;</em>.
              </p>
            </div>
          </div>
        </div>
      )}
    </ComerziaModal>
  );
};
