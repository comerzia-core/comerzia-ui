import { useState } from 'react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { salesService } from '../services/salesService';
import type { SaleResponse, SaleDetailResponse, ReturnResponse } from '../types/sales';
import { useToast } from '../../../context/ToastContext';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { BtnCancel, BtnSave, BtnModalYes } from '../../../components/ui/CrudButtons';
import { RefreshCw, Search, ShieldAlert, AlertTriangle, FileText, CheckCircle } from 'lucide-react';

export const ReturnsPage = () => {
  const { userProfile } = useAuthStore();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [saleIdInput, setSaleIdInput] = useState('');
  const [activeSale, setActiveSale] = useState<SaleResponse | null>(null);
  const [isLoadingSale, setIsLoadingSale] = useState(false);

  // Formulario de Devolución
  const [reason, setReason] = useState('');
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({}); // saleDetailId -> quantityToReturn
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);

  const [showConfirmModal, setShowConfirmModal] = useState(false);

  const currency = userProfile?.companySettings?.currencyCode || 'USD';

  // Buscar Venta por ID
  const handleSearchSale = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!saleIdInput.trim()) return;

    setIsLoadingSale(true);
    setActiveSale(null);
    setReason('');
    setReturnQtys({});

    try {
      // Como el backend no provee un GET unitario directo, buscamos la venta en las del turno del cajero
      const res = await salesService.getMyShiftSales();
      const term = saleIdInput.trim().toLowerCase();
      const matched = res.find(s => s.id.toLowerCase() === term || (s.saleNumber && s.saleNumber.toLowerCase() === term));
      
      if (matched) {
        const statusCode = typeof matched.saleStatus === 'object' ? (matched.saleStatus as any).code : matched.saleStatus;
        if (statusCode === 601) {
          toastWarning("Esta venta está PENDIENTE de cobro. Edítala o cancélala en el Historial.");
        } else if (statusCode === 603) {
          toastWarning("Esta venta está CANCELADA. No se pueden procesar devoluciones.");
        } else if (statusCode === 604) {
          toastWarning("Esta venta está ANULADA. No se pueden procesar devoluciones.");
        } else if (statusCode === 606) {
          toastWarning("Esta venta ya ha sido devuelta en su totalidad (DEV. TOTAL).");
        } else {
          setActiveSale(matched);
          // Inicializar cantidades de devolución en 0
          const qtys: Record<string, number> = {};
          (matched.details || []).forEach((d: SaleDetailResponse) => {
            qtys[d.id] = 0;
          });
          setReturnQtys(qtys);
        }
      } else {
        toastError("No se encontró la venta con ese código en tu turno activo.");
      }
    } catch (err) {
      toastError("Error al consultar las ventas en el turno actual.");
    } finally {
      setIsLoadingSale(false);
    }
  };

  // Manejar cambio en cantidad a devolver
  const handleQtyChange = (detailId: string, value: number, maxQty: number) => {
    const val = Math.max(0, Math.min(maxQty, value));
    setReturnQtys({
      ...returnQtys,
      [detailId]: val
    });
  };

  // Enviar devolución
  const handleSubmitReturn = async () => {
    if (!activeSale) return;
    if (!reason.trim()) {
      setShakeKey(prev => prev + 1);
      return;
    }

    const returnDetails = Object.entries(returnQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([detailId, qty]) => ({
        saleDetailId: detailId,
        quantityToReturn: qty
      }));

    if (returnDetails.length === 0) {
      toastWarning("Debes seleccionar al menos un producto y una cantidad mayor a 0 para devolver.");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        reason: reason.trim(),
        returnDetails
      };

      await salesService.processReturn(activeSale.id, payload);
      toastSuccess("Devolución procesada y registrada exitosamente. Inventario y caja actualizados.");
      setActiveSale(null);
      setSaleIdInput('');
      setReason('');
      setReturnQtys({});
      setShowConfirmModal(false);
    } catch (err: any) {
      toastError(err.response?.data?.message || "Ocurrió un error al procesar la devolución.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasItemsToReturn = Object.values(returnQtys).some(q => q > 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Procesar Devoluciones (Devoluciones de Caja)</h1>
        <p className="text-base-content/60 mt-1">Anulación parcial o total de tickets cobrados con reingreso automático de stock</p>
      </div>

      {/* SEGURIDAD: MENSAJE DE ROL/PERMISO */}
      <div className="bg-warning/15 border border-warning/30 text-warning p-4 rounded-xl flex gap-3 text-sm items-start">
        <ShieldAlert size={20} className="shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Control de Seguridad Activo:</span> Esta funcionalidad está restringida a personal con permisos de administración de devoluciones de caja (<code className="text-xs bg-warning/20 px-1 rounded">SAL_RETURNS_MANAGE</code>). Cada devolución registrará una salida contable y un movimiento de inventario irreversible.
        </div>
      </div>

      {/* BUSCADOR DE TICKET */}
      <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold flex items-center gap-2">
          <Search className="h-5 w-5 text-primary" />
          Buscar Ticket de Venta
        </h2>
        <form onSubmit={handleSearchSale} className="flex gap-2 max-w-lg">
          <input
            type="text"
            placeholder="Introduce el número de ticket o venta..."
            className="input input-bordered w-full bg-base-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={saleIdInput}
            onChange={(e) => setSaleIdInput(e.target.value)}
          />
          <ComerziaButton
            type="submit"
            variant="primary"
            label="Buscar"
            disabled={isLoadingSale}
            isLoading={isLoadingSale}
          />
        </form>
      </div>

      {/* FICHA DE LA VENTA A DEVOLVER */}
      {activeSale && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-slide-up">
          {/* LISTA DE ITEMS */}
          <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <FileText className="h-5 w-5 text-secondary" />
              Detalle del Ticket {activeSale.saleNumber ? `(N° #${activeSale.saleNumber})` : ''}
            </h3>

            <div className="overflow-x-auto">
              <table className="table table-compact w-full">
                <thead>
                  <tr className="bg-base-200/50">
                    <th>Producto</th>
                    <th>Comprado</th>
                    <th>Disp. Devolución</th>
                    <th className="w-24">A Devolver</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSale.details.map((d: SaleDetailResponse) => {
                    const availableToReturn = d.receiptQuantity ?? d.finalQuantity ?? d.unitQuantity ?? 0;
                    const finalPrice = d.unitFinalPrice ?? (d.receiptUnitPrice ?? d.unitSalePrice ?? 0);
                    
                    return (
                      <tr key={d.id} className="hover">
                        <td>
                          <div>
                            <span className="font-semibold block text-sm">{d.productName || d.variantName || 'Producto'}</span>
                            <span className="text-xs text-base-content/50">Precio Final: {currency} {finalPrice.toFixed(2)}</span>
                          </div>
                        </td>
                        <td>{d.receiptQuantity ?? d.unitQuantity ?? 0}</td>
                        <td>
                          <span className={`badge badge-sm font-semibold ${availableToReturn > 0 ? 'badge-success' : 'badge-neutral'}`}>
                            {availableToReturn} u
                          </span>
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            max={availableToReturn}
                            className="input input-bordered input-xs w-16"
                            value={returnQtys[d.id] || 0}
                            disabled={availableToReturn === 0}
                            onChange={(e) => handleQtyChange(d.id, parseInt(e.target.value) || 0, availableToReturn)}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* RAZÓN Y CONFIRMACIÓN */}
          <div className="bg-base-100 p-6 rounded-2xl border border-base-200 shadow-sm space-y-6">
            <h3 className="text-lg font-bold">Procesar Devolución</h3>
            
            <div className="space-y-4">
              <ComerziaInput
                label="Motivo de la Devolución"
                type="text"
                value={reason}
                placeholder="Escribe el motivo detallado..."
                onChange={(e) => setReason(e.target.value)}
                error={!reason.trim() && shakeKey > 0 ? "El motivo es requerido" : ""}
                shakeKey={shakeKey}
                isRequired
              />

              {/* Alerta de devolución */}
              <div className="bg-error/10 border border-error/20 p-4 rounded-xl flex gap-3 text-xs text-error">
                <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">ADVERTENCIA:</span> Esta acción reingresará el stock seleccionado al inventario y registrará la salida del dinero correspondiente de la caja registradora. Es irreversible.
                </div>
              </div>
            </div>

            <ComerziaButton
              variant="delete"
              label="Confirmar Devolución"
              fullWidth
              disabled={!hasItemsToReturn || !reason.trim()}
              onClick={() => setShowConfirmModal(true)}
            />
          </div>
        </div>
      )}

      {/* MODAL CONFIRMACIÓN FINAL */}
      <ComerziaModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Confirmación de Devolución"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-error">
            <AlertTriangle size={32} />
            <p className="font-semibold text-lg">¿Procesar esta devolución?</p>
          </div>
          <p className="text-sm text-base-content/60">
            Se actualizarán los saldos de caja registradora del turno activo y las existencias físicas de los SKUs correspondientes en sucursal.
          </p>
          <div className="flex justify-end gap-2 mt-6">
            <BtnCancel onClick={() => setShowConfirmModal(false)} disabled={isSubmitting} />
            <BtnModalYes
              label="Sí, Procesar Devolución"
              onClick={handleSubmitReturn}
              isLoading={isSubmitting}
              disabled={isSubmitting}
            />
          </div>
        </div>
      </ComerziaModal>
    </div>
  );
};
