import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { ScannerProductResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaSelectableCard } from '../../../components/ui/ComerziaSelectableCard';
import { ImageOff, Store, Tag, Copy, ChevronRight, Layers, Barcode } from 'lucide-react';

export const StockQueryPage = () => {
  const [searchParams] = useSearchParams();
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState<ScannerProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  useEffect(() => {
    // Auto-focus on mount
    if (inputRef.current) {
      inputRef.current.focus();
    }

    // Check for barcode in URL
    const urlBarcode = searchParams.get('barcode');
    if (urlBarcode) {
      setBarcode(urlBarcode);
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
      setBarcode(''); // Clear after scan
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!barcode.trim()) {
        setShakeKey(prev => prev + 1);
        return;
      }
      await executeScan(barcode);
    }
  };

  const scannedVariant = productData?.scannedVariant;

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto mt-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-base-content tracking-tight">Consulta de Stock</h1>
      </div>

      <div className="flex justify-center mb-10">
        <div className={`relative w-full max-w-2xl ${shakeKey > 0 ? 'animate-shake' : ''}`} key={shakeKey}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Escanea o escribe el código y presiona Enter..."
            className="input input-lg input-bordered w-full pl-12 shadow-lg text-xl bg-base-100 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-shadow relative z-0"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleScan}
            disabled={isLoading}
          />
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none z-10">
            <Barcode className="h-6 w-6 text-base-content/40" />
          </div>
          {isLoading && (
            <div className="absolute inset-y-0 right-4 flex items-center z-10">
              <span className="loading loading-spinner loading-md text-primary"></span>
            </div>
          )}
        </div>
      </div>

      {productData && scannedVariant && (
        <div className="bg-base-100 rounded-3xl shadow-sm border border-base-200 overflow-hidden animate-slide-up">
          {/* Header Producto */}
          <div className="p-8 border-b border-base-200 flex items-start gap-6">
            <div className="w-32 h-32 bg-base-200 rounded-2xl flex-shrink-0 overflow-hidden border border-base-300">
              {scannedVariant.imageUrl ? (
                <img src={scannedVariant.imageUrl} alt={scannedVariant.variantName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/30 bg-base-200">
                  <ImageOff className="h-10 w-10 mb-2" />
                  <span className="text-xs font-medium">Sin imagen</span>
                </div>
              )}
            </div>

            <div className="flex-1">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-3xl font-bold text-base-content mb-1">
                    {productData.productName}
                  </h2>
                  <h3 className="text-xl text-primary font-semibold mb-2">
                    {scannedVariant.variantName}
                  </h3>
                </div>
                <div className="text-right">
                  <div className="badge badge-lg badge-outline font-mono bg-base-100 text-lg py-3 px-4 border-base-300">
                    {scannedVariant.barCode}
                  </div>
                  <div className="text-sm text-base-content/50 mt-2 font-mono">SKU: {scannedVariant.sku}</div>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-4">
                <ComerziaBadge variant="neutral" label={productData.brandName} />
                <span className="text-sm text-base-content/60">{productData.description || 'Sin descripción adicional'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-200">
            {/* Stock por Sucursal */}
            <div className="p-8 bg-base-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Store className="h-5 w-5 text-primary" />
                  Disponibilidad en Tiendas
                </h3>
                <span className="badge badge-primary font-bold">Total: {scannedVariant.totalAvailableStock}</span>
              </div>

              <div className="space-y-3">
                {scannedVariant.stockByBranch.map((sb) => (
                  <div
                    key={sb.branchId}
                    className={`flex justify-between items-center p-4 rounded-xl border ${sb.isCurrentBranch ? 'bg-primary/5 border-primary/20' : 'bg-base-100 border-base-200'}`}
                  >
                    <div className="flex items-center gap-3">
                      {sb.isCurrentBranch && (
                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                      )}
                      <span className={`font-medium ${sb.isCurrentBranch ? 'text-primary' : ''}`}>
                        {sb.branchName}
                        {sb.isCurrentBranch && <span className="ml-2 text-xs opacity-60 font-normal">(Actual)</span>}
                      </span>
                    </div>
                    <div className="font-mono text-lg font-bold">
                      {sb.availableQuantity} <span className="text-sm font-normal opacity-50">uds</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Lista de Precios */}
            <div className="p-8">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <Tag className="h-5 w-5 text-success" />
                Listas de Precio Activas
              </h3>

              <div className="grid gap-4">
                {scannedVariant.activePrices.map((price) => (
                  <div key={price.priceTypeId} className="bg-base-100 border border-base-200 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-bold text-base-content">{price.priceTypeName}</h4>
                      <p className="text-xs text-base-content/50 mt-1">{price.equivalenceFactor} Unidades</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-2xl font-bold text-success font-mono">
                        {currencyCode} {price.salePrice.toFixed(2)}
                      </div>
                      {price.discountPrice != null && price.discountPrice !== price.salePrice && (
                        <div className="text-sm font-medium text-error font-mono px-2 py-1 bg-error/10 rounded-md">
                          Desc: {currencyCode} {price.discountPrice.toFixed(2)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Otras variantes */}
          {productData.otherVariants && productData.otherVariants.length > 0 && (
            <div className="p-8 bg-base-100 border-t border-base-200">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Layers className="h-5 w-5 text-primary" />
                Otras variantes de este producto
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {productData.otherVariants.map((variant) => (
                  <ComerziaSelectableCard
                    key={variant.variantId}
                    title={variant.variantName}
                    description={variant.barCode}
                    selected={false}
                    onClick={() => {
                      setBarcode(variant.barCode);
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
    </div>
  );
};
