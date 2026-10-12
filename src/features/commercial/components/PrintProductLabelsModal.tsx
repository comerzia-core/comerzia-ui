import { ProductLabelPrintDialog } from './ProductLabelPrintDialog';
import type { ProductResponse } from '../types/commercial';

interface Props { isOpen: boolean; onClose: () => void; product: ProductResponse | null; }

export const PrintProductLabelsModal = ({ isOpen, onClose, product }: Props) =>
  isOpen && product ? <ProductLabelPrintDialog key={product.id} product={product} onClose={onClose} /> : null;
