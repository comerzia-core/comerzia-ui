import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { ScannerProductResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
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
        <div className="space-y-4 sm:space-y-6 animate-slide-up">
          {/* Header Producto */}
          <div className="card bg-base-100 p-4 sm:p-6 rounded-2xl shadow-xs border border-base-200">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <div
                className={`w-24 h-24 sm:w-28 sm:h-28 bg-base-200/80 rounded-2xl flex-shrink-0 overflow-hidden border border-base-300 relative group ${
                  scannedVariant.imageUrl ? 'cursor-pointer' : ''
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
                      <ZoomIn size={22} />
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-base-content/30 bg-base-200/60">
                    <ImageOff className="h-8 w-8 sm:h-9 sm:w-9 mb-1" />
                    <span className="text-[10px] font-medium">Sin imagen</span>
                  </div>
                )}
              </div>

              <div className="flex-1 w-full min-w-0">
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-base-content leading-tight">
                  {productData.productName}{' '}
                  <span className="text-primary font-semibold">
                    {scannedVariant.variantName}
                  </span>
                </h2>

                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 mt-2 sm:mt-3">
                  {productData.brandName && (
                    <ComerziaBadge variant="neutral" label={productData.brandName} />
                  )}
                  {productData.description ? (
                    <p className="text-xs sm:text-sm text-base-content/70 leading-relaxed text-left">
                      {productData.description}
                    </p>
                  ) : (
                    <span className="text-xs text-base-content/40 italic">(sin descripción)</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Disponibilidad en Tiendas y Listas de Precios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Stock por Sucursal */}
            <div className="card bg-base-100 p-4 sm:p-6 rounded-2xl shadow-xs border border-base-200 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-base-200/70">
                  <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-base-content">
                    <Store className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                    Disponibilidad en Tiendas
                  </h3>
                  <span className="badge badge-primary font-bold text-xs sm:text-sm px-2.5 py-1">
                    Total: {scannedVariant.totalAvailableStock} uds
                  </span>
                </div>

                <div className="space-y-2 sm:space-y-2.5">
                  {scannedVariant.stockByBranch.length === 0 ? (
                    <p className="text-xs text-base-content/50 italic py-4 text-center">
                      No hay registros de stock en sucursales.
                    </p>
                  ) : (
                    scannedVariant.stockByBranch.map((sb, idx) => (
                      <div
                        key={`${sb.branchId}-${idx}`}
                        className={`flex justify-between items-center p-3 sm:p-3.5 rounded-xl border text-xs sm:text-sm transition-all ${
                          sb.isCurrentBranch
                            ? 'bg-primary/10 border-primary/30 shadow-2xs'
                            : 'bg-base-200/50 hover:bg-base-200/80 border-base-200'
                        }`}
                      >
                        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                          {sb.isCurrentBranch && (
                            <div className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0"></div>
                          )}
                          <span className={`font-medium truncate ${sb.isCurrentBranch ? 'text-primary font-bold' : 'text-base-content'}`}>
                            {sb.branchName}
                            {sb.isCurrentBranch && (
                              <span className="ml-1 text-[10px] sm:text-xs font-normal opacity-70">(Actual)</span>
                            )}
                          </span>
                        </div>
                        <div className="font-mono text-sm sm:text-base font-bold shrink-0 ml-2">
                          <span className={sb.availableQuantity > 0 ? (sb.isCurrentBranch ? 'text-primary' : 'text-base-content') : 'text-base-content/40'}>
                            {sb.availableQuantity}
                          </span>{' '}
                          <span className="text-xs font-normal text-base-content/50">uds</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Lista de Precios */}
            <div className="card bg-base-100 p-4 sm:p-6 rounded-2xl shadow-xs border border-base-200">
              <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-base-200/70">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-base-content">
                  <Tag className="h-4 w-4 sm:h-5 sm:w-5 text-success" />
                  Listas de Precio Activas
                </h3>
              </div>

              <div className="space-y-2 sm:space-y-2.5">
                {scannedVariant.activePrices.length === 0 ? (
                  <p className="text-xs text-base-content/50 italic py-4 text-center">
                    No hay precios activos configurados.
                  </p>
                ) : (
                  scannedVariant.activePrices.map((price, idx) => (
                    <div
                      key={`${price.priceTypeId}-${idx}`}
                      className="bg-base-200/50 hover:bg-base-200/80 border border-base-200 p-3 sm:p-3.5 rounded-xl flex justify-between items-center transition-all"
                    >
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-base-content truncate">
                          {price.priceTypeName}
                        </h4>
                        <p className="text-[11px] sm:text-xs text-base-content/50 mt-0.5">
                          {price.equivalenceFactor} Unidades
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {price.discountPrice != null && price.discountPrice !== price.salePrice && (
                          <div className="text-xs sm:text-sm font-medium text-error font-mono px-2 py-0.5 bg-error/10 rounded-md">
                            {currencyCode} {price.discountPrice.toFixed(2)}
                          </div>
                        )}
                        <div className="text-base sm:text-xl font-bold text-success font-mono">
                          {currencyCode} {price.salePrice.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Otras variantes */}
          {productData.otherVariants && productData.otherVariants.length > 0 && (
            <div className="card bg-base-100 p-4 sm:p-6 rounded-2xl shadow-xs border border-base-200">
              <div className="flex items-center justify-between pb-3 mb-3 sm:mb-4 border-b border-base-200/70">
                <h3 className="text-sm sm:text-base font-bold flex items-center gap-2 text-base-content">
                  <Layers className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  Otras variantes de este producto
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {productData.otherVariants.map((variant, idx) => (
                  <div
                    key={`${variant.variantId}-${idx}`}
                    onClick={() => {
                      executeScan(variant.barCode);
                    }}
                    className="flex items-center gap-3 p-3.5 bg-base-200/50 hover:bg-base-200/90 hover:border-primary/50 border border-base-200 rounded-2xl cursor-pointer active:scale-[0.99] transition-all group"
                  >
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-base-100 rounded-xl overflow-hidden border border-base-300 flex items-center justify-center shrink-0">
                      {variant.imageUrl ? (
                        <img
                          src={variant.imageUrl}
                          alt={variant.variantName}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <ImageOff className="h-5 w-5 text-base-content/30" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-sm sm:text-base text-base-content group-hover:text-primary transition-colors block truncate">
                        {variant.variantName}
                      </span>
                    </div>
                  </div>
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
