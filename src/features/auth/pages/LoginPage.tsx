import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { AlertTriangle, Eye, EyeOff, Lock } from "lucide-react";
import api from "../../../lib/axios";
import { useAuthStore } from "../../../stores/useAuthStore";
import { PasswordChecklist } from "../components/PasswordChecklist";
import { AUTH_ERROR_CODES, type AuthErrorResponse } from "../types";

// Asumimos que tienes tu componente de input y botón. 
// Sustituye por tus importaciones reales de src/components/ui/
import { ComerziaInput } from "../../../components/ui/ComerziaInput"; 
import { BtnLogin } from "../../../components/ui/CrudButtons";

type AuthStep = 'LOGIN' | 'CHANGE_PASSWORD';

export const LoginPage = () => {
    const navigate = useNavigate();
    const loginStore = useAuthStore(state => state.login);

    // --- ESTADOS DE FLUJO ---
    const [currentStep, setCurrentStep] = useState<AuthStep>('LOGIN');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [shakeKey, setShakeKey] = useState(0);

    // --- ESTADOS DE FORMULARIO ---
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    
    // --- ESTADOS DE UI ---
    const [showPassword, setShowPassword] = useState(false);
    const [showErrorsInChecklist, setShowErrorsInChecklist] = useState(false);

    // ==========================================
    // PASO 1: LOGIN NORMAL
    // ==========================================
    const handleLoginSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (!username || !currentPassword) {
            setShakeKey(prev => prev + 1);
            setErrorMessage("Por favor, complete todos los campos.");
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/login', { 
                username, 
                password: currentPassword 
            });
            
            // Si funciona a la primera, lo dejamos entrar
            await loginStore(data.token);
            navigate('/dashboard', { replace: true });

        } catch (error) {
            if (isAxiosError<AuthErrorResponse>(error) && error.response) {
                const { status, data } = error.response;
                const errCode = (data?.code || '').toLowerCase();
                const errMsg = (data?.message || '').toLowerCase();
                
                // HTTP 428: Precondition Required (password_change_required)
                const isPasswordChangeRequired = 
                    status === 428 || 
                    errCode === AUTH_ERROR_CODES.PASSWORD_CHANGE_REQUIRED ||
                    errCode === AUTH_ERROR_CODES.REQUIRES_PASSWORD_CHANGE ||
                    errMsg.includes('temporary password');

                if (isPasswordChangeRequired) {
                    setCurrentStep('CHANGE_PASSWORD');
                    setErrorMessage(""); // Limpiamos el mensaje de error para cambiar limpiamente de vista
                } else if (status === 401) {
                    // HTTP 401: Unauthorized - Credenciales incorrectas
                    setErrorMessage("Usuario o contraseña incorrectos.");
                    setShakeKey(prev => prev + 1);
                } else if (status === 403) {
                    // HTTP 403: Forbidden - Cuenta deshabilitada (account_disabled) vs Cuenta bloqueada (account_locked)
                    if (
                        errCode === AUTH_ERROR_CODES.ACCOUNT_DISABLED || 
                        errCode === AUTH_ERROR_CODES.USER_DISABLED || 
                        errMsg.includes('disabled') || 
                        errMsg.includes('deshabilitad')
                    ) {
                        setErrorMessage("Cuenta deshabilitada. Contacte con la administración.");
                    } else if (
                        errCode === AUTH_ERROR_CODES.ACCOUNT_LOCKED || 
                        errMsg.includes('locked') || 
                        errMsg.includes('bloquead') || 
                        errMsg.includes('attempts')
                    ) {
                        setErrorMessage("Cuenta bloqueada. Contacte con la administración.");
                    } else {
                        setErrorMessage("Acceso denegado. No tiene permisos suficientes para ingresar.");
                    }
                    setShakeKey(prev => prev + 1);
                } else if (status === 400) {
                    setErrorMessage(data?.message || "Usuario o contraseña incorrectos.");
                    setShakeKey(prev => prev + 1);
                } else {
                    // Para otros errores (ej. 500) usamos el mensaje del backend o uno genérico
                    setErrorMessage(data?.message || "Error al intentar iniciar sesión.");
                    setShakeKey(prev => prev + 1);
                }
            } else {
                setErrorMessage("Error de red. Por favor, intente nuevamente.");
                setShakeKey(prev => prev + 1);
            }
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // PASO 2: CAMBIO DE CONTRASEÑA OBLIGATORIO
    // ==========================================
    const handleChangePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setShowErrorsInChecklist(true);
        setErrorMessage("");

        // Validaciones Manuales de la Expresión Regular
        const isValid = 
            newPassword.length >= 8 && newPassword.length <= 64 &&
            /[A-Z]/.test(newPassword) && 
            /[a-z]/.test(newPassword) && 
            /\d/.test(newPassword);

        if (!isValid) {
            setShakeKey(prev => prev + 1);
            return;
        }

        setIsLoading(true);
        try {
            const { data } = await api.post('/auth/change-temporary-password', {
                username,
                currentPassword, // Se envía la contraseña actual ingresada en el Paso 1
                newPassword
            });

            // Si es exitoso (200 OK), el backend devuelve el JWT token y entra directamente
            await loginStore(data.token);
            navigate('/dashboard', { replace: true });

        } catch (error) {
            if (isAxiosError<AuthErrorResponse>(error) && error.response) {
                const { status, data } = error.response;
                if (status === 400) {
                    setErrorMessage(data?.message || "Credenciales incorrectas o la cuenta no requiere cambio de contraseña.");
                } else if (status === 401) {
                    if (data?.code === AUTH_ERROR_CODES.USER_DISABLED || data?.message?.toLowerCase().includes('disabled')) {
                        setErrorMessage("Cuenta deshabilitada. Contacte con la administración.");
                    } else {
                        setErrorMessage("Credenciales incorrectas.");
                    }
                } else if (status === 403) {
                    setErrorMessage("Acceso denegado. No tiene permisos suficientes.");
                } else if (status === 404) {
                    setErrorMessage("Usuario no encontrado.");
                } else {
                    setErrorMessage(data?.message || "Error al cambiar la contraseña. Por favor, intente nuevamente.");
                }
            } else {
                setErrorMessage("Error de red. Por favor, intente nuevamente.");
            }
            setShakeKey(prev => prev + 1);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
            <div className="card w-full max-w-md bg-base-100 shadow-xl border border-base-300">
                <div className="card-body">
                    
                    {/* LOGO AREA */}
                    <div className="text-center mb-6">
                        <div className="w-16 h-16 bg-primary text-primary-content rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg">
                            <Lock size={32} />
                        </div>
                        <h2 className="text-2xl font-black">Comerzia ERP</h2>
                        <p className="text-base-content/60 text-sm">
                            {currentStep === 'LOGIN' 
                                ? "Inicia sesión en tu cuenta" 
                                : "Actualiza tu contraseña temporal"}
                        </p>
                    </div>

                    {/* ALERTA DE ERROR GENERAL */}
                    {errorMessage && (
                        <div className="alert alert-error text-sm rounded-xl py-3 animate-shake mb-4">
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    {/* --- RENDERIZADO DEL PASO 1: LOGIN --- */}
                    {currentStep === 'LOGIN' && (
                        <form onSubmit={handleLoginSubmit} className="space-y-4">
                            <ComerziaInput
                                label="Usuario"
                                type="text"
                                icon="user" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                shakeKey={shakeKey}
                                isRequired
                                disabled={isLoading}
                            />

                            <div className="relative">
                                <ComerziaInput
                                    label="Contraseña"
                                    type={showPassword ? "text" : "password"}
                                    icon="key"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    shakeKey={shakeKey}
                                    isRequired
                                    disabled={isLoading}
                                />
                                {/* BOTÓN DE OJO (Posicionado absolutamente sobre el input) */}
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-10 text-base-content/50 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

                            <BtnLogin 
                                type="submit" 
                                label="Iniciar Sesión" 
                                className={`btn btn-primary w-full mt-6 ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading}
                                
                            />
                        </form>
                    )}

                    {/* --- RENDERIZADO DEL PASO 2: CHANGE PASSWORD --- */}
                    {currentStep === 'CHANGE_PASSWORD' && (
                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4 animate-fade-in">
                            <div className="alert bg-warning/10 border border-warning/30 text-base-content rounded-xl py-3 mb-4 flex items-start shadow-sm">
                                <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
                                <span className="text-sm font-medium leading-snug">
                                    Por su seguridad, debe cambiar la contraseña por defecto antes de continuar.
                                </span>
                            </div>

                            <div className="relative">
                                <ComerziaInput
                                    label="Nueva Contraseña"
                                    type={showPassword ? "text" : "password"}
                                    icon="shield-check"
                                    value={newPassword}
                                    onChange={(e) => {
                                        setNewPassword(e.target.value);
                                        setShowErrorsInChecklist(false); // Resetea el rojo al escribir
                                    }}
                                    shakeKey={shakeKey}
                                    isRequired
                                    disabled={isLoading}
                                />
                                <button 
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-10 text-base-content/50 hover:text-primary transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>

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