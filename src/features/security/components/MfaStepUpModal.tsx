import { isValidTotpCode } from '../utils/mfaInput';
import React, { useEffect, useState } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave, BtnCancel } from '../../../components/ui/CrudButtons';
import { mfaProfileService } from '../services/mfaProfileService';
import type { MfaStepUpActionType } from '../types/mfa';

interface MfaStepUpModalProps {
  isOpen: boolean;
  action: MfaStepUpActionType;
  targetId?: string;
  title?: string;
  description?: string;
  onSuccess: (grantToken: string) => void;
  onCancel: () => void;
}

const ACTION_DESCRIPTIONS: Record<MfaStepUpActionType, { title: string; desc: string }> = {
  UPDATE_SECURITY_SETTINGS: { title: 'Confirmar configuración sensible', desc: 'Verifica tu autenticador para guardar estos cambios.' },
  ASSIGN_ROLES: {
    title: 'Confirmar asignación de roles',
    desc: 'Esta acción modifica privilegios de acceso críticos en el sistema y requiere validación de tu segundo factor.'
  },
  UPDATE_USER_ACCESS: {
    title: 'Confirmar modificación de acceso',
    desc: 'Esta operación altera el estado de acceso de una cuenta de usuario y requiere validación de seguridad.'
  },
  MANAGE_SAAS_TEAM: {
    title: 'Confirmar operación en equipo SaaS',
    desc: 'Los cambios en cuentas de plataforma SaaS requieren verificación de segundo factor.'
  },
  DEACTIVATE_MFA: {
    title: 'Confirmar desactivación de 2FA',
    desc: 'Estás a punto de desactivar la autenticación en dos pasos. Ingresa el código actual de tu aplicación para autorizarlo.'
  },
  REGENERATE_RECOVERY_CODES: {
    title: 'Confirmar regeneración de códigos',
    desc: 'Al regenerar nuevos códigos de recuperación se invalidarán todos los anteriores. Ingresa tu código de autenticación.'
  },
  REPLACE_MFA: {
    title: 'Confirmar reemplazo de autenticador',
    desc: 'Para vincular un nuevo dispositivo o aplicación debes verificar primero tu autenticador actual.'
  },
  ADMIN_MFA_RECOVERY: {
    title: 'Confirmar recuperación administrativa de MFA',
    desc: 'Esta operación crítica de recuperación de factores requiere validación estricta de tu segundo factor.'
  },
  INVITE_EMPLOYEE: {
    title: 'Confirmar invitación de colaborador',
    desc: 'La invitación asigna un rol con privilegios sensibles en la empresa y requiere validación de tu segundo factor.'
  }
};

export const MfaStepUpModal: React.FC<MfaStepUpModalProps> = ({
  isOpen,
  action,
  targetId,
  title,
  description,
  onSuccess,
  onCancel
}) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopImmediatePropagation();
      if (!loading) { setCode(''); setError(null); onCancel(); }
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [isOpen, loading, onCancel]);

  if (!isOpen) return null;

  const config = ACTION_DESCRIPTIONS[action] || {
    title: title || 'Verificación de seguridad',
    desc: description || 'Por favor ingresa tu código de autenticación para continuar.'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (!isValidTotpCode(cleanCode)) {
      setError('Ingresa el código numérico de 6 dígitos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await mfaProfileService.requestStepUp({
        code: cleanCode,
        action, targetId
      });
      setCode('');
      onSuccess(response.grantToken);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; message?: string } } };
      const errCode = axiosErr.response?.data?.code;

      if (errCode === 'totp_code_replayed') {
        setError('Este código ya fue utilizado recientemente. Espera a que la app genere el siguiente.');
      } else if (errCode === 'invalid_totp_code') {
        setError('El código ingresado es incorrecto. Verifica tu aplicación de autenticación.');
      } else if (errCode === 'rate_limited') {
        setError('Demasiados intentos fallidos. Por favor espera unos minutos antes de intentar de nuevo.');
      } else {
        setError(axiosErr.response?.data?.message || 'Error al validar el código de seguridad.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setCode('');
    setError(null);
    onCancel();
  };

  return (
    <ComerziaModal isOpen={isOpen} onClose={handleClose} title={title || config.title} size="sm"
      actions={<>
        <BtnCancel responsive={false} onClick={handleClose} disabled={loading} />
        <BtnSave responsive={false} label="Autorizar" isLoading={loading}
          disabled={loading || !isValidTotpCode(code)} onClick={handleSubmit} />
      </>}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-base-content/70">{description || config.desc}</p>
        <ComerziaInput label="Código de la app autenticadora" aria-label="Código de la app autenticadora"
          value={code} inputMode="numeric" autoComplete="one-time-code" maxLength={6}
          placeholder="123456" autoFocus disabled={loading}
          onChange={event => { setCode(event.target.value.replace(/\D/g, '')); setError(null); }}
          error={error || undefined} />
      </form>
    </ComerziaModal>
  );
};
