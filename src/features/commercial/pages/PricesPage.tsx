import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { VariantWithPricesResponse, SalePriceResponse, SalePriceHistoryResponse, SalePriceTrendResponse } from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { BtnUpdatePrices, BtnCreate } from '../../../components/ui/CrudButtons';
import { ManageVariantPricesModal } from '../components/ManageVariantPricesModal';
import { CommercialProductSearchBar } from '../components/CommercialProductSearchBar';
import { History, TrendingUp, Coins, LineChart, Calendar, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import { ComerziaLineChart } from '../../../components/ui/charts';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { formatDateForUser } from '../../../utils/date';

export const PricesPage = () => {
  const [searchParams] = useSearchParams();
  const [productData, setProductData] = useState<VariantWithPricesResponse | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const { error: toastError } = useToast();
  const { userProfile, hasPermission } = useAuthStore();
  const canManagePrices = hasPermission('COM_PRICES_MANAGE');
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // Historial seleccionado (al hacer clic en cualquier tipo de precio)
  const [selectedPriceType, setSelectedPriceType] = useState<SalePriceResponse | null>(null);

  // Table Data (Historial)
  const [historyData, setHistoryData] = useState<SalePriceHistoryResponse[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);

  // Trend Data
  const [trendData, setTrendData] = useState<SalePriceTrendResponse[]>([]);
  const [isLoadingTrend, setIsLoadingTrend] = useState(false);
  const [trendMonths, setTrendMonths] = useState('6');

  // Modal para modificar/asignar precios
  const [isPricesModalOpen, setIsPricesModalOpen] = useState(false);

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
    }
  }, [toastError]);

  useEffect(() => {
    const urlBarcode = searchParams.get('barcode');
    if (urlBarcode) {
      executeScan(urlBarcode);
    }
  }, [searchParams, executeScan]);

  const loadHistoryAndTrend = useCallback(async () => {
    if (!productData || !selectedPriceType || !selectedPriceType.priceTypeId) return;

    // Cargar Historial
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

    // Cargar Tendencia
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

  // Columnas para la tabla Desktop de Precios Activos
  const activePricesColumns: Column<SalePriceResponse>[] = [
    {
      header: 'Tipo de Precio',
      render: (row) => (
        <span className="font-bold text-base text-base-content group-hover:text-primary transition-colors duration-150 block">
          {row.priceTypeName}
        </span>
      )
    },
    {
      header: 'Precio Venta',
      render: (row) => {
        const salePrice = Number(row.salePrice) || 0;
        const discountPrice = Number(row.discountPrice) || 0;
        const hasDiscount = discountPrice > 0 && discountPrice < salePrice;

        return (
          <div className="flex items-baseline gap-2">
            <span className="font-bold text-sm text-base-content">
              {currencyCode} {salePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            {hasDiscount && (
              <span className="font-bold text-sm text-error">
                {currencyCode} {discountPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>
        );
      }
    },
    {
      header: 'Presentación',
      render: (row) => {
        const factor = row.priceType?.equivalenceFactor || row.equivalenceFactor || 1;
        const salePrice = Number(row.salePrice) || 0;
        const discountPrice = Number(row.discountPrice) || 0;
        const hasDiscount = discountPrice > 0 && discountPrice < salePrice;
        const totalSale = salePrice * factor;
        const totalDiscount = discountPrice * factor;

        return (
          <div className="text-xs font-mono text-base-content/80">
            <span className="text-xs text-base-content/60 font-medium block">
              x{factor} {factor === 1 ? 'unidad' : 'unidades'}
            </span>
            {factor > 1 && (
              <div className="flex items-center gap-1.5 mt-0.5 font-semibold">
                <span className="text-base-content">
                  {currencyCode} {totalSale.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                {hasDiscount && (
                  <span className="text-error">
                    {currencyCode} {totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                )}
              </div>
            )}
          </div>
        );
      }
    }
  ];

  // Columnas para la tabla Desktop de Historial
  const historyColumns: Column<SalePriceHistoryResponse>[] = [
    { header: 'Fecha Desde', render: (row) => formatDateForUser(row.validFrom) },
    { header: 'Fecha Hasta', render: (row) => row.validTo ? formatDateForUser(row.validTo) : <span className="badge badge-xs badge-success text-[10px] text-white">Vigente</span> },
    {
      header: 'Precio Venta',
      render: (row) => {
        const sale = Number(row.salePrice) || 0;
        const discount = Number(row.discountPrice) || 0;
        const hasDiscount = discount > 0 && discount < sale;

        return (
          <div className="flex items-baseline gap-2 font-mono">
            <span className="font-bold text-base-content">{currencyCode} {sale.toFixed(2)}</span>
            {hasDiscount && <span className="font-bold text-error">{currencyCode} {discount.toFixed(2)}</span>}
          </div>
        );
      }
    },
    {
      header: 'Variación',
      render: (row) => {
        if (row.previousPrice == null || row.previousPrice === row.salePrice) return '-';
        const pct = row.variationPercentage != null
          ? row.variationPercentage
          : ((row.salePrice - row.previousPrice) / row.previousPrice) * 100;
        return (
          <ComerziaBadge
            variant={pct < 0 ? 'error' : pct > 0 ? 'success' : 'neutral'}
            label={`${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
          />
        );
      }
    }
  ];

  const historyPagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements: totalElements,
    totalPages: Math.ceil(totalElements / size),
    onPageChange: setPage,
    onPageSizeChange: setSize
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <Coins className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Gestión de Precios
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Consulta, trazabilidad histórica y actualización de listas de precios (SCD Type 2).
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE BÚSQUEDA Y SUGERENCIAS */}
      <div className="card bg-base-100 p-3.5 sm:p-4 rounded-2xl shadow-xs border border-base-200">
        <CommercialProductSearchBar
          onSearchBarcode={executeScan}
          isLoading={isLoadingScan}
          shakeKey={shakeKey}
          placeholder="Buscar producto por nombre, código o SKU..."
        />
      </div>

      {productData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-slide-up">
          {/* COLUMNA IZQUIERDA: Precios Vigentes o Historial */}
          <div className="space-y-4 md:card md:bg-base-100 md:p-6 md:rounded-2xl md:border md:border-base-200 md:shadow-xs md:space-y-6 flex flex-col">
            {/* Cabecera del Producto (sin SKU ni Barcode) */}
            <div className="bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs md:p-0 md:bg-transparent md:border-none md:shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-base-content leading-tight truncate">
                  {productData.productName}{' '}
                  <span className="text-primary font-semibold">
                    {productData.variantName}
                  </span>
                </h2>
              </div>

              {canManagePrices && (
                <div className="shrink-0 w-full sm:w-auto">
                  {productData.activePrices && productData.activePrices.length > 0 ? (
                    <BtnUpdatePrices
                      onClick={() => setIsPricesModalOpen(true)}
                      label="Modificar Precios"
                      responsive={false}
                      className="w-full sm:w-auto"
                    />
                  ) : (
                    <BtnCreate
                      onClick={() => setIsPricesModalOpen(true)}
                      label="Asignar Precios"
                      responsive={false}
                      className="w-full sm:w-auto"
                    />
                  )}
                </div>
              )}
            </div>

            <div className="hidden md:block divider my-0"></div>

            {!selectedPriceType ? (
              /* ================= LISTADO DE PRECIOS VIGENTES ================= */
              <div className="flex-1 space-y-3">
                <div className="flex justify-between items-center px-1 md:px-0">
                  <h3 className="text-sm sm:text-base font-bold text-base-content/80 flex items-center gap-2">
                    <Coins className="w-4 h-4 text-primary" />
                    Precios Vigentes
                  </h3>
                  <span className="text-xs text-base-content/50 font-medium hidden md:inline">
                    Selecciona uno para ver su historial
                  </span>
                </div>

                {productData.activePrices && productData.activePrices.length > 0 ? (
                  <>
                    {/* VISTA DESKTOP: TABLA CON HOVER SUAVE */}
                    <div className="hidden md:block overflow-x-auto rounded-xl border border-base-200">
                      <table className="table table-md w-full">
                        <thead>
                          <tr className="bg-base-200/50 text-base-content/70 border-b border-base-200">
                            <th className="w-10">#</th>
                            {activePricesColumns.map((col, idx) => (
                              <th key={idx} className={col.className}>{col.header as React.ReactNode}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {productData.activePrices.map((price, idx) => (
                            <tr
                              key={price.priceTypeId || idx}
                              onClick={() => setSelectedPriceType(price)}
                              className="group cursor-pointer transition-colors duration-150 border-b border-base-200/60 last:border-none hover:bg-base-200/60"
                              title="Haz clic para consultar historial y tendencia"
                            >
                              <td>
                                <span className="font-mono text-xs text-base-content/40 group-hover:text-primary transition-colors duration-150">
                                  {idx + 1}
                                </span>
                              </td>
                              {activePricesColumns.map((col, colIdx) => (
                                <td key={colIdx} className={col.className}>
                                  {col.render ? col.render(price) : null}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* VISTA MOBILE: LISTADO DE CARDS INDIVIDUALES SIN CARD MAESTRA */}
                    <div className="block md:hidden space-y-2.5">
                      {productData.activePrices.map((price, index) => {
                        const factor = price.priceType?.equivalenceFactor || price.equivalenceFactor || 1;
                        const salePrice = Number(price.salePrice) || 0;
                        const discountPrice = Number(price.discountPrice) || 0;
                        const hasDiscount = discountPrice > 0 && discountPrice < salePrice;
                        const totalSale = salePrice * factor;
                        const totalDiscount = discountPrice * factor;

                        return (
                          <article
                            key={price.priceTypeId || index}
                            onClick={() => setSelectedPriceType(price)}
                            className="group bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs flex flex-col gap-2 select-none cursor-pointer active:scale-[0.99] transition-colors duration-150 hover:border-primary/40 hover:bg-base-200/30"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0">
                                <h4 className="font-bold text-base text-base-content group-hover:text-primary transition-colors duration-150 leading-tight truncate">
                                  {price.priceTypeName}
                                </h4>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="flex items-baseline justify-end gap-1.5">
                                  <span className="font-bold text-sm text-base-content">
                                    {currencyCode} {salePrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  {hasDiscount && (
                                    <span className="font-bold text-sm text-error">
                                      {currencyCode} {discountPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="pt-2 border-t border-base-200/80 flex items-center justify-between text-xs text-base-content/70">
                              <span className="font-medium text-base-content/60">
                                x{factor} {factor === 1 ? 'unidad' : 'unidades'}
                              </span>
                              {factor > 1 && (
                                <div className="text-[11px] font-medium font-mono flex items-center gap-1.5">
                                  <span className="text-base-content font-bold">
                                    {currencyCode} {totalSale.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  {hasDiscount && (
                                    <span className="text-error font-bold">
                                      {currencyCode} {totalDiscount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 px-4 bg-base-100 rounded-2xl border border-dashed border-base-300">
                    <Coins className="w-8 h-8 mx-auto text-base-content/30 mb-2" />
                    <p className="text-sm font-medium text-base-content/60">Esta variante no tiene precios configurados.</p>
                  </div>
                )}
              </div>
            ) : (
              /* ================= VISTA DE HISTORIAL ================= */
              <div className="flex-1 flex flex-col space-y-4">
                {/* Cabecera de Historial con Botón Volver discreto */}
                <div className="flex items-center justify-between gap-2 bg-base-100 p-3 rounded-xl border border-base-200 shadow-2xs md:bg-transparent md:border-none md:shadow-none md:p-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <button
                      type="button"
                      onClick={() => setSelectedPriceType(null)}
                      className="btn btn-ghost btn-xs h-8 px-2 rounded-lg text-base-content/70 hover:text-base-content hover:bg-base-200 gap-1 text-xs font-medium shrink-0 transition-colors border border-base-300"
                      title="Volver al listado de precios vigentes"
                    >
                      <ArrowLeft size={14} />
                      <span>Volver</span>
                    </button>
                    <h3 className="text-sm sm:text-base font-bold text-base-content truncate flex items-center gap-1.5">
                      <History className="h-4 w-4 text-primary shrink-0" />
                      <span>Historial: {selectedPriceType.priceTypeName}</span>
                    </h3>
                  </div>
                </div>

                <div className="flex-1">
                  {/* VISTA DESKTOP: TABLA HISTORIAL */}
                  <div className="hidden md:block">
                    <ComerziaTable
                      data={historyData}
                      columns={historyColumns}
                      isLoading={isLoadingHistory}
                      pagination={historyPagination}
                    />
                  </div>

                  {/* VISTA MOBILE: CARDS INDIVIDUALES DE HISTORIAL */}
                  <div className="block md:hidden space-y-2.5">
                    {isLoadingHistory ? (
                      <div className="py-8 text-center">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                      </div>
                    ) : historyData.length === 0 ? (
                      <div className="text-center py-6 text-base-content/50 bg-base-100 rounded-2xl border border-dashed border-base-300 text-xs">
                        Sin cambios históricos registrados.
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2.5">
                          {historyData.map((h, idx) => {
                            const salePrice = Number(h.salePrice) || 0;
                            const discountPrice = Number(h.discountPrice) || 0;
                            const hasDiscount = discountPrice > 0 && discountPrice < salePrice;
                            const pct = h.variationPercentage != null
                              ? h.variationPercentage
                              : h.previousPrice && h.previousPrice !== salePrice
                                ? ((salePrice - h.previousPrice) / h.previousPrice) * 100
                                : null;

                            return (
                              <article
                                key={idx}
                                className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs text-xs flex flex-col gap-2.5 select-none"
                              >
                                <div className="flex justify-between items-center">
                                  <div className="flex items-baseline gap-2">
                                    <span className="font-bold font-mono text-sm sm:text-base text-base-content">
                                      {currencyCode} {salePrice.toFixed(2)}
                                    </span>
                                    {hasDiscount && (
                                      <span className="font-bold font-mono text-sm sm:text-base text-error">
                                        {currencyCode} {discountPrice.toFixed(2)}
                                      </span>
                                    )}
                                  </div>
                                  {pct != null && (
                                    <ComerziaBadge
                                      variant={pct < 0 ? 'error' : pct > 0 ? 'success' : 'neutral'}
                                      label={`${pct > 0 ? '+' : ''}${pct.toFixed(1)}%`}
                                    />
                                  )}
                                </div>

                                {/* Fechas optimizadas en 2 líneas separadas para evitar colisiones */}
                                <div className="pt-2 border-t border-base-200/80 space-y-1 text-[11px] text-base-content/70">
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-primary/70 shrink-0" />
                                    <span className="text-base-content/60">Desde:</span>
                                    <strong className="font-medium text-base-content/90">{formatDateForUser(h.validFrom)}</strong>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Calendar size={12} className="text-primary/70 shrink-0" />
                                    <span className="text-base-content/60">Hasta:</span>
                                    <strong className="font-medium text-base-content/90">
                                      {h.validTo ? formatDateForUser(h.validTo) : 'Vigente'}
                                    </strong>
                                  </div>
                                </div>
                              </article>
                            );
                          })}
                        </div>

                        {/* Paginación Mobile Estándar en 1 Sola Línea */}
                        {totalElements > 0 && Math.ceil(totalElements / size) > 1 && (
                          <footer className="mt-3 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
                            <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
                              <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                                <span>Mostrar</span>
                                <select
                                  value={size}
                                  onChange={(e) => setSize(Number(e.target.value))}
                                  className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                                >
                                  <option value={5}>5</option>
                                  <option value={10}>10</option>
                                  <option value={25}>25</option>
                                </select>
                                <span className="whitespace-nowrap">de {totalElements}</span>
                              </div>
                              <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                                Pág. {page + 1} de {Math.ceil(totalElements / size)}
                              </span>
                            </div>

                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                aria-label="Primera página"
                                disabled={page === 0 || isLoadingHistory}
                                onClick={() => setPage(0)}
                                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                              >
                                <ChevronsLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Página anterior"
                                disabled={page === 0 || isLoadingHistory}
                                onClick={() => setPage(Math.max(0, page - 1))}
                                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Página siguiente"
                                disabled={page >= Math.ceil(totalElements / size) - 1 || isLoadingHistory}
                                onClick={() => setPage(page + 1)}
                                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                aria-label="Última página"
                                disabled={page >= Math.ceil(totalElements / size) - 1 || isLoadingHistory}
                                onClick={() => setPage(Math.ceil(totalElements / size) - 1)}
                                className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                              >
                                <ChevronsRight className="w-4 h-4" />
                              </button>
                            </div>
                          </footer>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* COLUMNA DERECHA: Gráfica Analítica */}
          <div className="card bg-base-100 p-4 sm:p-6 rounded-2xl shadow-xs border border-base-200 flex flex-col">
            {!selectedPriceType ? (
              <div className="flex-1 flex flex-col items-center justify-center text-base-content/40 space-y-4 min-h-[320px] sm:min-h-[400px]">
                <div className="bg-base-200/60 p-5 sm:p-6 rounded-full">
                  <LineChart className="h-10 w-10 sm:h-12 sm:w-12 opacity-50 text-primary" />
                </div>
                <p className="text-center max-w-sm text-xs sm:text-sm px-4">
                  Selecciona cualquier tipo de precio de la lista para consultar su trazabilidad histórica y gráfica de tendencias.
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col space-y-5 sm:space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h3 className="text-base sm:text-lg font-bold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    Tendencia: {selectedPriceType.priceTypeName}
                  </h3>
                  <div className="w-full sm:w-48">
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

                <div className="flex-1 min-h-[300px] sm:min-h-[350px]">
                  {isLoadingTrend ? (
                    <div className="h-full flex items-center justify-center py-16">
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
                    <div className="h-full flex items-center justify-center text-base-content/50 border border-dashed border-base-300 rounded-2xl py-16 text-xs">
                      No hay suficientes datos para graficar la tendencia en este rango.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de modificación y sincronización de precios */}
      {productData && (
        <ManageVariantPricesModal
          isOpen={isPricesModalOpen}
          onClose={() => setIsPricesModalOpen(false)}
          onSuccess={() => {
            if (productData.barCode) {
              executeScan(productData.barCode);
            }
          }}
          variantId={productData.variantId}
          variantName={`${productData.productName} (${productData.variantName})`}
        />
      )}
    </div>
  );
};
