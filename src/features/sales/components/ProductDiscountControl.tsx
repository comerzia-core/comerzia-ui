import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { useProductDiscount } from '../hooks/useProductDiscount';
import type { CartItem } from '../store/useCartStore';

interface Props {
  item: CartItem;
  currency: string;
  updateDiscount: (id: string, amount: number, priceTypeId?: string) => { success: boolean; message?: string };
  toastWarning: (message: string) => void;
  compact?: boolean;
}

export const ProductDiscountControl = ({ item, currency, updateDiscount, toastWarning, compact = false }: Props) => {
  const { value, setValue, commit, shakeKey, maximum } = useProductDiscount({ item, updateDiscount, toastWarning });
  return (
    <div className={compact ? 'w-44 text-left' : 'w-full'}>
      <ComerziaInput
        aria-label={`Descuento de ${item.productName}`}
        type="text"
        inputMode="decimal"
        placeholder="0.00"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            event.currentTarget.blur();
          }
        }}
        disabled={item.quantity === 0}
        error={item.discountError}
        shakeKey={shakeKey}
        className={compact ? 'input-sm text-right font-mono' : 'text-right font-mono'}
        helperText={`Máx. ${currency} ${maximum.toFixed(2)}`}
      />
    </div>
  );
};
