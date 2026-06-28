import { useState, useEffect } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { commercialService } from '../services/commercialService';
import type { ProductVariantResponse } from '../types/commercial';
import { useAuthStore } from '../../../stores/useAuthStore';
import { EditVariantModal } from './EditVariantModal';
import { VariantPricesModal } from './VariantPricesModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { BtnEdit, BtnDeleteIcon, BtnCreate, BtnPriceIcon } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';

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

  const { hasRole } = useAuthStore();
  const isOwner = hasRole('OWNER');
  const { error: toastError, success: toastSuccess } = useToast();

  const [variantToEdit, setVariantToEdit] = useState<ProductVariantResponse | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<ProductVariantResponse | null>(null);
  const [variantToPrices, setVariantToPrices] = useState<ProductVariantResponse | null>(null);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDelete = async () => {
    if (!variantToDelete) return;
    setIsDeleting(true);
    try {
      await commercialService.deleteProductVariant(variantToDelete.id);
      toastSuccess("Variante eliminada exitosamente");
      loadData();
      setVariantToDelete(null);
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al eliminar la variante");
    } finally {
      setIsDeleting(false);
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

  if (isOwner) {
    columns.push({
      header: 'Acciones',
      render: (row) => (
        <div className="flex gap-2">
          <BtnPriceIcon onClick={() => setVariantToPrices(row)} title="Actualizar precio" />
          <BtnEdit onClick={() => setVariantToEdit(row)} title="Editar variante" />
          <BtnDeleteIcon onClick={() => setVariantToDelete(row)} title="Eliminar variante" />
        </div>
      )
    });
  }

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
      <ComerziaModal
        isOpen={isOpen}
      onClose={onClose}
      title={`Variantes de ${productName}`}
      size="xl"
    >
      <div className="mb-4 flex justify-between items-center">
        <h3 className="font-semibold text-base-content/70">Listado de Variantes</h3>
        {isOwner && (
          <BtnCreate onClick={() => setIsCreatingVariant(true)} label="Añadir Variante" />
        )}
      </div>
      <ComerziaTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        pagination={pagination}
        showRowNumbers={true}
      />
      </ComerziaModal>
      <VariantPricesModal
        isOpen={!!variantToPrices}
        onClose={() => setVariantToPrices(null)}
        variantId={variantToPrices?.id || ''}
        variantName={variantToPrices?.name || ''}
      />
      <EditVariantModal
        isOpen={!!variantToEdit || isCreatingVariant}
        onClose={() => {
          setVariantToEdit(null);
          setIsCreatingVariant(false);
        }}
        variant={variantToEdit}
        productId={productId}
        onSuccess={loadData}
      />
      <ConfirmationModal
        isOpen={!!variantToDelete}
        onClose={() => setVariantToDelete(null)}
        onConfirm={handleDelete}
        title="Eliminar Variante"
        message={`¿Estás seguro de que deseas eliminar la variante "${variantToDelete?.name}"? Esta acción no se puede deshacer.`}
        isLoading={isDeleting}
      />
    </>
  );
};
