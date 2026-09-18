import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column } from '../../../components/ui/ComerziaTable';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import type { SaleResponse, SaleDetailResponse } from '../types/sales';
import { useAuthStore } from '../../../stores/useAuthStore';
import { formatDateForUser } from '../../../utils/date';
import { ShoppingBag } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sale: SaleResponse | null;
}

export const SaleDetailsModal = ({ isOpen, onClose, sale }: Props) => {
  const { userProfile, hasRole } = useAuthStore();
  const isOwner = hasRole('OWNER');
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  if (!sale) return null;

  const columns: Column<SaleDetailResponse>[] = [
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
        const qty = row.receiptQuantity ?? row.unitQuantity ?? 1;
        return (
          <span className="font-semibold text-base-content">
            {qty} {row.measureUnitName && <span className="text-xs text-base-content/60 font-normal">({row.measureUnitName})</span>}
          </span>
        );
      }
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
          <span className="font-bold text-primary font-mono">
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
      variant="view"
    >
      <div className="space-y-5 pt-1">
        <div className={`grid grid-cols-2 ${isOwner && sale.branchName ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-2.5 bg-base-100 shadow-sm p-3.5 rounded-xl border border-base-300 text-xs`}>
          {isOwner && sale.branchName && (
            <div>
              <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider block">Sucursal</span>
              <p className="font-bold mt-0.5 text-base-content truncate">{sale.branchName}</p>
            </div>
          )}
          <div>
            <span className="text-[10px] text-base-content/50 font-semibold uppercase tracking-wider block">Vendedor</span>
            <p className="font-bold mt-0.5 text-base-content truncate">{sale.employeeUsername || '-'}</p>
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
            <p className="font-black text-primary font-mono text-sm sm:text-base mt-0.5">{currencyCode} {sale.totalAmount.toFixed(2)}</p>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-xs sm:text-sm text-base-content/80 mb-2.5 flex items-center gap-1.5">
            <ShoppingBag size={16} className="text-primary" /> Productos en la Venta ({sale.details?.length || 0})
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
          <div className="block sm:hidden space-y-2 max-h-[50vh] overflow-y-auto pr-0.5">
            {(!sale.details || sale.details.length === 0) ? (
              <p className="text-xs text-base-content/50 text-center py-4 bg-base-200/30 rounded-xl">
                No hay productos detallados en esta venta.
              </p>
            ) : (
              sale.details.map((detail, idx) => {
                const discount = detail.lineTotalDiscount ?? detail.unitDiscountAmount ?? 0;
                const total = detail.lineTotalFinal ?? detail.unitFinalPrice ?? 0;
                const qty = detail.receiptQuantity ?? detail.unitQuantity ?? 1;
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
                          {currencyCode} {(detail.receiptUnitPrice ?? detail.unitSalePrice ?? 0).toFixed(2)}
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
        </div>

        <div className="flex flex-row items-center gap-2 pt-3 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel onClick={onClose} label="Cerrar" responsive={false} className="w-full sm:w-auto" />
        </div>
      </div>
    </ComerziaModal>
  );
};
