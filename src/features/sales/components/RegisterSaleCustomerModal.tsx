import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { salesService } from '../services/salesService';
import { useToast } from '../../../context/ToastContext';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { UserCheck, UserPlus, Info, Search, Phone, CheckCircle2, RotateCcw } from 'lucide-react';
import type { CustomerProfileResponse } from '../types/sales';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  saleNumber?: string | null;
  onSuccess: () => void;
}

export const RegisterSaleCustomerModal = ({ isOpen, onClose, saleId, saleNumber, onSuccess }: Props) => {
  const { options, isLoading: isLoadingDict } = useLoadDictionaries([
    DICTIONARIES.CUSTOMER_TYPE,
    DICTIONARIES.DOCUMENT_TYPE,
    DICTIONARIES.DOCUMENT_EXTENSION
  ]);

  const customerTypeOptions = options[DICTIONARIES.CUSTOMER_TYPE] || [
    { value: '611', label: 'Persona Natural' },
    { value: '612', label: 'Empresa / Jurídico' }
  ];
  const documentTypeOptions = options[DICTIONARIES.DOCUMENT_TYPE] || [
    { value: '101', label: 'Cédula de Identidad (CI)' },
    { value: '102', label: 'Pasaporte' },
    { value: '103', label: 'NIT' },
    { value: '104', label: 'Otro' }
  ];
  const documentExtOptions = options[DICTIONARIES.DOCUMENT_EXTENSION] || [
    { value: '201', label: 'LP - La Paz' },
    { value: '202', label: 'CB - Cochabamba' },
    { value: '203', label: 'SC - Santa Cruz' },
    { value: '204', label: 'OR - Oruro' },
    { value: '205', label: 'PT - Potosí' },
    { value: '206', label: 'TJ - Tarija' },
    { value: '207', label: 'CH - Chuquisaca' },
    { value: '208', label: 'BE - Beni' },
    { value: '209', label: 'PD - Pando' }
  ];

  // Search by Phone State
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [foundCustomer, setFoundCustomer] = useState<CustomerProfileResponse | null>(null);

  // Form Fields
  const [customerType, setCustomerType] = useState('611');
  const [firstName, setFirstName] = useState('');
  const [paternalSurname, setPaternalSurname] = useState('');
  const [maternalSurname, setMaternalSurname] = useState('');
  const [documentType, setDocumentType] = useState('101');
  const [documentNumber, setDocumentNumber] = useState('');
  const [documentExtension, setDocumentExtension] = useState('201');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  const [shakeKey, setShakeKey] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { error: toastError, success: toastSuccess, warning: toastWarning } = useToast();

  // Limpiar inputs a solo números y aplicar longitud máxima (8 dígitos)
  const handleNumericInput = (val: string, maxLen = 8) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.slice(0, maxLen);
  };

  const resetForm = () => {
    setSearchPhone('');
    setFoundCustomer(null);
    setCustomerType('611');
    setFirstName('');
    setPaternalSurname('');
    setMaternalSurname('');
    setDocumentType('101');
    setDocumentNumber('');
    setDocumentExtension('201');
    setPhoneNumber('');
    setEmail('');
    setShakeKey(0);
  };

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  if (!saleId) return null;

  // Buscar cliente existente por celular
  const handleSearchCustomerByPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phone = searchPhone.trim();
    if (!phone) {
      toastWarning("Ingresa un número de celular para buscar.");
      return;
    }

    setIsSearchingPhone(true);
    try {
      const customer = await salesService.getCustomerByPhone(phone);
      if (customer && customer.id) {
        setFoundCustomer(customer);
        // Prellenar campos
        setCustomerType(customer.customerType ? String(customer.customerType) : '611');
        setFirstName(customer.firstName || customer.fullName || '');
        setPaternalSurname(customer.paternalSurname || '');
        setMaternalSurname(customer.maternalSurname || '');
        setDocumentType(customer.documentType ? String(customer.documentType) : '101');
        setDocumentNumber(customer.documentNumber || '');
        setDocumentExtension(customer.documentExtension ? String(customer.documentExtension) : '201');
        setPhoneNumber(customer.phoneNumber ? handleNumericInput(customer.phoneNumber, 8) : phone);
        setEmail(customer.email || '');
        toastSuccess(`Cliente encontrado: ${customer.fullName || customer.firstName}`);
      } else {
        setFoundCustomer(null);
        setPhoneNumber(phone);
        toastWarning("No se encontró cliente registrado con ese número. Completa el formulario para crearlo.");
      }
    } catch (err: any) {
      setFoundCustomer(null);
      setPhoneNumber(phone);
      if (err.response?.status === 404) {
        toastWarning("No se encontró ningún cliente con ese número de teléfono. Puedes registrarlo abajo.");
      } else {
        toastError("Error al consultar el número de teléfono.");
      }
    } finally {
      setIsSearchingPhone(false);
    }
  };

  // Enviar y vincular cliente a la venta
  const handleSubmit = async () => {
    if (foundCustomer) {
      setIsSubmitting(true);
      try {
        await salesService.assignCustomerToSale(saleId, foundCustomer.id);
        toastSuccess("Cliente asignado exitosamente a la venta.");
        onSuccess();
        onClose();
      } catch (e: any) {
        console.error(e);
        const msg = e.response?.data?.message || "Error al asignar el cliente a la venta.";
        toastError(msg);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    const hasSurname = paternalSurname.trim().length > 0 || maternalSurname.trim().length > 0;

    if (!firstName.trim() || !hasSurname || !phoneNumber.trim()) {
      setShakeKey(prev => prev + 1);
      if (!firstName.trim()) {
        toastError("El nombre es obligatorio.");
      } else if (!hasSurname) {
        toastError("Debes ingresar al menos un apellido (paterno o materno).");
      } else if (!phoneNumber.trim()) {
        toastError("El teléfono / celular es obligatorio.");
      }
      return;
    }

    setIsSubmitting(true);
    try {
      await salesService.createCustomerFromSale(saleId, {
        customerType: Number(customerType),
        firstName: firstName.trim(),
        paternalSurname: paternalSurname.trim() || undefined,
        maternalSurname: maternalSurname.trim() || undefined,
        documentType: documentType ? Number(documentType) : undefined,
        documentNumber: documentNumber.trim() || undefined,
        documentExtension: documentExtension ? Number(documentExtension) : undefined,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined
      });

      toastSuccess("Cliente registrado y vinculado exitosamente a la venta.");
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Error al registrar y vincular el cliente.";
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={saleNumber ? `Asignar Cliente - Venta #${saleNumber}` : "Datos del Cliente"}
      size="xl"
    >
      <div className="space-y-5 pt-1">
        {/* Information Banner */}
        <div className="bg-info/10 border border-info/20 p-4 rounded-2xl flex items-center gap-3 text-xs text-base-content">
          <Info size={20} className="text-info shrink-0" />
          <div>
            <p className="font-bold text-base-content">
              {saleNumber ? `Asociar Cliente a la Venta #${saleNumber}` : 'Asociar Cliente a la Venta'}
            </p>
            <p className="text-base-content/70 mt-0.5">
              Puedes buscar a un cliente existente por su número de celular o registrar uno nuevo para vincularlo a esta transacción.
            </p>
          </div>
        </div>

        {/* Sección: Buscar por Celular */}
        <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-base-content flex items-center gap-2">
              <Phone size={16} className="text-primary" />
              Buscar Cliente por Celular
            </h4>
            {foundCustomer && (
              <button
                type="button"
                onClick={resetForm}
                className="btn btn-ghost btn-xs gap-1 text-base-content/60 hover:text-error cursor-pointer"
              >
                <RotateCcw size={12} /> Limpiar / Nuevo
              </button>
            )}
          </div>

          <form onSubmit={handleSearchCustomerByPhone} className="flex gap-2">
            <div className="relative flex-1">
              <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
              <input
                type="tel"
                placeholder="Introduce el número de celular del cliente..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(handleNumericInput(e.target.value, 8))}
                className="input input-bordered w-full pl-10 bg-base-50 focus:bg-base-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <ComerziaButton
              type="submit"
              variant="primary"
              label="Buscar"
              icon={<Search size={15} />}
              isLoading={isSearchingPhone}
              disabled={isSearchingPhone || !searchPhone.trim()}
            />
          </form>

          {/* Tarjeta de Cliente Encontrado */}
          {foundCustomer && (
            <div className="bg-success/10 border border-success/30 p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 size={18} className="text-success shrink-0" />
                <div>
                  <span className="font-bold text-success text-sm block">{foundCustomer.fullName || foundCustomer.firstName}</span>
                  <span className="text-base-content/70">
                    {foundCustomer.documentNumber ? `Documento: ${foundCustomer.documentNumber}` : 'Sin documento registrado'}
                    {foundCustomer.phoneNumber ? ` • Tel: ${foundCustomer.phoneNumber}` : ''}
                  </span>
                </div>
              </div>
              <span className="badge badge-success badge-sm font-semibold">EXISTENTE</span>
            </div>
          )}
        </div>

        {/* Customer Form */}
        <div className="space-y-4 bg-base-100 p-5 rounded-2xl border border-base-200 shadow-xs">
          <div className="flex justify-between items-center border-b border-base-200 pb-2">
            <h4 className="text-sm font-bold text-base-content flex items-center gap-2">
              <UserPlus size={16} className="text-secondary" />
              {foundCustomer ? "Datos del Cliente Encontrado (Modo Lectura)" : "Datos del Nuevo Cliente"}
            </h4>
            {foundCustomer && (
              <span className="text-xs text-base-content/50 italic">
                Para registrar o buscar otro cliente, presiona "Limpiar / Nuevo" arriba.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComerziaSelect
              label="Tipo de Cliente"
              options={customerTypeOptions}
              isLoading={isLoadingDict}
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              disabled={!!foundCustomer}
              isRequired
            />
            <ComerziaInput
              label="Nombres"
              value={firstName}
              uppercase
              onChange={(e) => setFirstName(e.target.value)}
              error={!firstName && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              disabled={!!foundCustomer}
              isRequired
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComerziaInput
              label="Apellido Paterno"
              value={paternalSurname}
              uppercase
              disabled={!!foundCustomer}
              onChange={(e) => setPaternalSurname(e.target.value)}
              shakeKey={shakeKey}
              error={!paternalSurname.trim() && !maternalSurname.trim() && shakeKey > 0 ? "Al menos un apellido" : ""}
            />
            <ComerziaInput
              label="Apellido Materno"
              value={maternalSurname}
              uppercase
              disabled={!!foundCustomer}
              onChange={(e) => setMaternalSurname(e.target.value)}
              shakeKey={shakeKey}
              error={!paternalSurname.trim() && !maternalSurname.trim() && shakeKey > 0 ? "Al menos un apellido" : ""}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ComerziaSelect
              label="Tipo de Documento"
              options={documentTypeOptions}
              isLoading={isLoadingDict}
              value={documentType}
              disabled={!!foundCustomer}
              onChange={(e) => setDocumentType(e.target.value)}
            />
            <ComerziaInput
              label="Nro. Documento / NIT"
              value={documentNumber}
              disabled={!!foundCustomer}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
            <ComerziaSelect
              label="Extensión (Si aplica)"
              options={documentExtOptions}
              isLoading={isLoadingDict}
              value={documentExtension}
              disabled={!!foundCustomer}
              onChange={(e) => setDocumentExtension(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComerziaInput
              label="Teléfono / Celular"
              value={phoneNumber}
              disabled={!!foundCustomer}
              onChange={(e) => setPhoneNumber(handleNumericInput(e.target.value, 8))}
              isRequired
              shakeKey={shakeKey}
              error={!phoneNumber.trim() && shakeKey > 0 ? "Requerido" : ""}
            />
            <ComerziaInput
              label="Correo Electrónico"
              type="email"
              value={email}
              disabled={!!foundCustomer}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-3 border-t border-base-200">
          <BtnCancel onClick={onClose} label="Omitir (No registrar)" disabled={isSubmitting} />
          <BtnSave
            onClick={handleSubmit}
            label={foundCustomer ? "Confirmar y Vincular Cliente" : "Registrar y Vincular Cliente"}
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
