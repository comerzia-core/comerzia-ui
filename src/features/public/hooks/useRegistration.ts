import { useRef, useState, useMemo } from 'react';
import { isAxiosError } from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';
import { publicService } from '../services/publicService';
import { registerGoogle } from '../../auth/services/oidcService';
import type { PublicApiError, RegistrationForm } from '../types/public';
import { passwordFeedback } from '../../auth/utils/passwordPolicy';

const emptyForm: RegistrationForm = { firstName: '', paternalSurname: '', maternalSurname: '', email: '', username: '', password: '', commercialName: '', branchName: '' };

export function useRegistration() {
  const navigate = useNavigate();
  const location = useLocation();
  const googleRegistration = useMemo(() => {
    return (location.state as { googleRegistration?: { registrationToken: string; email?: string; name?: string } })?.googleRegistration;
  }, [location.state]);

  const isGoogle = Boolean(googleRegistration?.registrationToken);

  const initialForm = useMemo<RegistrationForm>(() => {
    if (!googleRegistration) return emptyForm;
    const nameParts = (googleRegistration.name || '').trim().split(/\s+/);
    const firstName = nameParts[0] || '';
    const paternalSurname = nameParts.slice(1).join(' ') || '';
    return {
      ...emptyForm,
      email: googleRegistration.email || '',
      firstName,
      paternalSurname
    };
  }, [googleRegistration]);

  const [form, setForm] = useState<RegistrationForm>(initialForm);
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationForm, string>>>({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inFlight = useRef(false);
  const requestKey = useRef(crypto.randomUUID());
  const change = (key: keyof RegistrationForm, value: string) => {
    setForm(current => ({ ...current, [key]: value }));
    setErrors(current => ({ ...current, [key]: undefined })); setNotice('');
  };
  function validate() {
    const nextErrors: Partial<Record<keyof RegistrationForm, string>> = {};
    if (step === 0) {
      if (!form.firstName.trim()) nextErrors.firstName = 'Escribe tu nombre.';
      if (!form.paternalSurname.trim() && !form.maternalSurname.trim()) nextErrors.paternalSurname = 'Escribe al menos un apellido.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) nextErrors.email = 'Revisa tu correo.';
    } else if (step === 1) {
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{2,39}$/.test(form.username.trim())) nextErrors.username = 'Usa de 3 a 40 letras, números, puntos, guiones o guiones bajos.';
      if (!isGoogle) {
        nextErrors.password = passwordFeedback(form.password);
      }
    } else {
      if (!form.commercialName.trim()) nextErrors.commercialName = 'Escribe el nombre de tu empresa.';
      if (!form.branchName.trim()) nextErrors.branchName = 'Escribe el nombre de tu tienda.';
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) { setShakeKey(value => value + 1); return false; }
    return true;
  }
  async function next() {
    if (inFlight.current || !validate()) return;
    if (step < 2) { setDirection('forward'); setStep(value => value + 1); return; }
    inFlight.current = true; setBusy(true); setNotice('');
    try {
      if (isGoogle && googleRegistration) {
        const payload = {
          registrationToken: googleRegistration.registrationToken,
          username: form.username.trim(),
          firstName: form.firstName.trim(),
          paternalSurname: form.paternalSurname.trim() || undefined,
          maternalSurname: form.maternalSurname.trim() || undefined,
          commercialName: form.commercialName.trim(),
          branchName: form.branchName.trim(),
          requestKey: requestKey.current
        };
        const response = await registerGoogle(payload);
        setForm(emptyForm);
        if (response.token) {
          await useAuthStore.getState().login(response.token);
          if (!useAuthStore.getState().isSessionReady) { navigate('/login', { replace: true }); return; }
          navigate('/app', { replace: true });
        } else {
          navigate('/login', { replace: true });
        }
      } else {
        const payload = { ...form, email: form.email.trim(), username: form.username.trim(), firstName: form.firstName.trim(),
          commercialName: form.commercialName.trim(), branchName: form.branchName.trim() };
        const response = await publicService.register(payload, requestKey.current);
        setForm(emptyForm);
        await useAuthStore.getState().login(response.token);
        if (!useAuthStore.getState().isSessionReady) { navigate('/login', { replace: true }); return; }
        navigate('/app', { replace: true });
      }
    } catch (error) {
      const code = isAxiosError<PublicApiError>(error) ? error.response?.data.code : undefined;
      if (code === 'username_unavailable') { setDirection('back'); setErrors({ username: 'Este usuario ya está reservado.' }); setStep(1); }
      else if (code === 'email_unavailable' || code === 'email_required') { setDirection('back'); setErrors({ email: code === 'email_required' ? 'Revisa tu correo.' : 'Este correo ya está registrado.' }); setStep(0); }
      else if (code === 'account_link_required') setNotice('Ya existe una cuenta con este correo. Inicia sesión con contraseña y vincula Google desde Perfil > Seguridad.');
      else if (code === 'external_identity_conflict') setNotice('Esta cuenta de Google ya está vinculada a otro usuario.');
      else if (code === 'registration_token_invalid') setNotice('La sesión de registro con Google ha expirado. Por favor, inicia nuevamente.');
      else if (code === 'registration_already_completed' || code === 'registration_conflict') setNotice('La cuenta puede estar creada. Intenta iniciar sesión o revisa usuario y correo.');
      else if (code === 'registration_rate_limited' || code === 'registration_busy' || code === 'authentication_rate_limited') setNotice('Espera un momento y vuelve a intentar.');
      else if (code === 'authentication_temporarily_unavailable') setNotice('Registro temporalmente no disponible. Intenta en unos segundos.');
      else if (code === 'registration_unavailable') setNotice('El registro no está disponible ahora. Intenta más tarde.');
      else if (isAxiosError(error) && !error.response) setNotice('No pudimos confirmar el registro. Reintenta con los mismos datos o inicia sesión.');
      else setNotice('No se pudo crear la cuenta. Revisa los datos e intenta nuevamente.');
      setShakeKey(value => value + 1);
    } finally { inFlight.current = false; setBusy(false); }
  }
  return { form, step, direction, errors, notice, busy, shakeKey, change, next, isGoogle, googleRegistration, back: () => { if (!busy) { setDirection('back'); setStep(value => Math.max(0, value - 1)); setNotice(''); } } };
}
