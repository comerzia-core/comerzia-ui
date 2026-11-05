import React, { useEffect, useState } from 'react';
import { Shield, Plus, Trash2, Key, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { PasswordChecklist } from '../../auth/components/PasswordChecklist';
import { passwordFeedback } from '../../auth/utils/passwordPolicy';
import { useToast } from '../../../context/ToastContext';
import {
  getMyExternalIdentities,
  startGoogleLink,
  unlinkExternalIdentity,
  setupInitialPassword
} from '../../auth/services/oidcService';
import { resolveOidcMessage } from '../../auth/utils/oidcMessages';
import type { ExternalIdentityItem } from '../../auth/types/oidc';

interface ExternalIdentitiesPanelProps {
  hasPassword?: boolean;
  onPasswordSetupSuccess?: () => void;
}

export const ExternalIdentitiesPanel: React.FC<ExternalIdentitiesPanelProps> = ({
  hasPassword = true,
  onPasswordSetupSuccess
}) => {
  const { addToast } = useToast();
  const [identities, setIdentities] = useState<ExternalIdentityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState(false);
  const [identityToUnlink, setIdentityToUnlink] = useState<ExternalIdentityItem | null>(null);
  const [unlinking, setUnlinking] = useState(false);

  // Formulario de setup de contraseña
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswordErrors, setShowPasswordErrors] = useState(false);
  const [settingPassword, setSettingPassword] = useState(false);

  const fetchIdentities = async () => {
    try {
      setLoading(true);
      const data = await getMyExternalIdentities();
      setIdentities(data || []);
    } catch {
      // Ignorar fallo de carga no crítico
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const data = await getMyExternalIdentities();
        if (active) setIdentities(data || []);
      } catch {
        // Ignorar fallo de carga no crítico
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleStartLink = async () => {
    if (linking) return;
    setLinking(true);
    try {
      const { authorizationUrl } = await startGoogleLink();
      if (authorizationUrl) {
        window.location.assign(authorizationUrl);
      }
    } catch (err: unknown) {
      setLinking(false);
      const errCode = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      addToast(resolveOidcMessage(errCode, 'No se pudo iniciar la vinculación con Google.'), 'error');
    }
  };

  const handleConfirmUnlink = async () => {
    if (!identityToUnlink || unlinking) return;
    setUnlinking(true);
    try {
      await unlinkExternalIdentity(identityToUnlink.publicReference);
      addToast('Cuenta de Google desvinculada exitosamente.', 'success');
      setIdentityToUnlink(null);
      await fetchIdentities();
    } catch (err: unknown) {
      const errCode = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      addToast(resolveOidcMessage(errCode, 'No se pudo desvincular la cuenta.'), 'error');
    } finally {
      setUnlinking(false);
    }
  };

  const handleSetupPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const feedback = passwordFeedback(newPassword);
    if (feedback) {
      setShowPasswordErrors(true);
      addToast(feedback, 'error');
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast('Las contraseñas no coinciden.', 'error');
      return;
    }

    setSettingPassword(true);
    try {
      await setupInitialPassword(newPassword);
      addToast('Contraseña configurada con éxito. Ahora puedes acceder con contraseña o mediante Google.', 'success');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordErrors(false);
      if (onPasswordSetupSuccess) onPasswordSetupSuccess();
    } catch (err: unknown) {
      const errCode = (err as { response?: { data?: { code?: string } } })?.response?.data?.code;
      addToast(resolveOidcMessage(errCode, 'No se pudo configurar la contraseña.'), 'error');
    } finally {
      setSettingPassword(false);
    }
  };

  const googleIdentity = identities.find(i => i.provider === 'GOOGLE');
  const isGoogleOnly = !hasPassword && Boolean(googleIdentity);

  return (
    <div className="bg-base-100 rounded-xl border border-base-200 p-6 shadow-sm mb-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <Shield size={22} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-base-content">Cuentas vinculadas</h2>
          <p className="text-sm text-base-content/60">Gestiona los proveedores de identidad federada para iniciar sesión.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-6 text-base-content/60">
          <Loader2 size={24} className="animate-spin mr-2" /> Cargando identidades…
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border border-base-200 bg-base-50/50">
            <div className="flex items-center gap-3">
              <img src="/media/landing/google-g.png" width={22} height={22} alt="Google" />
              <div>
                <div className="font-medium text-base-content flex items-center gap-2">
                  <span>Google</span>
                  {googleIdentity && (
                    <span className="badge badge-success badge-sm gap-1 text-xs">
                      <CheckCircle2 size={12} /> Conectada
                    </span>
                  )}
                </div>
                <p className="text-xs text-base-content/60">
                  {googleIdentity
                    ? `Vinculada como ${googleIdentity.emailAtLink}`
                    : 'Permite iniciar sesión rápidamente con tu cuenta de Google.'}
                </p>
              </div>
            </div>

            <div>
              {googleIdentity ? (
                <ComerziaButton
                  variant="ghost"
                  className="btn-sm text-error hover:bg-error/10 border border-error/30"
                  onClick={() => setIdentityToUnlink(googleIdentity)}
                  disabled={isGoogleOnly}
                  title={isGoogleOnly ? 'No puedes desvincular tu único método de acceso' : 'Desvincular cuenta'}
                >
                  <Trash2 size={14} className="mr-1" /> Desvincular
                </ComerziaButton>
              ) : (
                <ComerziaButton
                  variant="primary"
                  className="btn-sm"
                  onClick={handleStartLink}
                  disabled={linking}
                >
                  {linking ? <Loader2 size={14} className="animate-spin mr-1" /> : <Plus size={14} className="mr-1" />}
                  Vincular Google
                </ComerziaButton>
              )}
            </div>
          </div>

          {isGoogleOnly && (
            <div className="alert alert-warning text-xs flex items-start gap-2 py-3">
              <AlertTriangle size={18} className="shrink-0 mt-0.5 text-warning" />
              <div>
                <strong>Método de acceso único:</strong> Tu cuenta fue creada mediante Google y no tiene una contraseña asignada.
                Para poder desvincular Google si lo deseas en el futuro, debes configurar una contraseña local a continuación.
              </div>
            </div>
          )}

          {!hasPassword && (
            <div className="mt-6 pt-6 border-t border-base-200">
              <div className="flex items-center gap-2 mb-4">
                <Key size={18} className="text-primary" />
                <h3 className="text-sm font-semibold text-base-content">Establecer contraseña local</h3>
              </div>
              <p className="text-xs text-base-content/60 mb-4">
                Configura una contraseña segura para tu cuenta. Esto te permitirá acceder tanto con Google como mediante usuario y contraseña.
              </p>
              <form onSubmit={handleSetupPassword} className="space-y-4 max-w-md">
                <ComerziaInput
                  id="setup-new-password"
                  name="newPassword"
                  label="Nueva contraseña"
                  type="password"
                  value={newPassword}
                  onChange={e => {
                    setNewPassword(e.target.value);
                    setShowPasswordErrors(false);
                  }}
                  isRequired
                  disabled={settingPassword}
                  autoComplete="new-password"
                />
                <PasswordChecklist passwordValue={newPassword} showErrors={showPasswordErrors} />
                <ComerziaInput
                  id="setup-confirm-password"
                  name="confirmPassword"
                  label="Confirmar contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  isRequired
                  disabled={settingPassword}
                  autoComplete="new-password"
                />
                <ComerziaButton
                  type="submit"
                  variant="primary"
                  className="btn-sm"
                  disabled={settingPassword || !newPassword || !confirmPassword}
                >
                  {settingPassword ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
                  Establecer contraseña
                </ComerziaButton>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Modal de confirmación para desvincular */}
      <ComerziaModal
        isOpen={Boolean(identityToUnlink)}
        onClose={() => setIdentityToUnlink(null)}
        title="¿Desvincular cuenta de Google?"
      >
        <div className="space-y-4">
          <p className="text-sm text-base-content/80">
            Estás a punto de desvincular tu cuenta de Google (<strong>{identityToUnlink?.emailAtLink}</strong>).
            Ya no podrás usar el botón de Google para acceder a este usuario.
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <ComerziaButton
              variant="ghost"
              className="btn-sm"
              onClick={() => setIdentityToUnlink(null)}
              disabled={unlinking}
            >
              Cancelar
            </ComerziaButton>
            <ComerziaButton
              variant="delete"
              className="btn-sm"
              onClick={handleConfirmUnlink}
              disabled={unlinking}
            >
              {unlinking ? <Loader2 size={14} className="animate-spin mr-1" /> : null}
              Confirmar desvinculación
            </ComerziaButton>
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};

