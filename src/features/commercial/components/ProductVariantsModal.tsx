import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { commercialService } from '../services/commercialService';
import type { ProductVariantResponse } from '../types/commercial';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export const ProductVariantsModal = ({ isOpen, onClose, productId, productName }: Props) => {
  const [data, setData] = useState<ProductVariantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  useEffect(() => {
    if (isOpen && productId) {
      loadData();
    }
  }, [isOpen, productId, page, size]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await commercialService.getVariantsByProduct(productId, page, size);
      setData(res.content);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const columns: Column<ProductVariantResponse>[] = [
    {
      header: 'Imagen',
      render: (row) => (
        <div className="w-10 h-10 rounded bg-base-200 overflow-hidden">
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base-content/30 text-xs">Sin img</div>
          )}
        </div>
      )
    },
    { header: 'Nombre', accessorKey: 'name' },
    { header: 'SKU', accessorKey: 'sku' },
    { header: 'Cod. Barras', accessorKey: 'barCode' },
    { 
      header: 'Estado', 
      render: (row) => (
        <span className={`badge badge-sm ${row.status ? 'badge-success' : 'badge-error'}`}>
          {row.status ? 'Activo' : 'Inactivo'}
        </span>
      )
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
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Variantes de ${productName}`}
      size="xl"
    >
      <ComerziaTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
        showRowNumbers={true}
      />
    </ComerziaModal>
  );
};
