import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import type { SaleResponse, SaleDetailResponse } from '../types/sales';
import { salesService } from '../services/salesService';
import { useAuthStore } from '../../../stores/useAuthStore';
import { formatDateForUser } from '../../../utils/date';
import { ShoppingBag, Wallet } from 'lucide-react';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponse | null;
}

export const SaleDetailsModal = ({ isOpen, onClose, sale }: Props) => {
  const { userProfile, hasRole } = useAuthStore();
  const isOwner = hasRole('OWNER');
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  const [details, setDetails] = useState<SaleDetailResponse[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  const { options: dictOptions } = useLoadDictionaries([DICTIONARIES.PAYMENT_TYPE]);
  const paymentTypeOptions = dictOptions[DICTIONARIES.PAYMENT_TYPE] || [];

  const getPaymentTypeLabel = (type: number): string => {
    const found = paymentTypeOptions.find(opt => String(opt.value) === String(type));
    if (found) return found.label;
    if (type === 701) return 'Efectivo';
    if (type === 702) return 'Transferencia / QR';
    if (type === 703) return 'Tarjeta Débito / Crédito';
    return `Método (${type})`;
  };

  useEffect(() => {
    if (isOpen && sale?.id) {
      // Si la venta ya tiene detalles cargados en memoria, usarlos
      if (sale.details && sale.details.length > 0) {
        setDetails(sale.details);
        return;
      }

      setIsLoadingDetails(true);
      salesService.getSaleDetails(sale.id)
        .then((res) => {
          setDetails(res || []);
        })
        .catch((err) => {
          console.error('Error al cargar detalles de la venta:', err);
          setDetails([]);
        })
        .finally(() => {
          setIsLoadingDetails(false);
        });
    } else if (!isOpen) {
      setDetails([]);
      setIsLoadingDetails(false);
    }
  }, [isOpen, sale?.id, sale?.details]);

  if (!sale) return null;

  const detailColumns: Column<SaleDetailResponse>[] = [
    {
      header: 'Producto / Variante',
      render: (row) => (
        <div className="truncate max-w-sm">
          <span className="font-bold text-base-content">{row.productName || 'Producto'}</span>
          {row.variantName && <span className="text-primary font-semibold ml-1.5">· {row.variantName}</span>}
        </div>
      )
    },
    {
      header: 'Cantidad',
      render: (row) => {
        const qty = row.receiptQuantity ?? 1;
        return (
          <span className="font-semibold text-base-content">
            {qty} {row.measureUnitName && <span className="text-xs text-base-content/60 font-normal">({row.measureUnitName})</span>}
          </span>
        );
      }
    },
    {
      header: 'Precio Unit.',
      render: (row) => `${currencyCode} ${(row.receiptUnitPrice ?? 0).toFixed(2)}`
    },
    {
      header: 'Descuento',
      render: (row) => {
        const discount = row.lineTotalDiscount ?? 0;
        return discount > 0 ? (
          <span className="text-error font-medium">-{currencyCode} {discount.toFixed(2)}</span>
        ) : (
          <span className="text-base-content/40">-</span>
        );
      }
    },
    {
      header: 'Subtotal Final',
      render: (row) => {
        const total = row.lineTotalFinal ?? 0;
        return (
          <span className="font-bold text-primary font-mono">
            {currencyCode} {total.toFixed(2)}
          </span>
        );
      }
    }
  ];

  const hasPayments = Boolean(sale.payments && sale.payments.length > 0);

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Venta ${sale.saleNumber ? `#${sale.saleNumber}` : ''}`}
      size="xl"
      variant="view"
    >
      <div className="space-y-5 pt-1">
        {/* Cabecera resumen de la venta con desglose de pagos integrado */}
        <div className="bg-base-100 shadow-sm p-3.5 sm:p-4 rounded-xl border border-base-300 space-y-3 text-xs">
          {/* Fila principal de datos de la venta */}
          <div className={`grid grid-cols-2 ${isOwner && sale.branchName ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2.5`}>
            {isOwner && sale.branchName && (
              <div>
                <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider block">Sucursal</span>
                <p className="font-bold mt-0.5 text-base-content truncate">{sale.branchName}</p>
              </div>
            )}
            <div>
              <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider block">Vendedor</span>
              <p className="font-bold mt-0.5 text-base-content truncate">{sale.employeeName || '-'}</p>
            </div>
            <div>
              <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider block">Fecha</span>
              <p className="font-semibold mt-0.5 text-base-content/80 text-[11px]">{formatDateForUser(sale.date)}</p>
            </div>
            <div>
              <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider block">Estado</span>
              <p className="font-bold mt-0.5 text-warning">
                {typeof sale.saleStatus === 'object' ? sale.saleStatus.label : (sale.saleStatus === 601 ? 'Pendiente' : sale.saleStatus === 602 ? 'Completada' : 'Cancelada')}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider block">Total</span>
              <p className="font-black text-primary font-mono text-sm sm:text-base mt-0.5">{currencyCode} {(sale.totalAmount ?? 0).toFixed(2)}</p>
            </div>
          </div>

          {/* Pagos integrados en la misma card principal */}
          {hasPayments && (
            <div className="pt-2.5 border-t border-base-200/80 space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Wallet size={14} className="text-primary" />
                <span className="text-[10px] font-bold text-base-content/60 uppercase tracking-wider">
                  {sale.payments!.length > 1 ? 'Métodos de Pago' : 'Método de Pago'}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {sale.payments!.map((payment, idx) => {
                  const paidVal = payment.amount ?? payment.amountPaid ?? 0;
                  const hasChange = payment.changeAmount !== undefined && payment.changeAmount !== null && payment.changeAmount > 0;
                  return (
                    <div key={payment.id || idx} className="bg-base-200/50 p-2 sm:p-2.5 rounded-lg border border-base-200 flex items-center justify-between text-xs gap-2">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <span className="font-bold text-base-content block truncate text-xs">
                          {getPaymentTypeLabel(payment.paymentType)}
                        </span>
                        {hasChange && (
                          <span className="text-[10px] text-warning font-mono font-medium block">
                            Cambio: {currencyCode} {payment.changeAmount!.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-[10px] text-base-content/50 block">Abonado</span>
                        <span className="font-mono font-bold text-primary text-xs sm:text-sm">
                          {currencyCode} {paidVal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Sección de Productos */}
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-base-content/80 mb-2.5 flex items-center gap-1.5">
            <ShoppingBag size={16} className="text-primary" /> Productos en la Venta ({isLoadingDetails ? '...' : details.length})
          </h4>

          {isLoadingDetails ? (
            <div className="py-8 text-center bg-base-100 rounded-xl border border-base-200">
              <span className="loading loading-spinner loading-md text-primary"></span>
              <p className="text-xs text-base-content/50 mt-2">Cargando detalles de los productos...</p>
            </div>
          ) : (
            <>
              {/* VISTA DESKTOP */}
              <div className="hidden sm:block">
                <ComerziaTable
                  data={details}
                  columns={detailColumns}
                  showRowNumbers={true}
                />
              </div>

              {/* VISTA MOBILE: CARDS */}
              <div className="block sm:hidden space-y-2 max-h-[45vh] overflow-y-auto pr-0.5">
                {details.length === 0 ? (
                  <p className="text-xs text-base-content/50 text-center py-4 bg-base-200/30 rounded-xl">
                    No hay productos detallados en esta venta.
                  </p>
                ) : (
                  details.map((detail, idx) => {
                    const discount = detail.lineTotalDiscount ?? 0;
                    const total = detail.lineTotalFinal ?? 0;
                    const qty = detail.receiptQuantity ?? 1;
                    return (
                      <div key={detail.id || idx} className="bg-base-100 p-3 rounded-xl border border-base-200 space-y-2 text-xs shadow-xs">
                        {/* Fila Única: Nombre de Producto · Variante y Total */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="min-w-0 flex-1 truncate whitespace-nowrap">
                            <span className="font-bold text-xs text-base-content">
                              {detail.productName || 'Producto'}
                            </span>
                            {detail.variantName && (
                              <span className="text-[11px] text-primary font-semibold ml-1">
                                · {detail.variantName}
                              </span>
                            )}
                          </div>
                          <span className="font-mono font-bold text-primary text-xs shrink-0">
                            {currencyCode} {total.toFixed(2)}
                          </span>
                        </div>

                        {/* Grilla: Cantidad con Unidad al lado | Precio Unitario | Descuento */}
                        <div className="grid grid-cols-3 gap-1.5 bg-base-200/40 p-2 rounded-lg text-center items-center">
                          <div className="min-w-0">
                            <span className="text-base-content/50 block text-[10px]">Cant.</span>
                            <span className="font-semibold text-base-content text-xs truncate block">
                              {qty} {detail.measureUnitName ? `(${detail.measureUnitName})` : ''}
                            </span>
                          </div>
                          <div>
                            <span className="text-base-content/50 block text-[10px]">P. Unit.</span>
                            <span className="font-mono text-base-content text-[11px]">
                              {currencyCode} {(detail.receiptUnitPrice ?? 0).toFixed(2)}
                            </span>
                          </div>
                          <div>
                            <span className="text-base-content/50 block text-[10px]">Desc.</span>
                            <span className={`font-mono text-[11px] ${discount > 0 ? 'text-error font-semibold' : 'text-base-content/40'}`}>
                              {discount > 0 ? `-${currencyCode} ${discount.toFixed(2)}` : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex flex-row items-center gap-2 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel onClick={onClose} label="Cerrar" responsive={false} className="w-full sm:w-auto" />
        </div>
      </div>
    </ComerziaModal>
  );
};
