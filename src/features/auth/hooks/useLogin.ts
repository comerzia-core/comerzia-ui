import { isValidTotpCode, isValidRecoveryCode } from '../../security/utils/mfaInput';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
    submitBrowserCredentials,
    verifyMfaLogin,
    verifyMfaRecovery,
    consumeEmergencyMfaAuthorization,
    startPendingMfaEnrollment,
    confirmPendingMfaEnrollment,
    cancelPendingMfaEnrollment
} from '../services/browserSessionService';
import type { TotpEnrollmentStartResponse } from '../../security/types/mfa';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../context/ToastContext';
import { AUTH_ERROR_CODES, type AuthErrorResponse } from '../types';
import { passwordFeedback } from '../utils/passwordPolicy';

export type AuthStep = 'LOGIN' | 'CHANGE_PASSWORD' | 'MFA_CHALLENGE' | 'MFA_ENROLLMENT';
export type EnrollmentSubStep = 'SETUP' | 'RECOVERY_CODES';

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
    const [mfaMode, setMfaMode] = useState<'TOTP' | 'RECOVERY' | 'EMERGENCY'>('TOTP');
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [shakeKey, setShakeKey] = useState(0);

    // --- ESTADOS DE FORMULARIO ---
    const [username, setUsername] = useState("");
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [totpCode, setTotpCode] = useState("");
    const [recoveryCode, setRecoveryCode] = useState("");

    // --- ESTADOS DE ENROLAMIENTO PENDIENTE ---
    const [enrollmentSubStep, setEnrollmentSubStep] = useState<EnrollmentSubStep>('SETUP');
    const [enrollmentData, setEnrollmentData] = useState<TotpEnrollmentStartResponse | null>(null);
    const [enrollmentCode, setEnrollmentCode] = useState("");
    const [enrollmentRecoveryCodes, setEnrollmentRecoveryCodes] = useState<string[]>([]);
    const [pendingAuthToken, setPendingAuthToken] = useState<string | null>(null);
    const [copiedKey, setCopiedKey] = useState(false);
    const [copiedCodes, setCopiedCodes] = useState(false);

    // --- ESTADOS DE UI ---
    const [showPassword, setShowPassword] = useState(false);
    const [showErrorsInChecklist, setShowErrorsInChecklist] = useState(false);

    const loadPendingEnrollment = () => {
        setIsLoading(true);
        startPendingMfaEnrollment()
            .then(data => {
                setEnrollmentData(data);
                setIsLoading(false);
            })
            .catch(err => {
                setIsLoading(false);
                const msg = err?.response?.data?.message || 'Error al iniciar la configuración de MFA.';
                setErrorMessage(msg);
            });
    };

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

            if (data.mfaRequired || data.authenticationState === 'MFA_PENDING' || data.authenticationState === 'MFA_ENROLLMENT_REQUIRED' || !data.token) {
                useAuthStore.getState().requireAdditionalAuthentication();

                if (data.authenticationState === 'MFA_ENROLLMENT_REQUIRED' || data.mfaType === 'ENROLLMENT_REQUIRED') {
                    setCurrentStep('MFA_ENROLLMENT');
                    setEnrollmentSubStep('SETUP');
                    setEnrollmentData(null);
                    setErrorMessage("");
                    setEnrollmentCode("");
                    loadPendingEnrollment();
                    return;
                }

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
                    setErrorMessage("");
                } else if (status === 429) {
                    setErrorMessage('Demasiados intentos. Espera un momento.');
                } else if (status === 503) {
                    setErrorMessage('Acceso temporalmente no disponible. Intenta en unos segundos.');
                } else if (status === 401) {
                    setErrorMessage("Usuario o contraseña incorrectos.");
                    setShakeKey(prev => prev + 1);
                } else if (status === 403) {
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

        const isValid = !passwordFeedback(newPassword);

        if (!isValid) {
            setShakeKey(prev => prev + 1);
            return;
        }

        setIsLoading(true);
        try {
            const data = await submitBrowserCredentials('/auth/change-temporary-password', {
                username,
                currentPassword,
                newPassword
            });

            if (data.mfaRequired || data.authenticationState === 'MFA_PENDING' || data.authenticationState === 'MFA_ENROLLMENT_REQUIRED' || !data.token) {
                useAuthStore.getState().requireAdditionalAuthentication();

                if (data.authenticationState === 'MFA_ENROLLMENT_REQUIRED' || data.mfaType === 'ENROLLMENT_REQUIRED') {
                    setCurrentStep('MFA_ENROLLMENT');
                    setEnrollmentSubStep('SETUP');
                    setEnrollmentData(null);
                    setErrorMessage("");
                    setEnrollmentCode("");
                    loadPendingEnrollment();
                    return;
                }

                setCurrentStep('MFA_CHALLENGE');
                setMfaMode('TOTP');
                setErrorMessage("");
                setTotpCode("");
                return;
            }

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
            if (!isValidTotpCode(clean)) {
                setShakeKey(prev => prev + 1);
                setErrorMessage("Ingresa el código de 6 dígitos.");
                return;
            }
        } else {
            const clean = recoveryCode.trim();
            if (mfaMode === 'EMERGENCY' ? !/^[a-f0-9]{64}$/.test(clean) : !isValidRecoveryCode(clean)) {
                setShakeKey(prev => prev + 1);
                setErrorMessage("Ingresa tu código de recuperación.");
                return;
            }
        }

        setIsLoading(true);
        try {
            const data = mfaMode === 'TOTP'
                ? await verifyMfaLogin(totpCode.trim())
                : mfaMode === 'EMERGENCY' ? await consumeEmergencyMfaAuthorization(recoveryCode.trim())
                : await verifyMfaRecovery(recoveryCode.trim());

            // Bloque 08-D / R5-08: Si el resultado es RECOVERY_RESTRICTED, se exige re-enrolar
            if (data.authenticationState === 'RECOVERY_RESTRICTED' || data.mfaType === 'RECOVERY_RESTRICTED') {
                setRecoveryCode('');
                setCurrentStep('MFA_ENROLLMENT');
                setEnrollmentSubStep('SETUP');
                setEnrollmentData(null);
                setErrorMessage("Código de respaldo validado. Por seguridad tu factor anterior fue revocado. Debes vincular un nuevo dispositivo autenticador.");
                loadPendingEnrollment();
                return;
            }

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

    // ==========================================
    // PASO 4: ENROLAMIENTO OBLIGATORIO / RE-ENROLAMIENTO
    // ==========================================
    const handleConfirmEnrollment = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMessage("");

        const clean = enrollmentCode.trim();
        if (!isValidTotpCode(clean)) {
            setShakeKey(prev => prev + 1);
            setErrorMessage("Ingresa el código de 6 dígitos generado por tu app.");
            return;
        }

        setIsLoading(true);
        try {
            const data = await confirmPendingMfaEnrollment(clean);
            if (data.token) {
                setPendingAuthToken(data.token);
            }
            if (data.recoveryCodes && data.recoveryCodes.length > 0) {
                setEnrollmentRecoveryCodes(data.recoveryCodes);
                setEnrollmentSubStep('RECOVERY_CODES');
                setErrorMessage("");
            } else if (data.token) {
                // Si no hay códigos devueltos directamente, ingresar
                await loginStore(data.token);
                navigate('/app', { replace: true });
            }
        } catch (error) {
            if (isAxiosError<AuthErrorResponse>(error) && error.response) {
                const { status, data } = error.response;
                const errCode = (data?.code || '').toLowerCase();
                const errMsg = (data?.message || '').toLowerCase();

                if (errCode === 'totp_code_replayed' || errMsg.includes('replayed')) {
                    setErrorMessage("Este código ya fue utilizado. Espera el siguiente código.");
                } else if (errCode === 'invalid_totp_code' || errMsg.includes('totp')) {
                    setErrorMessage("Código incorrecto. Revisa tu aplicación Google Authenticator.");
                } else if (status === 429) {
                    setErrorMessage("Demasiados intentos fallidos. Espera unos momentos.");
                } else {
                    setErrorMessage("No se pudo verificar el código de confirmación.");
                }
            } else {
                setErrorMessage("Error de conexión durante el enrolamiento.");
            }
            setShakeKey(prev => prev + 1);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinishEnrollment = async () => {
        if (!pendingAuthToken) {
            setCurrentStep('LOGIN');
            return;
        }
        setIsLoading(true);
        try {
            await loginStore(pendingAuthToken);
            navigate('/app', { replace: true });
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelEnrollment = async () => {
        setIsLoading(true);
        try {
            await cancelPendingMfaEnrollment().catch(() => {});
            await useAuthStore.getState().logout().catch(() => {});
        } finally {
            setIsLoading(false);
            setCurrentStep('LOGIN');
            setEnrollmentSubStep('SETUP');
            setEnrollmentData(null);
            setEnrollmentCode("");
            setEnrollmentRecoveryCodes([]);
            setPendingAuthToken(null);
            setErrorMessage("");
        }
    };

    const handleCopyKey = () => {
        if (!enrollmentData?.secret) return;
        navigator.clipboard.writeText(enrollmentData.secret).then(() => {
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        });
    };

    const handleCopyCodes = () => {
        if (enrollmentRecoveryCodes.length === 0) return;
        navigator.clipboard.writeText(enrollmentRecoveryCodes.join('\n')).then(() => {
            setCopiedCodes(true);
            setTimeout(() => setCopiedCodes(false), 2000);
        });
    };

    const handleDownloadCodes = () => {
        if (enrollmentRecoveryCodes.length === 0) return;
        const text = `CÓDIGOS DE RESPALDO DE COMERZIA\nGenerados: ${new Date().toISOString()}\n\n` +
            enrollmentRecoveryCodes.map((c, i) => `${i + 1}. ${c}`).join('\n') +
            '\n\nGuarda estos códigos en un lugar seguro. Cada código solo puede usarse una vez.';
        const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `comerzia-backup-codes-${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return {
        currentStep, setCurrentStep,
        mfaMode, setMfaMode,
        isLoading, errorMessage, setErrorMessage, shakeKey,
        username, setUsername, currentPassword, setCurrentPassword, newPassword, setNewPassword,
        totpCode, setTotpCode, recoveryCode, setRecoveryCode,
        showPassword, setShowPassword, showErrorsInChecklist, setShowErrorsInChecklist,
        // Enrollment state & actions
        enrollmentSubStep, setEnrollmentSubStep,
        enrollmentData, enrollmentCode, setEnrollmentCode,
        enrollmentRecoveryCodes, copiedKey, copiedCodes,
        handleLoginSubmit, handleChangePasswordSubmit, handleMfaSubmit, handleCancelMfa,
        handleConfirmEnrollment, handleFinishEnrollment, handleCancelEnrollment,
        handleCopyKey, handleCopyCodes, handleDownloadCodes
    };
}
