import { isTransientRefreshFailure } from '../../realtime/utils/refreshErrors';
import { useRealtimeRefresh } from '../../realtime/hooks/useRealtimeRefresh';
import React, { useState, useEffect, useMemo } from 'react';
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
import { PrintProductLabelsModal } from './PrintProductLabelsModal';
import { getCatalogErrorMessage } from '../utils/catalogErrorMessages';
import { useUrlParams } from '../../../hooks/useUrlState';
import { 
  Pencil, 
  Trash2, 
  Layers, 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight, 
  Package,
  Barcode
} from 'lucide-react';

import { PERMISSIONS } from '../../../config/permissions';

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
  useRealtimeRefresh(['PRODUCT', 'CATEGORY'], async () => {
    await loadData(true);
  });

  const { getParam, setParams } = useUrlParams();

  // URL state: IDs son strings ofuscados
  const urlProductId = getParam('product');
  const urlPrintProductId = getParam('printProduct');
  const urlEditProductId = getParam('editProduct');
  const urlPage = getParam('page');
  const page = urlPage ? Math.max(0, parseInt(urlPage, 10)) : 0;

  const [data, setData] = useState<ProductResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);

  const [selectedProductName, setSelectedProductName] = useState<string>('');

  const { hasPermission, hasRole } = useAuthStore();
  const canManage = hasPermission('COM_CATALOG_MANAGE');
  const canPrint = hasRole('OWNER') && hasPermission(PERMISSIONS.HARDWARE.PRINT_EXECUTE);
  const { error: toastError, success: toastSuccess } = useToast();

  const [productToDelete, setProductToDelete] = useState<ProductResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Derivar objetos seleccionados a partir de los IDs en la URL
  const productForLabels = useMemo(() => {
    if (!urlPrintProductId) return null;
    return data.find(p => p.id === urlPrintProductId) || null;
  }, [data, urlPrintProductId]);

  const productToEdit = useMemo(() => {
    if (!urlEditProductId) return null;
    return data.find(p => p.id === urlEditProductId) || null;
  }, [data, urlEditProductId]);

  const selectedProduct = useMemo(() => {
    if (!urlProductId) return null;
    return data.find(p => p.id === urlProductId) || null;
  }, [data, urlProductId]);

  const activeProductName = selectedProduct?.name || selectedProductName || '';

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

  // Reset page a 0 en la URL cuando los filtros o búsqueda cambian
  useEffect(() => {
    if (page !== 0) {
      setParams({ page: null }, { replace: true });
    }
  }, [categoryId, segmentId, brandId, searchTerm]);

  useEffect(() => {
    loadData();
  }, [categoryId, segmentId, brandId, searchTerm, page, size, refreshKey, canManage]);

  const loadData = async (background = false) => {
    if (!background) setIsLoading(true);
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
      const preserveData = background && isTransientRefreshFailure(e);
      console.error(e);
      if (!preserveData) setData([]);
    } finally {
      if (!background) setIsLoading(false);
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
      toastError(getCatalogErrorMessage(e, "Error al eliminar el producto"));
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
    onPageChange: (newPage) => {
      setParams({ page: newPage > 0 ? String(newPage) : null }, { replace: true });
    },
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

                  <div className="shrink-0 flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-neutral text-neutral-content tracking-wider uppercase whitespace-nowrap">
                      {product.variantName || 'Variante Simple'}
                    </span>
                    <ComerziaBadge
                      label={product.status ? 'Activo' : 'Inactivo'}
                      variant={product.status ? 'success' : 'error'}
                    />
                  </div>
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
                    setParams({ page: null }, { replace: true });
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
                onClick={() => setParams({ page: null }, { replace: true })}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página anterior"
                disabled={page === 0 || isLoading}
                onClick={() => setParams({ page: page > 1 ? String(page - 1) : null }, { replace: true })}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Página siguiente"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setParams({ page: String(page + 1) }, { replace: true })}
                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Última página"
                disabled={page >= totalPages - 1 || isLoading}
                onClick={() => setParams({ page: String(totalPages - 1) }, { replace: true })}
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
                  setSelectedProductName(contextMenu.product.name);
                  setParams({ product: contextMenu.product.id }, { replace: false });
                }
              }}
            />
            {canPrint && (
              <ContextMenuItem 
                icon={Barcode}
                label="Imprimir Etiquetas de Código de Barras"
                onClick={() => {
                  if (contextMenu.product) {
                    setParams({ printProduct: contextMenu.product.id }, { replace: false });
                  }
                }}
              />
            )}
            {canManage && (
              <>
                <ContextMenuItem 
                  icon={Pencil}
                  label="Modificar Producto"
                  onClick={() => { 
                    if (contextMenu.product) {
                      setParams({ editProduct: contextMenu.product.id }, { replace: false });
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
        isOpen={Boolean(urlProductId)}
        onClose={() => setParams({ product: null, pricesVariant: null, editVariant: null }, { replace: false })}
        productId={urlProductId || ''}
        productName={activeProductName}
      />
      <PrintProductLabelsModal
        isOpen={Boolean(urlPrintProductId)}
        onClose={() => setParams({ printProduct: null }, { replace: false })}
        product={productForLabels}
      />
      <EditProductModal
        isOpen={Boolean(urlEditProductId)}
        onClose={() => setParams({ editProduct: null }, { replace: false })}
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
