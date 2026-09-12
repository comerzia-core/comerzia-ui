import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { ScannerProductResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaSelectableCard } from '../../../components/ui/ComerziaSelectableCard';
import { ComerziaImageViewer } from '../../../components/ui/ComerziaImageViewer';
import { CommercialProductSearchBar } from '../components/CommercialProductSearchBar';
import { ImageOff, Store, Tag, Layers, ZoomIn, PackageSearch } from 'lucide-react';

export const StockQueryPage = () => {
  const [searchParams] = useSearchParams();
  const [productData, setProductData] = useState<ScannerProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [viewingImage, setViewingImage] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  useEffect(() => {
    // Check for barcode in URL
    const urlBarcode = searchParams.get('barcode');
    if (urlBarcode) {
      executeScan(urlBarcode);
    }
  }, [searchParams]);

  const executeScan = async (codeToScan: string) => {
    setIsLoading(true);
    setProductData(null);
    try {
      const res = await commercialService.scanBarcode(codeToScan.trim());
      setProductData(res);
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Producto no encontrado');
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const scannedVariant = productData?.scannedVariant;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto mt-2 sm:mt-6 px-2 sm:px-0">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <PackageSearch className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Consulta de Stock
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Busca productos por nombre, código de barras o escanea con la cámara para verificar disponibilidad.
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y SUGERENCIAS */}
      <div className="card bg-base-100 p-3.5 sm:p-4 rounded-2xl shadow-xs border border-base-200">
        <CommercialProductSearchBar
          onSearchBarcode={executeScan}
          isLoading={isLoading}
          shakeKey={shakeKey}
          placeholder="Buscar producto por nombre, código o SKU..."
        />
      </div>

      {productData && scannedVariant && (
        <div className="bg-base-100 rounded-2xl sm:rounded-3xl shadow-sm border border-base-200 overflow-hidden animate-slide-up">
          {/* Header Producto */}
          <div className="p-4 sm:p-8 border-b border-base-200 flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
            <div
              className={`w-24 h-24 sm:w-32 sm:h-32 bg-base-200 rounded-2xl flex-shrink-0 overflow-hidden border border-base-300 relative group ${scannedVariant.imageUrl ? 'cursor-pointer' : ''
                }`}
              onClick={() => {
                if (scannedVariant.imageUrl) {
                  setViewingImage({
                    isOpen: true,
                    url: scannedVariant.imageUrl,
                    title: `${productData.productName} - ${scannedVariant.variantName}`
                  });
                }
              }}
              title={scannedVariant.imageUrl ? "Clic para ampliar imagen" : undefined}
            >
              {scannedVariant.imageUrl ? (
                <>
                  <img
                    src={scannedVariant.imageUrl}
                    alt={scannedVariant.variantName}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ZoomIn size={24} />
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/30 bg-base-200">
                  <ImageOff className="h-8 w-8 sm:h-10 sm:w-10 mb-1 sm:mb-2" />
                  <span className="text-[10px] sm:text-xs font-medium">Sin imagen</span>
                </div>
              )}
            </div>

            <div className="flex-1 w-full min-w-0">
              <div className="flex flex-col sm:flex-row justify-between items-center sm:items-start gap-2">
                <div>
                  <h2 className="text-xl sm:text-3xl font-bold text-base-content mb-0.5">
                    {productData.productName}
                  </h2>
                  <h3 className="text-base sm:text-xl text-primary font-semibold mb-1">
                    {scannedVariant.variantName}
                  </h3>
                </div>
                <div className="text-center sm:text-right">
                  <div className="badge badge-md sm:badge-lg badge-outline font-mono bg-base-100 text-xs sm:text-lg py-2 sm:py-3 px-3 sm:px-4 border-base-300">
                    {scannedVariant.barCode}
                  </div>
                  <div className="text-xs sm:text-sm text-base-content/50 mt-1 font-mono">SKU: {scannedVariant.sku}</div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 mt-3 sm:mt-4">
                <ComerziaBadge variant="neutral" label={productData.brandName} />
                <span className="text-xs sm:text-sm text-base-content/60">
                  {productData.description || <span className="text-xs text-base-content/40 italic">(sin descripción)</span>}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-200">
            {/* Stock por Sucursal */}
            <div className="p-4 sm:p-8 bg-base-50">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Disponibilidad en Tiendas
                </h3>
                <span className="badge badge-primary font-bold text-xs sm:text-sm">Total: {scannedVariant.totalAvailableStock}</span>
              </div>

              <div className="space-y-2.5 sm:space-y-3">
                {scannedVariant.stockByBranch.map((sb, idx) => (
                  <div
                    key={`${sb.branchId}-${idx}`}
                    className={`flex justify-between items-center p-3.5 sm:p-4 rounded-xl border text-xs sm:text-sm ${sb.isCurrentBranch ? 'bg-primary/5 border-primary/20' : 'bg-base-100 border-base-200'}`}
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      {sb.isCurrentBranch && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      )}
                      <span className={`font-medium ${sb.isCurrentBranch ? 'text-primary' : ''}`}>
                        {sb.branchName}
                        {sb.isCurrentBranch && <span className="ml-1.5 text-[10px] sm:text-xs opacity-60 font-normal">(Actual)</span>}
                      </span>
                    </div>
                    <div className="font-mono text-base sm:text-lg font-bold">
                      {sb.availableQuantity} <span className="text-xs sm:text-sm font-normal opacity-50">uds</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de Precios */}
            <div className="p-4 sm:p-8">
              <h3 className="text-base sm:text-lg font-bold mb-4 sm:mb-6 flex items-center gap-2">
                <Tag className="h-5 w-5 text-success" />
                Listas de Precio Activas
              </h3>

              <div className="grid gap-3 sm:gap-4">
                {scannedVariant.activePrices.map((price, idx) => (
                  <div key={`${price.priceTypeId}-${idx}`} className="bg-base-100 border border-base-200 p-3.5 sm:p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-base-content">{price.priceTypeName}</h4>
                      <p className="text-[11px] sm:text-xs text-base-content/50 mt-0.5">{price.equivalenceFactor} Unidades</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {price.discountPrice != null && price.discountPrice !== price.salePrice && (
                        <div className="text-xs sm:text-sm font-medium text-error font-mono px-2 py-1 bg-error/10 rounded-md">
                          {currencyCode} {price.discountPrice.toFixed(2)}
                        </div>
                      )}
                      <div className="text-lg sm:text-2xl font-bold text-success font-mono">
                        {currencyCode} {price.salePrice.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Otras variantes */}
          {productData.otherVariants && productData.otherVariants.length > 0 && (
            <div className="p-4 sm:p-8 bg-base-100 border-t border-base-200">
              <h3 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Otras variantes de este producto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {productData.otherVariants.map((variant, idx) => (
                  <ComerziaSelectableCard
                    key={`${variant.variantId}-${idx}`}
                    title={variant.variantName}
                    description={variant.barCode}
                    selected={false}
                    onClick={() => {
                      executeScan(variant.barCode);
                    }}
                    icon={
                      variant.imageUrl ? (
                        <img src={variant.imageUrl} alt={variant.variantName} className="w-8 h-8 rounded object-cover" />
                      ) : (
                        <ImageOff className="h-6 w-6" />
                      )
                    }
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <ComerziaImageViewer
        isOpen={viewingImage.isOpen}
        onClose={() => setViewingImage({ ...viewingImage, isOpen: false })}
        imageUrl={viewingImage.url}
        title={viewingImage.title}
      />
    </div>
  );
};
