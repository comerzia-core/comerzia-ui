import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { submitBrowserCredentials, verifyMfaLogin, verifyMfaRecovery } from '../services/browserSessionService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../context/ToastContext';
import { AUTH_ERROR_CODES, type AuthErrorResponse } from '../types';
import { passwordFeedback } from '../utils/passwordPolicy';

type AuthStep = 'LOGIN' | 'CHANGE_PASSWORD' | 'MFA_CHALLENGE';

export function useLogin() {
    const navigate = useNavigate();
    const loginStore = useAuthStore(state => state.login);
    const sessionNotice = useAuthStore(state => state.sessionNotice);
    const authStatus = useAuthStore(state => state.status);
    const { info: toastInfo } = useToast();

    // Mostrar aviso de sesión (ej. revocación, cambio de permisos) mediante notificación toast
    useEffect(() => {
        if (sessionNotice) {
            toastInfo(sessionNotice);
            useAuthStore.setState({ sessionNotice: null });
        }
    }, [sessionNotice, toastInfo]);

    // --- ESTADOS DE FLUJO ---
    const [currentStep, setCurrentStep] = useState<AuthStep>(authStatus === 'mfa_pending' ? 'MFA_CHALLENGE' : 'LOGIN');
    const [mfaMode, setMfaMode] = useState<'TOTP' | 'RECOVERY'>('TOTP');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [shakeKey, setShakeKey] = useState(0);

    // --- ESTADOS DE FORMULARIO ---
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");

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
            const data = await submitBrowserCredentials('/auth/login', {
                username,
                password: currentPassword
            });

            if (data.mfaRequired || data.authenticationState === 'MFA_PENDING' || !data.token) {
                useAuthStore.getState().requireAdditionalAuthentication();
                setCurrentStep('MFA_CHALLENGE');
                setMfaMode('TOTP');
                setErrorMessage("");
                setTotpCode("");
                return;
            }

            // Si funciona a la primera, lo dejamos entrar
            await loginStore(data.token);
            if (!useAuthStore.getState().isSessionReady) { setErrorMessage('No pudimos cargar tu empresa. Inicia sesión nuevamente.'); return; }
            navigate('/app', { replace: true });

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
                    errCode === 'require_password_change';

                if (errCode === 'company_disabled') {
                    setErrorMessage('Tu empresa está deshabilitada. Contacta con soporte.');
                    setShakeKey(prev => prev + 1);
                } else if (isPasswordChangeRequired) {
                    setCurrentStep('CHANGE_PASSWORD');
                    setErrorMessage(""); // Limpiamos el mensaje de error para cambiar limpiamente de vista
                } else if (status === 429) {
                    setErrorMessage('Demasiados intentos. Espera un momento.');
                } else if (status === 503) {
                    setErrorMessage('Acceso temporalmente no disponible. Intenta en unos segundos.');
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
                    setErrorMessage("Revisa tus datos de acceso.");
                    setShakeKey(prev => prev + 1);
                } else {
                    // Para otros errores (ej. 500) usamos el mensaje del backend o uno genérico
                    setErrorMessage("No pudimos ingresar. Intenta nuevamente.");
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
        const isValid = !passwordFeedback(newPassword);

        if (!isValid) {
            setShakeKey(prev => prev + 1);
            return;
        }

        setIsLoading(true);
        try {
            const data = await submitBrowserCredentials('/auth/change-temporary-password', {
                username,
                currentPassword, // Se envía la contraseña actual ingresada en el Paso 1
                newPassword
            });

            if (data.mfaRequired || data.authenticationState === 'MFA_PENDING' || !data.token) {
                useAuthStore.getState().requireAdditionalAuthentication();
                setCurrentStep('MFA_CHALLENGE');
                setMfaMode('TOTP');
                setErrorMessage("");
                setTotpCode("");
                return;
            }

            // Si es exitoso (200 OK), el backend devuelve el JWT token y entra directamente
            await loginStore(data.token);
            if (!useAuthStore.getState().isSessionReady) { setErrorMessage('No pudimos cargar tu empresa. Inicia sesión nuevamente.'); return; }
            navigate('/app', { replace: true });

        } catch (error) {
            if (isAxiosError<AuthErrorResponse>(error) && error.response) {
                const { status, data } = error.response;
                if (data?.code === 'company_disabled') {
                    setErrorMessage('Tu empresa está deshabilitada. Contacta con soporte.');
                } else if (status === 429) {
                    setErrorMessage('Demasiados intentos. Espera un momento.');
                } else if (status === 503) {
                    setErrorMessage('Acceso temporalmente no disponible. Intenta en unos segundos.');
                } else if (status === 400) {
                    setErrorMessage("Revisa tus datos y la nueva contraseña.");
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
                    setErrorMessage("No pudimos cambiar la contraseña. Intenta nuevamente.");
                }
            } else {
                setErrorMessage("Error de red. Por favor, intente nuevamente.");
            }
            setShakeKey(prev => prev + 1);
        } finally {
            setIsLoading(false);
        }
    };

    // ==========================================
    // PASO 3: DESAFÍO MFA (TOTP / CÓDIGO DE RECUPERACIÓN)
    // ==========================================
    const handleMfaSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        if (mfaMode === 'TOTP') {
            const clean = totpCode.trim();
            if (!clean || clean.length !== 6) {
                setShakeKey(prev => prev + 1);
                setErrorMessage("Ingresa el código de 6 dígitos.");
                return;
            }
        } else {
            const clean = recoveryCode.trim();
            if (!clean || clean.length < 8) {
                setShakeKey(prev => prev + 1);
                setErrorMessage("Ingresa tu código de recuperación.");
                return;
            }
        }

        setIsLoading(true);
        try {
            const data = mfaMode === 'TOTP'
                ? await verifyMfaLogin(totpCode.trim())
                : await verifyMfaRecovery(recoveryCode.trim());

            if (!data.token) {
                setErrorMessage("No se pudo completar la verificación.");
                setShakeKey(prev => prev + 1);
                return;
            }

            await loginStore(data.token);
            if (!useAuthStore.getState().isSessionReady) {
                setErrorMessage('No pudimos cargar tu empresa. Inicia sesión nuevamente.');
                return;
            }
            navigate('/app', { replace: true });

        } catch (error) {
            if (isAxiosError<AuthErrorResponse>(error) && error.response) {
                const { status, data } = error.response;
                const errCode = (data?.code || '').toLowerCase();
                const errMsg = (data?.message || '').toLowerCase();

                if (errCode === 'totp_code_replayed' || errMsg.includes('replayed')) {
                    setErrorMessage("Este código ya fue utilizado. Espera el siguiente código en tu app.");
                } else if (errCode === 'invalid_totp_code' || errMsg.includes('totp')) {
                    setErrorMessage("Código incorrecto. Revisa tu aplicación Google Authenticator.");
                } else if (errCode === 'invalid_recovery_code' || errMsg.includes('recovery')) {
                    setErrorMessage("Código de recuperación inválido o ya utilizado.");
                } else if (status === 429) {
                    setErrorMessage("Demasiados intentos fallidos. Por seguridad, espera 5 minutos.");
                } else if (errCode === 'session_expired' || status === 401) {
                    setErrorMessage("El tiempo para verificar expiró. Inicia sesión nuevamente.");
                    setCurrentStep('LOGIN');
                } else if (status === 403) {
                    setErrorMessage("Acceso denegado o sesión modificada. Inicia sesión nuevamente.");
                    setCurrentStep('LOGIN');
                } else {
                    setErrorMessage("No pudimos verificar el código. Intenta nuevamente.");
                }
            } else {
                setErrorMessage("Error de conexión. Intenta nuevamente.");
            }
            setShakeKey(prev => prev + 1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelMfa = async () => {
        setIsLoading(true);
        try {
            await useAuthStore.getState().logout();
        } finally {
            setIsLoading(false);
            setCurrentStep('LOGIN');
            setErrorMessage("");
            setTotpCode("");
            setRecoveryCode("");
        }
    };

    return {
        currentStep, setCurrentStep,
        mfaMode, setMfaMode,
        isLoading, errorMessage, setErrorMessage, shakeKey,
        username, setUsername, currentPassword, setCurrentPassword, newPassword, setNewPassword,
        totpCode, setTotpCode, recoveryCode, setRecoveryCode,
        showPassword, setShowPassword, showErrorsInChecklist, setShowErrorsInChecklist,
        handleLoginSubmit, handleChangePasswordSubmit, handleMfaSubmit, handleCancelMfa
    };
}
