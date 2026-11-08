import React, { useEffect, useState } from 'react';
import { companyService } from '../services/companyService';
import { uploadFile } from '../../shared/services/storageService';
import { STORAGE_FOLDERS } from '../../../config/storage';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import type { SingleImageValue } from '../../../components/ui/ComerziaSingleImageUploader';
import type { TenantCompanyProfileResponse, UpdateCompanySettingsRequest } from '../types/company';

export function useCompanyProfileSettings() {
  const { addToast: showToast } = useToast();
  const [tab, setTab] = useState<'general' | 'business'>('general');
  const canManageSettings = useAuthStore(state => state.hasPermission('ORG_SETTINGS_MANAGE'));

  // Estados de la vista
  const [profileData, setProfileData] = useState<TenantCompanyProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [companyLogo, setCompanyLogo] = useState<SingleImageValue | null>(null);
  const [ticketLogo, setTicketLogo] = useState<SingleImageValue | null>(null);
  const [companyQr, setCompanyQr] = useState<SingleImageValue | null>(null);
  
  // Estado para validación visual
  const [shakeKey, setShakeKey] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Estado del formulario de configuraciones
  const [formData, setFormData] = useState<UpdateCompanySettingsRequest>({
    companyLogoUrl: null,
    ticketLogoUrl: null,
    companyQrUrl: null,
    currencyCode: '',
    timezone: '',
    taxName: '',
    taxPercentage: 0,
    ticketFooterText: '',
    defaultMinStock: 0,
    defaultIdealStock: 0,
    saleCustomerRegistrationEnabled: true,
    receiptPrintingEnabled: true
  });

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const data = await companyService.getCompanyProfile();
      setProfileData(data);
      
      setCompanyLogo(data.companyLogoUrl ? { preview: data.companyLogoUrl } : null);
      setTicketLogo(data.ticketLogoUrl ? { preview: data.ticketLogoUrl } : null);
      setCompanyQr(data.companyQrUrl ? { preview: data.companyQrUrl } : null);

      // Mapeamos los datos al formulario. 
      // IMPORTANTE: Mantenemos las URLs originales intactas para no sobrescribirlas al guardar.
      setFormData({
        companyLogoUrl: data.companyLogoUrl, 
        ticketLogoUrl: data.ticketLogoUrl,
        companyQrUrl: data.companyQrUrl,
        currencyCode: data.currencyCode,
        timezone: data.timezone,
        taxName: data.taxName || '',
        taxPercentage: data.taxPercentage || 0,
        ticketFooterText: data.ticketFooterText || '',
        defaultMinStock: data.defaultMinStock ?? 0,
        defaultIdealStock: data.defaultIdealStock ?? 0,
        saleCustomerRegistrationEnabled: data.saleCustomerRegistrationEnabled ?? true,
        receiptPrintingEnabled: data.receiptPrintingEnabled ?? true
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
      [name]: (name === 'taxPercentage' || name === 'defaultMinStock' || name === 'defaultIdealStock')
        ? (value === '' ? '' : Number(value))
        : value
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

    const minStockVal = Number(formData.defaultMinStock ?? 0);
    const idealStockVal = Number(formData.defaultIdealStock ?? 0);

    if (minStockVal < 0) {
      newErrors.defaultMinStock = 'El stock mínimo no puede ser negativo';
    }
    if (idealStockVal < 0) {
      newErrors.defaultIdealStock = 'El stock ideal no puede ser negativo';
    }
    if (idealStockVal > 0 && minStockVal > idealStockVal) {
      newErrors.defaultMinStock = 'El stock mínimo no puede ser mayor que el stock ideal';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeKey(prev => prev + 1); // Disparamos la vibración (shake) en la UI
      return false;
    }
    return true;
  };

  const handleSaveSettings = async () => {
    if (!canManageSettings || !validateForm()) return;

    try {
      setIsSaving(true);
      let finalCompanyLogoUrl: string | null = null;
      let finalTicketLogoUrl: string | null = null;

      // Subida de logo de la empresa
      if (companyLogo) {
        if (companyLogo.file) {
          try {
            finalCompanyLogoUrl = await uploadFile(
              companyLogo.file,
              STORAGE_FOLDERS.COMPANY,
              `logo-${profileData?.slug || 'company'}-${Date.now()}`
            );
          } catch (uploadErr) {
            console.error("Error uploading company logo:", uploadErr);
            showToast("No se pudo subir la imagen del logo", "error");
            setIsSaving(false);
            return;
          }
        } else if (companyLogo.preview) {
          finalCompanyLogoUrl = companyLogo.preview;
        }
      }

      // Subida de logo de tickets
      if (ticketLogo) {
        if (ticketLogo.file) {
          try {
            finalTicketLogoUrl = await uploadFile(
              ticketLogo.file,
              STORAGE_FOLDERS.COMPANY,
              `ticket-logo-${profileData?.slug || 'company'}-${Date.now()}`
            );
          } catch (uploadErr) {
            console.error("Error uploading receipt logo:", uploadErr);
            showToast("No se pudo subir la imagen del logo de ticket", "error");
            setIsSaving(false);
            return;
          }
        } else if (ticketLogo.preview) {
          finalTicketLogoUrl = ticketLogo.preview;
        }
      }

      // Subida de código QR de la empresa (para cobros QR)
      let finalCompanyQrUrl: string | null = null;
      if (companyQr) {
        if (companyQr.file) {
          try {
            finalCompanyQrUrl = await uploadFile(
              companyQr.file,
              STORAGE_FOLDERS.COMPANY,
              `qr-${profileData?.slug || 'company'}-${Date.now()}`
            );
          } catch (uploadErr) {
            console.error("Error uploading company payment QR:", uploadErr);
            showToast("No se pudo subir la imagen del código QR", "error");
            setIsSaving(false);
            return;
          }
        } else if (companyQr.preview) {
          finalCompanyQrUrl = companyQr.preview;
        }
      }

      await companyService.updateCompanySettings({
        ...formData,
        companyLogoUrl: finalCompanyLogoUrl,
        ticketLogoUrl: finalTicketLogoUrl,
        companyQrUrl: finalCompanyQrUrl,
        defaultMinStock: formData.defaultMinStock != null ? Number(formData.defaultMinStock) : 0,
        defaultIdealStock: formData.defaultIdealStock != null ? Number(formData.defaultIdealStock) : 0
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

  return { profileData, isLoading, isSaving, companyLogo, setCompanyLogo, ticketLogo, setTicketLogo,
    companyQr, setCompanyQr, shakeKey, errors, formData, setFormData, handleChange, handleSaveSettings,
    tab, setTab, canManageSettings };
}
