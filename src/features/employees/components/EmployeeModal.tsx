// src/features/employees/components/EmployeeModal.tsx
import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaSelectableCard } from '../../../components/ui/ComerziaSelectableCard';
import { BtnSave, BtnCancel, BtnNext, BtnBack } from '../../../components/ui/CrudButtons';
import { ComerziaStepper } from '../../../components/ui/ComerziaStepper';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { employeeService } from '../services/employeeService';
import { branchService } from '../../organization/services/branchService';
import { userService } from '../../security/services/userService';
import { useToast } from '../../../context/ToastContext';
import { SubscriptionLimitModal } from '../../../components/ui/SubscriptionLimitModal';
import type { EmployeeSummaryResponse, EmployeeCreatedResponse } from '../types/employee';
import type { RoleResponse } from '../../security/types/user';
import type { BranchResponse } from '../../organization/types/branch';

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

  const [backendLimitError, setBackendLimitError] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  // Pasos del Stepper:
  // En creación: Personales -> Roles -> Contrato (para saber si es OWNER antes de requerir sucursal)
  // En edición: Personales -> Contrato
  const STEPS = isEditing ? ['Personales', 'Contrato'] : ['Personales', 'Roles', 'Contrato'];
  const [currentStep, setCurrentStep] = useState(1);

  // Identificadores de paso activo
  const isRolesStep = !isEditing && currentStep === 2;
  const isContractStep = isEditing ? currentStep === 2 : currentStep === 3;

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

  // Roles del sistema y roles seleccionados
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);

  // Datos externos (Sucursales)
  const [branches, setBranches] = useState<{ value: string | number; label: string }[]>([]);
  const [isLoadingExternals, setIsLoadingExternals] = useState(false);

  // Evaluar si el rol escogido (o actual si se edita) es OWNER
  const isChosenRoleOwner = roles.some(
    r =>
      selectedRoleIds.includes(r.id) &&
      (r.name.toUpperCase() === 'OWNER' || r.displayName?.toUpperCase().includes('OWNER'))
  );

  const isTargetOwner = isEditing
    ? Boolean(
        employee?.roleNames?.some(name => name.toUpperCase().includes('OWNER')) ||
        (employee?.roleIds &&
          roles.some(
            r =>
              (r.name.toUpperCase() === 'OWNER' || r.displayName?.toUpperCase().includes('OWNER')) &&
              employee.roleIds?.includes(r.id)
          ))
      )
    : isChosenRoleOwner;

  useEffect(() => {
    if (isOpen) {
      setShakeKey(0);
      setCurrentStep(1);
      setSelectedRoleIds([]);
      loadExternalData();
      if (employee) {
        loadEmployeeDetails(employee.id);
      } else {
        resetForm();
      }
    } else {
      setShakeKey(0);
    }
  }, [isOpen, employee]);

  const loadExternalData = async () => {
    setIsLoadingExternals(true);
    try {
      const promises: Promise<any>[] = [branchService.getBranches(0, 100)];
      if (!isEditing) {
        promises.push(userService.getAllRoles());
      }

      const results = await Promise.allSettled(promises);
      const branchesRes = results[0];
      const rolesRes = !isEditing ? results[1] : null;

      if (branchesRes && branchesRes.status === 'fulfilled') {
        setBranches(branchesRes.value.content.map((b: BranchResponse) => ({ value: b.id, label: b.name })));
      }
      if (rolesRes && rolesRes.status === 'fulfilled') {
        setRoles(rolesRes.value);
      }
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
        baseSalary: detail.baseSalary !== undefined && detail.baseSalary !== null ? detail.baseSalary : ''
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
    setShakeKey(0);
    setSelectedRoleIds([]);
  };

  // Limpiar inputs a solo números y aplicar longitud máxima
  const handleNumericInput = (val: string, maxLen: number) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.slice(0, maxLen);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds(prev =>
      prev.includes(roleId) ? prev.filter(id => id !== roleId) : [...prev, roleId]
    );
  };

  const validateStep = (step: number) => {
    if (step === 1) {
      // Nombres es obligatorio
      if (!person.firstName.trim()) return false;
      // Al menos un apellido
      if (!person.paternalSurname.trim() && !person.maternalSurname.trim()) return false;
      // Email opcional, pero si se escribe debe ser válido
      if (person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) return false;
      return true;
    }

    if (!isEditing) {
      // EN CREACIÓN:
      // Paso 2: Roles (obligatorio al menos un rol)
      if (step === 2) {
        if (selectedRoleIds.length === 0) return false;
        return true;
      }
      // Paso 3: Contrato (Sucursal obligatoria salvo que el rol escogido sea OWNER)
      if (step === 3) {
        if (!isTargetOwner && !contract.branchId) return false;
        if (contract.baseSalary !== '' && Number(contract.baseSalary) < 0) return false;
        return true;
      }
    } else {
      // EN EDICIÓN:
      // Paso 2: Contrato (Sucursal obligatoria salvo que el rol sea OWNER)
      if (step === 2) {
        if (!isTargetOwner && !contract.branchId) return false;
        if (contract.baseSalary !== '' && Number(contract.baseSalary) < 0) return false;
        return true;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep(currentStep)) {
      setShakeKey(prev => prev + 1);
      return;
    }
    setShakeKey(0);
    setCurrentStep(prev => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setShakeKey(0);
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setShakeKey(prev => prev + 1);
      return;
    }

    setIsLoading(true);
    try {
      const personPayload = {
        firstName: person.firstName.trim(),
        paternalSurname: person.paternalSurname.trim() || undefined,
        maternalSurname: person.maternalSurname.trim() || undefined,
        documentType: person.documentType ? Number(person.documentType) : undefined,
        documentNumber: person.documentNumber.trim() || undefined,
        extension: person.extension ? Number(person.extension) : undefined,
        phoneNumber: person.phoneNumber.trim() || undefined,
        email: person.email.trim() || undefined
      };

      const contractPayload = {
        branchId: isTargetOwner ? null : (contract.branchId || null),
        employmentStartDate: contract.employmentStartDate || null,
        employmentEndDate: contract.employmentEndDate || null,
        baseSalary: contract.baseSalary !== '' ? Number(contract.baseSalary) : undefined,
        paymentFrequency: contract.paymentFrequency ? Number(contract.paymentFrequency) : undefined
      };

      if (isEditing) {
        await employeeService.update(employee.id, {
          person: personPayload,
          contract: contractPayload
        });
        onSaved();
      } else {
        const response = await employeeService.create({
          person: personPayload,
          contract: contractPayload,
          user: {
            roleIds: selectedRoleIds
          }
        });
        onSaved(response);
      }
      setShakeKey(0);
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

  const handleModalClose = () => {
    setShakeKey(0);
    onClose();
  };

  return (
    <>
      <ComerziaModal
        isOpen={isOpen}
        onClose={handleModalClose}
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
                error={!person.firstName.trim() && shakeKey > 0 ? 'Requerido' : ''}
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
                    !person.paternalSurname.trim() && !person.maternalSurname.trim() && shakeKey > 0
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
                    !person.paternalSurname.trim() && !person.maternalSurname.trim() && shakeKey > 0
                      ? 'Al menos un apellido es requerido'
                      : ''
                  }
                />
              </div>

              {/* Fila de Documentos (Opcionales) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5">
                  <ComerziaSelect
                    label="Tipo Doc."
                    options={options[DICTIONARIES.DOCUMENT_TYPE] || []}
                    value={person.documentType}
                    onChange={e => setPerson({ ...person, documentType: e.target.value })}
                    isLoading={isLoadingDicts}
                    enableDefaultOption
                    shakeKey={shakeKey}
                  />
                </div>
                <div className="md:col-span-4">
                  <ComerziaInput
                    label="Nro Doc."
                    value={person.documentNumber}
                    onChange={e => setPerson({ ...person, documentNumber: handleNumericInput(e.target.value, 12) })}
                    shakeKey={shakeKey}
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
                    shakeKey={shakeKey}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ComerziaInput
                  label="Teléfono"
                  value={person.phoneNumber}
                  onChange={e => setPerson({ ...person, phoneNumber: handleNumericInput(e.target.value, 8) })}
                  shakeKey={shakeKey}
                />
                <ComerziaInput
                  label="Email"
                  type="email"
                  value={person.email}
                  onChange={e => setPerson({ ...person, email: e.target.value })}
                  shakeKey={shakeKey}
                  error={
                    person.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email) && shakeKey > 0
                      ? 'Email inválido'
                      : ''
                  }
                />
              </div>
            </div>
          )}

          {/* --- PASO 2 EN CREACIÓN: ROLES --- */}
          {isRolesStep && (
            <div className="bg-base-200/50 p-5 rounded-xl space-y-4 animate-fade-in">
              <div className="border-b pb-2">
                <h3 className="font-bold text-lg">Asignación de Roles</h3>
                <p className="text-xs text-base-content/70 mt-0.5">
                  Selecciona los roles de seguridad que tendrá asignados el nuevo empleado en el sistema.
                </p>
              </div>

              {isLoadingExternals ? (
                <div className="flex flex-col items-center justify-center p-8 space-y-2">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <span className="text-xs text-base-content/60">Cargando catálogo de roles...</span>
                </div>
              ) : roles.length === 0 ? (
                <div className="text-center py-6 text-sm text-base-content/60">
                  No se encontraron roles disponibles.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-1">
                  {roles.map(role => (
                    <ComerziaSelectableCard
                      key={role.id}
                      title={role.displayName || role.name}
                      description={role.description}
                      selected={selectedRoleIds.includes(role.id)}
                      onClick={() => toggleRole(role.id)}
                      className="!p-3.5"
                    />
                  ))}
                </div>
              )}

              {selectedRoleIds.length === 0 && shakeKey > 0 && (
                <span className="text-xs font-semibold text-error block animate-shake">
                  * Debe asignar al menos un rol al nuevo empleado.
                </span>
              )}
            </div>
          )}

          {/* --- CONTRATO (PASO 3 EN CREACIÓN O PASO 2 EN EDICIÓN) --- */}
          {isContractStep && (
            <div className="bg-base-200/50 p-5 rounded-xl space-y-4 animate-fade-in">
              <h3 className="font-bold text-lg border-b pb-2">Contacto y Contrato</h3>

              {!isTargetOwner && (
                <ComerziaSelect
                  label="Sucursal Asignada"
                  options={branches}
                  value={contract.branchId}
                  onChange={e => setContract({ ...contract, branchId: e.target.value })}
                  isLoading={isLoadingExternals}
                  enableDefaultOption
                  isRequired
                  shakeKey={shakeKey}
                  error={!contract.branchId && shakeKey > 0 ? 'Requerido' : ''}
                />
              )}

              {isEditing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ComerziaInput
                    label="Fecha Inicio Contrato"
                    type="date"
                    value={contract.employmentStartDate}
                    onChange={e => setContract({ ...contract, employmentStartDate: e.target.value })}
                    shakeKey={shakeKey}
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
                  shakeKey={shakeKey}
                />
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <ComerziaInput
                  label="Salario Base"
                  type="number"
                  value={contract.baseSalary}
                  onChange={e => setContract({ ...contract, baseSalary: e.target.value })}
                  shakeKey={shakeKey}
                />
                <ComerziaSelect
                  label="Frecuencia Pago"
                  options={options[DICTIONARIES.PAYMENT_FREQUENCY] || []}
                  value={contract.paymentFrequency}
                  onChange={e => setContract({ ...contract, paymentFrequency: e.target.value })}
                  isLoading={isLoadingDicts}
                  enableDefaultOption
                  shakeKey={shakeKey}
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
              <BtnCancel onClick={handleModalClose} disabled={isLoading} responsive={true} className="w-full sm:w-auto min-w-0" />
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
