import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import type { ProductResponse } from '../types/commercial';
import { ProductVariantsModal } from './ProductVariantsModal';
import { useAuthStore } from '../../../stores/useAuthStore';

import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { EditProductModal } from './EditProductModal';
import { Edit, Trash2 } from 'lucide-react';

interface Props {
  brandId: string;
  selectedProducts: string[];
  setSelectedProducts: (val: string[]) => void;
  refreshKey?: number;
}

export const ProductTable = ({ brandId, selectedProducts, setSelectedProducts, refreshKey = 0 }: Props) => {
  const [data, setData] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  const { hasRole } = useAuthStore();
  const isOwner = hasRole('OWNER');
  const { error: toastError, success: toastSuccess } = useToast();

  const [productToEdit, setProductToEdit] = useState<ProductResponse | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; row: ProductResponse | null }>({ isOpen: false, x: 0, y: 0, row: null });

  useEffect(() => {
    loadData();
  }, [brandId, page, size, refreshKey]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeOnly = isOwner ? false : undefined;
      const res = await commercialService.getProductsByBrand(brandId, page, size, activeOnly);
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

  const handleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await commercialService.deleteProduct(productToDelete.id);
      toastSuccess("Producto eliminado exitosamente");
      loadData();
      setProductToDelete(null);
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al eliminar el producto");
    } finally {
      setIsDeleting(false);
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
    { 
      header: 'Descripción', 
      render: (row) => row.description ? row.description : <span className="text-base-content/40 italic">(sin descripción)</span>
    },
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

  // Se eliminó la columna de Acciones para usar menú contextual

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
        onRowContextMenu={(e, row) => {
          e.preventDefault();
          if (isOwner) {
            setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, row });
          }
        }}
      />
      
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      >
        {isOwner && (
          <>
            <ContextMenuItem 
              icon={Edit}
              label="Editar"
              onClick={() => { setProductToEdit(contextMenu.row); setContextMenu({ ...contextMenu, isOpen: false }); }} 
            />
            <ContextMenuItem 
              icon={Trash2}
              label="Eliminar"
              variant="error"
              onClick={() => { setProductToDelete(contextMenu.row); setContextMenu({ ...contextMenu, isOpen: false }); }} 
            />
          </>
        )}
      </ComerziaContextMenu>
      <ProductVariantsModal 
        isOpen={!!selectedProductId}
        onClose={() => setSelectedProductId(null)}
        productId={selectedProductId || ''}
        productName={selectedProductName}
      />
      <EditProductModal
        isOpen={!!productToEdit}
        onClose={() => setProductToEdit(null)}
        product={productToEdit}
        onSuccess={loadData}
      />
      <ConfirmationModal
        isOpen={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Producto"
        message={`¿Estás seguro de que deseas eliminar el producto "${productToDelete?.name}"? Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </>
  );
};
