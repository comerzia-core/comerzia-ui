import React, { useEffect, useState } from 'react';
import { Building2, CreditCard, Settings } from 'lucide-react';
import { companyService } from '../services/companyService';
import { uploadFile } from '../../shared/services/storageService';
import { STORAGE_FOLDERS } from '../../../config/storage';
import { useToast } from '../../../context/ToastContext';
import { formatDateForUser } from '../../../utils/date';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSingleImageUploader, type SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { TenantCompanyProfileResponse, UpdateCompanySettingsRequest } from '../types/company';

export const CompanyProfilePage = () => {
  const { addToast: showToast } = useToast();

  // Estados de la vista
  const [profileData, setProfileData] = useState<TenantCompanyProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [companyLogo, setCompanyLogo] = useState<SingleImageValue | null>(null);
  
  // Estado para validación visual
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado del formulario de configuraciones
  const [formData, setFormData] = useState<UpdateCompanySettingsRequest>({
    companyLogoUrl: null,
    ticketLogoUrl: null,
    currencyCode: '',
    timezone: '',
    taxName: '',
    taxPercentage: 0,
    ticketFooterText: ''
  });

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await companyService.getCompanyProfile();
      setProfileData(data);
      
      setCompanyLogo(data.companyLogoUrl ? { preview: data.companyLogoUrl } : null);

      // Mapeamos los datos al formulario. 
      // IMPORTANTE: Mantenemos las URLs originales intactas para no sobrescribirlas al guardar.
      setFormData({
        companyLogoUrl: data.companyLogoUrl, 
        ticketLogoUrl: data.ticketLogoUrl,
        currencyCode: data.currencyCode,
        timezone: data.timezone,
        taxName: data.taxName || '',
        taxPercentage: data.taxPercentage || 0,
        ticketFooterText: data.ticketFooterText || ''
      });
    } catch (error) {
      console.error('Error loading company profile:', error);
      showToast('Error al cargar la información de la empresa', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'taxPercentage' ? Number(value) : value
    }));
    
    // Limpiar el error del campo al escribir
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validamos los requeridos según el backend (NotBlank)
    if (!formData.currencyCode) newErrors.currencyCode = 'El código de moneda es requerido';
    if (!formData.timezone) newErrors.timezone = 'La zona horaria es requerida';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeKey(prev => prev + 1); // Disparamos la vibración (shake) en la UI
      return false;
    }
    return true;
  };

  const handleSaveSettings = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      let finalCompanyLogoUrl: string | null = null;

      if (companyLogo) {
        if (companyLogo.file) {
          try {
            finalCompanyLogoUrl = await uploadFile(
              companyLogo.file,
              STORAGE_FOLDERS.COMPANY,
              `logo-${profileData?.slug || 'company'}-${Date.now()}`
            );
          } catch (uploadErr) {
            console.error("Error al subir logo de empresa:", uploadErr);
            showToast("No se pudo subir la imagen del logo", "error");
            setIsSaving(false);
            return;
          }
        } else if (companyLogo.preview) {
          finalCompanyLogoUrl = companyLogo.preview;
        }
      }

      await companyService.updateCompanySettings({
        ...formData,
        companyLogoUrl: finalCompanyLogoUrl
      });
      showToast('Configuración actualizada exitosamente', 'success');
      
      // Recargamos el perfil local y global para mantener la UI y el branding sincronizados
      await Promise.all([
        loadProfile(),
        useAuthStore.getState().fetchUserProfile()
      ]);
    } catch (error) {
      console.error('Error updating settings:', error);
      showToast('Ocurrió un error al actualizar la configuración', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !profileData) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  const { currentSubscription } = profileData;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TÍTULO PRINCIPAL */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Perfil de la Empresa
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Visualiza tu información y administra la configuración de operación
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Info General y Suscripción (Solo Lectura) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* TARJETA INFO BÁSICA */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg mb-4 text-base-content/80">Identidad Empresarial</h2>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="avatar">
                  <div className="w-16 h-16 rounded-xl border border-base-300 bg-base-200 flex items-center justify-center">
                    {profileData.companyLogoUrl ? (
                      <img src={profileData.companyLogoUrl} alt="Logo" className="object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-base-content/40">
                        {profileData.legalName.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{profileData.commercialName}</p>
                  <p className="text-sm text-base-content/60">NIT: {profileData.taxId}</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-base-200 pt-4">
                <div>
                  <span className="text-xs font-semibold text-base-content/50 uppercase">Razón Social</span>
                  <p className="font-medium text-sm">{profileData.legalName}</p>
                </div>
                <div>
                  <span className="text-xs font-semibold text-base-content/50 uppercase">Catálogo Digital</span>
                  <p className="text-sm mt-1 font-mono text-primary cursor-pointer hover:underline">
                    www.comerzia.com/{profileData.slug}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* TARJETA SUSCRIPCIÓN */}
          <div className="card bg-gradient-to-br from-primary/5 to-base-100 shadow-sm border border-primary/20">
            <div className="card-body p-6">
              <h2 className="card-title text-lg mb-4 text-primary flex gap-2">
                <CreditCard className="w-5 h-5" /> Tu Suscripción
              </h2>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center border-b border-base-200/50 pb-2">
                  <span className="text-sm font-medium text-base-content/70">Plan</span>
                  <span className="badge badge-primary">{currentSubscription.planName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-base-200/50 pb-2">
                  <span className="text-sm font-medium text-base-content/70">Estado</span>
                  <span className="font-bold text-success text-sm">{currentSubscription.statusName}</span>
                </div>

                {currentSubscription.planTypeCode !== 705 && (
                  <>
                    <div className="flex justify-between items-center border-b border-base-200/50 pb-2">
                      <span className="text-sm font-medium text-base-content/70">Válido hasta</span>
                      <span className="text-sm font-semibold text-base-content">
                        {formatDateForUser(currentSubscription.validUntil)}
                      </span>
                    </div>
                    
                    <div className="pt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="bg-base-100 rounded-box p-2 shadow-sm border border-base-200">
                        <p className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Sucursales</p>
                        <p className="font-black text-lg text-base-content">{currentSubscription.maxBranches}</p>
                      </div>
                      <div className="bg-base-100 rounded-box p-2 shadow-sm border border-base-200">
                        <p className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Usuarios</p>
                        <p className="font-black text-lg text-base-content">{currentSubscription.maxUsers}</p>
                      </div>
                      <div className="bg-base-100 rounded-box p-2 shadow-sm border border-base-200">
                        <p className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Productos</p>
                        <p className="font-black text-lg text-base-content">{currentSubscription.maxProducts}</p>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: Formulario de Configuración (Settings) */}
        <div className="lg:col-span-2">
          <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
            <div className="card-body p-6">
              <div className="flex gap-2 items-center mb-6">
                <Settings className="w-5 h-5 text-base-content/50" />
                <h2 className="card-title text-lg m-0">Parámetros de Operación</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-6">
                
                {/* Zona Horaria y Moneda (Solo lectura) */}
                <ComerziaInput 
                  label="Zona Horaria (Predeterminada)" 
                  name="timezone"
                  value={formData.timezone} 
                  onChange={handleChange}
                  disabled
                  shakeKey={shakeKey}
                  error={errors.timezone}
                />
                
                <ComerziaInput 
                  label="Moneda Principal (ISO)" 
                  name="currencyCode"
                  value={formData.currencyCode} 
                  onChange={handleChange}
                  disabled
                  shakeKey={shakeKey}
                  error={errors.currencyCode}
                />

                <div className="divider md:col-span-2 my-2 text-xs font-bold text-base-content/40 uppercase tracking-widest">
                  Identidad Visual
                </div>

                <div className="md:col-span-2">
                  <ComerziaSingleImageUploader
                    label="Logo de la Empresa"
                    value={companyLogo}
                    onChange={setCompanyLogo}
                    helperText="Formato recomendado: PNG transparente o JPG (Máx. 5MB). Se usará en el encabezado, sidebar y documentos."
                    compact
                  />
                </div>

                <div className="divider md:col-span-2 my-2 text-xs font-bold text-base-content/40 uppercase tracking-widest">
                  Facturación e Impuestos
                </div>

                <ComerziaInput 
                  label="Nombre del Impuesto" 
                  name="taxName"
                  value={formData.taxName} 
                  onChange={handleChange}
                  placeholder="Ej. IVA"
                  maxLength={20}
                  helperText="Se mostrará en los recibos"
                />

                <ComerziaInput 
                  label="Porcentaje de Impuesto (%)" 
                  name="taxPercentage"
                  type="number"
                  value={formData.taxPercentage} 
                  onChange={handleChange}
                  placeholder="0.00"
                />

                <div className="md:col-span-2">
                  <ComerziaInput 
                    label="Mensaje al pie del Ticket" 
                    name="ticketFooterText"
                    value={formData.ticketFooterText} 
                    onChange={handleChange}
                    placeholder="¡Gracias por su preferencia! Vuelva pronto..."
                  />
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="card-actions justify-end border-t border-base-200 pt-6 mt-auto w-full">
                <BtnSave onClick={handleSaveSettings} isLoading={isSaving} label="Guardar Cambios" responsive={false} className="w-full sm:w-auto" />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};