import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaCreatableSelect } from '../../../components/ui/ComerziaCreatableSelect';
import type { CategoryResponse, SegmentResponse, BrandResponse } from '../types/commercial';
import { ProductTable } from '../components/ProductTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { CreateFullProductModal } from '../components/CreateFullProductModal';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { Filter, ChevronDown } from 'lucide-react';

export const CatalogPage = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  const { hasPermission } = useAuthStore();
  const canManage = hasPermission('COM_CATALOG_MANAGE');

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [segments, setSegments] = useState<SegmentResponse[]>([]);
  const [brands, setBrands] = useState<BrandResponse[]>([]);

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>('');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('');

  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSegments, setIsLoadingSegments] = useState(false);
  const [isLoadingBrands, setIsLoadingBrands] = useState(false);

  const [showFilters, setShowFilters] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCategories();
  }, [canManage]);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const activeOnly = canManage ? false : undefined;
      const res = await commercialService.getCategories(activeOnly);
      setCategories(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingCategories(false);
    }
  };

  useEffect(() => {
    if (selectedCategoryId) {
      loadSegments(selectedCategoryId);
    } else {
      setSegments([]);
    }
    setSelectedSegmentId('');
    setSelectedBrandId('');
    setBrands([]);
  }, [selectedCategoryId, canManage]);

  const loadSegments = async (categoryId: string) => {
    setIsLoadingSegments(true);
    try {
      const activeOnly = canManage ? false : undefined;
      const res = await commercialService.getSegmentsByCategory(categoryId, activeOnly);
      setSegments(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingSegments(false);
    }
  };

  useEffect(() => {
    if (selectedSegmentId) {
      loadBrands(selectedSegmentId);
    } else {
      setBrands([]);
    }
    setSelectedBrandId('');
  }, [selectedSegmentId, canManage]);

  const loadBrands = async (segmentId: string) => {
    setIsLoadingBrands(true);
    try {
      const activeOnly = canManage ? false : undefined;
      const res = await commercialService.getBrandsBySegment(segmentId, activeOnly);
      setBrands(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBrands(false);
    }
  };

  const hasActiveFilters = Boolean(selectedCategoryId || selectedSegmentId || selectedBrandId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content tracking-tight">Catálogo de Productos</h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">Administración de catálogo y productos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <BtnCreate
            label="Nuevo Producto"
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      {/* TARJETA DE FILTROS COLAPSABLE */}
      <div className="card bg-base-100 p-4 sm:p-5 rounded-2xl shadow-xs border border-base-200">
        <div
          className="flex items-center justify-between cursor-pointer select-none"
          onClick={() => setShowFilters(prev => !prev)}
        >
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-primary" />
            <h2 className="text-base sm:text-lg font-bold text-base-content">Filtros de Búsqueda</h2>
            {hasActiveFilters && (
              <span className="badge badge-primary badge-sm font-semibold">
                Activos
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn-ghost btn-xs btn-circle text-base-content/70"
            onClick={(e) => {
              e.stopPropagation();
              setShowFilters(prev => !prev);
            }}
            title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}
          >
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-base-200/60 mt-3 animate-fade-in">
            <ComerziaCreatableSelect
              label="1. Categoría"
              entityName="Categoría"
              canManage={canManage}
              options={categories.map(c => ({ value: c.id, label: c.name, status: c.status }))}
              value={selectedCategoryId}
              onChange={(val) => {
                setSelectedCategoryId(val as string);
              }}
              onCreate={async (name) => {
                try {
                  const newCat = await commercialService.createCategory(name);
                  setCategories(prev => [...prev, newCat]);
                  toastSuccess("Categoría creada");
                  return newCat.id;
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al crear la categoría");
                  throw e;
                }
              }}
              onUpdate={async (id, newLabel, status) => {
                try {
                  await commercialService.updateCategory(id as string, newLabel, status);
                  setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newLabel, status } : c));
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al actualizar la categoría");
                  throw e;
                }
              }}
              onDelete={async (id) => {
                try {
                  await commercialService.deleteCategory(id as string);
                  setCategories(prev => prev.filter(c => c.id !== id));
                  if (selectedCategoryId === id) setSelectedCategoryId('');
                  toastSuccess("Categoría eliminada");
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al eliminar la categoría");
                  throw e;
                }
              }}
              isLoading={isLoadingCategories}
            />
            <ComerziaCreatableSelect
              label="2. Rubro"
              entityName="Rubro"
              canManage={canManage}
              options={segments.map(s => ({ value: s.id, label: s.name, status: s.status }))}
              value={selectedSegmentId}
              onChange={(val) => {
                setSelectedSegmentId(val as string);
              }}
              onCreate={async (name) => {
                try {
                  const newSeg = await commercialService.createSegment(name, selectedCategoryId);
                  setSegments(prev => [...prev, newSeg]);
                  toastSuccess("Rubro creado");
                  return newSeg.id;
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al crear rubro");
                  throw e;
                }
              }}
              onUpdate={async (id, newLabel, status) => {
                try {
                  const existing = segments.find(s => s.id === id);
                  await commercialService.updateSegment(id as string, newLabel, status, existing?.category?.id ?? selectedCategoryId);
                  setSegments(prev => prev.map(s => s.id === id ? { ...s, name: newLabel, status } : s));
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al actualizar rubro");
                  throw e;
                }
              }}
              onDelete={async (id) => {
                try {
                  await commercialService.deleteSegment(id as string);
                  setSegments(prev => prev.filter(s => s.id !== id));
                  if (selectedSegmentId === id) setSelectedSegmentId('');
                  toastSuccess("Rubro eliminado");
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al eliminar rubro");
                  throw e;
                }
              }}
              disabled={!selectedCategoryId}
              isLoading={isLoadingSegments}
            />
            <ComerziaCreatableSelect
              label="3. Marca"
              entityName="Marca"
              canManage={canManage}
              options={brands.map(b => ({ value: b.id, label: b.name, status: b.status }))}
              value={selectedBrandId}
              onChange={(val) => setSelectedBrandId(val as string)}
              onCreate={async (name) => {
                try {
                  const newBrand = await commercialService.createBrand(name, selectedSegmentId);
                  setBrands(prev => [...prev, newBrand]);
                  toastSuccess("Marca creada");
                  return newBrand.id;
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al crear marca");
                  throw e;
                }
              }}
              onUpdate={async (id, newLabel, status) => {
                try {
                  const existing = brands.find(b => b.id === id);
                  await commercialService.updateBrand(id as string, newLabel, status, existing?.segment?.id ?? selectedSegmentId);
                  setBrands(prev => prev.map(b => b.id === id ? { ...b, name: newLabel, status } : b));
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al actualizar marca");
                  throw e;
                }
              }}
              onDelete={async (id) => {
                try {
                  await commercialService.deleteBrand(id as string);
                  setBrands(prev => prev.filter(b => b.id !== id));
                  if (selectedBrandId === id) setSelectedBrandId('');
                  toastSuccess("Marca eliminada");
                } catch (e: any) {
                  toastError(e.response?.data?.message || "Error al eliminar marca");
                  throw e;
                }
              }}
              disabled={!selectedSegmentId}
              isLoading={isLoadingBrands}
            />
          </div>
        )}
      </div>

      {/* CONTENEDOR DE TABLA DE PRODUCTOS */}
      <div className="md:bg-base-100 md:p-6 md:rounded-2xl md:shadow-sm md:border md:border-base-200">
        <div className="mb-3 md:mb-4 px-1 md:px-0">
          <h2 className="text-sm md:text-lg font-bold text-base-content/70 md:text-base-content uppercase md:capitalize tracking-wider md:tracking-normal">Listado de Productos</h2>
        </div>

        <ProductTable
          categoryId={selectedCategoryId}
          segmentId={selectedSegmentId}
          brandId={selectedBrandId}
          refreshKey={refreshKey}
        />
      </div>

      <CreateFullProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialCategoryId={selectedCategoryId}
        initialSegmentId={selectedSegmentId}
        initialBrandId={selectedBrandId}
        onSuccess={() => {
          setRefreshKey(prev => prev + 1);
        }}
      />
    </div>
  );
};
