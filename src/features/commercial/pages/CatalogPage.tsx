import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaCreatableSelect } from '../../../components/ui/ComerziaCreatableSelect';
import type { CategoryResponse, SegmentResponse, BrandResponse } from '../types/commercial';
import { ProductTable } from '../components/ProductTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { GroupFamilyModal } from '../components/GroupFamilyModal';
import { CreateFullProductModal } from '../components/CreateFullProductModal';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';

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

  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
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
      setSelectedSegmentId('');
      setSegments([]);
      setSelectedBrandId('');
      setBrands([]);
    }
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
      setSelectedBrandId('');
      setBrands([]);
    }
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-base-content tracking-tight">Catálogo de Productos</h1>
          <p className="text-xs sm:text-sm text-base-content/60 mt-0.5">Administración de jerarquías y maestro de artículos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <BtnCreate 
            label="Nuevo Producto" 
            onClick={() => setIsCreateModalOpen(true)}
            className="w-full sm:w-auto"
          />
        </div>
      </div>

      <div className="bg-base-100 p-4 sm:p-6 rounded-2xl shadow-sm border border-base-200">
        <h2 className="text-base sm:text-lg font-bold mb-4">Filtros de Búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComerziaCreatableSelect
            label="1. Categoría"
            entityName="Categoría"
            canManage={canManage}
            options={categories.map(c => ({ value: c.id, label: c.name, status: c.status }))}
            value={selectedCategoryId}
            onChange={(val) => {
              setSelectedCategoryId(val as string);
              if (!val) {
                setSelectedSegmentId('');
                setSelectedBrandId('');
              }
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
              if (!val) {
                setSelectedBrandId('');
              }
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
      </div>

      <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold">Listado de Productos</h2>
          <button 
            className="btn btn-primary btn-sm"
            disabled={selectedProducts.length < 2}
            onClick={() => setIsGroupModalOpen(true)}
          >
            Agrupar en Familia ({selectedProducts.length})
          </button>
        </div>
        
        {selectedBrandId ? (
          <ProductTable 
            brandId={selectedBrandId}
            selectedProducts={selectedProducts}
            setSelectedProducts={setSelectedProducts}
            refreshKey={refreshKey}
          />
        ) : (
          <div className="text-center py-10 text-base-content/50 bg-base-200 rounded-xl">
            Selecciona una marca para ver sus productos.
          </div>
        )}
      </div>

      <GroupFamilyModal 
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        selectedProductIds={selectedProducts}
        onSuccess={() => {
          setSelectedProducts([]);
          // We could reload products here if we needed to reflect the family in the UI, 
          // but product list doesn't necessarily show family right now.
        }}
      />

      <CreateFullProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        initialCategoryId={selectedCategoryId}
        initialSegmentId={selectedSegmentId}
        initialBrandId={selectedBrandId}
        onSuccess={() => {
          if (selectedBrandId) {
            setRefreshKey(prev => prev + 1);
          }
        }}
      />
    </div>
  );
};
