import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import type { SaleResponse, SalesCatalogItem, SaleDetailResponse, CustomerProfileResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCancel, BtnSave, BtnDeleteIcon, BtnModalYes } from '../../../components/ui/CrudButtons';
import { SaleDetailsModal } from '../components/SaleDetailsModal';
import { RegisterSaleCustomerModal } from '../components/RegisterSaleCustomerModal';
import { History, AlertTriangle, Plus, Eye, Edit, Trash2, RotateCcw, RotateCcw as RefundIcon, Info, UserCheck, UserPlus, User } from 'lucide-react';

export const SalesHistoryPage = () => {
  const { userProfile, hasPermission, hasRole } = useAuthStore();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Permisos requeridos
  const canCancel = hasPermission('SAL_SALES_CANCEL') || hasRole('OWNER') || hasRole('ADMIN');
  const canReturn = hasPermission('SAL_RETURNS_MANAGE') || hasRole('OWNER') || hasRole('ADMIN');
  const canManageSales = hasPermission('SAL_SALES_MANAGE') || hasRole('OWNER') || hasRole('ADMIN');

  // Paginación en cliente para List<SaleResponse>
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);

  // Estado del Menú Contextual
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    sale: SaleResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    sale: null
  });

  // Modal de Detalle de Venta
  const [selectedSaleDetails, setSelectedSaleDetails] = useState<SaleResponse | null>(null);

  // Modal de Detalles del Cliente y Asignación de Cliente
  const [selectedCustomerDetails, setSelectedCustomerDetails] = useState<CustomerProfileResponse | null>(null);
  const [assigningCustomerSale, setAssigningCustomerSale] = useState<SaleResponse | null>(null);

  // Estados de Edición de Venta
  const [editingSale, setEditingSale] = useState<SaleResponse | null>(null);
  const [editDetails, setEditDetails] = useState<any[]>([]);
  const [editCatalogSearch, setEditCatalogSearch] = useState('');
  const [editSearchResults, setEditSearchResults] = useState<SalesCatalogItem[]>([]);
  const [isSearchingCatalog, setIsSearchingCatalog] = useState(false);

  // Estados de Cancelación
  const [cancelingSaleId, setCancelingSaleId] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const res = await salesService.getMyShiftSales();
      setSales(res);
    } catch (e) {
      toastError("Error al cargar el historial de ventas del turno.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCode = (status: number | { code: number; label: string } | undefined): number => {
    if (typeof status === 'number') return status;
    if (status && typeof status === 'object' && 'code' in status) return status.code;
    return 0;
  };

  // Abrir Menú Contextual
  const handleContextMenu = (e: React.MouseEvent, sale: SaleResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      sale
    });
  };

  // Cancelar venta pendiente (601)
  const handleCancelSale = async () => {
    if (!cancelingSaleId) return;
    setIsCanceling(true);
    try {
      await salesService.cancelPendingSale(cancelingSaleId);
      toastSuccess("Venta pendiente cancelada y stock liberado correctamente.");
      setCancelingSaleId(null);
      loadSales();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Error al cancelar la venta.");
    } finally {
      setIsCanceling(false);
    }
  };

  // Iniciar edición de venta pendiente (601)
  const startEditSale = (sale: SaleResponse) => {
    setEditingSale(sale);
    setEditDetails((sale.details || []).map(d => ({
      productVariantId: d.productVariantId,
      priceTypeId: d.priceTypeId,
      variantName: d.variantName || d.productName || 'Producto',
      quantity: d.receiptQuantity ?? d.unitQuantity ?? 1,
      salePrice: d.receiptUnitPrice ?? d.unitSalePrice ?? 0,
      discountAmount: d.lineTotalDiscount ?? d.unitDiscountAmount ?? 0,
      stock: (d.receiptQuantity ?? d.unitQuantity ?? 1) + 50,
      discountPrice: 0
    })));
    setEditCatalogSearch('');
    setEditSearchResults([]);
  };

  // Buscar catálogo para agregar items a la venta editada
  const handleCatalogSearch = async () => {
    if (!editCatalogSearch.trim()) return;
    setIsSearchingCatalog(true);
    try {
      const term = editCatalogSearch.trim();
      let productResponse;
      try {
        productResponse = await salesService.getProductDetailsBySku(term);
      } catch {
        try {
          productResponse = await salesService.getProductDetailsByBarcode(term);
        } catch {
          productResponse = null;
        }
      }

      if (productResponse && productResponse.activePrices && productResponse.activePrices.length > 0) {
        const defaultPrice = productResponse.activePrices[0];
        const item: SalesCatalogItem = {
          productVariantId: productResponse.variantId,
          productName: productResponse.name,
          variantName: productResponse.nameVariant || productResponse.name,
          sku: productResponse.sku,
          barCode: term,
          stock: productResponse.availableStock || 0,
          salePrice: defaultPrice.salePrice,
          discountPrice: defaultPrice.discountPrice,
          priceTypeId: defaultPrice.priceTypeId,
          priceTypeName: defaultPrice.priceTypeName,
          equivalenceFactor: defaultPrice.equivalenceFactor || 1,
          activePrices: productResponse.activePrices
        };
        setEditSearchResults([item]);
      } else {
        setEditSearchResults([]);
        toastWarning("No se encontró ningún producto con ese SKU o Código de barras.");
      }
    } catch {
      toastError("Error al buscar en catálogo.");
    } finally {
      setIsSearchingCatalog(false);
    }
  };

  // Agregar item buscado a los detalles de edición
  const handleAddEditItem = (catItem: SalesCatalogItem) => {
    const existingIndex = editDetails.findIndex(d => d.productVariantId === catItem.productVariantId);
    if (existingIndex >= 0) {
      toastWarning("El producto ya se encuentra en el pedido.");
      return;
    }

    setEditDetails([...editDetails, {
      productVariantId: catItem.productVariantId,
      priceTypeId: catItem.priceTypeId,
      variantName: catItem.variantName || catItem.productName,
      quantity: 1,
      salePrice: catItem.salePrice,
      discountAmount: 0,
      stock: catItem.stock,
      discountPrice: catItem.discountPrice
    }]);

    setEditCatalogSearch('');
    setEditSearchResults([]);
  };

  const handleRemoveEditItem = (productVariantId: string) => {
    setEditDetails(editDetails.filter(d => d.productVariantId !== productVariantId));
  };

  const handleUpdateEditItemQty = (productVariantId: string, quantity: number) => {
    setEditDetails(editDetails.map(d => {
      if (d.productVariantId === productVariantId) {
        if (quantity > d.stock) {
          toastWarning(`Cantidad supera el stock disponible (${d.stock}). Capped.`);
          return { ...d, quantity: d.stock };
        }
        return { ...d, quantity: Math.max(1, quantity) };
      }
      return d;
    }));
  };

  const handleUpdateEditItemDiscount = (productVariantId: string, discount: number) => {
    setEditDetails(editDetails.map(d => {
      if (d.productVariantId === productVariantId) {
        const maxDiscount = d.salePrice - d.discountPrice;
        if (discount > maxDiscount) {
          toastWarning(`Límite de descuento excedido. Ajustado a ${currency} ${maxDiscount.toFixed(2)}.`);
          return { ...d, discountAmount: maxDiscount };
        }
        return { ...d, discountAmount: Math.max(0, discount) };
      }
      return d;
    }));
  };

  const getEditSubtotal = () => editDetails.reduce((acc, d) => acc + d.salePrice * d.quantity, 0);
  const getEditDiscount = () => editDetails.reduce((acc, d) => acc + d.discountAmount * d.quantity, 0);
  const getEditTotal = () => getEditSubtotal() - getEditDiscount();

  const handleSaveEditSale = async () => {
    if (!editingSale) return;
    if (editDetails.length === 0) {
      toastWarning("La venta debe contener al menos un producto.");
      return;
    }
    try {
      const payload = {
        expectedTotalAmount: getEditTotal(),
        details: editDetails.map(d => ({
          productVariantId: d.productVariantId,
          priceTypeId: d.priceTypeId,
          receiptQuantity: d.quantity,
          lineDiscountAmount: d.discountAmount
        }))
      };

      await salesService.updatePendingSale(editingSale.id, payload as any);
      toastSuccess("Venta pendiente actualizada con éxito.");
      setEditingSale(null);
      loadSales();
    } catch (err: any) {
      toastError(err.response?.data?.message || "Error al actualizar la venta.");
    }
  };

  // Configuración de Badges de Estado (6 Estados Oficiales)
  const renderStatusBadge = (status: number | { code: number; label: string } | undefined) => {
    const code = getStatusCode(status);
    switch (code) {
      case 601:
        return <ComerziaBadge variant="warning" label="PENDIENTE" />;
      case 602:
        return <ComerziaBadge variant="success" label="COMPLETADA" />;
      case 603:
        return <ComerziaBadge variant="neutral" label="CANCELADA" />;
      case 604:
        return <ComerziaBadge variant="error" label="ANULADA" />;
      case 605:
        return <ComerziaBadge variant="info" label="DEV. PARCIAL" />;
      case 606:
        return <ComerziaBadge variant="secondary" label="DEV. TOTAL" />;
      default:
        return <ComerziaBadge variant="neutral" label="DESCONOCIDO" />;
    }
  };

  // Definición de Columnas de la Tabla (Sin Columna de Acciones)
  const columns: Column<SaleResponse>[] = [
    {
      header: 'N° Venta',
      render: (row) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-sm font-semibold">{row.saleNumber ? `#${row.saleNumber}` : '-'}</span>
          {row.customer && (
            <div className="tooltip tooltip-right" data-tip={`Cliente: ${row.customer.fullName || row.customer.firstName}`}>
              <UserCheck size={16} className="text-primary shrink-0 cursor-pointer" />
            </div>
          )}
        </div>
      )
    },
    {
      header: 'Hora',
      render: (row) => new Date(row.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })
    },
    {
      header: 'Subtotal',
      render: (row) => `${currency} ${row.subtotalAmount.toFixed(2)}`
    },
    {
      header: 'Descuentos',
      render: (row) => <span className="text-error">{row.discountedAmount > 0 ? `- ${currency} ${row.discountedAmount.toFixed(2)}` : '0.00'}</span>
    },
    {
      header: 'Total Cobro',
      render: (row) => <span className="font-bold text-success">{currency} {row.totalAmount.toFixed(2)}</span>
    },
    {
      header: 'Estado',
      render: (row) => renderStatusBadge(row.saleStatus)
    }
  ];

  const paginatedSales = sales.slice(page * size, (page + 1) * size);

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements: sales.length,
    totalPages: Math.ceil(sales.length / size) || 1,
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seguimiento de Ventas (Mi Turno)</h1>
        <p className="text-base-content/60 mt-1">Historial del cajero activo en el turno de trabajo</p>
      </div>

      <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            Ventas Generadas
          </h2>
          <span className="text-xs text-base-content/50 italic">
            * Haz clic derecho sobre una venta para ver el menú de opciones (Detalles, Cliente, Cancelar o Devolución).
          </span>
        </div>

        <ComerziaTable
          data={paginatedSales}
          columns={columns}
          isLoading={isLoading}
          pagination={pagination}
          onRowClick={(row) => setSelectedSaleDetails(row)}
          onRowContextMenu={(e, row) => handleContextMenu(e, row)}
        />
      </div>

      {/* MENÚ CONTEXTUAL */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      >
        {contextMenu.sale && (
          <>
            <ContextMenuItem
              icon={Eye}
              label="Ver Detalles"
              onClick={() => {
                setSelectedSaleDetails(contextMenu.sale);
              }}
            />

            {/* Opciones de Cliente */}
            {contextMenu.sale.customer ? (
              <ContextMenuItem
                icon={UserCheck}
                label="Ver Detalles del Cliente"
                onClick={() => {
                  if (contextMenu.sale?.customer) {
                    setSelectedCustomerDetails(contextMenu.sale.customer);
                  }
                }}
              />
            ) : (
              canManageSales && getStatusCode(contextMenu.sale.saleStatus) === 602 && (
                <ContextMenuItem
                  icon={UserPlus}
                  label="Asignar Cliente"
                  onClick={() => {
                    if (contextMenu.sale) {
                      setAssigningCustomerSale(contextMenu.sale);
                    }
                  }}
                />
              )
            )}

            {/* Si la venta está PENDING (601) */}
            {getStatusCode(contextMenu.sale.saleStatus) === 601 && canCancel && (
              <ContextMenuItem
                icon={Trash2}
                label="Cancelar Venta"
                variant="error"
                onClick={() => {
                  if (contextMenu.sale) setCancelingSaleId(contextMenu.sale.id);
                }}
              />
            )}

            {/* Si la venta está COMPLETED (602) o PARTIALLY_REFUNDED (605) */}
            {(getStatusCode(contextMenu.sale.saleStatus) === 602 || getStatusCode(contextMenu.sale.saleStatus) === 605) && canReturn && (
              <ContextMenuItem
                icon={RotateCcw}
                label="Procesar Devolución"
                isExternalLink
                onClick={() => {
                  if (contextMenu.sale?.saleNumber) {
                    window.open(`/sales/returns/${encodeURIComponent(contextMenu.sale.saleNumber)}`, '_blank');
                  }
                }}
              />
            )}
          </>
        )}
      </ComerziaContextMenu>

      {/* MODAL DETALLES DE VENTA */}
      <SaleDetailsModal
        isOpen={!!selectedSaleDetails}
        onClose={() => setSelectedSaleDetails(null)}
        sale={selectedSaleDetails}
      />

      {/* MODAL DETALLES DEL CLIENTE ASIGNADO */}
      <ComerziaModal
        isOpen={!!selectedCustomerDetails}
        onClose={() => setSelectedCustomerDetails(null)}
        title="Perfil del Cliente"
        size="md"
      >
        {selectedCustomerDetails && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3.5 bg-primary/10 rounded-xl border border-primary/20">
              <UserCheck className="h-8 w-8 text-primary shrink-0" />
              <div>
                <h3 className="font-bold text-base text-base-content">
                  {selectedCustomerDetails.fullName || selectedCustomerDetails.firstName}
                </h3>
                <span className="text-xs text-base-content/60">
                  {selectedCustomerDetails.customerType === 612 ? 'Persona Jurídica (Empresa)' : 'Persona Natural'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-base-50 p-4 rounded-xl border border-base-200 text-xs">
              <div>
                <span className="text-base-content/50 block font-medium">Documento de Identidad</span>
                <span className="font-mono text-sm font-semibold text-base-content">{selectedCustomerDetails.documentNumber || '-'}</span>
              </div>
              <div>
                <span className="text-base-content/50 block font-medium">Teléfono / Celular</span>
                <span className="font-mono text-sm font-semibold text-base-content">{selectedCustomerDetails.phoneNumber || '-'}</span>
              </div>
              <div className="col-span-2">
                <span className="text-base-content/50 block font-medium">Correo Electrónico</span>
                <span className="text-sm text-base-content">{selectedCustomerDetails.email || '-'}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <ComerziaButton
                variant="ghost"
                label="Cerrar"
                onClick={() => setSelectedCustomerDetails(null)}
              />
            </div>
          </div>
        )}
      </ComerziaModal>

      {/* MODAL ASIGNAR CLIENTE A VENTA */}
      {assigningCustomerSale && (
        <RegisterSaleCustomerModal
          isOpen={!!assigningCustomerSale}
          onClose={() => setAssigningCustomerSale(null)}
          saleId={assigningCustomerSale.id}
          saleNumber={assigningCustomerSale.saleNumber}
          onSuccess={() => {
            loadSales();
            setAssigningCustomerSale(null);
          }}
        />
      )}

      {/* MODAL CONFIRMAR CANCELACIÓN (601 PENDING) */}
      <ComerziaModal
        isOpen={!!cancelingSaleId}
        onClose={() => setCancelingSaleId(null)}
        title="Confirmar Cancelación de Venta"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle size={32} />
            <p className="font-semibold text-lg">¿Estás seguro de cancelar esta venta?</p>
          </div>
          <p className="text-sm text-base-content/60">
            Esta acción abortará la venta pendiente y liberará de inmediato el stock retenido en el inventario.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setCancelingSaleId(null)} disabled={isCanceling} />
            <BtnModalYes
              label="Sí, Cancelar Venta"
              onClick={handleCancelSale}
              isLoading={isCanceling}
              disabled={isCanceling}
            />
          </div>
        </div>
      </ComerziaModal>

      {/* MODAL EDITAR VENTA PENDIENTE (601 PENDING) */}
      <ComerziaModal
        isOpen={!!editingSale}
        onClose={() => setEditingSale(null)}
        title="Modificar Pedido Pendiente de Pago"
        size="xl"
      >
        <div className="space-y-6">
          {/* BUSCADOR DE AGREGAR PRODUCTOS */}
          <div className="bg-base-50 p-4 rounded-xl space-y-3">
            <h4 className="font-bold text-sm text-base-content/80 flex items-center gap-2">
              <Plus size={16} className="text-primary" /> Agregar Producto al Pedido
            </h4>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Buscar por SKU o Barcode..."
                className="input input-bordered input-sm flex-1"
                value={editCatalogSearch}
                onChange={(e) => setEditCatalogSearch(e.target.value)}
              />
              <ComerziaButton
                variant="primary"
                label="Buscar"
                className="btn-sm"
                onClick={handleCatalogSearch}
                isLoading={isSearchingCatalog}
                disabled={isSearchingCatalog}
              />
            </div>

            {/* Resultados rápidos de edición */}
            {isSearchingCatalog ? (
              <span className="loading loading-spinner loading-sm text-primary block mx-auto"></span>
            ) : editSearchResults.length > 0 ? (
              <div className="border border-base-200 bg-white rounded-lg overflow-y-auto max-h-[150px] p-2 space-y-1">
                {editSearchResults.map(item => (
                  <div key={item.productVariantId} className="flex justify-between items-center text-xs p-1.5 hover:bg-base-100 rounded">
                    <span>{item.variantName} (Stock: {item.stock})</span>
                    <ComerziaButton
                      variant="create"
                      label="Agregar"
                      className="btn-xs"
                      onClick={() => handleAddEditItem(item)}
                    />
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {/* LISTADO DE ITEMS ACTUALIZADOS */}
          <div className="overflow-x-auto">
            <table className="table table-compact w-full">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th className="w-24">Cantidad</th>
                  <th>Precio Venta</th>
                  <th className="w-28">Descuento</th>
                  <th>Total Línea</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {editDetails.map((item) => (
                  <tr key={item.productVariantId}>
                    <td>
                      <div>
                        <span className="font-bold block text-sm">{item.variantName}</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max={item.stock}
                        className="input input-bordered input-xs w-16"
                        value={item.quantity}
                        onChange={(e) => handleUpdateEditItemQty(item.productVariantId, parseInt(e.target.value) || 1)}
                      />
                    </td>
                    <td>{currency} {item.salePrice.toFixed(2)}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input input-bordered input-xs w-24"
                        value={item.discountAmount}
                        onChange={(e) => handleUpdateEditItemDiscount(item.productVariantId, parseFloat(e.target.value) || 0)}
                      />
                    </td>
                    <td className="font-mono font-semibold">
                      {currency} {((item.salePrice - item.discountAmount) * item.quantity).toFixed(2)}
                    </td>
                    <td>
                      <BtnDeleteIcon
                        onClick={() => handleRemoveEditItem(item.productVariantId)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* TOTALES DE EDICIÓN */}
          <div className="divider"></div>
          <div className="flex justify-between items-center bg-base-50 p-4 rounded-xl font-mono text-sm">
            <div>
              <p>Subtotal: {currency} {getEditSubtotal().toFixed(2)}</p>
              <p className="text-error">Descuentos: - {currency} {getEditDiscount().toFixed(2)}</p>
            </div>
            <p className="text-xl font-bold text-success">
              Total Actualizado: {currency} {getEditTotal().toFixed(2)}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <BtnCancel onClick={() => setEditingSale(null)} />
            <BtnSave label="Actualizar Pedido" onClick={handleSaveEditSale} />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
