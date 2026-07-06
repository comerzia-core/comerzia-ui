import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { VariantWithPricesResponse, SalePriceResponse, SalePriceHistoryResponse, SalePriceTrendResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnCancel } from '../../../components/ui/CrudButtons';
import { ChangePriceModal } from '../components/ChangePriceModal';
import { Barcode, History, TrendingUp, DollarSign, LineChart } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaLineChart } from '../../../components/ui/charts';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';

export const PricesPage = () => {
  const [searchParams] = useSearchParams();
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState<VariantWithPricesResponse | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError } = useToast();
  const { userProfile } = useAuthStore();
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // State B
  const [selectedPriceType, setSelectedPriceType] = useState<SalePriceResponse | null>(null);
  
  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; row: SalePriceResponse | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    row: null
  });

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
  
  // Used to pre-fill ChangePriceModal if opened from context menu
  const [priceTypeToEdit, setPriceTypeToEdit] = useState<string>(''); 

  const executeScan = useCallback(async (code: string) => {
    setIsLoadingScan(true);
    setProductData(null);
    setSelectedPriceType(null);
    try {
      const res = await commercialService.getPricesByBarcode(code);
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
    if (!productData || !selectedPriceType || !selectedPriceType.priceTypeId) return;
    
    // Load History
    setIsLoadingHistory(true);
    try {
      const res = await commercialService.getSalePriceHistory(productData.variantId, selectedPriceType.priceTypeId, page, size);
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
      const trendRes = await commercialService.getSalePriceTrend(productData.variantId, selectedPriceType.priceTypeId, Number(trendMonths));
      
      setTrendData(trendRes.map(item => {
        const d = new Date(item.validFrom);
        return {
          ...item,
          date: isNaN(d.getTime()) ? String(item.validFrom) : d.toLocaleDateString()
        };
      }));
    } catch (e) {
      console.error(e);
      setTrendData([]);
    } finally {
      setIsLoadingTrend(false);
    }
  }, [productData, selectedPriceType, page, size, trendMonths]);

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

  const handleContextMenu = (e: React.MouseEvent, row: SalePriceResponse) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      row
    });
  };

  const activePricesColumns: Column<SalePriceResponse>[] = [
    { 
      header: 'Nombre', 
      render: (row) => <span className="font-semibold">{row.priceTypeName}</span> 
    },
    { 
      header: 'Descuento', 
      render: (row) => row.discountPrice != null && row.salePrice != null && row.discountPrice !== row.salePrice 
        ? <span className="text-error">{currencyCode} {row.discountPrice.toFixed(2)}</span> 
        : '-'
    },
    { 
      header: 'Venta', 
      render: (row) => row.salePrice != null 
        ? <span className="font-bold text-success">{currencyCode} {row.salePrice.toFixed(2)}</span> 
        : <span className="text-warning text-xs">No configurado</span>
    },
    { 
      header: 'Total', 
      render: (row) => row.salePrice != null
        ? <span className="text-base-content/80 font-mono">{currencyCode} {(row.salePrice * (row.priceType?.equivalenceFactor || 1)).toFixed(2)}</span>
        : '-'
    }
  ];

  const historyColumns: Column<SalePriceHistoryResponse>[] = [
    { header: 'Fecha Desde', render: (row) => new Date(row.validFrom).toLocaleString() },
    { header: 'Fecha Hasta', render: (row) => row.validTo ? new Date(row.validTo).toLocaleString() : '-' },
    { header: 'Nuevo', render: (row) => <span className="font-bold">{currencyCode} {(row.salePrice || 0).toFixed(2)}</span> },
    { 
      header: 'Variación', 
      render: (row) => {
        if (row.variationPercentage == null) return '-';
        const isUp = row.variationPercentage < 0;
        const type = isUp ? 'error' : row.variationPercentage > 0 ? 'success' : 'neutral';
        return <ComerziaBadge variant={type} label={`${isUp ? '' : '+'}${row.variationPercentage.toFixed(2)}%`} />;
      }
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
    <div className="space-y-6 animate-fade-in">
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

      {productData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          {/* COLUMNA IZQUIERDA: Listado Actual o Historial */}
          <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 space-y-6 flex flex-col">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-bold text-primary">{productData.variantName}</h2>
                <div className="flex flex-col gap-1 mt-2">
                  <span className="text-sm font-semibold">{productData.productName}</span>
                  <span className="text-xs text-base-content/60 font-mono">SKU: {productData.sku} | Barcode: {productData.barCode}</span>
                </div>
              </div>
            </div>

            <div className="divider my-0"></div>

            {!selectedPriceType ? (
              <div className="flex-1">
                <h3 className="text-lg font-bold mb-4 text-base-content/80">Precios Activos</h3>
                <p className="text-sm text-base-content/50 mb-4">Haz clic derecho sobre un precio para ver opciones.</p>
                {productData.activePrices && productData.activePrices.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="table table-sm w-full">
                      <thead>
                        <tr>
                          <th>#</th>
                          {activePricesColumns.map((col, idx) => (
                            <th key={idx}>{col.header as React.ReactNode}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {productData.activePrices.map((price, idx) => (
                          <tr 
                            key={price.priceTypeId} 
                            className="hover hover:bg-base-200 transition-colors cursor-context-menu"
                            onContextMenu={(e) => handleContextMenu(e, price)}
                          >
                            <td><span className="text-base-content/50">{idx + 1}</span></td>
                            {activePricesColumns.map((col, colIdx) => (
                              <td key={colIdx}>{col.render ? col.render(price) : null}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center p-8 text-base-content/50 bg-base-50 rounded-box border border-base-200">
                    Esta variante no tiene precios configurados.
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-4">
                <div className="flex items-center gap-4">
                  <BtnCancel 
                    label="Volver" 
                    onClick={() => setSelectedPriceType(null)} 
                  />
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Historial: {selectedPriceType.priceTypeName}
                  </h3>
                </div>
                <div className="flex-1">
                  <ComerziaTable
                    data={historyData}
                    columns={historyColumns}
                    isLoading={isLoadingHistory}
                    pagination={pagination}
                  />
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Gráfica Analítica */}
          <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 flex flex-col">
            {!selectedPriceType ? (
              <div className="flex-1 flex flex-col items-center justify-center text-base-content/40 space-y-4 min-h-[400px]">
                <div className="bg-base-200 p-6 rounded-full">
                  <LineChart className="h-12 w-12 opacity-50" />
                </div>
                <p className="text-center max-w-sm">
                  Selecciona el historial de un precio activo para ver su gráfica de tendencias aquí.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Tendencia de Precio
                  </h3>
                  <div className="w-48">
                    <ComerziaSelect
                      value={trendMonths}
                      onChange={(e) => setTrendMonths(e.target.value)}
                      options={[
                        { value: '3', label: 'Últimos 3 meses' },
                        { value: '6', label: 'Últimos 6 meses' },
                        { value: '12', label: 'Últimos 12 meses' }
                      ]}
                    />
                  </div>
                </div>
                
                <div className="flex-1 min-h-[350px]">
                  {isLoadingTrend ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                  ) : trendData.length > 0 ? (
                    <ComerziaLineChart
                      data={trendData}
                      xAxisDataKey="validFrom"
                      xTickFormatter={(val) => {
                        const d = new Date(val);
                        return isNaN(d.getTime()) ? String(val) : d.toLocaleDateString();
                      }}
                      valueFormatter={(val) => `${currencyCode} ${Number(val).toFixed(2)}`}
                      series={[
                        { dataKey: 'salePrice', name: 'Precio de Venta', color: '#4f46e5' }
                      ]}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center text-base-content/50 border border-dashed border-base-300 rounded-box">
                      No hay suficientes datos para graficar la tendencia en este rango.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Menú Contextual para Precios Activos */}
      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu({ ...contextMenu, isOpen: false })}
      >
        <ContextMenuItem
          icon={History}
          label="Ver Historial y Tendencia"
          onClick={() => {
            if (contextMenu.row) setSelectedPriceType(contextMenu.row);
            setContextMenu({ ...contextMenu, isOpen: false });
          }}
        />
        <ContextMenuItem
          icon={DollarSign}
          label="Actualizar Precio"
          onClick={() => {
            if (contextMenu.row) setPriceTypeToEdit(contextMenu.row.priceTypeId || '');
            setIsChangeModalOpen(true);
            setContextMenu({ ...contextMenu, isOpen: false });
          }}
        />
      </ComerziaContextMenu>

      {productData && (
        <ChangePriceModal
          isOpen={isChangeModalOpen}
          onClose={() => {
            setIsChangeModalOpen(false);
            setPriceTypeToEdit('');
          }}
          variantId={productData.variantId}
          variantName={productData.variantName}
          activePrices={productData.activePrices}
          initialPriceTypeId={priceTypeToEdit}
          onSuccess={() => {
            // Re-fetch to update the active prices list
            executeScan(barcode);
          }}
        />
      )}
    </div>
  );
};
