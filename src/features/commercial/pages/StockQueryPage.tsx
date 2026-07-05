import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { ScannerProductResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';

export const StockQueryPage = () => {
  const [searchParams] = useSearchParams();
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState<ScannerProductResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();

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

  const scannedVariant = productData?.variants.find(v => v.isScannedVariant) || productData?.variants[0];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto mt-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-base-content tracking-tight">Consulta de Stock</h1>
        <p className="text-base-content/60 mt-2">Escanea el código de barras para ver detalles, precios y stock.</p>
      </div>

      <div className="flex justify-center mb-10">
        <div className={`relative w-full max-w-2xl ${shakeKey > 0 ? 'animate-shake' : ''}`} key={shakeKey}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Escanea o escribe el código y presiona Enter..." 
            className="input input-lg input-bordered w-full pl-12 shadow-lg text-xl bg-base-100 focus:outline-none focus:ring-4 focus:ring-primary/20 transition-shadow"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleScan}
            disabled={isLoading}
          />
          {isLoading && (
            <div className="absolute inset-y-0 right-4 flex items-center">
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
                <div className="w-full h-full flex flex-col items-center justify-center text-base-content/30">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
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
                <span className="badge badge-neutral">{productData.brandName}</span>
                <span className="text-sm text-base-content/60">{productData.description || 'Sin descripción adicional'}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-base-200">
            {/* Stock por Sucursal */}
            <div className="p-8 bg-base-50">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
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
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                Listas de Precio Activas
              </h3>
              
              <div className="grid gap-4">
                {scannedVariant.activePrices.map((price) => (
                  <div key={price.priceTypeId} className="bg-base-100 border border-base-200 p-4 rounded-xl flex justify-between items-center hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-bold text-base-content">{price.priceTypeName}</h4>
                      <p className="text-xs text-base-content/50 mt-1">{price.equivalenceFactor} Unidades</p>
                    </div>
                    <div className="text-2xl font-bold text-success font-mono">
                      ${price.salePrice.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
