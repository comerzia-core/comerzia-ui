import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { salesService } from '../services/salesService';
import { useToast } from '../../../context/ToastContext';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { UserCheck, UserPlus, Info } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  onSuccess: () => void;
}

export const RegisterSaleCustomerModal = ({ isOpen, onClose, saleId, onSuccess }: Props) => {
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
  const { error: toastError, success: toastSuccess } = useToast();

  useEffect(() => {
    if (isOpen) {
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
    }
  }, [isOpen]);

  if (!saleId) return null;

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      setShakeKey(prev => prev + 1);
      toastError("El nombre o razón social es obligatorio.");
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
        phoneNumber: phoneNumber.trim() || undefined,
        email: email.trim() || undefined
      });

      toastSuccess("Cliente registrado y vinculado exitosamente a la venta.");
      onSuccess();
      onClose();
    } catch (e: any) {
      console.error(e);
      const msg = e.response?.data?.message || "Error al registrar el cliente.";
      toastError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Datos del Cliente (Opcional)"
      size="xl"
    >
      <div className="space-y-6 pt-2">
        {/* Information Banner */}
        <div className="bg-info/10 border border-info/20 p-4 rounded-xl flex items-center gap-3 text-xs text-info-content">
          <Info size={20} className="text-info shrink-0" />
          <div>
            <p className="font-bold">Pago completado para la Venta #{saleId.substring(0, 8)}</p>
            <p className="text-base-content/70 mt-0.5">
              Puedes ingresar los datos del cliente para asociarlo a esta venta o hacer clic en <strong>Omitir</strong> si no requieres asociar un cliente.
            </p>
          </div>
        </div>

        {/* Customer Form */}
        <div className="space-y-4 bg-base-100 p-4 rounded-2xl border border-base-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComerziaSelect
              label="Tipo de Cliente"
              options={customerTypeOptions}
              isLoading={isLoadingDict}
              value={customerType}
              onChange={(e) => setCustomerType(e.target.value)}
              isRequired
            />
            <ComerziaInput
              label={customerType === '612' ? "Razón Social / Nombre Empresa" : "Nombres"}
              value={firstName}
              uppercase
              onChange={(e) => setFirstName(e.target.value)}
              error={!firstName && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
          </div>

          {customerType !== '612' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ComerziaInput
                label="Apellido Paterno"
                value={paternalSurname}
                uppercase
                onChange={(e) => setPaternalSurname(e.target.value)}
              />
              <ComerziaInput
                label="Apellido Materno"
                value={maternalSurname}
                uppercase
                onChange={(e) => setMaternalSurname(e.target.value)}
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ComerziaSelect
              label="Tipo de Documento"
              options={documentTypeOptions}
              isLoading={isLoadingDict}
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            />
            <ComerziaInput
              label="Nro. Documento / NIT"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.target.value)}
            />
            <ComerziaSelect
              label="Extensión (Si aplica)"
              options={documentExtOptions}
              isLoading={isLoadingDict}
              value={documentExtension}
              onChange={(e) => setDocumentExtension(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ComerziaInput
              label="Teléfono / Celular"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
            />
            <ComerziaInput
              label="Correo Electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-base-200">
          <BtnCancel onClick={onClose} label="Omitir (No registrar)" disabled={isSubmitting} />
          <BtnSave
            onClick={handleSubmit}
            label="Registrar y Vincular Cliente"
            isLoading={isSubmitting}
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
