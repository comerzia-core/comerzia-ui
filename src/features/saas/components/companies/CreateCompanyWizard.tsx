import { useState } from "react";
import { ComerziaModal } from "../../../../components/ui/ComerziaModal";
import { ComerziaStepper } from "../../../../components/ui/ComerziaStepper";
import { ComerziaInput } from "../../../../components/ui/ComerziaInput";
import { ComerziaSelect } from "../../../../components/ui/ComerziaSelect";
import { BtnBack, BtnNext, BtnCancel, BtnSave } from "../../../../components/ui/CrudButtons";
import { useLoadDictionaries } from "../../../../hooks/useLoadDictionaries";
import { DICTIONARIES } from "../../../../config/dictionaries";
import { createCompany } from "../../services/companyService";
import type { CompanyCreatedResponse, CreateCompanyRequest } from "../../types/company";

// NOTA: Asumo que tu context exporta un hook useToast con métodos como success() y error().
// Ajusta esto si la firma de tu ToastContext es ligeramente distinta.
import { useToast } from "../../../../context/ToastContext"; 

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (data: CompanyCreatedResponse) => void;
}

const INITIAL_STATE: CreateCompanyRequest = {
    company: { legalName: '', commercialName: '', slug: '', taxId: '' },
    owner: { firstName: '', paternalSurname: '', maternalSurname: '', documentType: '', documentNumber: '', extension: '', email: '', phoneNumber: '' },
    subscription: { planType: '', validUntil: '', maxBranches: 1, maxUsers: 1, maxProducts: 100, enabledModules: '' }
};

export const CreateCompanyWizard = ({ isOpen, onClose, onSuccess }: Props) => {
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
    const handleCommercialNameChange = (val: string) => {
        updateCompany('commercialName', val);
        
        const autoSlug = val
            .normalize("NFD") // Descompone acentos y caracteres especiales (ej. 'ñ' -> 'n' + '~')
            .replace(/[\u0300-\u036f]/g, "") // Elimina las marcas de acentuación
            .toLowerCase() // Todo a minúsculas
            .replace(/[^a-z0-9]+/g, '-') // Reemplaza cualquier cosa que NO sea letra o número por guiones
            .replace(/(^-|-$)+/g, ''); // Quita guiones iniciales o finales huérfanos
            
        updateCompany('slug', autoSlug);
    };

    // --- LÓGICA DE VALIDACIÓN ESTRICTA ---
    const validateCurrentStep = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (step === 1) {
            if (!formData.company.legalName.trim()) newErrors.legalName = "Campo requerido";
            if (!formData.company.commercialName.trim()) newErrors.commercialName = "Campo requerido";
            if (!formData.company.taxId.trim()) newErrors.taxId = "Campo requerido";
        } 
        else if (step === 2) {
            if (!formData.owner.firstName.trim()) newErrors.firstName = "Campo requerido";
            if (!formData.owner.paternalSurname.trim()) newErrors.paternalSurname = "Campo requerido";
            if (!formData.owner.documentType) newErrors.documentType = "Seleccione un documento";
            if (!formData.owner.documentNumber.trim()) newErrors.documentNumber = "Campo requerido";
            
            // Validación básica de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!formData.owner.email.trim()) {
                newErrors.email = "Campo requerido";
            } else if (!emailRegex.test(formData.owner.email)) {
                newErrors.email = "Correo inválido";
            }
            
            if (!formData.owner.phoneNumber.trim()) newErrors.phoneNumber = "Campo requerido";
        } 
        else if (step === 3) {
            if (!formData.subscription.planType) newErrors.planType = "Seleccione un plan";
            if (!formData.subscription.validUntil) newErrors.validUntil = "Fecha requerida";
            if (formData.subscription.maxBranches < 1) newErrors.maxBranches = "Mínimo 1";
            if (formData.subscription.maxUsers < 1) newErrors.maxUsers = "Mínimo 1";
            if (formData.subscription.maxProducts < 1) newErrors.maxProducts = "Mínimo 1";
        }

        setErrors(newErrors);

        // Si hay errores, disparamos el Shake y mostramos Toast
        if (Object.keys(newErrors).length > 0) {
            setShakeKey(prev => prev + 1); // Dispara la animación CSS de vibración
            
            // Dependiendo de tu implementación de ToastContext (toast.error o toast({type: 'error'}))
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
            const localDate = new Date(formData.subscription.validUntil);
            const payload: CreateCompanyRequest = {
                ...formData,
                subscription: {
                    ...formData.subscription,
                    validUntil: localDate.toISOString() // Transformación estricta a UTC
                }
            };

            // 2. Capturamos la respuesta del backend
            const responseData = await createCompany(payload);
            
            if (toast?.success) toast.success("Empresa y Suscripción registradas exitosamente.");
            
            // 3. Emitimos la data al padre
            onSuccess(responseData);
            handleClose();
        } catch (error: any) {
            console.error("Error creating company:", error);
            if (toast?.error) {
                toast.error(error?.response?.data?.message || "Ocurrió un error al registrar la empresa.");
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

    return (
        <ComerziaModal isOpen={isOpen} onClose={handleClose} title="Registrar Nueva Empresa (Tenant)" size="lg">
            
            <div className="mb-8">
                <ComerziaStepper steps={steps} currentStep={step} />
            </div>

            <div className="min-h-[300px]">
                
                {/* PASO 1: EMPRESA (Antes paso 0) */}
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <ComerziaInput 
                                label="Razón Social" 
                                value={formData.company.legalName} 
                                onChange={(e) => updateCompany('legalName', e.target.value)} 
                                isRequired 
                                error={errors.legalName}
                                shakeKey={shakeKey}
                            />
                        </div>
                        <ComerziaInput 
                            label="Nombre Comercial" 
                            value={formData.company.commercialName} 
                            onChange={(e) => handleCommercialNameChange(e.target.value)} 
                            isRequired 
                            error={errors.commercialName}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput 
                            label="NIT / Tax ID" 
                            value={formData.company.taxId} 
                            onChange={(e) => updateCompany('taxId', e.target.value)} 
                            isRequired 
                            error={errors.taxId}
                            shakeKey={shakeKey}
                        />
                        <div className="col-span-full">
                            <ComerziaInput 
                                label="Slug de Acceso (URL Auto-generada)" 
                                value={formData.company.slug} 
                                disabled // Bloqueado, no editable por el usuario
                                isRequired 
                                error={errors.slug}
                                shakeKey={shakeKey}
                            />
                        </div>
                    </div>
                )}

                {/* PASO 2: PROPIETARIO (OWNER) */}
                {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <h3 className="font-bold text-base-content/70 border-b pb-2 mb-2">Datos del Administrador Root</h3>
                        </div>
                        <ComerziaInput 
                            label="Nombres" 
                            value={formData.owner.firstName} 
                            onChange={(e) => updateOwner('firstName', e.target.value)} 
                            isRequired 
                            error={errors.firstName}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput 
                            label="Apellido Paterno" 
                            value={formData.owner.paternalSurname} 
                            onChange={(e) => updateOwner('paternalSurname', e.target.value)} 
                            isRequired 
                            error={errors.paternalSurname}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput 
                            label="Apellido Materno" 
                            value={formData.owner.maternalSurname || ''} 
                            onChange={(e) => updateOwner('maternalSurname', e.target.value)} 
                        />
                        
                        <ComerziaSelect 
                            label="Tipo de Documento" 
                            options={options[DICTIONARIES.DOCUMENT_TYPE]} 
                            isLoading={isLoadingDicts}
                            value={formData.owner.documentType} 
                            onChange={(e) => updateOwner('documentType', e.target.value)} 
                            isRequired 
                            error={errors.documentType}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput 
                            label="Número de Documento" 
                            value={formData.owner.documentNumber} 
                            onChange={(e) => {
                                const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 12);
                                updateOwner('documentNumber', soloNumeros);
                            }} 
                            isRequired 
                            error={errors.documentNumber}
                            shakeKey={shakeKey}
                        />
                        <ComerziaSelect 
                            label="Extensión" 
                            options={options[DICTIONARIES.DOCUMENT_EXTENSION]} 
                            isLoading={isLoadingDicts}
                            value={formData.owner.extension || ''} 
                            onChange={(e) => updateOwner('extension', e.target.value)} 
                            isRequired 
                            error={errors.extension}
                            shakeKey={shakeKey}
                        />

                        <ComerziaInput 
                            label="Correo Electrónico" 
                            type="email"
                            value={formData.owner.email} 
                            onChange={(e) => updateOwner('email', e.target.value)} 
                            isRequired 
                            error={errors.email}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput 
                            label="Teléfono" 
                            value={formData.owner.phoneNumber} 
                            onChange={(e) => {
                                const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 8);
                                updateOwner('phoneNumber', soloNumeros);
                            }} 
                            isRequired 
                            error={errors.phoneNumber}
                            shakeKey={shakeKey}
                            placeholder="ej. 71234567" 
                        />
                    </div>
                )}

                {/* PASO 3: SUSCRIPCIÓN */}
                {step === 3 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <h3 className="font-bold text-base-content/70 border-b pb-2 mb-2">Parámetros de Suscripción</h3>
                        </div>
                        <div className="col-span-full md:col-span-1">
                            <ComerziaSelect 
                                label="Plan Inicial" 
                                options={options[DICTIONARIES.PLAN_TYPE]} 
                                isLoading={isLoadingDicts}
                                value={formData.subscription.planType} 
                                onChange={(e) => updateSubscription('planType', e.target.value)} 
                                isRequired 
                                error={errors.planType}
                                shakeKey={shakeKey}
                            />
                        </div>
                        <div className="col-span-full md:col-span-1">
                            {/* Fallback de error para el Input Nativo de Fecha */}
                            <div className="form-control w-full">
                                <label className="label">
                                    <span className={`label-text font-semibold ${errors.validUntil ? 'text-error' : ''}`}>
                                        Válido Hasta *
                                    </span>
                                </label>
                                <input 
                                    type="datetime-local" 
                                    className={`input input-bordered w-full bg-base-100 ${errors.validUntil ? 'input-error animate-shake' : ''}`} 
                                    value={formData.subscription.validUntil}
                                    onChange={(e) => updateSubscription('validUntil', e.target.value)}
                                    required
                                />
                                {errors.validUntil && <span className="text-xs text-error mt-1">{errors.validUntil}</span>}
                            </div>
                        </div>

                        <ComerziaInput 
                            label="Max. Sucursales" 
                            type="number"
                            value={String(formData.subscription.maxBranches)} 
                            onChange={(e) => updateSubscription('maxBranches', Number(e.target.value))} 
                            isRequired 
                            error={errors.maxBranches}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput 
                            label="Max. Usuarios" 
                            type="number"
                            value={String(formData.subscription.maxUsers)} 
                            onChange={(e) => updateSubscription('maxUsers', Number(e.target.value))} 
                            isRequired 
                            error={errors.maxUsers}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput 
                            label="Max. Productos" 
                            type="number"
                            value={String(formData.subscription.maxProducts)} 
                            onChange={(e) => updateSubscription('maxProducts', Number(e.target.value))} 
                            isRequired 
                            error={errors.maxProducts}
                            shakeKey={shakeKey}
                        />
                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="flex justify-between mt-8 pt-4 border-t border-base-200">
                <div>
                    {step > 1 && (
                        <BtnBack onClick={handlePrev} disabled={isSaving} />
                    )}
                </div>
                <div className="flex gap-2">
                    <BtnCancel onClick={handleClose} disabled={isSaving} />
                    
                    {step < steps.length ? (
                        <BtnNext onClick={handleNext} />
                    ) : (
                        <BtnSave onClick={handleSubmit} isLoading={isSaving} />
                    )}
                </div>
            </div>
        </ComerziaModal>
    );
};