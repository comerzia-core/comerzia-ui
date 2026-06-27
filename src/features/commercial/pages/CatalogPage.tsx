import { useState, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import type { CategoryResponse, SegmentResponse, BrandResponse } from '../types/commercial';
import { ProductTable } from '../components/ProductTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { GroupFamilyModal } from '../components/GroupFamilyModal';
import { CreateFullProductModal } from '../components/CreateFullProductModal';

export const CatalogPage = () => {
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
          <ComerziaSelect
            label="1. Categoría"
            options={categories.map(c => ({ value: c.id, label: c.name }))}
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            isLoading={isLoadingCategories}
          />
          <ComerziaSelect
            label="2. Segmento/Rubro"
            options={segments.map(s => ({ value: s.id, label: s.name }))}
            value={selectedSegmentId}
            onChange={(e) => setSelectedSegmentId(e.target.value)}
            disabled={!selectedCategoryId}
            isLoading={isLoadingSegments}
          />
          <ComerziaSelect
            label="3. Marca"
            options={brands.map(b => ({ value: b.id, label: b.name }))}
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
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
