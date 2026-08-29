// src/features/employees/components/EmployeeModal.tsx
import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnSave, BtnCancel, BtnNext, BtnBack } from '../../../components/ui/CrudButtons';
import { ComerziaStepper } from '../../../components/ui/ComerziaStepper';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { employeeService } from '../services/employeeService';
import { branchService } from '../../organization/services/branchService';
import { useToast } from '../../../context/ToastContext';
import { SubscriptionLimitModal } from '../../../components/ui/SubscriptionLimitModal';
import type { EmployeeSummaryResponse, EmployeeCreatedResponse } from '../types/employee';
import { useAuthStore } from '../../../stores/useAuthStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (data?: EmployeeCreatedResponse) => void;
  employee: EmployeeSummaryResponse | null;
}

export const EmployeeModal = ({ isOpen, onClose, onSaved, employee }: Props) => {
  const isEditing = !!employee;
  const { options, isLoading: isLoadingDicts } = useLoadDictionaries([
    DICTIONARIES.DOCUMENT_TYPE,
    DICTIONARIES.DOCUMENT_EXTENSION,
    DICTIONARIES.PAYMENT_FREQUENCY
  ]);
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const isCurrentUserOwner = userProfile?.roles?.includes('OWNER') || false;

  const [backendLimitError, setBackendLimitError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Pasos del Stepper
  const STEPS = ['Personales', 'Contrato'];
  const [currentStep, setCurrentStep] = useState(1);

  // Formularios
  const [person, setPerson] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    documentType: '' as string | number,
    documentNumber: '',
    extension: '' as string | number,
    phoneNumber: '',
    email: ''
  });

  const [contract, setContract] = useState({
    branchId: '' as string,
    employmentStartDate: '',
    employmentEndDate: '',
    paymentFrequency: '' as string | number,
    baseSalary: '' as string | number
  });

  // Datos externos
  const [branches, setBranches] = useState<{ value: string | number; label: string }[]>([]);
  const [isLoadingExternals, setIsLoadingExternals] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      loadExternalData();
      if (employee) {
        loadEmployeeDetails(employee.id);
      } else {
        resetForm();
      }
    }
  }, [isOpen, employee]);

  const loadExternalData = async () => {
    setIsLoadingExternals(true);
    try {
      const branchesRes = await branchService.getBranches(0, 100);
      setBranches(branchesRes.content.map(b => ({ value: b.id, label: b.name })));
    } catch (error) {
      console.error('Error loading external data:', error);
    } finally {
      setIsLoadingExternals(false);
    }
  };

  const loadEmployeeDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const detail = await employeeService.getById(id);

      setPerson({
        firstName: detail.firstName || '',
        paternalSurname: detail.paternalSurname || '',
        maternalSurname: detail.maternalSurname || '',
        documentType: detail.documentType?.code || '',
        documentNumber: detail.documentNumber || '',
        extension: detail.documentExtension?.code || '',
        phoneNumber: detail.phoneNumber || '',
        email: detail.email || ''
      });

      setContract({
        branchId: detail.branchId || '',
        employmentStartDate: detail.employmentStartDate || '',
        employmentEndDate: detail.employmentEndDate || '',
        paymentFrequency: detail.paymentFrequency?.code || '',
        baseSalary: detail.baseSalary || ''
      });
    } catch (error) {
      console.error('Error loading employee details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setPerson({
      firstName: '',
      paternalSurname: '',
      maternalSurname: '',
      documentType: '',
      documentNumber: '',
      extension: '',
      phoneNumber: '',
      email: ''
    });
    setContract({
      branchId: '',
      employmentStartDate: '',
      employmentEndDate: '',
      paymentFrequency: '',
      baseSalary: ''
    });
  };

  // Limpiar inputs a solo números y aplicar longitud máxima
  const handleNumericInput = (val: string, maxLen: number) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.slice(0, maxLen);
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      if (!person.firstName || !person.documentType || !person.documentNumber || !person.extension || !person.phoneNumber || !person.email)
        return false;
      if (!person.paternalSurname && !person.maternalSurname) return false;
      if (person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) return false;
      return true;
    }
    if (step === 2) {
      if ((!isCurrentUserOwner && !contract.branchId) || !contract.paymentFrequency || !contract.baseSalary || !contract.employmentStartDate)
        return false;
      return true;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setShakeKey(prev => prev + 1);
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing) {
        await employeeService.update(employee.id, {
          firstName: person.firstName,
          paternalSurname: person.paternalSurname || '',
          maternalSurname: person.maternalSurname || '',
          documentType: Number(person.documentType),
          documentNumber: person.documentNumber,
          documentExtension: person.extension ? Number(person.extension) : undefined,
          phoneNumber: person.phoneNumber || '',
          email: person.email || '',
          branchId: contract.branchId || null,
          employmentStartDate: contract.employmentStartDate,
          employmentEndDate: contract.employmentEndDate || null,
          baseSalary: contract.baseSalary ? Number(contract.baseSalary) : undefined,
          paymentFrequency: Number(contract.paymentFrequency)
        });
        onSaved();
      } else {
        const response = await employeeService.create({
          person: {
            firstName: person.firstName,
            paternalSurname: person.paternalSurname || '',
            maternalSurname: person.maternalSurname || '',
            documentType: Number(person.documentType),
            documentNumber: person.documentNumber,
            extension: person.extension ? Number(person.extension) : undefined,
            phoneNumber: person.phoneNumber || '',
            email: person.email || ''
          },
          contract: {
            branchId: contract.branchId || null,
            employmentStartDate: contract.employmentStartDate,
            paymentFrequency: Number(contract.paymentFrequency),
            baseSalary: contract.baseSalary ? Number(contract.baseSalary) : undefined
          }
        });
        onSaved(response);
      }
      onClose();
    } catch (err: any) {
      console.error('Error saving employee:', err);

      // VALIDACIÓN LÍMITES DE SUSCRIPCIÓN (HTTP 400 - Employee subscription limit reached for current plan)
      const errCode = err.response?.data?.code;
      const status = err.response?.status;
      const apiMsg = err.response?.data?.message || err.response?.data?.error || '';

      if (
        errCode === 'business_rule_violation' ||
        errCode === 'employee_subscription_limit' ||
        errCode === 'subscription_limit_reached' ||
        (status === 400 && (apiMsg.toLowerCase().includes('limit') || apiMsg.toLowerCase().includes('subscription')))
      ) {
        setBackendLimitError(apiMsg || 'Employee subscription limit reached for current plan');
        setIsLoading(false);
        return;
      }

      if (apiMsg) {
        toastError(apiMsg);
      } else if (err.response?.data) {
        toastError(JSON.stringify(err.response.data).slice(0, 150));
      } else {
        toastError('Error al guardar el empleado. Verifica los datos.');
      }
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ComerziaModal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Editar Empleado' : 'Nuevo Empleado'}
        size="lg"
      >
        <div className="flex flex-col gap-4">
          {/* Stepper Header */}
          <ComerziaStepper steps={STEPS} currentStep={currentStep} className="mt-2" />

          {/* --- PASO 1: PERSONALES --- */}
          {currentStep === 1 && (
            <div className="bg-base-200/50 p-5 rounded-xl space-y-4 animate-fade-in">
              <h3 className="font-bold text-lg border-b pb-2">Datos Personales</h3>
              <ComerziaInput
                label="Nombres"
                value={person.firstName}
                onChange={e => setPerson({ ...person, firstName: e.target.value })}
                isRequired
                shakeKey={shakeKey}
                error={!person.firstName && shakeKey > 0 ? 'Requerido' : ''}
                disabled={isEditing && !!person.firstName}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ComerziaInput
                  label="Ap. Paterno"
                  value={person.paternalSurname}
                  onChange={e => setPerson({ ...person, paternalSurname: e.target.value })}
                  isRequired={!person.maternalSurname}
                  shakeKey={shakeKey}
                  error={
                    !person.paternalSurname && !person.maternalSurname && shakeKey > 0
                      ? 'Al menos un apellido es requerido'
                      : ''
                  }
                />
                <ComerziaInput
                  label="Ap. Materno"
                  value={person.maternalSurname}
                  onChange={e => setPerson({ ...person, maternalSurname: e.target.value })}
                  isRequired={!person.paternalSurname}
                  shakeKey={shakeKey}
                  error={
                    !person.paternalSurname && !person.maternalSurname && shakeKey > 0
                      ? 'Al menos un apellido es requerido'
                      : ''
                  }
                />
              </div>

              {/* Fila de Documentos */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <ComerziaSelect
                    label="Tipo Doc."
                    options={options[DICTIONARIES.DOCUMENT_TYPE] || []}
                    value={person.documentType}
                    onChange={e => setPerson({ ...person, documentType: e.target.value })}
                    isLoading={isLoadingDicts}
                    enableDefaultOption
                    isRequired
                    shakeKey={shakeKey}
                    error={!person.documentType && shakeKey > 0 ? 'Requerido' : ''}
                  />
                </div>
                <div className="md:col-span-4">
                  <ComerziaInput
                    label="Nro Doc."
                    value={person.documentNumber}
                    onChange={e => setPerson({ ...person, documentNumber: handleNumericInput(e.target.value, 12) })}
                    isRequired
                    shakeKey={shakeKey}
                    error={!person.documentNumber && shakeKey > 0 ? 'Requerido' : ''}
                  />
                </div>
                <div className="md:col-span-3">
                  <ComerziaSelect
                    label="Ext."
                    options={options[DICTIONARIES.DOCUMENT_EXTENSION] || []}
                    value={person.extension}
                    onChange={e => setPerson({ ...person, extension: e.target.value })}
                    isLoading={isLoadingDicts}
                    enableDefaultOption
                    isRequired
                    shakeKey={shakeKey}
                    error={!person.extension && shakeKey > 0 ? 'Requerido' : ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ComerziaInput
                  label="Teléfono"
                  value={person.phoneNumber}
                  onChange={e => setPerson({ ...person, phoneNumber: handleNumericInput(e.target.value, 8) })}
                  isRequired
                  shakeKey={shakeKey}
                  error={!person.phoneNumber && shakeKey > 0 ? 'Requerido' : ''}
                />
                <ComerziaInput
                  label="Email"
                  type="email"
                  value={person.email}
                  onChange={e => setPerson({ ...person, email: e.target.value })}
                  isRequired
                  shakeKey={shakeKey}
                  error={
                    !person.email && shakeKey > 0
                      ? 'Requerido'
                      : person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email) && shakeKey > 0
                      ? 'Email inválido'
                      : ''
                  }
                />
              </div>
            </div>
          )}

          {/* --- PASO 2: CONTRATO --- */}
          {currentStep === 2 && (
            <div className="bg-base-200/50 p-5 rounded-xl space-y-4 animate-fade-in">
              <h3 className="font-bold text-lg border-b pb-2">Contacto y Contrato</h3>

              <ComerziaSelect
                label="Sucursal Asignada"
                options={branches}
                value={contract.branchId}
                onChange={e => setContract({ ...contract, branchId: e.target.value })}
                isLoading={isLoadingExternals}
                enableDefaultOption
                isRequired={!isCurrentUserOwner}
                shakeKey={shakeKey}
                error={!isCurrentUserOwner && !contract.branchId && shakeKey > 0 ? 'Requerido' : ''}
              />

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ComerziaInput
                    label="Fecha Inicio Contrato"
                    type="date"
                    value={contract.employmentStartDate}
                    onChange={e => setContract({ ...contract, employmentStartDate: e.target.value })}
                    isRequired
                    shakeKey={shakeKey}
                    error={!contract.employmentStartDate && shakeKey > 0 ? 'Requerido' : ''}
                  />
                  <ComerziaInput
                    label="Fecha Fin Contrato"
                    type="date"
                    value={contract.employmentEndDate}
                    onChange={e => setContract({ ...contract, employmentEndDate: e.target.value })}
                  />
                </div>
              ) : (
                <ComerziaInput
                  label="Fecha Inicio Contrato"
                  type="date"
                  value={contract.employmentStartDate}
                  onChange={e => setContract({ ...contract, employmentStartDate: e.target.value })}
                  isRequired
                  shakeKey={shakeKey}
                  error={!contract.employmentStartDate && shakeKey > 0 ? 'Requerido' : ''}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ComerziaInput
                  label="Salario Base"
                  type="number"
                  value={contract.baseSalary}
                  onChange={e => setContract({ ...contract, baseSalary: e.target.value })}
                  isRequired
                  shakeKey={shakeKey}
                  error={!contract.baseSalary && shakeKey > 0 ? 'Requerido' : ''}
                />
                <ComerziaSelect
                  label="Frecuencia Pago"
                  options={options[DICTIONARIES.PAYMENT_FREQUENCY] || []}
                  value={contract.paymentFrequency}
                  onChange={e => setContract({ ...contract, paymentFrequency: e.target.value })}
                  isLoading={isLoadingDicts}
                  enableDefaultOption
                  isRequired
                  shakeKey={shakeKey}
                  error={!contract.paymentFrequency && shakeKey > 0 ? 'Requerido' : ''}
                />
              </div>
            </div>
          )}
        </div>

        {/* FOOTER DEL MODAL */}
        <div className="flex flex-row items-center gap-2 border-t border-base-200 mt-6 pt-4 w-full sm:justify-between">
          <div className="flex-1 sm:flex-none">
            {currentStep > 1 ? (
              <BtnBack onClick={handleBack} disabled={isLoading} responsive={true} className="w-full sm:w-auto min-w-0" />
            ) : (
              <BtnCancel onClick={onClose} disabled={isLoading} responsive={true} className="w-full sm:w-auto min-w-0" />
            )}
          </div>

          <div className="flex-1 sm:flex-none">
            {currentStep < STEPS.length ? (
              <BtnNext onClick={handleNext} disabled={isLoading} responsive={true} className="w-full sm:w-auto min-w-0" />
            ) : (
              <BtnSave onClick={handleSubmit} isLoading={isLoading} responsive={true} className="w-full sm:w-auto min-w-0" />
            )}
          </div>
        </div>
      </ComerziaModal>

      <SubscriptionLimitModal
        isOpen={!!backendLimitError}
        onClose={() => setBackendLimitError(null)}
        backendMessage={backendLimitError || ''}
      />
    </>
  );
};
