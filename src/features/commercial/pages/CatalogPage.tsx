import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaCreatableSelect } from '../../../components/ui/ComerziaCreatableSelect';
import type { CategoryResponse, SegmentResponse, BrandResponse } from '../types/commercial';
import { ProductTable } from '../components/ProductTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { GroupFamilyModal } from '../components/GroupFamilyModal';
import { CreateFullProductModal } from '../components/CreateFullProductModal';
import { useToast } from '../../../context/ToastContext';

export const CatalogPage = () => {
  const { error: toastError, success: toastSuccess } = useToast();
  
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

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoadingCategories(true);
    try {
      const res = await commercialService.getCategories();
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
  }, [selectedCategoryId]);

  const loadSegments = async (categoryId: string) => {
    setIsLoadingSegments(true);
    try {
      const res = await commercialService.getSegmentsByCategory(categoryId);
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
  }, [selectedSegmentId]);

  const loadBrands = async (segmentId: string) => {
    setIsLoadingBrands(true);
    try {
      const res = await commercialService.getBrandsBySegment(segmentId);
      setBrands(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingBrands(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Catálogo de Productos</h1>
          <p className="text-base-content/60 mt-1">Administración de jerarquías y maestro de artículos</p>
        </div>
        <div className="flex gap-2">
          <BtnCreate 
            label="Nuevo Producto" 
            onClick={() => setIsCreateModalOpen(true)} 
          />
        </div>
      </div>

      <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
        <h2 className="text-lg font-bold mb-4">Filtros de Búsqueda</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ComerziaCreatableSelect
            label="1. Categoría"
            entityName="Categoría"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
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
            onUpdate={async (id, newLabel) => {
              try {
                const existing = categories.find(c => c.id === id);
                await commercialService.updateCategory(id as string, newLabel, existing?.status ?? true);
                setCategories(prev => prev.map(c => c.id === id ? { ...c, name: newLabel } : c));
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
            options={segments.map(s => ({ value: s.id, label: s.name }))}
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
            onUpdate={async (id, newLabel) => {
              try {
                const existing = segments.find(s => s.id === id);
                await commercialService.updateSegment(id as string, newLabel, existing?.status ?? true, existing?.category?.id ?? selectedCategoryId);
                setSegments(prev => prev.map(s => s.id === id ? { ...s, name: newLabel } : s));
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
            options={brands.map(b => ({ value: b.id, label: b.name }))}
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
            onUpdate={async (id, newLabel) => {
              try {
                const existing = brands.find(b => b.id === id);
                await commercialService.updateBrand(id as string, newLabel, existing?.status ?? true, existing?.segment?.id ?? selectedSegmentId);
                setBrands(prev => prev.map(b => b.id === id ? { ...b, name: newLabel } : b));
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
        onSuccess={() => {
          if (selectedBrandId) {
            loadBrands(selectedSegmentId); // Hack to reload products if needed, actually we just need to retrigger ProductTable
            // we can handle reloading products elegantly, but for now closing modal is fine.
          }
        }}
      />
    </div>
  );
};
