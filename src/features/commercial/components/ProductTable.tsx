import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import type { ProductResponse } from '../types/commercial';
import { ProductVariantsModal } from './ProductVariantsModal';

interface Props {
  brandId: string;
  selectedProducts: string[];
  setSelectedProducts: (val: string[]) => void;
}

export const ProductTable = ({ brandId, selectedProducts, setSelectedProducts }: Props) => {
  const [data, setData] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [brandId, page, size]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await commercialService.getProductsByBrand(brandId, page, size);
      setData(res.content);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(data.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectOne = (checked: boolean, id: string) => {
    if (checked) {
      setSelectedProducts([...selectedProducts, id]);
    } else {
      setSelectedProducts(selectedProducts.filter(p => p !== id));
    }
  };

  const isAllSelected = data.length > 0 && selectedProducts.length === data.length;

  const columns: Column<ProductResponse>[] = [
    {
      header: (
        <input 
          type="checkbox" 
          className="checkbox checkbox-sm checkbox-primary" 
          checked={isAllSelected}
          onChange={(e) => handleSelectAll(e.target.checked)}
        />
      ),
      accessorKey: 'id',
      render: (row) => (
        <input 
          type="checkbox" 
          className="checkbox checkbox-sm checkbox-primary" 
          checked={selectedProducts.includes(row.id)}
          onChange={(e) => handleSelectOne(e.target.checked, row.id)}
        />
      )
    },
    { header: 'Nombre', accessorKey: 'name' },
    { header: 'Descripción', accessorKey: 'description' },
    { 
      header: 'Tipo de Variante', 
      render: (row) => row.variantType === 1 ? 'Simple' : row.variantType === 2 ? 'Color' : 'Color/Talla'
    },
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
    <>
      <ComerziaTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
        showRowNumbers={true}
        onRowClick={(row) => {
          setSelectedProductId(row.id);
          setSelectedProductName(row.name);
        }}
      />
      <ProductVariantsModal 
        isOpen={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}
        productId={selectedProductId || ''}
        productName={selectedProductName}
      />
    </>
  );
};
