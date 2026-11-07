import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getIdentityOptions, startGoogleLogin } from '../services/oidcService';
import { resolveOidcMessage } from '../utils/oidcMessages';

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  onError?: (message: string) => void;
  disabled?: boolean;
  variant?: 'public' | 'daisy';
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Continuar con Google',
  className = '',
  onError,
  disabled = false,
  variant = 'public'
}) => {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getIdentityOptions()
      .then(res => {
        if (active) setEnabled(res.googleOidcEnabled);
      })
      .catch(() => {
        if (active) setEnabled(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const handleClick = async () => {
    if (loading || disabled || !enabled) return;
    setLoading(true);
    try {
      const { authorizationUrl } = await startGoogleLogin();
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      } else {
        throw new Error('oidc_unavailable');
      }
    } catch (err: unknown) {
      setLoading(false);
      const errCode = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      const message = resolveOidcMessage(errCode, 'No se pudo iniciar la conexión con Google.');
      if (onError) onError(message);
    }
  };

  const isDaisy = variant === 'daisy';

  // Si no está habilitado en el backend
  if (enabled === false) {
    if (isDaisy) {
      return (
        <button
          type="button"
          disabled
          className={`btn btn-outline border-base-300 opacity-60 cursor-not-allowed w-full flex items-center justify-center gap-3 text-base-content font-medium ${className}`}
          aria-label={`${label} (No disponible)`}
        >
          <img src="/media/landing/google-g.png" width={18} height={18} alt="" />
          <span>{label}</span>
          <span className="badge badge-sm badge-ghost text-xs">No disponible</span>
        </button>
      );
    }

    return (
      <button
        type="button"
        disabled
        className={`public-action public-google ${className}`}
        aria-label={`${label} (No disponible)`}
      >
        <img src="/media/landing/google-g.png" width={18} height={18} alt="" />
        <span>{label}</span>
        <small>Próximamente</small>
      </button>
    );
  }

  if (isDaisy) {
    return (
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading || enabled === null}
        className={`btn btn-outline border-base-300 bg-base-100 hover:bg-base-200 hover:border-base-300 hover:text-base-content text-base-content w-full flex items-center justify-center gap-3 font-medium transition-colors shadow-xs normal-case ${loading ? 'opacity-80' : ''} ${className}`}
        aria-label={label}
        aria-busy={loading}
      >
        {loading ? (
          <Loader2 size={18} className="animate-spin text-primary" />
        ) : (
          <img src="/media/landing/google-g.png" width={18} height={18} alt="Google" />
        )}
        <span>{loading ? 'Conectando con Google…' : label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading || enabled === null}
      className={`public-action public-google ${className}`}
      aria-label={label}
      aria-busy={loading}
    >
      {loading ? (
        <Loader2 size={18} className="animate-spin" />
      ) : (
        <img src="/media/landing/google-g.png" width={18} height={18} alt="" />
      )}
      <span>{loading ? 'Conectando con Google…' : label}</span>
    </button>
  );
};

