import { ComerziaModal } from '../../../../components/ui/ComerziaModal';
import { ComerziaStepper } from '../../../../components/ui/ComerziaStepper';
import { ComerziaInput } from '../../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../../components/ui/ComerziaSelect';
import { BtnBack, BtnNext, BtnCancel, BtnSave } from '../../../../components/ui/CrudButtons';
import { DICTIONARIES } from '../../../../config/dictionaries';
import { useCompanyOnboarding, type CompanyOnboardingOptions } from '../../hooks/useCompanyOnboarding';

export const CreateCompanyWizard = (props: CompanyOnboardingOptions) => {
    const { isOpen } = props;
    const { step, formData, isSaving, errors, shakeKey, options, isLoadingDicts, catalog, requiresExpiry, steps,
        updateCompany, updateOwner, updateSubscription, handleCommercialNameChange, handleNext, handlePrev, handleSubmit, handleClose } = useCompanyOnboarding(props);
    return (
        <ComerziaModal isOpen={isOpen} onClose={() => { if (!isSaving) handleClose(); }} title="Registrar nueva empresa" size="lg">

            <div className="mb-8">
                <ComerziaStepper steps={steps} currentStep={step} />
            </div>

            <div className="min-h-[300px]">

                {/* PASO 1: EMPRESA (Antes paso 0) */}
                {step === 1 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <ComerziaInput
                                label="Razón Social" aria-label="Razón Social"
                                value={formData.company.legalName}
                                onChange={(e) => updateCompany('legalName', e.target.value)}
                                error={errors.legalName}
                                shakeKey={shakeKey}
                            />
                        </div>
                        <ComerziaInput
                            label="Nombre Comercial" aria-label="Nombre Comercial"
                            value={formData.company.commercialName}
                            onChange={(e) => handleCommercialNameChange(e.target.value)}
                            isRequired
                            error={errors.commercialName}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput
                            label="NIT / Tax ID" aria-label="NIT / Tax ID"
                            value={formData.company.taxId}
                            onChange={(e) => updateCompany('taxId', e.target.value)}
                            error={errors.taxId}
                            shakeKey={shakeKey}
                        />

                    </div>
                )}

                {/* PASO 2: PROPIETARIO (OWNER) */}
                {step === 2 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-full">
                            <h3 className="font-bold text-base-content/70 border-b pb-2 mb-2">Datos del propietario de la empresa</h3>
                        </div>
                        <ComerziaInput
                            label="Nombres" aria-label="Nombres"
                            value={formData.owner.firstName}
                            onChange={(e) => updateOwner('firstName', e.target.value)}
                            isRequired
                            error={errors.firstName}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput
                            label="Apellido Paterno" aria-label="Apellido Paterno"
                            value={formData.owner.paternalSurname}
                            onChange={(e) => updateOwner('paternalSurname', e.target.value)}
                            error={errors.paternalSurname}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput
                            label="Apellido Materno" aria-label="Apellido Materno"
                            value={formData.owner.maternalSurname || ''}
                            onChange={(e) => updateOwner('maternalSurname', e.target.value)}
                        />

                        <ComerziaSelect
                            label="Tipo de Documento" aria-label="Tipo de Documento"
                            options={options[DICTIONARIES.DOCUMENT_TYPE]}
                            isLoading={isLoadingDicts}
                            value={formData.owner.documentType ?? ''}
                            onChange={(e) => updateOwner('documentType', e.target.value)}
                            error={errors.documentType}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput
                            label="Número de Documento" aria-label="Número de Documento"
                            value={formData.owner.documentNumber}
                            onChange={(e) => {
                                updateOwner('documentNumber', e.target.value);
                            }}
                            error={errors.documentNumber}
                            shakeKey={shakeKey}
                        />
                        <ComerziaSelect
                            label="Extensión" aria-label="Extensión"
                            options={options[DICTIONARIES.DOCUMENT_EXTENSION]}
                            isLoading={isLoadingDicts}
                            value={formData.owner.extension || ''}
                            onChange={(e) => updateOwner('extension', e.target.value)}
                            error={errors.extension}
                            shakeKey={shakeKey}
                        />

                        <ComerziaInput
                            label="Correo Electrónico" aria-label="Correo Electrónico"
                            type="email"
                            value={formData.owner.email}
                            onChange={(e) => updateOwner('email', e.target.value)}
                            isRequired
                            error={errors.email}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput
                            label="Teléfono" aria-label="Teléfono"
                            value={formData.owner.phoneNumber}
                            onChange={(e) => {
                                updateOwner('phoneNumber', e.target.value);
                            }}
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
                                label="Plan Inicial" aria-label="Plan Inicial"
                                options={options[DICTIONARIES.PLAN_TYPE]}
                                isLoading={isLoadingDicts}
                                value={formData.subscription.planTypeCode}
                                onChange={(e) => updateSubscription('planTypeCode', e.target.value)}
                                isRequired
                                error={errors.planTypeCode}
                                shakeKey={shakeKey}
                            />
                        </div>
                        {requiresExpiry && <ComerziaInput label="Vigencia del plan" aria-label="Vigencia del plan" type="datetime-local" isRequired
                            value={formData.subscription.validUntil ?? ''} onChange={event => updateSubscription('validUntil',event.target.value)}
                            error={errors.validUntil} shakeKey={shakeKey} />}
                        {!requiresExpiry && <p className="text-sm text-base-content/60 self-center">Este plan no tiene vencimiento.</p>}

                        <ComerziaInput
                            label="Sucursales adicionales" aria-label="Sucursales adicionales"
                            type="number" min={0} step={1}
                            value={String(formData.subscription.extraBranches)}
                            onChange={(e) => updateSubscription('extraBranches', Number(e.target.value))}
                            isRequired
                            error={errors.extraBranches}
                            shakeKey={shakeKey}
                        />
                        <ComerziaInput
                            label="Usuarios adicionales" aria-label="Usuarios adicionales"
                            type="number" min={0} step={1}
                            value={String(formData.subscription.extraUsers)}
                            onChange={(e) => updateSubscription('extraUsers', Number(e.target.value))}
                            isRequired
                            error={errors.extraUsers}
                            shakeKey={shakeKey}
                        />

                    </div>
                )}
            </div>

            {/* FOOTER */}
            <div className="flex flex-row items-center gap-2 mt-6 pt-3 border-t border-base-200 w-full sm:justify-between">
                <div>
                    {step > 1 && (
                        <BtnBack onClick={handlePrev} disabled={isSaving} responsive={false} className="min-w-0" />
                    )}
                </div>
                <div className="flex flex-1 sm:flex-none justify-end gap-2">
                    <BtnCancel onClick={handleClose} disabled={isSaving} responsive={true} className="flex-1 sm:flex-none sm:w-auto min-w-0" />

                    {step < steps.length ? (
                        <BtnNext onClick={handleNext} responsive={false} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
                    ) : (
                        <BtnSave disabled={catalog.isPending || catalog.isError} responsive={false} onClick={handleSubmit} isLoading={isSaving} className="flex-1 sm:flex-none sm:w-auto min-w-0" />
                    )}
                </div>
            </div>
        </ComerziaModal>
    );
};
