import React, { useState } from 'react';
import { 
  KeyRound, 
  AlertTriangle, 
  Copy, 
  Check, 
  Download, 
  X 
} from 'lucide-react';

interface MfaRecoveryCodesModalProps {
  isOpen: boolean;
  recoveryCodes: string[];
  onClose: () => void;
}

export const MfaRecoveryCodesModal: React.FC<MfaRecoveryCodesModalProps> = ({
  isOpen,
  recoveryCodes,
  onClose
}) => {
  const [copied, setCopied] = useState(false);
  const [confirmedSaved, setConfirmedSaved] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      const text = `Comerzia - Códigos de Recuperación MFA\nFecha: ${new Date().toLocaleString()}\n\n${recoveryCodes.join('\n')}\n\nCada código solo puede ser usado una vez.`;
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // ignore
    }
  };

  const handleDownload = () => {
    const text = `Comerzia - Códigos de Recuperación MFA\nFecha: ${new Date().toLocaleString()}\n\n${recoveryCodes.join('\n')}\n\nCada código solo puede ser usado una vez.`;
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `comerzia-mfa-recovery-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-base-100 rounded-2xl shadow-2xl border border-base-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-base-200 flex items-center justify-between bg-base-200/40">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-base-content">
                Nuevos Códigos de Recuperación
              </h3>
              <p className="text-xs text-base-content/60">
                Los códigos anteriores han sido invalidados
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost btn-xs btn-circle"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <div className="p-3.5 rounded-xl bg-warning/10 border border-warning/20 text-warning-content space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-xs text-warning">
              <AlertTriangle size={16} />
              <span>Guarda estos códigos ahora</span>
            </div>
            <p className="text-xs text-base-content/80 leading-relaxed">
              Estos códigos son la única forma de acceder si pierdes tu dispositivo autenticador. Cada código es de un solo uso y <strong>no se volverán a mostrar</strong>.
            </p>
          </div>

          <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
            <div className="grid grid-cols-2 gap-2 font-mono text-xs font-bold text-center">
              {recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-base-100 rounded-lg border border-base-200 tracking-wider select-all"
                >
                  {code}
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleCopy}
              className="btn btn-outline btn-sm gap-1.5"
            >
              {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
              <span>{copied ? 'Códigos copiados' : 'Copiar todos'}</span>
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="btn btn-outline btn-sm gap-1.5"
            >
              <Download size={14} />
              <span>Descargar .txt</span>
            </button>
          </div>

          <div className="pt-3 border-t border-base-200">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={confirmedSaved}
                onChange={(e) => setConfirmedSaved(e.target.checked)}
                className="checkbox checkbox-sm checkbox-primary mt-0.5"
              />
              <span className="text-xs text-base-content/80 leading-snug">
                He guardado mis nuevos códigos de recuperación en un lugar seguro.
              </span>
            </label>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={!confirmedSaved}
              className="btn btn-primary btn-sm px-6"
            >
              Entendido y Guardado
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

