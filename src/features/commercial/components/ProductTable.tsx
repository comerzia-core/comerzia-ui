import { useState, useEffect, useRef } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import type { ProductResponse } from '../types/commercial';
import { ProductVariantsModal } from './ProductVariantsModal';
import { useAuthStore } from '../../../stores/useAuthStore';

import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { EditProductModal } from './EditProductModal';
import { Edit, Trash2, Layers, ChevronLeft, ChevronRight, Package } from 'lucide-react';

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

  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('COM_CATALOG_MANAGE');
  const { error: toastError, success: toastSuccess } = useToast();

  const [productToEdit, setProductToEdit] = useState<ProductResponse | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; row: ProductResponse | null }>({ isOpen: false, x: 0, y: 0, row: null });

  // Touch Long-Press Support
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleTouchStart = (product: ProductResponse, e: React.TouchEvent) => {
    touchStartPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    longPressTimerRef.current = setTimeout(() => {
      if (navigator.vibrate) navigator.vibrate(40);
      setContextMenu({
        isOpen: true,
        x: touchStartPosRef.current.x,
        y: touchStartPosRef.current.y,
        row: product
      });
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const moveX = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const moveY = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (moveX > 10 || moveY > 10) {
      handleTouchEnd();
    }
  };

  useEffect(() => {
    loadData();
  }, [brandId, page, size, refreshKey, canManage]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeOnly = canManage ? false : undefined;
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
  const totalPages = Math.ceil(totalElements / size);

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
      render: (row) => row.description ? row.description : <span className="text-xs text-base-content/40 italic">(sin descripción)</span>
    },
    { 
      header: 'Tipo de Variante', 
      accessorKey: 'variantName'
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
    totalPages,
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <>
      {/* VISTA DESKTOP: TABLA COMPLETA */}
      <div className="hidden md:block">
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
            setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, row });
          }}
        />
      </div>

      {/* VISTA MOBILE: CARDS COMPACTAS CON LONG-PRESS */}
      <div className="block md:hidden space-y-3">
        {data.length > 0 && (
          <div className="flex items-center justify-between px-2 py-1.5 bg-base-200/50 rounded-xl text-xs">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                className="checkbox checkbox-xs checkbox-primary"
                checked={isAllSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
              />
              <span className="font-semibold text-base-content/80">Seleccionar todos ({data.length})</span>
            </label>
            <span className="text-[11px] text-base-content/50 italic">Mantén presionado para opciones</span>
          </div>
        )}

        {isLoading ? (
          <div className="py-12 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-base-content/50 mt-2">Cargando productos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-base-content/50 bg-base-200/50 rounded-2xl">
            <Package size={32} className="mx-auto text-base-content/30 mb-2" />
            <p className="text-sm font-medium">No hay productos registrados en esta marca</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.map((product) => {
              const isSelected = selectedProducts.includes(product.id);
              return (
                <div
                  key={product.id}
                  onTouchStart={(e) => handleTouchStart(product, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchMove={handleTouchMove}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, row: product });
                  }}
                  className={`bg-base-100 p-4 rounded-2xl border transition-all select-none ${
                    isSelected ? 'border-primary bg-primary/5 shadow-sm' : 'border-base-200 hover:border-base-300 shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm checkbox-primary mt-0.5 shrink-0"
                        checked={isSelected}
                        onChange={(e) => handleSelectOne(e.target.checked, product.id)}
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-base-content leading-tight truncate">
                          {product.name}
                        </h4>
                        <p className="text-xs text-base-content/60 line-clamp-1 mt-0.5">
                          {product.description || <span className="text-xs text-base-content/40 italic">(sin descripción)</span>}
                        </p>
                      </div>
                    </div>
                    <span className={`badge badge-xs shrink-0 font-semibold ${product.status ? 'badge-success' : 'badge-error'}`}>
                      {product.status ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-base-200/60 text-xs text-base-content/70">
                    <span className="badge badge-neutral badge-outline badge-sm font-mono text-[10px]">
                      {product.variantName || 'Variante Simple'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedProductId(product.id);
                        setSelectedProductName(product.name);
                      }}
                      className="btn btn-ghost btn-xs text-primary font-bold gap-1"
                    >
                      <Layers size={13} /> Ver Variantes
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Paginación Mobile */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-1 pt-2">
            <button
              type="button"
              className="btn btn-sm btn-outline gap-1"
              disabled={page === 0 || isLoading}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
            >
              <ChevronLeft size={16} /> Ant.
            </button>
            <span className="text-xs font-semibold text-base-content/70">
              Pág. {page + 1} de {totalPages} ({totalElements} tot.)
            </span>
            <button
              type="button"
              className="btn btn-sm btn-outline gap-1"
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => setPage(prev => prev + 1)}
            >
              Sig. <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
      
      {/* MENÚ CONTEXTUAL */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      >
        {contextMenu.row && (
          <>
            <ContextMenuItem 
              icon={Layers}
              label="Ver Variantes"
              onClick={() => {
                if (contextMenu.row) {
                  setSelectedProductId(contextMenu.row.id);
                  setSelectedProductName(contextMenu.row.name);
                }
              }}
            />
            {canManage && (
              <>
                <ContextMenuItem 
                  icon={Edit}
                  label="Modificar Producto"
                  onClick={() => { 
                    setProductToEdit(contextMenu.row); 
                    setContextMenu({ ...contextMenu, isOpen: false }); 
                  }} 
                />
                <ContextMenuItem 
                  icon={Trash2}
                  label="Eliminar Producto"
                  variant="error"
                  onClick={() => { 
                    setProductToDelete(contextMenu.row); 
                    setContextMenu({ ...contextMenu, isOpen: false }); 
                  }} 
                />
              </>
            )}
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
