import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import { posService } from '../../pos/services/posService';
import { branchService } from '../../organization/services/branchService';
import { useCartStore } from '../store/useCartStore';
import type { SalesCatalogItem } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { BtnCancel, BtnSave, BtnCreate } from '../../../components/ui/CrudButtons';
import { Search, ShoppingCart, User, Trash2, ArrowRight, AlertCircle, Scan } from 'lucide-react';

export const NewSalePage = () => {
  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];
  const isCashier = roles.includes('CASHIER');
  const isOwner = roles.includes('OWNER');
  const isManager = roles.includes('BRANCH_MANAGER');

  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  // Estados de turno y sucursal
  const [activeShiftSummary, setActiveShiftSummary] = useState<any | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [isLoadingShift, setIsLoadingShift] = useState(true);
  const [shiftError, setShiftError] = useState<string | null>(null);

  // Estados del Buscador de Catálogo
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SalesCatalogItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Estados de Selección de Cliente
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
  const [customerSearchTerm, setCustomerSearchTerm] = useState('');

  // Estado para creación de nuevo cliente rápido
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    firstName: '',
    paternalSurname: '',
    maternalSurname: '',
    phoneNumber: '',
    email: '',
    customerType: 611, // Persona Natural
    documentType: 101, // CI
    documentNumber: ''
  });
  const [newCustomerShakeKey, setNewCustomerShakeKey] = useState(0);

  // Zustand Store
  const {
    items,
    customerId,
    customerName,
    addItem,
    removeItem,
    updateQuantity,
    updateDiscount,
    setCustomer,
    setBranchId: setCartBranchId,
    clearCart,
    getSubtotal,
    getDiscountedAmount,
    getTotal
  } = useCartStore();

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

  // 1. Validar turno y resolver branchId
  useEffect(() => {
    loadShiftAndBranches();
    // Limpiar carrito al montar
    clearCart();
  }, []);

  const loadShiftAndBranches = async () => {
    setIsLoadingShift(true);
    setShiftError(null);
    try {
      // 1. Cargar sucursales de todas formas
      const branchRes = await branchService.getBranches(0, 100);
      setBranches(branchRes.content);

      // 2. Cargar turno activo del cajero/usuario actual
      let activeShift = null;
      try {
        activeShift = await posService.getMyActiveShiftSummary();
        setActiveShiftSummary(activeShift);
      } catch (err: any) {
        // Si no tiene turno activo
        if (isCashier && !isOwner && !isManager) {
          setShiftError("Debes tener un turno de caja abierto antes de poder registrar ventas.");
          setIsLoadingShift(false);
          return;
        }
      }

      if (activeShift) {
        // Encontrar sucursal por nombre para vincular el ID
        const matchedBranch = branchRes.content.find(b => b.name === activeShift.branchName);
        if (matchedBranch) {
          setSelectedBranchId(matchedBranch.id);
          setCartBranchId(matchedBranch.id);
        } else {
          // Si no se encuentra correspondencia exacta por nombre, dejamos que seleccione manualmente si es admin
          if (isOwner || isManager) {
            toastWarning("No se pudo asociar automáticamente la sucursal del turno. Por favor selecciona una.");
          } else {
            setShiftError("No se pudo encontrar el ID de la sucursal asignada a tu turno.");
          }
        }
      } else {
        // Si no hay turno activo y es Owner/Manager, dejamos que seleccione una sucursal para armar pedidos administrativos
        if (branchRes.content.length > 0) {
          setSelectedBranchId(branchRes.content[0].id);
          setCartBranchId(branchRes.content[0].id);
        }
      }
    } catch (e) {
      console.error(e);
      setShiftError("Error al cargar la información del turno y sucursales.");
    } finally {
      setIsLoadingShift(false);
    }
  };

  // 2. Buscar en catálogo
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await salesService.searchSalesCatalog(searchTerm.trim());
      setSearchResults(res);
      if (res.length === 0) {
        toastInfo("No se encontraron productos coincidentes.");
      }
    } catch (err) {
      toastError("Error al realizar la búsqueda en el catálogo.");
    } finally {
      setIsSearching(false);
    }
  };

  const toastInfo = (msg: string) => {
    // Helper to display info message
    toastWarning(msg);
  };

  // Agregar al carrito
  const handleAddItem = (item: SalesCatalogItem) => {
    const res = addItem(item);
    if (res.success) {
      toastSuccess(`${item.variantName} agregado al carrito.`);
      setSearchTerm('');
      setSearchResults([]);
      searchInputRef.current?.focus();
    } else {
      toastWarning(res.message || "No se pudo agregar el producto.");
    }
  };

  // Cargar clientes
  const loadCustomers = async () => {
    setIsLoadingCustomers(true);
    try {
      const res = await salesService.getCustomers(0, 50);
      setCustomers(res.content);
    } catch (e) {
      toastError("Error al cargar la lista de clientes.");
    } finally {
      setIsLoadingCustomers(false);
    }
  };

  useEffect(() => {
    if (isCustomerModalOpen) {
      loadCustomers();
    }
  }, [isCustomerModalOpen]);

  // Crear cliente rápido
  const handleCreateCustomer = async () => {
    if (!newCustomerForm.firstName || !newCustomerForm.documentNumber) {
      setNewCustomerShakeKey(prev => prev + 1);
      return;
    }
    try {
      const res = await salesService.createCustomer(newCustomerForm);
      toastSuccess(`Cliente ${res.fullName} creado exitosamente.`);
      setCustomer(res.id, res.fullName);
      setIsNewCustomerModalOpen(false);
      setIsCustomerModalOpen(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Error al registrar el cliente.");
    }
  };

  // Enviar Pedido a Caja
  const handleSendToRegister = async () => {
    if (items.length === 0) {
      toastWarning("El carrito está vacío.");
      return;
    }
    if (!selectedBranchId) {
      toastWarning("Seleccione una sucursal válida.");
      return;
    }

    try {
      const payload = {
        branchId: selectedBranchId,
        customerId: customerId || null,
        expectedTotalAmount: getTotal(),
        details: items.map(i => ({
          productVariantId: i.productVariantId,
          priceTypeId: i.priceTypeId,
          unitQuantity: i.quantity,
          unitDiscountAmount: i.discountAmount
        }))
      };

      await salesService.createSale(payload as any);
      toastSuccess("Pedido enviado a caja exitosamente. Estado: PENDIENTE.");
      clearCart();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Error al procesar la venta en el servidor.");
    }
  };

  if (isLoadingShift) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (shiftError) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center text-warning mb-2 shadow-lg">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-base-content text-center max-w-md">
          Turno Requerido
        </h2>
        <p className="text-base-content/60 text-center max-w-sm">
          {shiftError}
        </p>
      </div>
    );
  }

  // Clientes filtrados por término de búsqueda local
  const filteredCustomers = customers.filter(c =>
    c.fullName.toLowerCase().includes(customerSearchTerm.toLowerCase()) ||
    c.documentNumber?.includes(customerSearchTerm)
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-2">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Nueva Venta (Carrito de Pedido)</h1>
          <p className="text-base-content/60 mt-1">
            Sucursal activa: <span className="font-semibold text-primary">{branches.find(b => b.id === selectedBranchId)?.name || 'Sin vincular'}</span>
          </p>
        </div>

        {/* Selector de Sucursal solo visible para Owner o Manager sin turno fijo */}
        {(isOwner || isManager) && !activeShiftSummary && (
          <div className="w-64">
            <ComerziaSelect
              label="Cambiar Sucursal Pedido"
              options={branches.map(b => ({ value: b.id, label: b.name }))}
              value={selectedBranchId}
              onChange={(e) => {
                setSelectedBranchId(e.target.value);
                setCartBranchId(e.target.value);
              }}
            />
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* PANEL DE PRODUCTOS / BÚSQUEDA */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar en Catálogo
            </h2>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-3 h-5 w-5 text-base-content/40" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Escribe SKU, nombre del producto o variante..."
                  className="input input-bordered w-full pl-12 bg-base-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={isSearching}>
                Buscar
              </button>
              <button
                type="button"
                onClick={() => toastWarning("Simulando Escáner de Cámara. Digita el barcode en el campo de texto y pulsa Enter.")}
                className="btn btn-outline"
                title="Escanear con Cámara"
              >
                <Scan size={18} />
              </button>
            </form>

            {/* Resultados de Búsqueda */}
            {isSearching ? (
              <div className="flex justify-center p-8">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="border border-base-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <table className="table table-compact w-full">
                  <thead>
                    <tr className="bg-base-200/50">
                      <th>Producto / Variante</th>
                      <th>SKU</th>
                      <th>Precio Venta</th>
                      <th>Stock</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {searchResults.map((item) => (
                      <tr key={item.productVariantId} className="hover hover:bg-base-50">
                        <td>
                          <div>
                            <span className="font-semibold block">{item.variantName}</span>
                            <span className="text-xs text-base-content/50">{item.productName} ({item.priceTypeName})</span>
                          </div>
                        </td>
                        <td className="font-mono text-xs">{item.sku}</td>
                        <td className="font-bold text-success">
                          {currency} {item.salePrice.toFixed(2)}
                        </td>
                        <td>
                          <span className={`badge badge-sm font-semibold ${item.stock > 10 ? 'badge-success' : 'badge-warning'}`}>
                            {item.stock}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn btn-primary btn-xs"
                            onClick={() => handleAddItem(item)}
                            disabled={item.stock < 1}
                          >
                            Agregar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : searchTerm ? (
              <p className="text-xs text-base-content/50 text-center py-2">
                Presiona Enter o clica en Buscar para consultar el catálogo.
              </p>
            ) : null}
          </div>

          {/* TABLA DEL CARRITO */}
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-secondary" />
              Líneas del Pedido
            </h2>

            {items.length === 0 ? (
              <div className="text-center p-12 text-base-content/40 bg-base-50 rounded-xl border border-dashed border-base-300">
                <ShoppingCart className="h-12 w-12 mx-auto mb-2 opacity-35" />
                <p>El carrito de ventas está vacío.</p>
                <p className="text-xs mt-1">Busca un producto y agrégalo para armar la orden.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra table-compact w-full">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Producto</th>
                      <th className="w-24">Cantidad</th>
                      <th>Precio Unit.</th>
                      <th className="w-28">Descuento</th>
                      <th>Subtotal</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => {
                      const maxDiscount = item.salePrice - item.discountPrice;
                      const hasDiscountLimit = item.discountPrice < item.salePrice;

                      return (
                        <tr key={item.productVariantId} className="hover">
                          <td>{idx + 1}</td>
                          <td>
                            <div>
                              <span className="font-semibold block text-sm">{item.variantName}</span>
                              <span className="text-xs text-base-content/50 font-mono">SKU: {item.sku}</span>
                            </div>
                          </td>
                          <td>
                            <input
                              type="number"
                              min="1"
                              max={item.stock}
                              className="input input-bordered input-xs w-16"
                              value={item.quantity}
                              onChange={(e) => {
                                const qty = parseInt(e.target.value) || 1;
                                const res = updateQuantity(item.productVariantId, qty);
                                if (!res.success && res.message) toastWarning(res.message);
                              }}
                            />
                          </td>
                          <td className="font-mono text-sm">
                            {currency} {item.salePrice.toFixed(2)}
                          </td>
                          <td>
                            <div className="flex flex-col gap-0.5">
                              <input
                                type="number"
                                min="0"
                                max={maxDiscount}
                                step="0.01"
                                className="input input-bordered input-xs w-24"
                                value={item.discountAmount}
                                disabled={!hasDiscountLimit}
                                placeholder="0.00"
                                onChange={(e) => {
                                  const disc = parseFloat(e.target.value) || 0;
                                  const res = updateDiscount(item.productVariantId, disc);
                                  if (!res.success && res.message) toastWarning(res.message);
                                }}
                              />
                              {hasDiscountLimit && (
                                <span className="text-[10px] text-base-content/40 block">Max: {currency} {maxDiscount.toFixed(2)}</span>
                              )}
                            </div>
                          </td>
                          <td className="font-bold text-sm font-mono">
                            {currency} {((item.salePrice - item.discountAmount) * item.quantity).toFixed(2)}
                          </td>
                          <td>
                            <button
                              className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-full"
                              onClick={() => removeItem(item.productVariantId)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* PANEL DETALLES DE VENTA Y CONFIRMACIÓN */}
        <div className="space-y-6">
          {/* CLIENTE */}
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Cliente del Pedido
            </h3>

            {customerId ? (
              <div className="bg-base-50 p-4 rounded-xl flex justify-between items-center border border-base-200">
                <div>
                  <p className="text-xs text-base-content/50">Cliente Seleccionado</p>
                  <p className="font-bold text-base-content">{customerName}</p>
                </div>
                <button
                  className="btn btn-ghost btn-xs text-error"
                  onClick={() => setCustomer(null, null)}
                >
                  Quitar
                </button>
              </div>
            ) : (
              <div className="bg-base-50 p-4 rounded-xl border border-dashed border-base-300 text-center">
                <p className="text-sm text-base-content/60">Cliente Anónimo / Sin Registrar</p>
                <div className="mt-3 flex gap-2 justify-center">
                  <button
                    className="btn btn-outline btn-xs"
                    onClick={() => setIsCustomerModalOpen(true)}
                  >
                    Buscar Cliente
                  </button>
                  <button
                    className="btn btn-primary btn-xs"
                    onClick={() => {
                      setNewCustomerForm({
                        firstName: '',
                        paternalSurname: '',
                        maternalSurname: '',
                        phoneNumber: '',
                        email: '',
                        customerType: 611,
                        documentType: 101,
                        documentNumber: ''
                      });
                      setIsNewCustomerModalOpen(true);
                    }}
                  >
                    Nuevo Rápido
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TOTALES */}
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold">Resumen de Venta</h3>

            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-base-content/60">Subtotal</span>
                <span>{currency} {getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-error">
                <span>Descuento Manual</span>
                <span>- {currency} {getDiscountedAmount().toFixed(2)}</span>
              </div>
              <div className="divider my-1"></div>
              <div className="flex justify-between text-lg font-bold text-base-content">
                <span>Total Estimado</span>
                <span className="text-success">{currency} {getTotal().toFixed(2)}</span>
              </div>
            </div>

            <button
              className="btn btn-primary w-full gap-2 mt-4 shadow-lg shadow-primary/30"
              disabled={items.length === 0}
              onClick={handleSendToRegister}
            >
              Enviar a Caja <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* MODAL SELECCIONAR CLIENTE */}
      <ComerziaModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Buscar y Seleccionar Cliente"
      >
        <div className="space-y-4">
          <ComerziaInput
            label="Filtrar por nombre o documento"
            type="text"
            value={customerSearchTerm}
            onChange={(e) => setCustomerSearchTerm(e.target.value)}
          />

          {isLoadingCustomers ? (
            <div className="flex justify-center p-8">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : filteredCustomers.length > 0 ? (
            <div className="max-h-[300px] overflow-y-auto border border-base-200 rounded-xl">
              <table className="table table-compact w-full">
                <thead>
                  <tr className="bg-base-200/50">
                    <th>Nombre</th>
                    <th>Documento</th>
                    <th>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map(c => (
                    <tr key={c.id} className="hover">
                      <td className="font-semibold">{c.fullName}</td>
                      <td className="font-mono text-xs">{c.documentNumber}</td>
                      <td>
                        <button
                          className="btn btn-success btn-xs"
                          onClick={() => {
                            setCustomer(c.id, c.fullName);
                            setIsCustomerModalOpen(false);
                          }}
                        >
                          Seleccionar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center p-4 text-base-content/50">No se encontraron clientes.</p>
          )}

          <div className="flex justify-end gap-2 mt-4">
            <BtnCancel onClick={() => setIsCustomerModalOpen(false)} />
          </div>
        </div>
      </ComerziaModal>

      {/* MODAL REGISTRAR CLIENTE RÁPIDO */}
      <ComerziaModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        title="Registro Rápido de Cliente"
      >
        <div className="space-y-4">
          <ComerziaSelect
            label="Tipo de Cliente"
            value={newCustomerForm.customerType}
            onChange={(e) => setNewCustomerForm({ ...newCustomerForm, customerType: Number(e.target.value) })}
            options={[
              { value: '611', label: 'Persona Natural' },
              { value: '612', label: 'Persona Jurídica (Empresa)' }
            ]}
          />

          <div className="grid grid-cols-2 gap-4">
            <ComerziaInput
              label="Nombre / Razón Social"
              type="text"
              value={newCustomerForm.firstName}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, firstName: e.target.value })}
              error={!newCustomerForm.firstName && newCustomerShakeKey > 0 ? "Requerido" : ""}
              shakeKey={newCustomerShakeKey}
              isRequired
            />
            <ComerziaInput
              label="Primer Apellido"
              type="text"
              value={newCustomerForm.paternalSurname}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, paternalSurname: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ComerziaSelect
              label="Tipo Documento"
              value={newCustomerForm.documentType}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, documentType: Number(e.target.value) })}
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
              value={newCustomerForm.documentNumber}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, documentNumber: e.target.value })}
              error={!newCustomerForm.documentNumber && newCustomerShakeKey > 0 ? "Requerido" : ""}
              shakeKey={newCustomerShakeKey}
              isRequired
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <ComerziaInput
              label="Teléfono"
              type="text"
              value={newCustomerForm.phoneNumber}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, phoneNumber: e.target.value })}
            />
            <ComerziaInput
              label="Email"
              type="email"
              value={newCustomerForm.email}
              onChange={(e) => setNewCustomerForm({ ...newCustomerForm, email: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setIsNewCustomerModalOpen(false)} />
            <BtnSave onClick={handleCreateCustomer} />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
