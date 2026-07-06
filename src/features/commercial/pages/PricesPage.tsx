import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { ScannerProductResponse, ScannerPriceResponse, SalePriceHistoryResponse, SalePriceTrendResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCreate, BtnCancel } from '../../../components/ui/CrudButtons';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ChangePriceModal } from '../components/ChangePriceModal';
import { Barcode, History, ArrowLeft, TrendingUp } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaLineChart } from '../../../components/ui/charts';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';

export const PricesPage = () => {
  const [searchParams] = useSearchParams();
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState<ScannerProductResponse | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // State B
  const [selectedPriceType, setSelectedPriceType] = useState<ScannerPriceResponse | null>(null);
  
  // Table Data
  const [historyData, setHistoryData] = useState<SalePriceHistoryResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Trend Data
  const [trendData, setTrendData] = useState<SalePriceTrendResponse[]>([]);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [trendMonths, setTrendMonths] = useState('6');

  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);

  const scannedVariant = productData?.scannedVariant;

  const executeScan = useCallback(async (code: string) => {
    setIsLoadingScan(true);
    setProductData(null);
    setSelectedPriceType(null);
    try {
      const res = await commercialService.scanBarcode(code);
      setProductData(res);
    } catch (err: any) {
      const errorCode = err.response?.data?.errorCode;
      if (errorCode === 'not_found' || err.response?.status === 404) {
        toastError('No se encontró ningún producto con este código de barras.');
      } else {
        toastError(err.response?.data?.message || 'Error al buscar el producto.');
      }
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoadingScan(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [toastError]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const urlBarcode = searchParams.get('barcode');
    if (urlBarcode) {
      setBarcode(urlBarcode);
      executeScan(urlBarcode);
    }
  }, [searchParams, executeScan]);

  const loadHistoryAndTrend = useCallback(async () => {
    if (!scannedVariant || !selectedPriceType) return;
    
    // Load History
    setIsLoadingHistory(true);
    try {
      const res = await commercialService.getSalePriceHistory(scannedVariant.variantId, selectedPriceType.priceTypeId, page, size);
      setHistoryData(res.content);
      setTotalElements(res.totalElements);
    } catch (e) {
      console.error(e);
      setHistoryData([]);
    } finally {
      setIsLoadingHistory(false);
    }

    // Load Trend
    setIsLoadingTrend(true);
    try {
      const trendRes = await commercialService.getSalePriceTrend(scannedVariant.variantId, selectedPriceType.priceTypeId, Number(trendMonths));
      setTrendData(trendRes.map(item => ({
        ...item,
        date: new Date(item.date).toLocaleDateString() // Format date for x-axis
      })));
    } catch (e) {
      console.error(e);
      setTrendData([]);
    } finally {
      setIsLoadingTrend(false);
    }
  }, [scannedVariant, selectedPriceType, page, size, trendMonths]);

  useEffect(() => {
    if (selectedPriceType) {
      loadHistoryAndTrend();
    }
  }, [selectedPriceType, page, size, trendMonths, loadHistoryAndTrend]);

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!barcode.trim()) {
        setShakeKey(prev => prev + 1);
        return;
      }
      await executeScan(barcode.trim());
    }
  };

  const columns: Column<SalePriceHistoryResponse>[] = [
    { header: 'Fecha Desde', render: (row) => new Date(row.validFrom).toLocaleString() },
    { header: 'Fecha Hasta', render: (row) => row.validTo ? new Date(row.validTo).toLocaleString() : '-' },
    { header: 'Precio Anterior', render: (row) => row.previousPrice != null ? `${currencyCode} ${row.previousPrice.toFixed(2)}` : '-' },
    { header: 'Nuevo Precio', render: (row) => <span className="font-bold">{currencyCode} {(row.salePrice || 0).toFixed(2)}</span> },
    { 
      header: 'Variación', 
      render: (row) => {
        if (row.variationPercentage == null) return '-';
        const isUp = row.variationPercentage > 0;
        const type = isUp ? 'error' : row.variationPercentage < 0 ? 'success' : 'neutral';
        return <ComerziaBadge variant={type} label={`${isUp ? '+' : ''}${row.variationPercentage.toFixed(2)}%`} />;
      }
    },
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
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Barcode className="h-5 w-5 text-primary" />
          Buscar Variante
        </h2>
        <div className={`relative w-full max-w-md ${shakeKey > 0 ? 'animate-shake' : ''}`} key={shakeKey}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Barcode className="h-5 w-5 text-base-content/40" />
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

      {scannedVariant && productData && !selectedPriceType && (
        <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 animate-slide-up space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-primary">{scannedVariant.variantName}</h2>
              <div className="flex items-center gap-3 mt-2">
                <ComerziaBadge variant="neutral" label={productData.productName} />
                <span className="text-sm text-base-content/60 font-mono">SKU: {scannedVariant.sku}</span>
                <span className="text-sm text-base-content/60 font-mono">Barcode: {scannedVariant.barCode}</span>
              </div>
            </div>
            <BtnCreate 
              label="Actualizar Precios" 
              onClick={() => setIsChangeModalOpen(true)} 
            />
          </div>

          <div>
            <h3 className="text-lg font-bold mb-4 text-base-content/80">Listas de Precio Activas</h3>
            {scannedVariant.activePrices && scannedVariant.activePrices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scannedVariant.activePrices.map((price, idx) => (
                  <div key={`${price.priceTypeId}-${idx}`} className="bg-base-50 border border-base-200 rounded-box p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <h4 className="font-bold text-lg text-base-content">{price.priceTypeName}</h4>
                      <div className="mt-4 flex items-baseline gap-2">
                        <span className="text-3xl font-bold text-success font-mono">
                          {currencyCode} {(price.salePrice || 0).toFixed(2)}
                        </span>
                      </div>
                      {price.equivalenceFactor > 1 && (
                        <p className="text-xs text-base-content/50 mt-1">
                          Precio Unitario: {currencyCode} {((price.salePrice || 0) * price.equivalenceFactor).toFixed(2)}
                        </p>
                      )}
                      {price.discountPrice != null && price.discountPrice !== price.salePrice && (
                         <p className="text-sm text-error mt-2 font-mono">
                           Descuento: {currencyCode} {price.discountPrice.toFixed(2)}
                         </p>
                      )}
                    </div>
                    <div className="mt-6">
                      <ComerziaButton 
                        type="button" 
                        label="Ver Historial" 
                        variant="primary"
                        icon={<History className="w-4 h-4" />}
                        onClick={() => setSelectedPriceType(price)}
                        className="w-full"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-8 text-base-content/50 bg-base-50 rounded-box border border-base-200">
                Esta variante no tiene precios configurados.
              </div>
            )}
          </div>
        </div>
      )}

      {scannedVariant && productData && selectedPriceType && (
        <div className="space-y-6 animate-slide-up">
          <div className="flex items-center gap-4">
            <BtnCancel 
              label="Volver a Resumen" 
              onClick={() => setSelectedPriceType(null)} 
            />
            <h2 className="text-2xl font-bold text-base-content flex items-center gap-2">
              <History className="h-6 w-6 text-primary" />
              Historial: {selectedPriceType.priceTypeName}
            </h2>
          </div>

          <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-secondary" />
                Tendencia de Precios
              </h3>
              <div className="w-48">
                <ComerziaSelect
                  value={trendMonths}
                  onChange={(e) => setTrendMonths(e.target.value)}
                  options={[
                    { value: '3', label: 'Últimos 3 meses' },
                    { value: '6', label: 'Últimos 6 meses' },
                    { value: '12', label: 'Este Año' }
                  ]}
                />
              </div>
            </div>
            
            {isLoadingTrend ? (
              <div className="h-[300px] flex items-center justify-center">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : trendData.length > 0 ? (
              <ComerziaLineChart
                data={trendData}
                xAxisDataKey="date"
                series={[
                  { dataKey: 'salePrice', name: 'Precio de Venta', color: 'oklch(var(--p))' }
                ]}
              />
            ) : (
               <div className="h-[300px] flex items-center justify-center text-base-content/50 border border-dashed border-base-300 rounded-box">
                No hay suficientes datos para graficar la tendencia en este rango.
              </div>
            )}
          </div>

          <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Tabla de Histórico (SCD Tipo 2)
            </h3>
            <ComerziaTable
              data={historyData}
              columns={columns}
              isLoading={isLoadingHistory}
              pagination={pagination}
            />
          </div>
        </div>
      )}

      {scannedVariant && (
        <ChangePriceModal
          isOpen={isChangeModalOpen}
          onClose={() => setIsChangeModalOpen(false)}
          variantId={scannedVariant.variantId}
          variantName={scannedVariant.variantName}
          activePrices={scannedVariant.activePrices}
          onSuccess={() => {
            // Re-fetch to update the active prices list
            executeScan(barcode);
          }}
        />
      )}
    </div>
  );
};
