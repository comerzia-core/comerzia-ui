import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import type { SaleResponse, SaleDetailResponse } from '../types/sales';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ShoppingBag } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponse | null;
}

export const SaleDetailsModal = ({ isOpen, onClose, sale }: Props) => {
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  if (!sale) return null;

  const columns: Column<SaleDetailResponse>[] = [
    {
      header: 'Producto / Variante',
      render: (row) => (
        <div>
          <span className="font-semibold block">{row.productName || 'Variante'}</span>
          {row.variantName && <span className="text-xs text-base-content/60">{row.variantName}</span>}
          {row.measureUnitName && <span className="text-[11px] text-base-content/50 block">Unidad: {row.measureUnitName}</span>}
        </div>
      )
    },
    {
      header: 'Cantidad',
      render: (row) => row.receiptQuantity ?? row.unitQuantity ?? 1
    },
    {
      header: 'Precio Unit.',
      render: (row) => `${currencyCode} ${(row.receiptUnitPrice ?? row.unitSalePrice ?? 0).toFixed(2)}`
    },
    {
      header: 'Descuento',
      render: (row) => {
        const discount = row.lineTotalDiscount ?? row.unitDiscountAmount ?? 0;
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
        const total = row.lineTotalFinal ?? row.unitFinalPrice ?? 0;
        return (
          <span className="font-bold text-primary">
            {currencyCode} {total.toFixed(2)}
          </span>
        );
      }
    }
  ];

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Detalle de Venta ${sale.saleNumber ? `#${sale.saleNumber}` : ''}`}
      size="xl"
    >
      <div className="space-y-6 pt-2">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-base-200/50 p-4 rounded-xl border border-base-200 text-sm">
          <div>
            <span className="text-xs text-base-content/60 font-semibold uppercase">Vendedor</span>
            <p className="font-bold mt-0.5">{sale.employeeUsername || '-'}</p>
          </div>
          <div>
            <span className="text-xs text-base-content/60 font-semibold uppercase">Fecha</span>
            <p className="font-bold mt-0.5">{new Date(sale.date).toLocaleString()}</p>
          </div>
          <div>
            <span className="text-xs text-base-content/60 font-semibold uppercase">Estado Venta</span>
            <p className="font-bold mt-0.5">
              {typeof sale.saleStatus === 'object' ? sale.saleStatus.label : (sale.saleStatus === 601 ? 'Pendiente' : sale.saleStatus === 602 ? 'Completada' : 'Cancelada')}
            </p>
          </div>
          <div>
            <span className="text-xs text-base-content/60 font-semibold uppercase">Monto Total</span>
            <p className="font-extrabold text-primary text-base mt-0.5">{currencyCode} {sale.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-sm text-base-content/80 mb-3 flex items-center gap-2">
            <ShoppingBag size={18} className="text-primary" /> Productos en la Venta ({sale.details?.length || 0})
          </h4>

          {/* VISTA DESKTOP */}
          <div className="hidden sm:block">
            <ComerziaTable
              data={sale.details || []}
              columns={columns}
              showRowNumbers={true}
            />
          </div>

          {/* VISTA MOBILE: CARDS */}
          <div className="block sm:hidden space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
            {(!sale.details || sale.details.length === 0) ? (
              <p className="text-xs text-base-content/50 text-center py-4 bg-base-200/30 rounded-xl">
                No hay productos detallados en esta venta.
              </p>
            ) : (
              sale.details.map((detail, idx) => {
                const discount = detail.lineTotalDiscount ?? detail.unitDiscountAmount ?? 0;
                const total = detail.lineTotalFinal ?? detail.unitFinalPrice ?? 0;
                return (
                  <div key={detail.id || idx} className="bg-base-100 p-3 rounded-xl border border-base-200 space-y-2 text-xs shadow-sm">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <span className="font-bold text-sm text-base-content block leading-tight">
                          {detail.productName || 'Producto'}
                        </span>
                        {detail.variantName && (
                          <span className="text-xs text-base-content/60 font-medium block mt-0.5">
                            {detail.variantName}
                          </span>
                        )}
                        {detail.measureUnitName && (
                          <span className="badge badge-ghost badge-xs mt-1">
                            {detail.measureUnitName}
                          </span>
                        )}
                      </div>
                      <span className="font-mono font-bold text-primary text-sm shrink-0">
                        {currencyCode} {total.toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 bg-base-200/40 p-2 rounded-lg text-center">
                      <div>
                        <span className="text-base-content/50 block text-[10px]">Cantidad</span>
                        <span className="font-semibold text-base-content">
                          {detail.receiptQuantity ?? detail.unitQuantity ?? 1}
                        </span>
                      </div>
                      <div>
                        <span className="text-base-content/50 block text-[10px]">Precio Unit.</span>
                        <span className="font-mono text-base-content text-[11px]">
                          {currencyCode} {(detail.receiptUnitPrice ?? detail.unitSalePrice ?? 0).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-base-content/50 block text-[10px]">Descuento</span>
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
        </div>

        <div className="flex justify-end pt-4 border-t border-base-200">
          <BtnCancel onClick={onClose} label="Cerrar" />
        </div>
      </div>
    </ComerziaModal>
  );
};
