import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import type { CustomerProfileResponse, SaleResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCancel, BtnSave, BtnCreate, BtnModalYes } from '../../../components/ui/CrudButtons';
import { SaleDetailsModal } from '../components/SaleDetailsModal';
import { Users, Mail, Phone, ShieldAlert, DollarSign, History, Search, Eye, Edit, Trash2, RotateCcw, ChevronRight } from 'lucide-react';

export const CustomersManagementPage = () => {
  const { userProfile, hasPermission, hasRole } = useAuthStore();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  // Permisos
  const canManageCustomers = hasPermission('SAL_CUSTOMERS_MANAGE') || hasRole('OWNER') || hasRole('ADMIN');
  const canReadSaleHistory = hasPermission('SAL_HISTORY_SALE_READ') || hasRole('OWNER') || hasRole('ADMIN');
  const isOwner = hasRole('OWNER');

  const [customers, setCustomers] = useState<CustomerProfileResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfileResponse | null>(null);

  // Búsqueda por Celular
  const [searchPhone, setSearchPhone] = useState('');
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [isFilteredByPhone, setIsFilteredByPhone] = useState(false);

  // Historial de Compras del Cliente Seleccionado
  const [salesHistory, setSalesHistory] = useState<SaleResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historyPage, setHistoryPage] = useState(0);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<SaleResponse | null>(null);

  // Paginación de Clientes
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Estado del Menú Contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    customer: CustomerProfileResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    customer: null
  });

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
    if (!isFilteredByPhone) {
      loadCustomers();
    }
  }, [page, size, isFilteredByPhone]);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await salesService.getCustomers(page, size);
      setCustomers(res.content || []);
      setTotalElements(res.totalElements || 0);
    } catch (e) {
      toastError("Error al cargar la lista de clientes.");
    } finally {
      setIsLoading(false);
    }
  };

  // Buscar cliente por número de celular
  const handleSearchByPhone = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const phone = searchPhone.trim();
    if (!phone) {
      toastWarning("Ingresa un número de teléfono/celular para buscar.");
      return;
    }

    setIsSearchingPhone(true);
    try {
      const customer = await salesService.getCustomerByPhone(phone);
      if (customer && customer.id) {
        setCustomers([customer]);
        setTotalElements(1);
        setIsFilteredByPhone(true);
        toastSuccess(`Cliente encontrado: ${customer.fullName || customer.firstName}`);
      } else {
        toastWarning("No se encontró ningún cliente registrado con ese número de teléfono.");
      }
    } catch (err: any) {
      if (err.response?.status === 404) {
        toastWarning("No se encontró ningún cliente registrado con ese número de teléfono.");
      } else {
        toastError("Error al buscar el cliente por teléfono.");
      }
    } finally {
      setIsSearchingPhone(false);
    }
  };

  const handleClearPhoneFilter = () => {
    setSearchPhone('');
    setIsFilteredByPhone(false);
    setPage(0);
    loadCustomers();
  };

  // Cargar Historial de Compras del Cliente
  const loadSalesHistory = async (customerId: string, pageNum = 0) => {
    if (!canReadSaleHistory) return;
    setIsLoadingHistory(true);
    try {
      const res = await salesService.getCustomerSalesHistory(customerId, pageNum, 5);
      setSalesHistory(res.content || []);
      setHistoryTotal(res.totalElements || 0);
    } catch (e) {
      toastError("Error al recuperar el historial de ventas del cliente.");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (selectedCustomer && canReadSaleHistory) {
      loadSalesHistory(selectedCustomer.id, historyPage);
    } else {
      setSalesHistory([]);
      setHistoryTotal(0);
    }
  }, [selectedCustomer, historyPage, canReadSaleHistory]);

  // Limpiar inputs a solo números y aplicar longitud máxima
  const handleNumericInput = (val: string, maxLen = 8) => {
    const cleaned = val.replace(/\D/g, '');
    return cleaned.slice(0, maxLen);
  };

  // Abrir Menú Contextual
  const handleContextMenu = (e: React.MouseEvent, customer: CustomerProfileResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      customer
    });
  };

  // Guardar creación / edición
  const handleSaveCustomer = async () => {
    if (!form.firstName || !form.documentNumber || !form.phoneNumber) {
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

  // Columnas sin botón acciones (reemplazado por Menú Contextual)
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
    }
  ];

  const customerPagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages: Math.ceil(totalElements / size) || 1,
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Clientes (CRM)</h1>
          <p className="text-base-content/60 mt-1">Administración de perfiles y auditoría de compras</p>
        </div>
        {canManageCustomers && (
          <BtnCreate label="Registrar Cliente" onClick={handleOpenCreate} />
        )}
      </div>

      {/* BUSCADOR RÁPIDO POR CELULAR */}
      <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-sm">
        <form onSubmit={handleSearchByPhone} className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40 pointer-events-none" />
            <input
              type="tel"
              placeholder="Buscar cliente por N° de celular..."
              value={searchPhone}
              onChange={(e) => setSearchPhone(handleNumericInput(e.target.value, 8))}
              className="input input-bordered w-full pl-10 bg-base-50 focus:bg-base-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <ComerziaButton
              type="submit"
              variant="primary"
              label="Buscar por Celular"
              icon={<Search size={15} />}
              isLoading={isSearchingPhone}
              disabled={isSearchingPhone || !searchPhone.trim()}
              className="flex-1 sm:flex-none"
            />
            {isFilteredByPhone && (
              <ComerziaButton
                type="button"
                variant="white"
                label="Ver Todos"
                icon={<RotateCcw size={14} />}
                onClick={handleClearPhoneFilter}
                className="border border-base-300"
              />
            )}
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* MAESTRO: LISTADO DE CLIENTES */}
        <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Lista de Clientes
              </h2>
              <span className="text-xs text-base-content/50 italic">
                * Haz clic derecho sobre un cliente para ver opciones.
              </span>
            </div>

            <ComerziaTable
              data={customers}
              columns={columns}
              isLoading={isLoading}
              pagination={isFilteredByPhone ? undefined : customerPagination}
              onRowContextMenu={(e, row) => handleContextMenu(e, row)}
              rowClassName={(row) => row.id === selectedCustomer?.id ? 'bg-primary/5 font-semibold' : ''}
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
                    {selectedCustomer.documentNumber && (
                      <p className="text-xs text-base-content/50 mt-1 font-mono">{selectedCustomer.documentNumber}</p>
                    )}
                  </div>
                  <ComerziaButton 
                    variant="ghost"
                    label="Cerrar Ficha"
                    className="btn-xs text-base-content/60"
                    onClick={() => setSelectedCustomer(null)}
                  />
                </div>

                <div className="divider my-0"></div>

                {/* KPI Rápido LTV (Solo si tiene permiso para leer historial de ventas) */}
                {canReadSaleHistory && (
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
                )}

                {/* Datos CRM */}
                <div className="space-y-2 text-sm">
                  <p><strong>Identificación:</strong> <span className="font-mono text-xs">{selectedCustomer.documentNumber || '-'}</span></p>
                  {selectedCustomer.phoneNumber && <p><strong>Teléfono:</strong> {selectedCustomer.phoneNumber}</p>}
                  {selectedCustomer.email && <p><strong>Correo Electrónico:</strong> {selectedCustomer.email}</p>}
                </div>

                {/* Historial de Compras (Solo si tiene permiso SAL_HISTORY_SALE_READ) */}
                {canReadSaleHistory && (
                  <>
                    <div className="divider my-0"></div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="font-bold text-sm text-base-content flex items-center gap-2">
                          <History size={16} className="text-secondary" /> Historial de Ventas
                        </h4>
                        <span className="text-[11px] text-base-content/50 italic">
                          (Clic en venta para ver detalle)
                        </span>
                      </div>

                      {isLoadingHistory ? (
                        <div className="flex justify-center p-4">
                          <span className="loading loading-spinner loading-md text-primary"></span>
                        </div>
                      ) : salesHistory.length > 0 ? (
                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                          {salesHistory.map(sale => (
                            <div
                              key={sale.id}
                              onClick={() => setSelectedSaleDetails(sale)}
                              className="flex justify-between items-center text-xs p-3 bg-base-50 hover:bg-base-200/80 cursor-pointer rounded-xl border border-base-200 transition-all shadow-xs group"
                            >
                              <div>
                                <span className="font-bold block text-base-content/80 group-hover:text-primary transition-colors">
                                  {sale.saleNumber ? `N° #${sale.saleNumber}` : 'Venta'}
                                </span>
                                <span className="text-base-content/50 text-[11px]">{new Date(sale.date).toLocaleDateString()}</span>
                              </div>
                              <div className="flex items-center gap-2 text-right">
                                <div>
                                  <span className="font-bold text-success block font-mono">{currency} {sale.totalAmount.toFixed(2)}</span>
                                  <span>
                                    {sale.saleStatus === 602 ? (
                                      <span className="badge badge-success badge-xs font-semibold">COMPLETADA</span>
                                    ) : (
                                      <span className="badge badge-warning badge-xs font-semibold">DEVOLUCIÓN</span>
                                    )}
                                  </span>
                                </div>
                                <ChevronRight size={14} className="text-base-content/30 group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-base-content/50 text-center py-4">No registra compras completadas.</p>
                      )}

                      {historyTotal > 5 && (
                        <div className="flex justify-between items-center pt-2 text-xs text-base-content/60 border-t border-base-200">
                          <span>{historyTotal} compras</span>
                          <div className="join">
                            <button
                              className="join-item btn btn-xs"
                              disabled={historyPage === 0}
                              onClick={() => setHistoryPage(p => Math.max(0, p - 1))}
                            >
                              «
                            </button>
                            <span className="join-item btn btn-xs pointer-events-none">
                              {historyPage + 1}
                            </span>
                            <button
                              className="join-item btn btn-xs"
                              disabled={(historyPage + 1) * 5 >= historyTotal}
                              onClick={() => setHistoryPage(p => p + 1)}
                            >
                              »
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-base-content/40 space-y-4 py-16">
              <div className="bg-base-100 p-6 rounded-full border border-base-200">
                <Users className="h-12 w-12 opacity-40" />
              </div>
              <p className="text-center text-sm max-w-[200px]">
                Haz clic derecho sobre un cliente para ver su ficha y datos.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MENÚ CONTEXTUAL DE CLIENTES */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      >
        {contextMenu.customer && (
          <>
            <ContextMenuItem
              icon={Eye}
              label="Ver Ficha / Detalle"
              onClick={() => {
                if (contextMenu.customer) setSelectedCustomer(contextMenu.customer);
              }}
            />

            {canManageCustomers && (
              <ContextMenuItem
                icon={Edit}
                label="Modificar Cliente"
                onClick={() => {
                  if (contextMenu.customer) handleOpenEdit(contextMenu.customer);
                }}
              />
            )}

            {isOwner && (
              <ContextMenuItem
                icon={Trash2}
                label="Eliminar Cliente"
                variant="error"
                onClick={() => {
                  if (contextMenu.customer) setDeletingCustomerId(contextMenu.customer.id);
                }}
              />
            )}
          </>
        )}
      </ComerziaContextMenu>

      {/* MODAL DETALLES DE VENTA SELECCIONADA EN HISTORIAL */}
      <SaleDetailsModal
        isOpen={!!selectedSaleDetails}
        onClose={() => setSelectedSaleDetails(null)}
        sale={selectedSaleDetails}
      />

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
              uppercase
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              error={!form.firstName && shakeKey > 0 ? "Requerido" : ""}
              shakeKey={shakeKey}
              isRequired
            />
            <ComerziaInput
              label="Primer Apellido"
              type="text"
              value={form.paternalSurname}
              uppercase
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
              label="Teléfono / Celular"
              type="text"
              value={form.phoneNumber}
              onChange={(e) => setForm({ ...form, phoneNumber: handleNumericInput(e.target.value, 8) })}
              isRequired
              shakeKey={shakeKey}
              error={!form.phoneNumber && shakeKey > 0 ? "Requerido" : ""}
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
            Esta acción quitará al cliente de forma permanente del CRM. Solo se puede realizar si el cliente no registra ventas previas en la empresa para resguardar la contabilidad.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setDeletingCustomerId(null)} disabled={isDeleting} />
            <BtnModalYes
              label="Sí, Eliminar"
              onClick={handleDeleteCustomer}
              isLoading={isDeleting}
              disabled={isDeleting}
            />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
