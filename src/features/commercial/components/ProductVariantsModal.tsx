import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { commercialService } from '../services/commercialService';
import type { ProductVariantResponse } from '../types/commercial';
import { useAuthStore } from '../../../stores/useAuthStore';
import { EditVariantModal } from './EditVariantModal';
import { VariantPricesModal } from './VariantPricesModal';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { ComerziaImageViewer } from '../../../components/ui/ComerziaImageViewer';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { Edit, Trash2, DollarSign, Search, ArrowRightLeft, History, Eye } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export const ProductVariantsModal = ({ isOpen, onClose, productId, productName }: Props) => {
  const navigate = useNavigate();
  const [data, setData] = useState<ProductVariantResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('COM_CATALOG_MANAGE');
  const canReadPrices = hasPermission('COM_PRICES_READ');
  const canManagePrices = hasPermission('COM_PRICES_MANAGE');
  const canManageStock = hasPermission('COM_STOCK_MANAGE');
  const { error: toastError, success: toastSuccess } = useToast();

  const [variantToEdit, setVariantToEdit] = useState<ProductVariantResponse | null>(null);
  const [variantToDelete, setVariantToDelete] = useState<ProductVariantResponse | null>(null);
  const [variantToPrices, setVariantToPrices] = useState<ProductVariantResponse | null>(null);
  const [isCreatingVariant, setIsCreatingVariant] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [viewingImage, setViewingImage] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; isCentered?: boolean; row: ProductVariantResponse | null }>({ isOpen: false, x: 0, y: 0, isCentered: false, row: null });

  useEffect(() => {
    if (isOpen && productId) {
      loadData();
    }
  }, [isOpen, productId, page, size, canManage]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeOnly = canManage ? false : undefined;
      const res = await commercialService.getVariantsByProduct(productId, page, size, activeOnly);
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

  const handleNavigate = (path: string) => {
    setContextMenu(prev => ({ ...prev, isOpen: false }));
    if (contextMenu.isCentered) {
      onClose();
      navigate(path);
    } else {
      window.open(path, '_blank');
    }
  };

  const columns: Column<ProductVariantResponse>[] = [
    {
      header: 'Imagen',
      render: (row) => (
        <div 
          className={`w-10 h-10 rounded-lg bg-base-200 overflow-hidden border border-base-300 transition-transform ${
            row.imageUrl ? 'cursor-pointer hover:scale-105 shadow-xs' : ''
          }`}
          onClick={() => {
            if (row.imageUrl) {
              setViewingImage({
                isOpen: true,
                url: row.imageUrl,
                title: `${productName} - ${row.name}`
              });
            }
          }}
          title={row.imageUrl ? "Clic para ver imagen" : undefined}
        >
          {row.imageUrl ? (
            <img src={row.imageUrl} alt={row.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-base-content/30 text-[10px]">Sin img</div>
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
    <>
      <ComerziaModal
        isOpen={isOpen}
        onClose={onClose}
        title={`Variantes de ${productName}`}
        size="xl"
      >
        <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          {canManage && (
            <BtnCreate onClick={() => setIsCreatingVariant(true)} label="Añadir Variante" className="w-full sm:w-auto" />
          )}
        </div>

        {/* VISTA DESKTOP: TABLA */}
        <div className="hidden md:block">
          <ComerziaTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            pagination={pagination}
            showRowNumbers={true}
            onRowContextMenu={(e, row) => {
              e.preventDefault();
              setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isCentered: false, row });
            }}
          />
        </div>

        {/* VISTA MOBILE: CARDS */}
        <div className="block md:hidden space-y-3">
          {isLoading ? (
            <div className="py-8 text-center">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-6 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
              No hay variantes registradas para este producto.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.map((variant) => (
                <div
                  key={variant.id}
                  onClick={() => {
                    setContextMenu({ isOpen: true, x: 0, y: 0, isCentered: true, row: variant });
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isCentered: false, row: variant });
                  }}
                  className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs select-none cursor-pointer hover:border-primary/40 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-12 h-12 rounded-lg bg-base-200 overflow-hidden border border-base-300 shrink-0"
                      onClick={(e) => {
                        if (variant.imageUrl) {
                          e.stopPropagation();
                          setViewingImage({
                            isOpen: true,
                            url: variant.imageUrl,
                            title: `${productName} - ${variant.name}`
                          });
                        }
                      }}
                    >
                      {variant.imageUrl ? (
                        <img src={variant.imageUrl} alt={variant.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-base-content/30 text-[9px]">Sin img</div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1">
                        <h4 className="font-bold text-sm text-base-content truncate">{variant.name}</h4>
                        <span className={`badge badge-xs shrink-0 font-semibold ${variant.status ? 'badge-success' : 'badge-error'}`}>
                          {variant.status ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-[11px] text-base-content/60 font-mono mt-0.5">
                        SKU: {variant.sku} | Barcode: {variant.barCode}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </ComerziaModal>

      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      >
        {contextMenu.row?.imageUrl && (
          <ContextMenuItem 
            icon={Eye}
            label="Ver Imagen"
            onClick={() => {
              if (contextMenu.row?.imageUrl) {
                setViewingImage({
                  isOpen: true,
                  url: contextMenu.row.imageUrl,
                  title: `${productName} - ${contextMenu.row.name}`
                });
              }
              setContextMenu({ ...contextMenu, isOpen: false });
            }} 
          />
        )}
        <ContextMenuItem 
          icon={Search}
          label="Consultar Stock"
          isExternalLink={!contextMenu.isCentered}
          onClick={() => {
            if (contextMenu.row?.barCode) {
              handleNavigate(`/commercial/stock-query?barcode=${encodeURIComponent(contextMenu.row.barCode)}`);
            }
          }} 
        />
        {canManageStock && (
          <ContextMenuItem 
            icon={ArrowRightLeft}
            label="Movimientos de Stock"
            isExternalLink={!contextMenu.isCentered}
            onClick={() => {
              if (contextMenu.row?.barCode) {
                handleNavigate(`/commercial/stock-movements?barcode=${encodeURIComponent(contextMenu.row.barCode)}`);
              }
            }} 
          />
        )}
        {canManagePrices && (
          <ContextMenuItem 
            icon={History}
            label="Histórico de Precios"
            isExternalLink={!contextMenu.isCentered}
            onClick={() => {
              if (contextMenu.row?.barCode) {
                handleNavigate(`/commercial/prices?barcode=${encodeURIComponent(contextMenu.row.barCode)}`);
              }
            }} 
          />
        )}
        {canReadPrices && (
          <ContextMenuItem 
            icon={DollarSign}
            label="Ver Precios"
            onClick={() => { setVariantToPrices(contextMenu.row); setContextMenu({ ...contextMenu, isOpen: false }); }} 
          />
        )}
        {canManage && (
          <>
            <ContextMenuItem 
              icon={Edit}
              label="Editar Variante"
              onClick={() => { setVariantToEdit(contextMenu.row); setContextMenu({ ...contextMenu, isOpen: false }); }} 
            />
            <ContextMenuItem 
              icon={Trash2}
              label="Eliminar Variante"
              variant="error"
              onClick={() => { setVariantToDelete(contextMenu.row); setContextMenu({ ...contextMenu, isOpen: false }); }} 
            />
          </>
        )}
      </ComerziaContextMenu>

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
        productName={productName}
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
      <ComerziaImageViewer
        isOpen={viewingImage.isOpen}
        onClose={() => setViewingImage({ ...viewingImage, isOpen: false })}
        imageUrl={viewingImage.url}
        title={viewingImage.title}
      />
    </>
  );
};
