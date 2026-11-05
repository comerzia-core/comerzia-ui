import { useState } from 'react';
import { emailChangeService } from '../services/emailChangeService';
import { securityChallengeMessage } from '../utils/securityChallengeMessages';
interface EmailChangeRequestOptions {
  currentEmail?: string | null;
  onSuccess: (message: string) => void;
  onClose: () => void;
}
export function useEmailChangeRequest({ currentEmail, onSuccess, onClose }: EmailChangeRequestOptions) {
  const [newEmail, setNewEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    const trimmedEmail = newEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setShakeKey(k => k + 1);
      setErrorMessage('Ingresa un correo electrónico válido.');
      return;
    }

    if (currentEmail && trimmedEmail.toLowerCase() === currentEmail.toLowerCase()) {
      setShakeKey(k => k + 1);
      setErrorMessage('El nuevo correo debe ser distinto al correo actual.');
      return;
    }

    if (!currentPassword) {
      setShakeKey(k => k + 1);
      setErrorMessage('Ingresa tu contraseña actual para confirmar tu identidad.');
      return;
    }

    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await emailChangeService.requestChange({
        newEmail: trimmedEmail,
        currentPassword,
      });

      // Limpiar de memoria inmediatamente
      setCurrentPassword('');
      setNewEmail('');
      onSuccess('Solicitud recibida. Revisa tu nuevo correo.');
      onClose();
    } catch (err: unknown) {
      setShakeKey(k => k + 1);
      // Limpiar contraseña de memoria en fallo
      setCurrentPassword('');
      setErrorMessage(securityChallengeMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };


  return { newEmail, setNewEmail, currentPassword, setCurrentPassword, showPassword, setShowPassword, errorMessage, isSubmitting, shakeKey, handleSubmit };
}
