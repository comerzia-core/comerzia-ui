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
            <ShoppingBag size={18} className="text-primary" /> Productos en la Venta
          </h4>
          <ComerziaTable
            data={sale.details || []}
            columns={columns}
            showRowNumbers={true}
          />
        </div>

        <div className="flex justify-end pt-4 border-t border-base-200">
          <BtnCancel onClick={onClose} label="Cerrar" />
        </div>
      </div>
    </ComerziaModal>
  );
};
