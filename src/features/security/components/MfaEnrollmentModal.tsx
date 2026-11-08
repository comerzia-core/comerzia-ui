import React, { useState, useEffect, useRef } from 'react';
import { BrowserQRCodeSvgWriter } from '@zxing/library';
import { 
  ShieldCheck, 
  Key, 
  Copy, 
  Check, 
  Download, 
  AlertTriangle, 
  X, 
  Loader2 
} from 'lucide-react';
import { mfaProfileService } from '../services/mfaProfileService';
import type { TotpEnrollmentStartResponse } from '../types/mfa';

interface MfaEnrollmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialGrantToken?: string;
}

export const MfaEnrollmentModal: React.FC<MfaEnrollmentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialGrantToken
}) => {
  const [step, setStep] = useState<'SETUP' | 'RECOVERY_CODES'>('SETUP');
  const [enrollmentData, setEnrollmentData] = useState<TotpEnrollmentStartResponse | null>(null);
  const [code, setCode] = useState<string>('');
  const [showManualKey, setShowManualKey] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfirming, setIsConfirming] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);
  const [copiedCodes, setCopiedCodes] = useState<boolean>(false);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);

  const qrContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStep('SETUP');
    setEnrollmentData(null);
    setCode('');
    setShowManualKey(false);
    setErrorMessage(null);
    setCopiedKey(false);
    setCopiedCodes(false);
    setRecoveryCodes([]);
    setIsLoading(true);
  };

  // Initialize enrollment when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isCancelled = false;

    mfaProfileService.startTotpEnrollment(initialGrantToken)
      .then(data => {
        if (!isCancelled) {
          setEnrollmentData(data);
          setIsLoading(false);
        }
      })
      .catch(err => {
        if (!isCancelled) {
          setIsLoading(false);
          const msg = err?.response?.data?.code === 'primary_reauthentication_required'
            ? 'Inicia sesión nuevamente para configurar 2FA.' : 'No pudimos iniciar la configuración de 2FA.';
          setErrorMessage(msg);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [isOpen, initialGrantToken]);

  // Render QR code locally when enrollmentData is available
  useEffect(() => {
    if (!enrollmentData?.otpauthUri || !qrContainerRef.current) return;

    try {
      const writer = new BrowserQRCodeSvgWriter();
      const svg = writer.write(enrollmentData.otpauthUri, 200, 200);
      qrContainerRef.current.innerHTML = '';
      qrContainerRef.current.appendChild(svg);
    } catch {
      // SVG render error handled gracefully
    }
  }, [enrollmentData?.otpauthUri, step]);

  // Focus input on setup step
  useEffect(() => {
    if (step === 'SETUP' && enrollmentData && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step, enrollmentData]);

  const handleCopySecret = async () => {
    if (!enrollmentData?.secret) return;
    try {
      await navigator.clipboard.writeText(enrollmentData.secret);
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2500);
    } catch {
      // Clipboard write failed
    }
  };

  const handleCopyRecoveryCodes = async () => {
    if (recoveryCodes.length === 0) return;
    try {
      const text = recoveryCodes.join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      setTimeout(() => setCopiedCodes(false), 2500);
    } catch {
      // Clipboard write failed
    }
  };

  const handleDownloadRecoveryCodes = () => {
    if (recoveryCodes.length === 0) return;
    const content = [
      '====================================================',
      'Comerzia - Códigos de Respaldo de Autenticación MFA',
      '====================================================',
      '',
      'IMPORTANTE: Cada código solo se puede utilizar UNA vez.',
      'Guárdalos en un lugar seguro (administrador de contraseñas).',
      '',
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
      '',
      `Fecha de generación: ${new Date().toISOString()}`
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'comerzia-codigos-respaldo.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().replace(/\s/g, '');
    if (!cleanCode || cleanCode.length !== 6) {
      setErrorMessage('Ingresa el código de 6 dígitos numéricos.');
      return;
    }

    setIsConfirming(true);
    setErrorMessage(null);

    try {
      const res = await mfaProfileService.confirmTotpEnrollment(cleanCode);
      setRecoveryCodes(res.recoveryCodes || []);
      setStep('RECOVERY_CODES');
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { code?: string; message?: string } } })?.response?.data;
      if (resp?.code === 'invalid_totp_code') {
        setErrorMessage('El código de 6 dígitos es incorrecto o ha expirado. Verifica la hora en tu dispositivo.');
      } else if (resp?.code === 'totp_code_replayed') {
        setErrorMessage('Este código ya fue utilizado. Espera al siguiente código en tu aplicación.');
      } else {
        setErrorMessage(resp?.message || 'Error al validar el código. Inténtalo de nuevo.');
      }
    } finally {
      setIsConfirming(false);
    }
  };

  const handleCancelAndClose = () => {
    if (step === 'SETUP') {
      mfaProfileService.cancelTotpEnrollment().catch(() => {});
    } else {
      onSuccess();
    }
    resetState();
    onClose();
  };

  const handleSaveAndClose = () => {
    onSuccess();
    resetState();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl border border-base-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-base-200 bg-base-200/40">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3 className="font-bold text-base text-base-content">
                {step === 'SETUP' ? 'Configurar Autenticador (MFA)' : 'Códigos de Respaldo'}
              </h3>
              <p className="text-xs text-base-content/60">
                {step === 'SETUP' 
                  ? 'Protege tu cuenta con verificación en dos pasos' 
                  : 'Paso obligatorio para completar la activación'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelAndClose}
            className="p-1.5 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
            title="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-3">
              <Loader2 className="animate-spin text-primary" size={36} />
              <p className="text-sm text-base-content/70">Generando credenciales de seguridad...</p>
            </div>
          ) : step === 'SETUP' ? (
            <div className="space-y-5">
              {errorMessage && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-error/10 border border-error/20 text-error text-xs">
                  <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Instructions */}
              <div className="text-xs text-base-content/80 space-y-1.5">
                <p className="font-semibold text-base-content">
                  1. Escanea este código QR con Google Authenticator, Microsoft Authenticator o tu app de confianza:
                </p>
              </div>

              {/* QR Container (rendered purely client-side SVG) */}
              <div className="flex justify-center p-4 bg-white rounded-2xl border border-base-200 shadow-inner">
                <div ref={qrContainerRef} className="w-[200px] h-[200px] flex items-center justify-center" />
              </div>

              {/* Manual Key Accordion / Option */}
              <div className="bg-base-200/50 rounded-xl p-3 border border-base-200">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowManualKey(!showManualKey)}
                    className="text-xs font-semibold text-primary hover:underline flex items-center gap-1.5"
                  >
                    <Key size={14} />
                    {showManualKey ? 'Ocultar clave manual' : '¿No puedes escanear? Ingresar clave manual'}
                  </button>
                  {showManualKey && (
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="btn btn-ghost btn-xs gap-1 text-primary"
                    >
                      {copiedKey ? <Check size={12} /> : <Copy size={12} />}
                      {copiedKey ? 'Copiada' : 'Copiar'}
                    </button>
                  )}
                </div>

                {showManualKey && enrollmentData && (
                  <div className="mt-2.5 pt-2.5 border-t border-base-200/60">
                    <p className="text-[11px] text-base-content/60 mb-1">
                      Copia esta clave secreta en tu aplicación de autenticación:
                    </p>
                    <code className="block p-2 bg-base-100 rounded-lg text-xs font-mono font-bold tracking-wider text-center text-primary break-all select-all">
                      {enrollmentData.secret}
                    </code>
                  </div>
                )}
              </div>

              {/* Step 2: Verification Input */}
              <form onSubmit={handleConfirm} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label htmlFor="totp-input" className="text-xs font-bold text-base-content block">
                    2. Ingresa el código de 6 dígitos que muestra tu aplicación:
                  </label>
                  <input
                    ref={inputRef}
                    id="totp-input"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="input input-bordered w-full text-center text-2xl tracking-[0.4em] font-mono font-bold h-13"
                    disabled={isConfirming}
                  />
                </div>

                {/* Footer Buttons */}
                <div className="flex justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleCancelAndClose}
                    className="btn btn-ghost btn-sm"
                    disabled={isConfirming}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary btn-sm px-5"
                    disabled={isConfirming || code.length !== 6}
                  >
                    {isConfirming ? (
                      <>
                        <Loader2 className="animate-spin" size={14} />
                        Verificando...
                      </>
                    ) : (
                      'Activar Autenticador'
                    )}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            /* STEP: RECOVERY CODES */
            <div className="space-y-5 animate-fade-in">
              <div className="p-4 rounded-xl bg-warning/10 border border-warning/20 text-warning-content space-y-2">
                <div className="flex items-center gap-2 font-bold text-xs text-warning">
                  <AlertTriangle size={18} />
                  <span>Guarda estos códigos en un lugar seguro</span>
                </div>
                <p className="text-xs text-base-content/80 leading-relaxed">
                  Si pierdes acceso a tu dispositivo, estos códigos son la <strong>única forma</strong> de ingresar a tu cuenta sin asistencia administrativa. Cada código se puede usar <strong>una sola vez</strong>. Por seguridad, no se volverán a mostrar.
                </p>
              </div>

              {/* Codes Grid */}
              <div className="bg-base-200/60 p-4 rounded-xl border border-base-200">
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs font-bold text-base-content text-center">
                  {recoveryCodes.map((rc, idx) => (
                    <div 
                      key={idx}
                      className="p-2 bg-base-100 rounded-lg border border-base-200/80 tracking-wider select-all"
                    >
                      {rc}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons: Copy / Download */}
              <div className="flex flex-wrap gap-2 justify-center">
                <button
                  type="button"
                  onClick={handleCopyRecoveryCodes}
                  className="btn btn-outline btn-sm gap-1.5"
                >
                  {copiedCodes ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                  {copiedCodes ? 'Códigos copiados' : 'Copiar todos'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRecoveryCodes}
                  className="btn btn-outline btn-sm gap-1.5"
                >
                  <Download size={14} />
                  Descargar (.txt)
                </button>
              </div>

              {/* Final confirmation button */}
              <div className="pt-3 border-t border-base-200 flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveAndClose}
                  className="btn btn-primary btn-sm px-6 w-full sm:w-auto"
                >
                  He guardado mis códigos
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
