import React, { useEffect, useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  KeyRound, 
  Eye, 
  EyeOff, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Lock,
  Sparkles
} from 'lucide-react';
import { profileService } from '../services/profileService';
import { uploadFile } from '../../shared/services/storageService';
import { STORAGE_FOLDERS } from '../../../config/storage';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { useToast } from '../../../context/ToastContext';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSingleImageUploader, type SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { 
  type MyProfileResponse, 
  type UpdateMyProfileRequest, 
  type ChangeMyPasswordRequest,
  PROFILE_ERROR_CODES 
} from '../types/profile';

export const ProfilePage = () => {
  const { addToast } = useToast();

  // Diccionarios del sistema
  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([
    DICTIONARIES.DOCUMENT_TYPE,
    DICTIONARIES.DOCUMENT_EXTENSION
  ]);

  // Estados de carga y navegación de pestañas
  const [activeTab, setActiveTab] = useState<'personal' | 'security'>('personal');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSavingProfile, setIsSavingProfile] = useState<boolean>(false);
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false);

  // Perfil original cargado desde el backend
  const [profile, setProfile] = useState<MyProfileResponse | null>(null);

  // Estado del Avatar
  const [avatarValue, setAvatarValue] = useState<SingleImageValue | null>(null);

  // Formulario de Información Personal
  const [personalForm, setPersonalForm] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    email: '',
    phoneNumber: '',
    documentType: '' as string | number,
    documentNumber: '',
    documentExtension: '' as string | number,
    address: ''
  });
  const [personalErrors, setPersonalErrors] = useState<Record<string, string>>({});
  const [personalShakeKey, setPersonalShakeKey] = useState<number>(0);

  // Formulario de Contraseña
  const [passwordForm, setPasswordForm] = useState<ChangeMyPasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>({});
  const [passwordShakeKey, setPasswordShakeKey] = useState<number>(0);

  // Visibilidad de contraseñas
  const [showCurrentPassword, setShowCurrentPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  // Carga inicial del perfil
  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await profileService.getMyProfile();
      setProfile(data);

      // Sincronizar avatar
      setAvatarValue(data.imageUrl ? { preview: data.imageUrl } : null);

      // Sincronizar formulario personal
      setPersonalForm({
        firstName: data.firstName || '',
        paternalSurname: data.paternalSurname || '',
        maternalSurname: data.maternalSurname || '',
        email: data.email || '',
        phoneNumber: data.phoneNumber || '',
        documentType: data.documentType?.code ? String(data.documentType.code) : '',
        documentNumber: data.documentNumber || '',
        documentExtension: data.documentExtension?.code ? String(data.documentExtension.code) : '',
        address: data.address || ''
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      const axiosError = error as { response?: { status?: number } };
      if (axiosError.response?.status === 404) {
        addToast('Perfil no encontrado.', 'error');
      } else if (axiosError.response?.status === 403) {
        addToast('Sin permisos para ver el perfil.', 'error');
      } else {
        addToast('Error al cargar el perfil.', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Manejador numérico
  const handleNumericInput = (val: string, maxLength: number) => {
    return val.replace(/\D/g, '').slice(0, maxLength);
  };

  // Validación del formulario personal
  const validatePersonalForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!personalForm.firstName.trim()) {
      errors.firstName = 'El nombre es obligatorio';
    } else if (personalForm.firstName.length > 100) {
      errors.firstName = 'El nombre no debe superar los 100 caracteres';
    }

    if (personalForm.paternalSurname && personalForm.paternalSurname.length > 45) {
      errors.paternalSurname = 'El apellido no debe superar 45 caracteres';
    }

    if (personalForm.maternalSurname && personalForm.maternalSurname.length > 45) {
      errors.maternalSurname = 'El apellido no debe superar 45 caracteres';
    }

    if (personalForm.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(personalForm.email)) {
        errors.email = 'El formato de correo no es válido';
      } else if (personalForm.email.length > 100) {
        errors.email = 'El correo no debe superar 100 caracteres';
      }
    }

    if (personalForm.phoneNumber && personalForm.phoneNumber.length > 15) {
      errors.phoneNumber = 'El teléfono no debe superar 15 dígitos';
    }

    if (personalForm.documentNumber && personalForm.documentNumber.length > 20) {
      errors.documentNumber = 'El documento no debe superar 20 caracteres';
    }

    if (personalForm.address && personalForm.address.length > 50) {
      errors.address = 'La dirección no debe superar 50 caracteres';
    }

    setPersonalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar Cambios de Información Personal
  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePersonalForm()) {
      setPersonalShakeKey(prev => prev + 1);
      return;
    }

    try {
      setIsSavingProfile(true);

      // 1. Gestionar subida de foto si se seleccionó un nuevo archivo
      let finalImageUrl: string | null = profile?.imageUrl || null;

      if (avatarValue?.file) {
        finalImageUrl = await uploadFile(avatarValue.file, STORAGE_FOLDERS.PROFILES);
      } else if (!avatarValue) {
        finalImageUrl = null;
      }

      // 2. Construir payload
      const payload: UpdateMyProfileRequest = {
        firstName: personalForm.firstName.trim(),
        paternalSurname: personalForm.paternalSurname.trim() || undefined,
        maternalSurname: personalForm.maternalSurname.trim() || undefined,
        email: personalForm.email.trim() || undefined,
        phoneNumber: personalForm.phoneNumber.trim() || undefined,
        documentType: personalForm.documentType ? Number(personalForm.documentType) : null,
        documentNumber: personalForm.documentNumber.trim() || undefined,
        documentExtension: personalForm.documentExtension ? Number(personalForm.documentExtension) : null,
        address: personalForm.address.trim() || undefined,
        imageUrl: finalImageUrl
      };

      // 3. Petición PUT
      const updatedProfile = await profileService.updateMyProfile(payload);
      setProfile(updatedProfile);

      addToast('Información personal actualizada correctamente', 'success');

      // 4. Sincronizar store global para actualizar avatar y saludo en el Header
      await useAuthStore.getState().fetchUserProfile();

    } catch (error: unknown) {
      console.error('Error updating personal profile:', error);
      const axiosError = error as { 
        response?: { 
          status?: number; 
          data?: { code?: string; message?: string } 
        } 
      };
      const status = axiosError.response?.status;
      const backendCode = axiosError.response?.data?.code?.toLowerCase();
      const rawMessage = axiosError.response?.data?.message?.toLowerCase() || '';

      if (
        backendCode === PROFILE_ERROR_CODES.EMAIL_ALREADY_EXISTS || 
        backendCode?.includes('email') || 
        rawMessage.includes('email')
      ) {
        setPersonalErrors(prev => ({ ...prev, email: 'El correo ya está en uso' }));
        addToast('El correo ya está en uso.', 'error');
      } else if (status === 404 || backendCode?.includes('not_found') || rawMessage.includes('not found')) {
        addToast('Usuario no encontrado.', 'error');
      } else if (status === 400 || backendCode?.includes('invalid')) {
        addToast('Datos del perfil inválidos.', 'error');
      } else if (status === 403) {
        addToast('Sin permisos para actualizar el perfil.', 'error');
      } else {
        addToast('Error al actualizar el perfil.', 'error');
      }

      setPersonalShakeKey(prev => prev + 1);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Validación de Contraseña
  const validatePasswordForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Ingresa tu contraseña actual';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'Ingresa una nueva contraseña';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Debe tener al menos 8 caracteres';
    } else if (passwordForm.newPassword.length > 64) {
      errors.newPassword = 'No puede superar 64 caracteres';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Confirma tu nueva contraseña';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Las contraseñas no coinciden';
    }

    if (passwordForm.currentPassword && passwordForm.newPassword && passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'La nueva contraseña no puede ser idéntica a la actual';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Guardar Cambio de Contraseña
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePasswordForm()) {
      setPasswordShakeKey(prev => prev + 1);
      return;
    }

    try {
      setIsChangingPassword(true);

      await profileService.changeMyPassword(passwordForm);

      addToast('Contraseña actualizada correctamente.', 'success');

      // Limpiar formulario de contraseña
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordErrors({});
    } catch (error: unknown) {
      console.error('Error changing password:', error);
      const axiosError = error as { 
        response?: { 
          status?: number; 
          data?: { code?: string; message?: string } 
        } 
      };
      const status = axiosError.response?.status;
      const code = axiosError.response?.data?.code?.toLowerCase();
      const rawMessage = axiosError.response?.data?.message?.toLowerCase() || '';

      if (
        code === PROFILE_ERROR_CODES.INVALID_CURRENT_PASSWORD || 
        rawMessage.includes('current password')
      ) {
        setPasswordErrors(prev => ({ ...prev, currentPassword: 'Contraseña actual incorrecta' }));
        addToast('Contraseña actual incorrecta.', 'error');
      } else if (
        code === PROFILE_ERROR_CODES.PASSWORD_MISMATCH || 
        rawMessage.includes('match')
      ) {
        setPasswordErrors(prev => ({ ...prev, confirmPassword: 'Las contraseñas no coinciden' }));
        addToast('Las contraseñas no coinciden.', 'error');
      } else if (
        code === PROFILE_ERROR_CODES.SAME_PASSWORD || 
        rawMessage.includes('identical') || 
        rawMessage.includes('same')
      ) {
        setPasswordErrors(prev => ({ ...prev, newPassword: 'No puede ser igual a la anterior' }));
        addToast('La nueva contraseña no puede ser igual a la actual.', 'error');
      } else if (status === 404 || code?.includes('not_found') || rawMessage.includes('not found')) {
        addToast('Usuario no encontrado.', 'error');
      } else if (status === 400) {
        addToast('Datos de contraseña inválidos.', 'error');
      } else if (status === 403) {
        addToast('Sin permisos para cambiar la contraseña.', 'error');
      } else {
        addToast('Error al cambiar la contraseña.', 'error');
      }

      setPasswordShakeKey(prev => prev + 1);
    } finally {
      setIsChangingPassword(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  // Iniciales para fallback del avatar
  const initials = profile.firstName
    ? `${profile.firstName[0]}${profile.paternalSurname?.[0] || ''}`.toUpperCase()
    : 'US';

  // Imagen activa a mostrar en el avatar (prioriza preview local si cambió)
  const currentAvatarUrl = avatarValue?.preview || profile.imageUrl;

  return (
    <div className="space-y-6 animate-fade-in pb-12 max-w-7xl mx-auto px-1 sm:px-2">
      
      {/* CABECERA DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-base-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <User className="w-6 h-6 text-primary" />
            Mi Perfil
          </h1>
          <p className="text-base-content/70 text-sm mt-0.5">
            Gestiona tus datos personales y credenciales de acceso al sistema
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* ============================================================== */}
        {/* TARJETA DE RESUMEN DE IDENTIDAD (STICKY EN PC)                 */}
        {/* ============================================================== */}
        <div className="lg:col-span-4 xl:col-span-4 lg:sticky lg:top-20 space-y-6">
          <div className="card bg-base-100 shadow-xs border border-base-200 overflow-hidden">
            
            {/* BANNER DECORATIVO SUPERIOR */}
            <div className="h-16 bg-gradient-to-r from-primary/20 via-primary/10 to-base-200"></div>

            <div className="card-body p-5 -mt-10 pt-0 text-center sm:text-left">
              
              {/* AVATAR + NOMBRE */}
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-3.5 mb-3">
                <div className="avatar placeholder ring-4 ring-base-100 rounded-2xl shadow-sm bg-base-100 shrink-0">
                  <div className="bg-primary/10 text-primary ring-1 ring-primary/20 rounded-2xl w-20 h-20 flex items-center justify-center overflow-hidden">
                    {currentAvatarUrl ? (
                      <img src={currentAvatarUrl} alt={profile.fullName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold">{initials}</span>
                    )}
                  </div>
                </div>

                <div className="min-w-0 flex-1 pb-1">
                  <h2 className="text-base sm:text-lg font-bold text-base-content truncate" title={profile.fullName}>
                    {profile.fullName}
                  </h2>
                  <p className="text-xs font-mono text-base-content/60">
                    @{profile.username}
                  </p>
                  <div className="mt-1.5 flex items-center justify-center sm:justify-start gap-1.5 flex-wrap">
                    <span className="badge badge-sm badge-success font-semibold gap-1 text-[11px] py-1">
                      <CheckCircle2 size={12} />
                      {profile.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* DATOS DE CONTEXTO EMPRESARIAL (SIN WORD-WRAP) */}
              <div className="divider my-1.5"></div>

              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-[11px] font-semibold text-base-content/50 uppercase tracking-wider block mb-1">
                    Roles Asignados
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {profile.roles && profile.roles.length > 0 ? (
                      profile.roles.map((role, idx) => (
                        <span key={idx} className="badge badge-sm badge-neutral font-semibold text-[11px]">
                          {role}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-base-content/40 italic">Sin roles</span>
                    )}
                  </div>
                </div>

                {/* EMPRESA - SIN WORD WRAP */}
                {profile.companyName && (
                  <div className="flex items-center gap-2 pt-2 border-t border-base-200 min-w-0">
                    <Building className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs text-base-content/60 shrink-0">Empresa:</span>
                      <span 
                        className="font-semibold text-xs text-base-content whitespace-nowrap truncate text-right" 
                        title={profile.companyName}
                      >
                        {profile.companyName}
                      </span>
                    </div>
                  </div>
                )}

                {/* SUCURSAL - SIN WORD WRAP */}
                {profile.branchName && (
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <div className="min-w-0 flex-1 flex items-center justify-between gap-2 overflow-hidden">
                      <span className="text-xs text-base-content/60 shrink-0">Sucursal:</span>
                      <span 
                        className="font-semibold text-xs text-base-content whitespace-nowrap truncate text-right" 
                        title={profile.branchName}
                      >
                        {profile.branchName}
                      </span>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* CONTENEDOR DE PESTAÑAS (OPTIMIZADO PARA PC Y MOBILE)           */}
        {/* ============================================================== */}
        <div className="lg:col-span-8 xl:col-span-8 space-y-0">
          
          {/* BARRA DE PESTAÑAS */}
          <div className="tabs tabs-boxed bg-base-200 p-1 rounded-t-2xl gap-1 font-semibold flex">
            <button
              type="button"
              className={`tab flex-1 text-xs sm:text-sm py-2.5 whitespace-nowrap transition-all ${
                activeTab === 'personal' ? 'tab-active !bg-base-100 !text-primary shadow-xs' : 'text-base-content/70 hover:text-base-content'
              }`}
              onClick={() => setActiveTab('personal')}
            >
              <User size={16} className="mr-1.5" />
              Información Personal
            </button>

            <button
              type="button"
              className={`tab flex-1 text-xs sm:text-sm py-2.5 whitespace-nowrap transition-all ${
                activeTab === 'security' ? 'tab-active !bg-base-100 !text-primary shadow-xs' : 'text-base-content/70 hover:text-base-content'
              }`}
              onClick={() => setActiveTab('security')}
            >
              <KeyRound size={16} className="mr-1.5" />
              Seguridad y Contraseña
            </button>
          </div>

          {/* CUERPO DEL TAB */}
          <div className="bg-base-100 rounded-b-2xl border border-t-0 border-base-200 p-4 sm:p-7 shadow-xs min-h-[500px]">
            
            {/* ======================================================== */}
            {/* TAB 1: INFORMACIÓN PERSONAL                              */}
            {/* ======================================================== */}
            {activeTab === 'personal' && (
              <form onSubmit={handleSavePersonal} className="space-y-6">
                
                {/* SECCIÓN 1: FOTOGRAFÍA + NOMBRES (DISEÑO HORIZONTAL FLUIDO EN PC) */}
                <div className="bg-base-200/30 p-4 sm:p-5 rounded-2xl border border-base-200">
                  <div className="flex flex-col lg:flex-row gap-6 items-start">
                    
                    {/* UPLOADER DE FOTO COMPACTO */}
                    <div className="w-full lg:w-56 shrink-0">
                      <span className="text-xs font-bold text-base-content/70 uppercase tracking-wider block mb-2">
                        Foto de Perfil
                      </span>
                      <ComerziaSingleImageUploader
                        value={avatarValue}
                        onChange={setAvatarValue}
                        helperText="JPG, PNG o WEBP. Máx. 5MB."
                        compact
                      />
                    </div>

                    {/* NOMBRES Y APELLIDOS */}
                    <div className="flex-1 w-full space-y-3.5">
                      <span className="text-xs font-bold text-base-content/70 uppercase tracking-wider block">
                        Nombres y Apellidos
                      </span>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <ComerziaInput
                          label="Nombres"
                          value={personalForm.firstName}
                          onChange={e => {
                            setPersonalForm({ ...personalForm, firstName: e.target.value });
                            if (personalErrors.firstName) setPersonalErrors(prev => ({ ...prev, firstName: '' }));
                          }}
                          error={personalErrors.firstName}
                          shakeKey={personalShakeKey}
                          isRequired
                        />

                        <ComerziaInput
                          label="Apellido Paterno"
                          value={personalForm.paternalSurname}
                          onChange={e => {
                            setPersonalForm({ ...personalForm, paternalSurname: e.target.value });
                            if (personalErrors.paternalSurname) setPersonalErrors(prev => ({ ...prev, paternalSurname: '' }));
                          }}
                          error={personalErrors.paternalSurname}
                          shakeKey={personalShakeKey}
                        />

                        <ComerziaInput
                          label="Apellido Materno"
                          value={personalForm.maternalSurname}
                          onChange={e => {
                            setPersonalForm({ ...personalForm, maternalSurname: e.target.value });
                            if (personalErrors.maternalSurname) setPersonalErrors(prev => ({ ...prev, maternalSurname: '' }));
                          }}
                          error={personalErrors.maternalSurname}
                          shakeKey={personalShakeKey}
                        />
                      </div>
                    </div>

                  </div>
                </div>

                {/* SECCIÓN 2: DOCUMENTO DE IDENTIDAD */}
                <div className="bg-base-200/30 p-4 sm:p-5 rounded-2xl border border-base-200 space-y-3">
                  <span className="text-xs font-bold text-base-content/70 uppercase tracking-wider block flex items-center gap-1.5">
                    <FileText size={15} className="text-primary" />
                    Documento de Identidad
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-5">
                      <ComerziaSelect
                        label="Tipo de Documento"
                        options={options[DICTIONARIES.DOCUMENT_TYPE] || []}
                        value={personalForm.documentType}
                        onChange={e => setPersonalForm({ ...personalForm, documentType: e.target.value })}
                        isLoading={isLoadingDicts}
                        enableDefaultOption
                        placeholder="Seleccionar tipo..."
                      />
                    </div>

                    <div className="sm:col-span-4">
                      <ComerziaInput
                        label="Nro. Documento"
                        value={personalForm.documentNumber}
                        onChange={e => {
                          setPersonalForm({ ...personalForm, documentNumber: handleNumericInput(e.target.value, 20) });
                          if (personalErrors.documentNumber) setPersonalErrors(prev => ({ ...prev, documentNumber: '' }));
                        }}
                        error={personalErrors.documentNumber}
                        shakeKey={personalShakeKey}
                      />
                    </div>

                    <div className="sm:col-span-3">
                      <ComerziaSelect
                        label="Extensión"
                        options={options[DICTIONARIES.DOCUMENT_EXTENSION] || []}
                        value={personalForm.documentExtension}
                        onChange={e => setPersonalForm({ ...personalForm, documentExtension: e.target.value })}
                        isLoading={isLoadingDicts}
                        enableDefaultOption
                        placeholder="Ext..."
                      />
                    </div>
                  </div>
                </div>

                {/* SECCIÓN 3: DATOS DE CONTACTO Y UBICACIÓN */}
                <div className="bg-base-200/30 p-4 sm:p-5 rounded-2xl border border-base-200 space-y-3">
                  <span className="text-xs font-bold text-base-content/70 uppercase tracking-wider block flex items-center gap-1.5">
                    <Phone size={15} className="text-primary" />
                    Información de Contacto y Ubicación
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ComerziaInput
                      label="Teléfono / Celular"
                      value={personalForm.phoneNumber}
                      onChange={e => {
                        setPersonalForm({ ...personalForm, phoneNumber: handleNumericInput(e.target.value, 15) });
                        if (personalErrors.phoneNumber) setPersonalErrors(prev => ({ ...prev, phoneNumber: '' }));
                      }}
                      error={personalErrors.phoneNumber}
                      shakeKey={personalShakeKey}
                      icon={<Phone size={16} />}
                    />

                    <ComerziaInput
                      label="Correo Electrónico"
                      type="email"
                      value={personalForm.email}
                      onChange={e => {
                        setPersonalForm({ ...personalForm, email: e.target.value });
                        if (personalErrors.email) setPersonalErrors(prev => ({ ...prev, email: '' }));
                      }}
                      error={personalErrors.email}
                      shakeKey={personalShakeKey}
                      icon={<Mail size={16} />}
                    />
                  </div>

                  <div className="mt-2">
                    <ComerziaInput
                      label="Dirección de Domicilio"
                      value={personalForm.address}
                      onChange={e => {
                        setPersonalForm({ ...personalForm, address: e.target.value });
                        if (personalErrors.address) setPersonalErrors(prev => ({ ...prev, address: '' }));
                      }}
                      error={personalErrors.address}
                      shakeKey={personalShakeKey}
                      icon={<MapPin size={16} />}
                    />
                  </div>
                </div>

                {/* BOTÓN GUARDAR INFORMACIÓN PERSONAL */}
                <div className="flex justify-end pt-3">
                  <BtnSave
                    label="Guardar Información"
                    isLoading={isSavingProfile}
                    responsive={false}
                    type="submit"
                  />
                </div>
              </form>
            )}

            {/* ======================================================== */}
            {/* TAB 2: SEGURIDAD Y CONTRASEÑA (SISTEMA BALANCEADO EN PC) */}
            {/* ======================================================== */}
            {activeTab === 'security' && (
              <form onSubmit={handleChangePassword} className="space-y-6">
                
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  
                  {/* COLUMNA IZQUIERDA EN PC: CAMPOS DE CONTRASEÑA */}
                  <div className="lg:col-span-7 space-y-4">
                    
                    <div className="border-b border-base-200 pb-2 mb-2">
                      <h3 className="text-sm font-bold text-base-content flex items-center gap-1.5">
                        <Lock size={16} className="text-primary" />
                        Cambio de Contraseña
                      </h3>
                      <p className="text-xs text-base-content/60 mt-0.5">
                        Ingresa tu contraseña actual y define una nueva clave segura.
                      </p>
                    </div>

                    {/* CONTRASEÑA ACTUAL */}
                    <ComerziaInput
                      label="Contraseña Actual"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={e => {
                        setPasswordForm({ ...passwordForm, currentPassword: e.target.value });
                        if (passwordErrors.currentPassword) setPasswordErrors(prev => ({ ...prev, currentPassword: '' }));
                      }}
                      error={passwordErrors.currentPassword}
                      shakeKey={passwordShakeKey}
                      isRequired
                      autoComplete="current-password"
                      rightAction={
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="text-base-content/50 hover:text-primary transition-colors p-1"
                          title={showCurrentPassword ? "Ocultar" : "Mostrar"}
                        >
                          {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    {/* NUEVA CONTRASEÑA */}
                    <ComerziaInput
                      label="Nueva Contraseña"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={e => {
                        setPasswordForm({ ...passwordForm, newPassword: e.target.value });
                        if (passwordErrors.newPassword) setPasswordErrors(prev => ({ ...prev, newPassword: '' }));
                      }}
                      error={passwordErrors.newPassword}
                      shakeKey={passwordShakeKey}
                      isRequired
                      autoComplete="new-password"
                      helperText="Entre 8 y 64 caracteres."
                      rightAction={
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="text-base-content/50 hover:text-primary transition-colors p-1"
                          title={showNewPassword ? "Ocultar" : "Mostrar"}
                        >
                          {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    {/* CONFIRMAR NUEVA CONTRASEÑA */}
                    <ComerziaInput
                      label="Confirmar Nueva Contraseña"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={e => {
                        setPasswordForm({ ...passwordForm, confirmPassword: e.target.value });
                        if (passwordErrors.confirmPassword) setPasswordErrors(prev => ({ ...prev, confirmPassword: '' }));
                      }}
                      error={passwordErrors.confirmPassword}
                      shakeKey={passwordShakeKey}
                      isRequired
                      autoComplete="new-password"
                      rightAction={
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="text-base-content/50 hover:text-primary transition-colors p-1"
                          title={showConfirmPassword ? "Ocultar" : "Mostrar"}
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      }
                    />

                    <div className="pt-3">
                      <BtnSave
                        label="Actualizar Contraseña"
                        isLoading={isChangingPassword}
                        responsive={false}
                        type="submit"
                      />
                    </div>
                  </div>

                  {/* COLUMNA DERECHA EN PC: PANEL DE ESTADO Y SEGURIDAD */}
                  <div className="lg:col-span-5 space-y-4">
                    
                    <div className="card bg-base-200/40 border border-base-200 p-4 rounded-2xl space-y-3">
                      <h4 className="text-xs font-bold text-base-content uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles size={14} className="text-primary" />
                        Requisitos de Seguridad
                      </h4>

                      <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                          {passwordForm.newPassword.length >= 8 && passwordForm.newPassword.length <= 64 ? (
                            <CheckCircle2 size={16} className="text-success shrink-0" />
                          ) : (
                            <AlertCircle size={16} className="text-base-content/40 shrink-0" />
                          )}
                          <span className={passwordForm.newPassword.length >= 8 && passwordForm.newPassword.length <= 64 ? 'text-success font-medium' : 'text-base-content/70'}>
                            Mínimo 8 caracteres ({passwordForm.newPassword.length}/64)
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword ? (
                            <CheckCircle2 size={16} className="text-success shrink-0" />
                          ) : (
                            <AlertCircle size={16} className="text-base-content/40 shrink-0" />
                          )}
                          <span className={passwordForm.confirmPassword && passwordForm.newPassword === passwordForm.confirmPassword ? 'text-success font-medium' : 'text-base-content/70'}>
                            Las contraseñas coinciden
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {passwordForm.currentPassword && passwordForm.newPassword && passwordForm.currentPassword !== passwordForm.newPassword ? (
                            <CheckCircle2 size={16} className="text-success shrink-0" />
                          ) : (
                            <AlertCircle size={16} className="text-base-content/40 shrink-0" />
                          )}
                          <span className={passwordForm.currentPassword && passwordForm.newPassword && passwordForm.currentPassword !== passwordForm.newPassword ? 'text-success font-medium' : 'text-base-content/70'}>
                            Diferente a la contraseña actual
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* ALERTA DE BUENAS PRÁCTICAS */}
                    <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 text-xs space-y-1.5">
                      <div className="flex items-center gap-1.5 font-bold text-primary text-xs">
                        <ShieldCheck size={16} />
                        Recomendación
                      </div>
                      <p className="text-base-content/70 leading-relaxed text-[11px]">
                        Utiliza una combinación de letras mayúsculas, minúsculas, números y símbolos para proteger tu cuenta de accesos no autorizados.
                      </p>
                    </div>

                  </div>

                </div>

              </form>
            )}

          </div>

        </div>

      </div>

    </div>
  );
};
