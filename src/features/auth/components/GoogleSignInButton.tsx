import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getIdentityOptions, startGoogleLogin } from '../services/oidcService';
import { resolveOidcMessage } from '../utils/oidcMessages';

interface GoogleSignInButtonProps {
  label?: string;
  className?: string;
  onError?: (message: string) => void;
  disabled?: boolean;
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  label = 'Continuar con Google',
  className = '',
  onError,
  disabled = false
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

  // Si aún está consultando o no está habilitado, se renderiza deshabilitado o con indicación de proximamente
  if (enabled === false) {
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

