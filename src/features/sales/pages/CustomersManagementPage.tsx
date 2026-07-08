import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import type { CustomerProfileResponse, SaleResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { BtnCancel, BtnSave, BtnCreate, BtnEdit, BtnDeleteIcon } from '../../../components/ui/CrudButtons';
import { Users, Mail, Phone, ShieldAlert, History, DollarSign, ArrowLeft } from 'lucide-react';

export const CustomersManagementPage = () => {
  const { userProfile } = useAuthStore();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [customers, setCustomers] = useState<CustomerProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfileResponse | null>(null);

  // Historial de Compras del Cliente Seleccionado
  const [salesHistory, setSalesHistory] = useState<SaleResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Paginación de Clientes
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<CustomerProfileResponse | null>(null);
  const [form, setForm] = useState({
    customerType: 611,
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    phoneNumber: '',
    email: '',
    documentType: 101,
    documentNumber: '',
    documentExtension: 201
  });
  const [shakeKey, setShakeKey] = useState(0);

  // Confirmar eliminación
  const [deletingCustomerId, setDeletingCustomerId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

  // Cargar clientes
  useEffect(() => {
    loadCustomers();
  }, [page, size]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await salesService.getCustomers(page, size);
      setCustomers(res.content);
      setTotalElements(res.totalElements);
    } catch (e) {
      toastError("Error al cargar la lista de clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cargar Historial de Compras del Cliente
  const loadSalesHistory = async (customerId: string, pageNum = 0) => {
    setIsLoadingHistory(true);
    try {
      const res = await salesService.getCustomerSalesHistory(customerId, pageNum, 5);
      setSalesHistory(res.content);
      setHistoryTotal(res.totalElements);
    } catch (e) {
      toastError("Error al recuperar el historial de ventas del cliente.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer) {
      loadSalesHistory(selectedCustomer.id, historyPage);
    } else {
      setSalesHistory([]);
      setHistoryTotal(0);
    }
  }, [selectedCustomer, historyPage]);

  // Guardar creación / edición
  const handleSaveCustomer = async () => {
    if (!form.firstName || !form.documentNumber) {
      setShakeKey(prev => prev + 1);
      return;
    }

    try {
      if (customerToEdit) {
        await salesService.updateCustomer(customerToEdit.id, form as any);
        toastSuccess("Cliente actualizado con éxito.");
      } else {
        await salesService.createCustomer(form as any);
        toastSuccess("Cliente registrado con éxito.");
      }
      setIsModalOpen(false);
      loadCustomers();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Ocurrió un error al guardar el cliente.");
    }
  };

  // Abrir Modal Crear
  const handleOpenCreate = () => {
    setCustomerToEdit(null);
    setForm({
      customerType: 611,
      firstName: '',
      paternalSurname: '',
      maternalSurname: '',
      phoneNumber: '',
      email: '',
      documentType: 101,
      documentNumber: '',
      documentExtension: 201
    });
    setIsModalOpen(true);
  };

  // Abrir Modal Editar
  const handleOpenEdit = (customer: CustomerProfileResponse) => {
    setCustomerToEdit(customer);
    setForm({
      customerType: customer.customerType,
      firstName: customer.firstName,
      paternalSurname: customer.paternalSurname || '',
      maternalSurname: customer.maternalSurname || '',
      phoneNumber: customer.phoneNumber || '',
      email: customer.email || '',
      documentType: customer.documentType || 101,
      documentNumber: customer.documentNumber || '',
      documentExtension: customer.documentExtension || 201
    });
    setIsModalOpen(true);
  };

  // Eliminar cliente
  const handleDeleteCustomer = async () => {
    if (!deletingCustomerId) return;
    setIsDeleting(true);
    try {
      await salesService.deleteCustomer(deletingCustomerId);
      toastSuccess("Cliente eliminado del CRM.");
      setDeletingCustomerId(null);
      if (selectedCustomer?.id === deletingCustomerId) {
        setSelectedCustomer(null);
      }
      loadCustomers();
    } catch (err: any) {
      if (err.response?.status === 400 || err.response?.data?.message?.includes("sales")) {
        toastError("No se puede eliminar el cliente porque posee transacciones o facturas vinculadas en su histórico.");
      } else {
        toastError(err.response?.data?.message || "Error al eliminar el cliente.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // LTV (Life Time Value) del cliente seleccionado
  const customerLTV = salesHistory
    .filter(s => s.saleStatus === 602) // Solo completadas
    .reduce((acc, s) => acc + s.totalAmount, 0);

  const columns: Column<CustomerProfileResponse>[] = [
    {
      header: 'Cliente',
      render: (row) => (
        <div>
          <span className="font-semibold block">{row.fullName}</span>
          <span className="text-xs text-base-content/50">
            {row.customerType === 611 ? 'Persona Natural' : 'Empresa'}
          </span>
        </div>
      )
    },
    {
      header: 'Identificación',
      render: (row) => (
        <span className="font-mono text-xs">
          {row.documentNumber || '-'} 
        </span>
      )
    },
    {
      header: 'Contacto',
      render: (row) => (
        <div className="flex flex-col gap-0.5 text-xs text-base-content/70">
          {row.phoneNumber && <span className="flex items-center gap-1"><Phone size={12} /> {row.phoneNumber}</span>}
          {row.email && <span className="flex items-center gap-1"><Mail size={12} /> {row.email}</span>}
        </div>
      )
    },
    {
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2 justify-end">
          <button 
            className="btn btn-outline btn-xs"
            onClick={() => setSelectedCustomer(row)}
          >
            Ficha
          </button>
          <BtnEdit onClick={() => handleOpenEdit(row)} />
          <BtnDeleteIcon onClick={() => setDeletingCustomerId(row.id)} />
        </div>
      )
    }
  ];

  const customerPagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes (CRM)</h1>
          <p className="text-base-content/60 mt-1">Administración de perfiles y auditoría de compras</p>
        </div>
        <BtnCreate label="Registrar Cliente" onClick={handleOpenCreate} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAESTRO: LISTADO DE CLIENTES */}
        <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Lista de Clientes
            </h2>
            <ComerziaTable
              data={customers}
              columns={columns}
              isLoading={isLoading}
              pagination={customerPagination}
            />
          </div>
        </div>

        {/* DETALLE: FICHA DEL CLIENTE */}
        <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm flex flex-col">
          {selectedCustomer ? (
            <div className="space-y-6 flex-1 flex flex-col justify-between">
              <div className="space-y-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-primary">{selectedCustomer.fullName}</h3>
                    <p className="text-xs text-base-content/50 mt-1 font-mono">ID: {selectedCustomer.id}</p>
                  </div>
                  <button 
                    className="btn btn-ghost btn-xs text-base-content/60"
                    onClick={() => setSelectedCustomer(null)}
                  >
                    Cerrar Ficha
                  </button>
                </div>

                <div className="divider my-0"></div>

                {/* KPI Rápido LTV */}
                <div className="bg-success/10 p-4 rounded-xl flex items-center gap-4">
                  <div className="bg-success text-white p-3 rounded-xl">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-success/70 font-semibold tracking-wide">LIFE TIME VALUE (LTV)</p>
                    <p className="text-2xl font-bold text-success font-mono">
                      {currency} {customerLTV.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Datos CRM */}
                <div className="space-y-2 text-sm">
                  <p><strong>Identificación:</strong> <span className="font-mono text-xs">{selectedCustomer.documentNumber || '-'}</span></p>
                  {selectedCustomer.phoneNumber && <p><strong>Teléfono:</strong> {selectedCustomer.phoneNumber}</p>}
                  {selectedCustomer.email && <p><strong>Correo Electrónico:</strong> {selectedCustomer.email}</p>}
                </div>

                <div className="divider my-0"></div>

                {/* Historial de Compras */}
                <div className="space-y-3">
                  <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                    <History size={16} className="text-secondary" /> Historial de Ventas
                  </h4>

                  {isLoadingHistory ? (
                    <div className="flex justify-center p-4">
                      <span className="loading loading-spinner loading-md text-primary"></span>
                    </div>
                  ) : salesHistory.length > 0 ? (
                    <div className="space-y-2">
                      {salesHistory.map(sale => (
                        <div key={sale.id} className="flex justify-between items-center text-xs p-2 bg-base-50 rounded-lg border border-base-100 font-mono">
                          <div>
                            <span className="font-bold block text-base-content/80">{sale.id.substring(0, 8)}...</span>
                            <span className="text-base-content/50">{new Date(sale.date).toLocaleDateString()}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-bold text-success block">{currency} {sale.totalAmount.toFixed(2)}</span>
                            <span>
                              {sale.saleStatus === 602 ? (
                                <span className="text-success text-[10px]">PAGADO</span>
                              ) : (
                                <span className="text-warning text-[10px]">DEVOLUCIÓN</span>
                              )}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-base-content/50 text-center py-4">No registra compras completadas.</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-base-content/40 space-y-4 py-16">
              <div className="bg-base-100 p-6 rounded-full border border-base-200">
                <Users className="h-12 w-12 opacity-40" />
              </div>
              <p className="text-center text-sm max-w-[200px]">
                Selecciona un cliente del listado para ver su ficha y compras acumuladas.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL CREAR / EDITAR CLIENTE */}
      <ComerziaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={customerToEdit ? "Modificar Perfil de Cliente" : "Registrar Nuevo Cliente"}
      >
        <div className="space-y-4">
          <ComerziaSelect
            label="Tipo de Cliente"
            value={form.customerType}
            onChange={(e) => setForm({ ...form, customerType: Number(e.target.value) })}
            options={[
              { value: '611', label: 'Persona Natural' },
              { value: '612', label: 'Persona Jurídica (Empresa)' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <ComerziaInput
              label="Nombre / Razón Social"
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              error={!form.firstName && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
            <ComerziaInput
              label="Primer Apellido"
              type="text"
              value={form.paternalSurname}
              onChange={(e) => setForm({ ...form, paternalSurname: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ComerziaSelect
              label="Tipo Documento"
              value={form.documentType}
              onChange={(e) => setForm({ ...form, documentType: Number(e.target.value) })}
              options={[
                { value: '101', label: 'CI (Cédula)' },
                { value: '102', label: 'NIT' },
                { value: '103', label: 'Pasaporte' },
                { value: '104', label: 'Otro' }
              ]}
            />
            <ComerziaInput
              label="Número de Documento"
              type="text"
              value={form.documentNumber}
              onChange={(e) => setForm({ ...form, documentNumber: e.target.value })}
              error={!form.documentNumber && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ComerziaInput
              label="Teléfono"
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
            />
            <ComerziaInput
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setIsModalOpen(false)} />
            <BtnSave onClick={handleSaveCustomer} />
          </div>
        </div>
      </ComerziaModal>

      {/* MODAL ELIMINAR CLIENTE */}
      <ComerziaModal
        isOpen={!!deletingCustomerId}
        onClose={() => setDeletingCustomerId(null)}
        title="Eliminar Cliente"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-error">
            <ShieldAlert size={32} />
            <p className="font-semibold text-lg">¿Estás seguro de eliminar este cliente?</p>
          </div>
          <p className="text-sm text-base-content/60">
            Esta acción quitará al cliente de forma permanente del CRM básico. Solo se puede realizar si el cliente no registra ventas previas en la empresa para resguardar la contabilidad.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setDeletingCustomerId(null)} disabled={isDeleting} />
            <button 
              className="btn btn-error text-white" 
              onClick={handleDeleteCustomer}
              disabled={isDeleting}
            >
              {isDeleting ? "Eliminando..." : "Sí, Eliminar"}
            </button>
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
