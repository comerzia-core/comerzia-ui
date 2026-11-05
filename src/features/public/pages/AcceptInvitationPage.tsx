// src/features/public/pages/AcceptInvitationPage.tsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Mail,
  Building2,
  Shield,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Eye,
  EyeOff,
  UserCheck
} from 'lucide-react';
import { AuthStage } from '../components/AuthStage';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { PasswordChecklist } from '../../auth/components/PasswordChecklist';
import { useAcceptInvitation } from '../hooks/useAcceptInvitation';
import { useAuthStore } from '../../../stores/useAuthStore';

export const AcceptInvitationPage: React.FC = () => {
  const {
    token,
    inspection,
    loading,
    submitting,
    errorMessage,
    acceptedOutcome,
    isAuthenticated,
    authUser,
    googleContinuationToken,
    acceptWithLocalCredentials,
    acceptWithActiveSession,
    acceptWithGoogle,
    startGoogleAcceptance
  } = useAcceptInvitation();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [paternalSurname, setPaternalSurname] = useState('');
  const [maternalSurname, setMaternalSurname] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formValidationErrors, setFormValidationErrors] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Aceptar Invitación | Comerzia';
  }, []);

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormValidationErrors(null);

    if (!firstName.trim()) {
      setFormValidationErrors('El nombre es requerido.');
      return;
    }
    if (!paternalSurname.trim()) {
      setFormValidationErrors('El apellido paterno es requerido.');
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setFormValidationErrors('El nombre de usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (!password || password.length < 8) {
      setFormValidationErrors('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setFormValidationErrors('Las contraseñas no coinciden.');
      return;
    }

    acceptWithLocalCredentials({
      username,
      password,
      firstName,
      paternalSurname,
      maternalSurname
    });
  };

  return (
    <AuthStage>
      <div className="public-login">
        {/* Caso 1: Token no proporcionado en la URL */}
        {!token && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              <AlertTriangle size={32} />
            </div>
            <h1 className="text-xl font-bold text-base-content">Enlace incompleto</h1>
            <p className="text-sm text-base-content/70">
              No se detectó un token de invitación. Si recibiste un correo de invitación, asegúrate de abrir el enlace completo.
            </p>
            <div className="pt-4">
              <Link to="/login" className="public-action" style={{ width: '100%', textDecoration: 'none' }}>
                Ir a iniciar sesión <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* Caso 2: Cargando / Inspeccionando */}
        {token && loading && (
          <div className="space-y-4 py-8 text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-sm font-medium text-base-content/70">
              Validando enlace de invitación...
            </p>
          </div>
        )}

        {/* Caso 3: Invitación aceptada exitosamente */}
        {acceptedOutcome && (
          <div className="space-y-5 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-success/15 text-success rounded-full flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-bold text-base-content">
              ¡Bienvenido a {acceptedOutcome.companyName}!
            </h1>
            <p className="text-sm text-base-content/70 leading-relaxed">
              Has aceptado la invitación exitosamente con el rol{' '}
              <strong className="text-primary font-semibold">{acceptedOutcome.roleName}</strong>. Tu cuenta se encuentra activa.
            </p>
            <div className="pt-3">
              <Link to="/app" className="public-action" style={{ width: '100%', textDecoration: 'none' }}>
                Entrar al sistema <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        )}

        {/* Caso 4: Error en inspección o estado terminal (expirada, revocada, ya aceptada, not found) */}
        {token && !loading && !acceptedOutcome && errorMessage && (!inspection || inspection.status !== 'PENDING') && (
          <div className="space-y-4 text-center animate-fade-in">
            <div className="w-16 h-16 mx-auto bg-error/10 text-error rounded-full flex items-center justify-center">
              <XCircle size={36} />
            </div>
            <h1 className="text-xl font-bold text-base-content">Invitación no disponible</h1>
            <div className="p-3 bg-error/10 text-error rounded-xl text-xs sm:text-sm font-medium text-left">
              {errorMessage}
            </div>
            <p className="text-xs text-base-content/60">
              Si crees que esto es un error, contacta a la persona que te envió la invitación para que te reenvíe un enlace nuevo.
            </p>
            <div className="pt-4 flex flex-col gap-3">
              <Link to="/login" className="public-action" style={{ width: '100%', textDecoration: 'none' }}>
                Iniciar sesión <ArrowRight size={18} />
              </Link>
              <Link to="/" className="public-action public-action--back" style={{ width: '100%', textDecoration: 'none' }}>
                Volver al inicio
              </Link>
            </div>
          </div>
        )}

        {/* Caso 5: Invitación válida en estado PENDING lista para aceptar */}
        {token && !loading && !acceptedOutcome && inspection && inspection.status === 'PENDING' && (
          <div className="space-y-5 animate-fade-in">
            <div className="text-center space-y-1">
              <span className="public-eyebrow">INVITACIÓN DE COLABORADOR</span>
              <h1 className="text-2xl font-bold text-base-content">Únete a la empresa</h1>
              <p className="text-xs text-base-content/60">
                Has sido invitado a formar parte del equipo de trabajo en Comerzia.
              </p>
            </div>

            {/* Ficha informativa de la invitación */}
            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-200 space-y-2.5 text-xs">
              <div className="flex items-center gap-2 text-base-content">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="text-base-content/60">Empresa:</span>
                <strong className="font-semibold text-sm">{inspection.companyName}</strong>
              </div>
              <div className="flex items-center gap-2 text-base-content">
                <Shield className="w-4 h-4 text-primary shrink-0" />
                <span className="text-base-content/60">Rol asignado:</span>
                <span className="badge badge-primary badge-sm font-medium">{inspection.roleName}</span>
              </div>
              <div className="flex items-center gap-2 text-base-content">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span className="text-base-content/60">Sucursal:</span>
                <span className="font-medium">{inspection.branchName || 'Todas las sucursales (Global)'}</span>
              </div>
              <div className="flex items-center gap-2 text-base-content pt-1 border-t border-base-200/80">
                <Mail className="w-4 h-4 text-primary shrink-0" />
                <span className="text-base-content/60">Invitado como:</span>
                <span className="font-mono font-medium">{inspection.emailMasked}</span>
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 bg-error/10 text-error rounded-xl text-xs font-medium">
                {errorMessage}
              </div>
            )}
            {formValidationErrors && (
              <div className="p-3 bg-warning/10 text-warning-content rounded-xl text-xs font-medium">
                {formValidationErrors}
              </div>
            )}

            {/* Subcaso A: Usuario ya tiene sesión activa en el navegador */}
            {isAuthenticated ? (
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-info/10 text-info-content rounded-xl text-xs flex items-start gap-2">
                  <UserCheck className="w-4 h-4 shrink-0 text-info mt-0.5" />
                  <div>
                    Has iniciado sesión como <strong>{authUser?.username || 'usuario activo'}</strong>. Puedes aceptar esta invitación para sumar este rol a tu cuenta.
                  </div>
                </div>

                <button
                  type="button"
                  className="public-action"
                  style={{ width: '100%' }}
                  onClick={acceptWithActiveSession}
                  disabled={submitting}
                >
                  {submitting ? 'Aceptando invitación...' : 'Aceptar invitación con mi cuenta'}
                  <ArrowRight size={18} />
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    className="text-xs text-base-content/60 hover:text-base-content underline"
                    onClick={() => useAuthStore.getState().logout()}
                  >
                    ¿No es tu cuenta? Cerrar sesión
                  </button>
                </div>
              </div>
            ) : googleContinuationToken ? (
              /* Subcaso B: Viene con token de Google verificado */
              <div className="space-y-4 pt-2">
                <div className="p-3 bg-success/10 text-success-content rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <div>Tu cuenta de Google ha sido verificada. Haz clic abajo para confirmar tu ingreso.</div>
                </div>

                <button
                  type="button"
                  className="public-action"
                  style={{ width: '100%' }}
                  onClick={() => acceptWithGoogle()}
                  disabled={submitting}
                >
                  {submitting ? 'Confirmando...' : 'Confirmar y unirme con Google'}
                  <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              /* Subcaso C: Nuevo usuario local o Google */
              <div className="space-y-5 pt-1">
                {/* Opción Google */}
                <button
                  type="button"
                  onClick={startGoogleAcceptance}
                  disabled={submitting}
                  className="public-action public-google"
                  style={{ width: '100%' }}
                >
                  <img src="/media/landing/google-g.png" width={18} height={18} alt="" />
                  <span>Unirme con Google</span>
                </button>

                <div className="public-divider">
                  <span>o crea tu contraseña</span>
                </div>

                <form onSubmit={handleLocalSubmit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-base-content/70 mb-1">
                        Nombre <span className="text-error">*</span>
                      </label>
                      <ComerziaInput
                        placeholder="Tu nombre"
                        value={firstName}
                        onChange={e => setFirstName(e.target.value)}
                        disabled={submitting}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-base-content/70 mb-1">
                        Apellido Paterno <span className="text-error">*</span>
                      </label>
                      <ComerziaInput
                        placeholder="Apellido paterno"
                        value={paternalSurname}
                        onChange={e => setPaternalSurname(e.target.value)}
                        disabled={submitting}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-base-content/70 mb-1">
                      Apellido Materno (Opcional)
                    </label>
                    <ComerziaInput
                      placeholder="Apellido materno"
                      value={maternalSurname}
                      onChange={e => setMaternalSurname(e.target.value)}
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-base-content/70 mb-1">
                      Nombre de Usuario <span className="text-error">*</span>
                    </label>
                    <ComerziaInput
                      placeholder="usuario"
                      value={username}
                      onChange={e => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''))}
                      disabled={submitting}
                      required
                    />
                    <p className="text-[10px] text-base-content/50 mt-0.5">
                      Solo letras minúsculas, números, guiones y puntos.
                    </p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-base-content/70 mb-1">
                      Contraseña <span className="text-error">*</span>
                    </label>
                    <div className="relative">
                      <ComerziaInput
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Contraseña segura"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        disabled={submitting}
                        required
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-base-content/50 hover:text-base-content"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-base-content/70 mb-1">
                      Confirmar Contraseña <span className="text-error">*</span>
                    </label>
                    <ComerziaInput
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Repite la contraseña"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      disabled={submitting}
                      required
                    />
                  </div>

                  <PasswordChecklist passwordValue={password} showErrors={Boolean(formValidationErrors)} />

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="public-action"
                      style={{ width: '100%' }}
                      disabled={submitting}
                    >
                      {submitting ? 'Creando cuenta...' : 'Aceptar invitación y crear cuenta'}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </form>

                <div className="text-center pt-2">
                  <p className="text-xs text-base-content/60">
                    ¿Ya tienes una cuenta registrada?{' '}
                    <Link to="/login" className="text-primary font-semibold hover:underline">
                      Inicia sesión primero
                    </Link>{' '}
                    y luego abre este enlace.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AuthStage>
  );
};

