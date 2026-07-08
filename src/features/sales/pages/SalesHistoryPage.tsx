import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import type { SaleResponse, SaleDetailResponse, SalesCatalogItem } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnCancel, BtnSave, BtnEdit, BtnDeleteIcon } from '../../../components/ui/CrudButtons';
import { Clock, History, Edit, AlertTriangle, Trash2, Search, Plus } from 'lucide-react';

export const SalesHistoryPage = () => {
  const { userProfile } = useAuthStore();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [sales, setSales] = useState<SaleResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Paginación
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);

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
  }, [page, size]);

  const loadSales = async () => {
    setIsLoading(true);
    try {
      const res = await salesService.getMyShiftSales(page, size);
      setSales(res.content);
      setTotalElements(res.totalElements);
    } catch (e) {
      toastError("Error al cargar el historial de ventas del turno.");
    } finally {
      setIsLoading(false);
    }
  };

  // Cancelar venta
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

  // Iniciar edición de venta
  const startEditSale = (sale: SaleResponse) => {
    setEditingSale(sale);
    // Mapear detalles existentes a formato editable local
    setEditDetails(sale.details.map(d => ({
      productVariantId: d.productVariantId,
      priceTypeId: d.priceTypeId,
      variantName: d.variantName || `Variante #${d.productVariantId}`,
      quantity: d.unitQuantity,
      salePrice: d.unitSalePrice,
      discountAmount: d.unitDiscountAmount,
      // Suponemos que el stock disponible puede recuperarse o lo dejamos en un número alto por defecto para edición
      stock: d.unitQuantity + 50, 
      discountPrice: 0 // Se asume libre de edición a menos que carguemos los topes del catálogo
    })));
    setEditCatalogSearch('');
    setEditSearchResults([]);
  };

  // Buscar catálogo para agregar items a la venta editada
  const handleCatalogSearch = async () => {
    if (!editCatalogSearch.trim()) return;
    setIsSearchingCatalog(true);
    try {
      const res = await salesService.searchSalesCatalog(editCatalogSearch.trim());
      setEditSearchResults(res);
    } catch (err) {
      toastError("Error al buscar en el catálogo.");
    } finally {
      setIsSearchingCatalog(false);
    }
  };

  const handleAddEditItem = (item: SalesCatalogItem) => {
    const existing = editDetails.find(d => d.productVariantId === item.productVariantId);
    if (existing) {
      toastWarning("El producto ya se encuentra en la lista de la venta.");
      return;
    }
    setEditDetails([...editDetails, {
      productVariantId: item.productVariantId,
      priceTypeId: item.priceTypeId,
      variantName: item.variantName,
      quantity: 1,
      salePrice: item.salePrice,
      discountAmount: 0,
      stock: item.stock,
      discountPrice: item.discountPrice
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
          toastWarning(`Límite de descuento excedido. Ajustado a ${maxDiscount.toFixed(2)}.`);
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
        customerId: editingSale.customerId,
        expectedTotalAmount: getEditTotal(),
        details: editDetails.map(d => ({
          productVariantId: d.productVariantId,
          priceTypeId: d.priceTypeId,
          unitQuantity: d.quantity,
          unitDiscountAmount: d.discountAmount
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

  // Configuración de Badges de Estado
  const renderStatusBadge = (status: number) => {
    switch (status) {
      case 601:
        return <ComerziaBadge variant="warning" label="PENDIENTE COBRO" />;
      case 602:
        return <ComerziaBadge variant="success" label="COMPLETADA" />;
      case 603:
        return <ComerziaBadge variant="error" label="CANCELADA" />;
      default:
        return <ComerziaBadge variant="neutral" label="DESCONOCIDO" />;
    }
  };

  // Definición de Columnas de la Tabla
  const columns: Column<SaleResponse>[] = [
    {
      header: 'Código de Venta',
      render: (row) => <span className="font-mono text-sm font-semibold">{row.id}</span>
    },
    {
      header: 'Fecha de Creación',
      render: (row) => new Date(row.date).toLocaleString()
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
    },
    {
      header: 'Acciones',
      render: (row) => {
        const isPending = row.saleStatus === 601;
        return (
          <div className="flex gap-2 justify-end">
            {isPending ? (
              <>
                <button
                  className="btn btn-outline btn-xs btn-primary gap-1"
                  onClick={() => startEditSale(row)}
                  title="Editar Pedido"
                >
                  <Edit size={14} /> Editar
                </button>
                <button
                  className="btn btn-outline btn-xs btn-error gap-1"
                  onClick={() => setCancelingSaleId(row.id)}
                  title="Anular Pedido"
                >
                  <Trash2 size={14} /> Anular
                </button>
              </>
            ) : (
              <span className="text-xs text-base-content/40">Sin acciones</span>
            )}
          </div>
        );
      }
    }
  ];

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Seguimiento de Ventas (Mi Turno)</h1>
        <p className="text-base-content/60 mt-1">Historial del cajero activo en el turno de trabajo</p>
      </div>

      <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          Ventas Generadas
        </h2>

        <ComerziaTable
          data={sales}
          columns={columns}
          isLoading={isLoading}
          pagination={pagination}
        />
      </div>

      {/* MODAL CONFIRMAR ANULACIÓN */}
      <ComerziaModal
        isOpen={!!cancelingSaleId}
        onClose={() => setCancelingSaleId(null)}
        title="Confirmar Anulación de Pedido"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <AlertTriangle size={32} />
            <p className="font-semibold text-lg">¿Estás seguro de anular esta venta?</p>
          </div>
          <p className="text-sm text-base-content/60">
            Esta acción liberará el inventario retenido temporalmente por este pedido de forma inmediata. No se puede revertir.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setCancelingSaleId(null)} disabled={isCanceling} />
            <button 
              className="btn btn-error text-white" 
              onClick={handleCancelSale}
              disabled={isCanceling}
            >
              {isCanceling ? "Cancelando..." : "Sí, Anular"}
            </button>
          </div>
        </div>
      </ComerziaModal>

      {/* MODAL EDITAR VENTA PENDIENTE */}
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
              <button 
                className="btn btn-primary btn-sm"
                onClick={handleCatalogSearch}
                disabled={isSearchingCatalog}
              >
                Buscar
              </button>
            </div>

            {/* Resultados rápidos de edición */}
            {isSearchingCatalog ? (
              <span className="loading loading-spinner loading-sm text-primary block mx-auto"></span>
            ) : editSearchResults.length > 0 ? (
              <div className="border border-base-200 bg-white rounded-lg overflow-y-auto max-h-[150px] p-2 space-y-1">
                {editSearchResults.map(item => (
                  <div key={item.productVariantId} className="flex justify-between items-center text-xs p-1.5 hover:bg-base-100 rounded">
                    <span>{item.variantName} (Stock: {item.stock})</span>
                    <button 
                      className="btn btn-primary btn-xs"
                      onClick={() => handleAddEditItem(item)}
                    >
                      Agregar
                    </button>
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
                      <button
                        className="btn btn-ghost btn-xs text-error hover:bg-error/10 rounded-full"
                        onClick={() => handleRemoveEditItem(item.productVariantId)}
                      >
                        <Trash2 size={16} />
                      </button>
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
