import { useState, useRef, useEffect } from 'react';
import { commercialService } from '../services/commercialService';
import type { ScannerProductResponse, SalePriceResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCreate } from '../../../components/ui/CrudButtons';
import { ChangePriceModal } from '../components/ChangePriceModal';

export const PricesPage = () => {
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState<ScannerProductResponse | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();

  const [pricesData, setPricesData] = useState<SalePriceResponse[]>([]);
  const [isLoadingPrices, setIsLoadingPrices] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const scannedVariant = productData?.variants.find(v => v.isScannedVariant) || productData?.variants[0];

  useEffect(() => {
    if (scannedVariant) {
      loadPrices();
    }
  }, [scannedVariant, page, size]);

  const loadPrices = async () => {
    if (!scannedVariant) return;
    setIsLoadingPrices(true);
    try {
      const res = await commercialService.getSalePricesByVariant(scannedVariant.variantId, page, size);
      setPricesData(res.content);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
      setPricesData([]);
    } finally {
      setIsLoadingPrices(false);
    }
  };

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!barcode.trim()) {
        setShakeKey(prev => prev + 1);
        return;
      }
      setIsLoadingScan(true);
      setProductData(null);
      try {
        const res = await commercialService.scanBarcode(barcode.trim());
        setProductData(res);
      } catch (err: any) {
        toastError(err.response?.data?.message || 'Producto no encontrado');
        setShakeKey(prev => prev + 1);
      } finally {
        setIsLoadingScan(false);
        setBarcode('');
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }
    }
  };

  const columns: Column<SalePriceResponse>[] = [
    { 
      header: 'Tipo de Precio', 
      render: (row) => row.priceType?.name || row.priceTypeName || 'Desconocido'
    },
    { header: 'Costo Base', render: (row) => `$${row.basePrice.toFixed(2)}` },
    { header: 'Precio Venta', render: (row) => <span className="font-bold text-success">${row.salePrice.toFixed(2)}</span> },
    { header: 'Precio Descuento', render: (row) => `$${row.discountPrice.toFixed(2)}` },
    { header: 'Válido Desde', render: (row) => new Date(row.validFrom).toLocaleString() },
    { header: 'Válido Hasta', render: (row) => row.validTo ? new Date(row.validTo).toLocaleString() : '-' },
    { 
      header: 'Estado', 
      render: (row) => (
        <span className={`badge badge-sm ${row.validTo === null ? 'badge-primary' : 'badge-neutral'}`}>
          {row.validTo === null ? 'Activo' : 'Histórico'}
        </span>
      )
    }
  ];

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Gestión de Precios</h1>
          <p className="text-base-content/60 mt-1">Trazabilidad e historial de listas de precios (SCD Type 2)</p>
        </div>
      </div>

      <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
        <h2 className="text-lg font-bold mb-4">Buscar Variante (Escáner)</h2>
        <div className={`relative w-full max-w-md ${shakeKey > 0 ? 'animate-shake' : ''}`} key={shakeKey}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-base-content/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Escanea el código de barras..." 
            className="input input-bordered w-full pl-12 bg-base-50 focus:outline-none focus:ring-2 focus:ring-primary/20"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            onKeyDown={handleScan}
            disabled={isLoadingScan}
          />
          {isLoadingScan && (
            <div className="absolute inset-y-0 right-4 flex items-center">
              <span className="loading loading-spinner loading-sm text-primary"></span>
            </div>
          )}
        </div>
      </div>

      {scannedVariant && productData && (
        <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 animate-slide-up">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-primary">{scannedVariant.variantName}</h2>
              <p className="text-sm text-base-content/60">{productData.productName} | SKU: {scannedVariant.sku}</p>
            </div>
            <BtnCreate 
              label="Cambiar Precio" 
              onClick={() => setIsChangeModalOpen(true)} 
            />
          </div>

          <ComerziaTable
            data={pricesData}
            columns={columns}
            isLoading={isLoadingPrices}
            pagination={pagination}
          />
        </div>
      )}

      {scannedVariant && (
        <ChangePriceModal
          isOpen={isChangeModalOpen}
          onClose={() => setIsChangeModalOpen(false)}
          variantId={scannedVariant.variantId}
          variantName={scannedVariant.variantName}
          onSuccess={() => {
            setPage(0);
            loadPrices();
          }}
        />
      )}
    </div>
  );
};
