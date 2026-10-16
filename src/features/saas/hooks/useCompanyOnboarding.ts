import { useState } from 'react';
import { usePlatformData } from './usePlatformData';
import type { PlatformPlan } from '../types/platform';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { createCompany } from '../services/companyService';
import { platformError } from '../services/platformService';
import type { CompanyCreatedResponse, CreateCompanyRequest } from '../types/company';
import { useToast } from '../../../context/ToastContext';

export interface CompanyOnboardingOptions {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: CompanyCreatedResponse) => void;
}

const INITIAL_STATE: CreateCompanyRequest = {
    company: { legalName: '', commercialName: '', slug: '', taxId: '' },
    owner: { firstName: '', paternalSurname: '', maternalSurname: '', documentType: '', documentNumber: '', extension: '', email: '', phoneNumber: '' },
    subscription: { planTypeCode: '', validUntil: '', extraBranches: 0, extraUsers: 0 }
};

export function useCompanyOnboarding({ isOpen, onClose, onSuccess }: CompanyOnboardingOptions) {
    // 1. CORRECCIÓN: El stepper de Comerzia empieza en 1 (1-based index)
    const [step, setStep] = useState(1);

    const [formData, setFormData] = useState<CreateCompanyRequest>(INITIAL_STATE);
    const [isSaving, setIsSaving] = useState(false);

    // 2. ESTADOS PARA VALIDACIÓN UX (SHAKE Y ERRORES)
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [shakeKey, setShakeKey] = useState(0);

    // Instancia de notificaciones
    const toast = useToast();

    const { options, isLoading: isLoadingDicts } = useLoadDictionaries([
        DICTIONARIES.DOCUMENT_TYPE,
        DICTIONARIES.DOCUMENT_EXTENSION,
        DICTIONARIES.PLAN_TYPE
    ]);

    const catalog = usePlatformData<PlatformPlan[]>('/saas/plans', undefined, isOpen);
    const selectedPlan = catalog.data?.find(plan => plan.code === Number(formData.subscription.planTypeCode));
    const requiresExpiry = selectedPlan?.requiresExpiry ?? true;

    const steps = ["Empresa", "Propietario", "Suscripción"];

    // --- MANEJADORES DE ESTADO ---
    const updateCompany = (field: keyof typeof formData.company, value: string) => {
        setFormData(prev => ({ ...prev, company: { ...prev.company, [field]: value } }));
        // Limpiamos el error de este campo al escribir
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const updateOwner = (field: keyof typeof formData.owner, value: string) => {
        setFormData(prev => ({ ...prev, owner: { ...prev.owner, [field]: value } }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    const updateSubscription = (field: keyof typeof formData.subscription, value: string | number) => {
        setFormData(prev => ({ ...prev, subscription: { ...prev.subscription, [field]: value } }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
    };

    // 3. CORRECCIÓN: Auto-generar SLUG seguro desde el Nombre Comercial
    const handleCommercialNameChange = (value: string) => { updateCompany('commercialName', value); updateCompany('slug', ''); };

    // --- LÓGICA DE VALIDACIÓN ESTRICTA ---
    const validateCurrentStep = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {

            if (!formData.company.commercialName.trim()) newErrors.commercialName = "Campo requerido";

        }
        else if (step === 2) {
            if (!formData.owner.firstName.trim()) newErrors.firstName = "Campo requerido";
            if (!formData.owner.paternalSurname.trim() && !formData.owner.maternalSurname?.trim()) newErrors.paternalSurname = "Indica al menos un apellido";
            if (formData.owner.documentNumber.trim() && !formData.owner.documentType) newErrors.documentType = "Seleccione un documento";
            if (formData.owner.documentType && !formData.owner.documentNumber.trim()) newErrors.documentNumber = "Campo requerido";

            // Validación básica de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!formData.owner.email.trim()) {
                newErrors.email = "Campo requerido";
            } else if (!emailRegex.test(formData.owner.email)) {
                newErrors.email = "Correo inválido";
            }


        }
        else if (step === 3) {
            if (!formData.subscription.planTypeCode) newErrors.planTypeCode = "Seleccione un plan";
            if (requiresExpiry && !formData.subscription.validUntil) newErrors.validUntil = "Fecha requerida";
            if (formData.subscription.extraBranches < 0) newErrors.extraBranches = "Mínimo 1";
            if (formData.subscription.extraUsers < 0) newErrors.extraUsers = "Mínimo 1";
        }

        setErrors(newErrors);

        // Si hay errores, disparamos el Shake y mostramos Toast
        if (Object.keys(newErrors).length > 0) {
            setShakeKey(prev => prev + 1); // Dispara la animación CSS de vibración

            // Segun la implementación de ToastContext (toast.error o toast({type: 'error'}))
            if (toast?.error) {
                toast.error("Por favor, complete los campos obligatorios en rojo.");
            }
            return false;
        }

        return true;
    };

    // --- NAVEGACIÓN Y SUBMIT ---
    const handleNext = () => {
        if (validateCurrentStep()) {
            setStep(prev => Math.min(prev + 1, steps.length));
        }
    };

    const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

    const handleSubmit = async () => {
        // Validar el último paso antes de enviar al backend
        if (!validateCurrentStep()) return;

        try {
            setIsSaving(true);
            const validUntil = requiresExpiry ? new Date(formData.subscription.validUntil!).toISOString() : null;
            const payload: CreateCompanyRequest = {
                ...formData,
                company: { ...formData.company, slug: formData.company.slug || null },
                owner: { ...formData.owner, documentType: formData.owner.documentType ? Number(formData.owner.documentType) : null, extension: formData.owner.extension ? Number(formData.owner.extension) : null },
                subscription: {
                    ...formData.subscription,
                    planTypeCode: Number(formData.subscription.planTypeCode),
                    validUntil // Transformación estricta a UTC
                }
            };

            // 2. Capturamos la respuesta del backend
            const responseData = await createCompany(payload);

            if (toast?.success) toast.success("Empresa y Suscripción registradas exitosamente.");

            // 3. Emitimos la data al padre
            onSuccess(responseData);
            handleClose();
        } catch (error: unknown) {
            if (toast?.error) {
                toast.error(platformError(error));
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleClose = () => {
        setFormData(INITIAL_STATE);
        setStep(1); // Volver al índice base 1
        setErrors({});
        onClose();
    };

    return { step, formData, isSaving, errors, shakeKey, options, isLoadingDicts, catalog, requiresExpiry, steps,
        updateCompany, updateOwner, updateSubscription, handleCommercialNameChange, handleNext, handlePrev, handleSubmit, handleClose };
}
