import { useEffect } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Eye, EyeOff, Lock, User, Key, ShieldCheck, KeyRound } from "lucide-react";
import { PasswordChecklist } from "../components/PasswordChecklist";
import { GoogleSignInButton } from "../components/GoogleSignInButton";
import { useLogin } from "../hooks/useLogin";
import { usePlatformConfig } from "../../../hooks/usePlatformConfig";

import { ComerziaInput } from "../../../components/ui/ComerziaInput";
import { BtnLogin } from "../../../components/ui/CrudButtons";

export const PrivateLoginPage = () => {
    const { data: platformConfig } = usePlatformConfig();
    const login = useLogin();

    const {
        currentStep, setCurrentStep, mfaMode, setMfaMode, isLoading, errorMessage, setErrorMessage, shakeKey,
        username, setUsername, currentPassword, setCurrentPassword, newPassword, setNewPassword,
        totpCode, setTotpCode, recoveryCode, setRecoveryCode,
        showPassword, setShowPassword, showErrorsInChecklist, setShowErrorsInChecklist,
        handleLoginSubmit, handleChangePasswordSubmit, handleMfaSubmit, handleCancelMfa
    } = login;

    const brandName = platformConfig?.brandName || "Comerzia ERP";

    useEffect(() => {
        document.title =
            currentStep === 'MFA_CHALLENGE' ? `Verificación de dos pasos | ${brandName}` :
            currentStep === 'CHANGE_PASSWORD' ? `Actualiza tu contraseña | ${brandName}` :
            `Acceso Corporativo | ${brandName}`;
    }, [currentStep, brandName]);

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                    {/* LOGO AREA */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary text-primary-content rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                            {currentStep === 'MFA_CHALLENGE' ? <ShieldCheck size={32} /> : <Lock size={32} />}
                        </div>
                        <h2 className="text-2xl font-black">{brandName}</h2>
                        <p className="text-base-content/60 text-sm">
                            {currentStep === 'LOGIN' && "Inicia sesión en tu cuenta"}
                            {currentStep === 'MFA_CHALLENGE' && "Verificación de dos pasos"}
                            {currentStep === 'CHANGE_PASSWORD' && "Actualiza tu contraseña temporal"}
                        </p>
                    </div>

                    {/* ALERTA DE ERROR GENERAL */}
                    {errorMessage && (
                        <div className="alert alert-error text-sm rounded-xl py-3 animate-shake mb-4" role="alert">
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* ==================================================== */}
                    {/* PASO 1: LOGIN NORMAL                                 */}
                    {/* ==================================================== */}
                    {currentStep === 'LOGIN' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <ComerziaInput
                                id="login-username"
                                aria-label="Usuario o correo"
                                name="username"
                                label="Usuario o correo"
                                type="text"
                                icon={<User size={18} />}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                shakeKey={shakeKey}
                                isRequired
                                disabled={isLoading}
                                autoComplete="username"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                            />

                            <ComerziaInput
                                id="login-password"
                                aria-label="Contraseña"
                                name="password"
                                label="Contraseña"
                                type={showPassword ? "text" : "password"}
                                icon={<Key size={18} />}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                shakeKey={shakeKey}
                                isRequired
                                disabled={isLoading}
                                autoComplete="current-password"
                                rightAction={
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-base-content/50 hover:text-primary transition-colors p-1"
                                        title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />

                            {/* Enlace para recuperar contraseña */}
                            <div className="flex justify-end pt-1">
                                <Link
                                    to="/password-reset"
                                    className="text-xs text-primary hover:underline font-medium focus:outline-hidden"
                                >
                                    ¿Olvidaste tu contraseña?
                                </Link>
                            </div>

                            <BtnLogin
                                type="submit"
                                label="Iniciar Sesión"
                                className={`btn btn-primary w-full mt-4 ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                            />

                            {/* Separador e inicio de sesión con Google */}
                            <div className="divider my-4 text-xs text-base-content/50">o continúa con</div>

                            <GoogleSignInButton label="Iniciar sesión con Google" variant="daisy" />
                        </form>
                    )}

                    {/* ==================================================== */}
                    {/* PASO 2: VERIFICACIÓN DE DOS PASOS (MFA / TOTP)        */}
                    {/* ==================================================== */}
                    {currentStep === 'MFA_CHALLENGE' && (
                        <form onSubmit={handleMfaSubmit} className="space-y-4 animate-fade-in">
                            <div className="alert bg-primary/10 border border-primary/20 text-base-content rounded-xl py-3 mb-2 flex items-start shadow-xs">
                                <ShieldCheck size={18} className="text-primary shrink-0 mt-0.5" />
                                <span className="text-xs sm:text-sm leading-snug">
                                    {mfaMode === 'TOTP'
                                        ? "Introduce el código de 6 dígitos generado por tu aplicación autenticadora."
                                        : "Introduce uno de tus códigos de recuperación de 10 caracteres."}
                                </span>
                            </div>

                            {mfaMode === 'TOTP' ? (
                                <ComerziaInput
                                    id="private-mfa-totp"
                                    name="totpCode"
                                    label="Código de seguridad (6 dígitos)"
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={6}
                                    icon={<ShieldCheck size={18} />}
                                    value={totpCode}
                                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    placeholder="000000"
                                    shakeKey={shakeKey}
                                    isRequired
                                    disabled={isLoading}
                                    autoFocus
                                    autoComplete="one-time-code"
                                />
                            ) : (
                                <ComerziaInput
                                    id="private-mfa-recovery"
                                    name="recoveryCode"
                                    label="Código de respaldo"
                                    type="text"
                                    maxLength={16}
                                    icon={<KeyRound size={18} />}
                                    value={recoveryCode}
                                    onChange={(e) => setRecoveryCode(e.target.value.toUpperCase())}
                                    placeholder="ABCD-1234"
                                    shakeKey={shakeKey}
                                    isRequired
                                    disabled={isLoading}
                                    autoFocus
                                />
                            )}

                            {/* Alternar entre TOTP y Código de Respaldo */}
                            <div className="text-center pt-1">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMfaMode(mfaMode === 'TOTP' ? 'RECOVERY' : 'TOTP');
                                        setErrorMessage("");
                                    }}
                                    className="text-xs text-primary hover:underline font-medium focus:outline-hidden"
                                >
                                    {mfaMode === 'TOTP'
                                        ? "¿No tienes tu teléfono? Usa un código de respaldo"
                                        : "Volver a usar código de la aplicación"}
                                </button>
                            </div>

                            <div className="flex gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={handleCancelMfa}
                                    className="btn btn-ghost flex-1"
                                    disabled={isLoading}
                                >
                                    Volver
                                </button>

                                <BtnLogin
                                    type="submit"
                                    label="Verificar Código"
                                    className={`btn btn-primary flex-1 ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                />
                            </div>
                        </form>
                    )}

                    {/* ==================================================== */}
                    {/* PASO 3: CAMBIO DE CONTRASEÑA OBLIGATORIO             */}
                    {/* ==================================================== */}
                    {currentStep === 'CHANGE_PASSWORD' && (
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 animate-fade-in">
                            <div className="alert bg-warning/10 border border-warning/30 text-base-content rounded-xl py-3 mb-4 flex items-start shadow-xs">
                                <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                                <span className="text-sm font-medium leading-snug">
                                    Por su seguridad, debe cambiar la contraseña por defecto antes de continuar.
                                </span>
                            </div>

                            <ComerziaInput
                                id="new-password"
                                name="newPassword"
                                label="Nueva Contraseña"
                                type={showPassword ? "text" : "password"}
                                icon={<Lock size={18} />}
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setShowErrorsInChecklist(false);
                                }}
                                shakeKey={shakeKey}
                                isRequired
                                disabled={isLoading}
                                autoComplete="new-password"
                                autoCapitalize="none"
                                autoCorrect="off"
                                spellCheck={false}
                                rightAction={
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="text-base-content/50 hover:text-primary transition-colors p-1"
                                        title={showPassword ? "Ocultar contraseña" : "Ver contraseña"}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                }
                            />

                            <PasswordChecklist
                                passwordValue={newPassword}
                                showErrors={showErrorsInChecklist}
                            />

                            <div className="flex gap-2 mt-6">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setCurrentStep('LOGIN');
                                        setErrorMessage("");
                                        setNewPassword("");
                                        setShowErrorsInChecklist(false);
                                    }}
                                    className="btn btn-ghost flex-1"
                                    disabled={isLoading}
                                >
                                    Cancelar
                                </button>

                                <BtnLogin
                                    type="submit"
                                    label="Actualizar e Iniciar Sesión"
                                    className={`btn btn-primary flex-1 ${isLoading ? 'loading' : ''}`}
                                    disabled={isLoading}
                                />
                            </div>
                        </form>
                    )}

                </div>
            </div>
        </div>
    );
};

