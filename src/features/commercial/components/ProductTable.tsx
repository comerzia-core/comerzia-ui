import React, { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import type { ProductResponse } from '../types/commercial';
import { ProductVariantsModal } from './ProductVariantsModal';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { useToast } from '../../../context/ToastContext';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { EditProductModal } from './EditProductModal';
import { 
  Pencil, 
  Trash2, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Package 
} from 'lucide-react';

interface Props {
  searchTerm?: string;
  categoryId?: string;
  segmentId?: string;
  brandId?: string;
  refreshKey?: number;
}

export const ProductTable = ({ 
  searchTerm,
  categoryId, 
  segmentId, 
  brandId, 
  refreshKey = 0 
}: Props) => {
  const [data, setData] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string>('');

  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('COM_CATALOG_MANAGE');
  const { error: toastError, success: toastSuccess } = useToast();

  const [productToEdit, setProductToEdit] = useState<ProductResponse | null>(null);
  const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Menú contextual (Desktop: coordenadas del mouse; Mobile: centrado en pantalla con telón)
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    product: ProductResponse | null;
    isCentered: boolean;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    product: null,
    isCentered: false
  });

  const handleContextMenu = (e: React.MouseEvent, product: ProductResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      product,
      isCentered: false
    });
  };

  const handleMobileCardTap = (e: React.MouseEvent, product: ProductResponse) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      isOpen: true,
      x: 0,
      y: 0,
      product,
      isCentered: true
    });
  };

  // Reset page to 0 when filters or search change
  useEffect(() => {
    setPage(0);
  }, [categoryId, segmentId, brandId, searchTerm]);

  useEffect(() => {
    loadData();
  }, [categoryId, segmentId, brandId, searchTerm, page, size, refreshKey, canManage]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const activeOnly = canManage ? false : undefined;
      const cleanSearch = searchTerm?.trim();
      const q = cleanSearch && cleanSearch.length >= 3 ? cleanSearch : undefined;

      const res = await commercialService.getProducts({
        q,
        categoryId: categoryId || undefined,
        segmentId: segmentId || undefined,
        brandId: brandId || undefined,
        page,
        size,
        activeOnly
      });
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

  const totalPages = Math.ceil(totalElements / size);

  const columns: Column<ProductResponse>[] = [
    { 
      header: 'Nombre', 
      accessorKey: 'name',
      render: (row) => (
        <div>
          <span className="font-semibold text-sm text-base-content block">
            {row.name}
          </span>
          {row.brand?.name && (
            <span className="text-[11px] text-base-content/50 block">
              {row.brand.name}
              {row.brand.segment?.name ? ` · ${row.brand.segment.name}` : ''}
            </span>
          )}
        </div>
      )
    },
    { 
      header: 'Descripción', 
      render: (row) => row.description ? (
        <span className="text-sm text-base-content/80">{row.description}</span>
      ) : (
        <span className="text-xs text-base-content/40 italic">(sin descripción)</span>
      )
    },
    { 
      header: 'Tipo de Variante', 
      render: (row) => (
        <span className="badge badge-sm badge-neutral font-semibold border-0 text-[11px]">
          {row.variantName || 'Variante Simple'}
        </span>
      )
    },
    { 
      header: 'Estado', 
      render: (row) => (
        <ComerziaBadge
          label={row.status ? 'Activo' : 'Inactivo'}
          variant={row.status ? 'success' : 'error'}
        />
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
          onRowContextMenu={handleContextMenu}
          rowClassName={() => 'hover:!bg-primary/10 transition-colors cursor-pointer'}
        />
      </div>

      {/* VISTA MOBILE: CARDS COMPACTAS CON TAP DIRECTO AL MENÚ CONTEXTUAL */}
      <div className="block md:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center">
            <span className="loading loading-spinner loading-md text-primary"></span>
            <p className="text-xs text-base-content/50 mt-2">Cargando productos...</p>
          </div>
        ) : data.length === 0 ? (
          <div className="text-center py-10 text-base-content/50 bg-base-200/50 rounded-2xl">
            <Package size={32} className="mx-auto text-base-content/30 mb-2" />
            <p className="text-sm font-medium">No se encontraron productos registrados</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.map((product, index) => (
              <article
                key={product.id}
                onClick={(e) => handleMobileCardTap(e, product)}
                className="bg-base-100 p-3.5 rounded-2xl border border-base-200 hover:border-base-300 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2.5 select-none cursor-pointer"
              >
                {/* FILA SUPERIOR: NÚMERO, NOMBRE Y ESTADO */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0 mt-0.5">
                      {page * size + index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                        {product.name}
                      </h3>
                      {product.brand?.name && (
                        <span className="text-[11px] text-primary font-medium block truncate mt-0.5">
                          {product.brand.name}
                          {product.brand.segment?.name ? ` · ${product.brand.segment.name}` : ''}
                        </span>
                      )}
                      <p className="text-xs text-base-content/60 line-clamp-1 mt-0.5">
                        {product.description || <span className="text-xs text-base-content/40 italic">(sin descripción)</span>}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <ComerziaBadge
                      label={product.status ? 'Activo' : 'Inactivo'}
                      variant={product.status ? 'success' : 'error'}
                    />
                  </div>
                </div>

                {/* FILA INFERIOR: TIPO DE VARIANTE */}
                <div className="pl-[26px] flex items-center justify-between text-xs text-base-content/70">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral text-neutral-content tracking-wider uppercase">
                    {product.variantName || 'Variante Simple'}
                  </span>
                </div>
              </article>
            ))}
          </div>
        )}

        {/* PAGINACIÓN MOBILE ESTANDARIZADA */}
        {totalElements > 0 && (
          <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                <span>Mostrar</span>
                <select
                  value={size}
                  onChange={(e) => {
                    setSize(Number(e.target.value));
                    setPage(0);
                  }}
                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                </select>
                <span className="whitespace-nowrap">de {totalElements} registros</span>
              </div>
              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                Página {page + 1} de {Math.max(1, totalPages)}
              </span>
            </div>

            <div className="flex items-center justify-center gap-1.5">
              <button
                type="button"
                aria-label="Primera página"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(0)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 0 || isLoading}
                onClick={() => setPage(Math.max(0, page - 1))}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(page + 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Última página"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setPage(totalPages - 1)}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </footer>
        )}
      </div>
      
      {/* MENÚ CONTEXTUAL (Centrado en móvil con telón / Posición de mouse en PC) */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {contextMenu.product && (
          <>
            <ContextMenuItem 
              icon={Layers}
              label="Ver Variantes"
              onClick={() => {
                if (contextMenu.product) {
                  setSelectedProductId(contextMenu.product.id);
                  setSelectedProductName(contextMenu.product.name);
                }
              }}
            />
            {canManage && (
              <>
                <ContextMenuItem 
                  icon={Pencil}
                  label="Modificar Producto"
                  onClick={() => { 
                    if (contextMenu.product) {
                      setProductToEdit(contextMenu.product); 
                    }
                  }} 
                />
                <ContextMenuItem 
                  icon={Trash2}
                  label="Eliminar Producto"
                  variant="error"
                  onClick={() => { 
                    if (contextMenu.product) {
                      setProductToDelete(contextMenu.product); 
                    }
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
