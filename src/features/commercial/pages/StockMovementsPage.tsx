import { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type { 
  ScannerProductResponse, 
  StockEntryResponse, 
  StockAdjustmentResponse 
} from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { BtnSave, BtnCreate } from '../../../components/ui/CrudButtons';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { CreateFullProductModal } from '../components/CreateFullProductModal';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { Settings2, X, Barcode, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { branchService } from '../../organization/services/branchService';
import type { BranchResponse } from '../../organization/types/branch';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { ValuateStockModal } from '../components/ValuateStockModal';

const CurrencyCell = ({ amount, currencyCode = 'USD' }: { amount: number, currencyCode?: string }) => {
  let currencySymbol = currencyCode;
  let formattedAmount = amount.toFixed(2).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ",");
  
  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const parts = formatter.formatToParts(amount);
    const currPart = parts.find(p => p.type === 'currency');
    if (currPart) {
      currencySymbol = currPart.value;
      formattedAmount = parts
        .filter(p => p.type !== 'currency' && (p.type !== 'literal' || p.value.trim() !== ''))
        .map(p => p.value)
        .join('');
    }
  } catch (e) {
    // Fallback si currencyCode es inválido
  }

  return (
    <div className="flex items-center justify-between min-w-[90px] w-full">
      <span className="text-base-content/50 mr-3">{currencySymbol}</span>
      <span className="font-medium text-right flex-1">{formattedAmount}</span>
    </div>
  );
};

export const StockMovementsPage = () => {
  const [searchParams] = useSearchParams();
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState<ScannerProductResponse | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Entry Form State
  const [quantityIn, setQuantityIn] = useState<number | ''>('');
  const [costInputType, setCostInputType] = useState<'unit' | 'total'>('unit');
  const [costInputValue, setCostInputValue] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branches, setBranches] = useState<BranchResponse[]>([]);

  const { hasPermission, hasRole, userProfile } = useAuthStore();
  const hasCostPermission = hasPermission('COM_STOCK_COST_MANAGE');
  const isOwner = hasRole('OWNER');
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // Tabs and Kardex State
  const [activeTab, setActiveTab] = useState<'entries' | 'adjustments'>('entries');
  const [kardexData, setKardexData] = useState<any[]>([]);
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Adjustment Form State
  const [adjustmentTarget, setAdjustmentTarget] = useState<StockEntryResponse | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number | ''>('');
  const [adjustmentType, setAdjustmentType] = useState<number | ''>('');
  const [adjustmentObs, setAdjustmentObs] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  const [contextMenu, setContextMenu] = useState<{ isOpen: boolean; x: number; y: number; row: StockEntryResponse | null }>({
    isOpen: false,
    x: 0,
    y: 0,
    row: null
  });

  const { options } = useLoadDictionaries([DICTIONARIES.ADJUSTMENT_TYPE, DICTIONARIES.STOCK_STATUS]);
  const adjustmentTypeOptions = options[DICTIONARIES.ADJUSTMENT_TYPE] || [];
  const stockStatusOptions = options[DICTIONARIES.STOCK_STATUS] || [];

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isValuateModalOpen, setIsValuateModalOpen] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
    const urlBarcode = searchParams.get('barcode');
    if (urlBarcode) {
      setBarcode(urlBarcode);
      executeScan(urlBarcode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasCostPermission) {
      branchService.getBranches(0, 100).then(res => setBranches(res.content));
    }
  }, [hasCostPermission]);

  const scannedVariant = productData?.variants.find(v => v.isScannedVariant) || productData?.variants[0];

  useEffect(() => {
    if (scannedVariant) {
      loadKardex();
    }
  }, [scannedVariant, activeTab, page, size]);

  const loadKardex = async () => {
    if (!scannedVariant) return;
    setIsLoadingKardex(true);
    try {
      if (activeTab === 'entries') {
        const res = await commercialService.getStockEntries(scannedVariant.variantId, page, size);
        setKardexData(res.content);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
      } else {
        const res = await commercialService.getStockAdjustments(scannedVariant.variantId, page, size);
        setKardexData(res.content);
        setTotalElements(res.totalElements);
        setTotalPages(res.totalPages);
      }
    } catch (e) {
      console.error(e);
      setKardexData([]);
    } finally {
      setIsLoadingKardex(false);
    }
  };

  const executeScan = async (codeToScan: string) => {
    setIsLoadingScan(true);
    setProductData(null);
    setQuantityIn('');
    setCostInputValue('');
    setNote('');
    try {
      const res = await commercialService.scanBarcode(codeToScan.trim());
      setProductData(res);
    } catch (err: any) {
      const status = err.response?.status;
      const errorCode = err.response?.data?.errorCode;
      
      if (status === 404 || errorCode === 'not_found') {
        toastError("No se encontró ningún producto con este código de barras.");
      } else {
        toastError(err.response?.data?.message || 'Error al conectar con el servidor.');
      }
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoadingScan(false);
      setBarcode('');
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

  const handleSubmitEntry = async () => {
    const qty = typeof quantityIn === 'number' ? quantityIn : 0;
    const val = typeof costInputValue === 'number' ? costInputValue : 0;
    const finalUnitCost = costInputType === 'unit' ? val : (qty > 0 ? Number((val / qty).toFixed(4)) : 0);
    const finalTotalCost = costInputType === 'total' ? val : Number((qty * val).toFixed(4));

    if (!scannedVariant || !quantityIn || (hasCostPermission && costInputValue === '')) {
      toastError("Completa todos los campos obligatorios.");
      return;
    }
    setIsSubmitting(true);
    try {
      await commercialService.createStockEntry({
        variantId: scannedVariant.variantId,
        quantityIn: Number(quantityIn),
        unitCost: hasCostPermission ? finalUnitCost : null,
        totalCost: hasCostPermission ? finalTotalCost : null,
        note: note || undefined
      }, hasCostPermission ? (selectedBranchId || undefined) : undefined);
      toastSuccess("Entrada registrada exitosamente.");
      setQuantityIn('');
      setCostInputValue('');
      setNote('');
      loadKardex(); // Reload kardex
    } catch (e: any) {
      const errorCode = e.response?.data?.errorCode;
      if (errorCode === 'invalid_cost_calculation') {
        toastError('El cálculo de costos es incorrecto. Verifica los montos.');
      } else if (errorCode === 'invalid_quantity') {
        toastError('La cantidad de entrada debe ser mayor a cero.');
      } else {
        toastError(e.response?.data?.message || "Error al registrar la entrada.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustmentTarget || !adjustmentQty || !adjustmentType || !adjustmentObs) {
      toastError("Completa todos los campos obligatorios.");
      return;
    }
    setIsSubmittingAdjustment(true);
    try {
      await commercialService.createManualAdjustment({
        stockId: adjustmentTarget.id,
        quantity: Number(adjustmentQty),
        adjustmentType: Number(adjustmentType),
        observation: adjustmentObs
      });
      toastSuccess("Ajuste registrado exitosamente.");
      setAdjustmentTarget(null);
      loadKardex();
    } catch (e: any) {
      const errorCode = e.response?.data?.errorCode;
      if (errorCode === 'insufficient_stock') {
        toastError("Stock insuficiente. No puedes retirar una cantidad mayor a la disponible.");
      } else if (errorCode === 'invalid_adjustment_type') {
        toastError("El tipo de ajuste seleccionado no es válido.");
      } else if (errorCode === 'negative_quantity') {
        toastError("La cantidad a ajustar debe ser mayor a cero.");
      } else {
        toastError(e.response?.data?.message || "Error al registrar el ajuste.");
      }
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const entryColumns: Column<StockEntryResponse>[] = [
    { header: 'Fecha', render: (row: StockEntryResponse) => new Date(row.entryDate).toLocaleString() },
    hasCostPermission && { header: 'Sucursal', accessorKey: 'branchName' },
    { header: 'Cant. Inicial', accessorKey: 'quantityIn' },
    { header: 'Disponible', accessorKey: 'availableQuantity' },
    hasCostPermission && { header: 'Costo Unit.', render: (row: StockEntryResponse) => <CurrencyCell amount={row.unitCost} currencyCode={currencyCode} /> },
    hasCostPermission && { header: 'Costo Total', render: (row: StockEntryResponse) => <CurrencyCell amount={row.totalCost} currencyCode={currencyCode} /> },
    { header: 'Nota', accessorKey: 'note' },
    { header: 'Estado', render: (row: StockEntryResponse) => {
      const statusLabel = stockStatusOptions.find(opt => Number(opt.value) === row.statusType)?.label || 'Desconocido';
      return (
        <span className={`badge badge-sm ${row.statusType === 331 ? 'badge-warning' : row.statusType === 332 ? 'badge-success' : 'badge-ghost'}`}>
          {statusLabel}
        </span>
      );
    }}
  ].filter(Boolean) as Column<StockEntryResponse>[];

  const adjustmentColumns: Column<StockAdjustmentResponse>[] = [
    { header: 'Fecha', render: (row: StockAdjustmentResponse) => new Date(row.date).toLocaleString() },
    { header: 'Tipo', render: (row: StockAdjustmentResponse) => adjustmentTypeOptions.find(opt => Number(opt.value) === row.adjustmentType)?.label || row.adjustmentType },
    { header: 'Cantidad', accessorKey: 'quantity' },
    hasCostPermission && { header: 'Costo Unit.', render: (row: StockAdjustmentResponse) => <CurrencyCell amount={row.unitCost} currencyCode={currencyCode} /> },
    hasCostPermission && { header: 'Costo Total', render: (row: StockAdjustmentResponse) => <CurrencyCell amount={row.totalCost} currencyCode={currencyCode} /> },
    { header: 'Observación', accessorKey: 'observation' },
  ].filter(Boolean) as Column<StockAdjustmentResponse>[];

  const pagination: TablePaginationConfig = {
    currentPage: page,
    pageSize: size,
    totalElements,
    totalPages: totalPages,
    onPageChange: setPage,
    onPageSizeChange: (newSize) => {
      setSize(newSize);
      setPage(0);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Kardex y Movimientos</h1>
          <p className="text-base-content/60 mt-1">Registro de entradas y ajustes manuales</p>
        </div>
        <BtnCreate 
          label="Crear Producto desde Cero" 
          onClick={() => setIsCreateModalOpen(true)} 
        />
      </div>

      <div className="bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
        <h2 className="text-lg font-bold mb-4">Escanear Producto</h2>
        <div className={`relative w-full max-w-md ${shakeKey > 0 ? 'animate-shake' : ''}`} key={shakeKey}>
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
            <Barcode className="h-5 w-5 text-base-content/40" strokeWidth={1.5} />
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Formulario Lateral */}
          <div className="lg:col-span-1 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 relative">
            {adjustmentTarget ? (
              <>
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-bold text-primary">Ajuste Manual Stock</h2>
                  <button onClick={() => setAdjustmentTarget(null)} className="btn btn-ghost btn-xs btn-circle"><X size={16}/></button>
                </div>
                <div className="text-sm text-base-content/60 mb-6 space-y-1">
                  <p>Producto: <strong>{productData.productName}</strong></p>
                  <p>Variante: <strong>{scannedVariant.variantName}</strong></p>
                  <p>Fecha Stock: <strong>{new Date(adjustmentTarget.entryDate).toLocaleString()}</strong></p>
                  {isOwner && <p>Sucursal: <strong>{adjustmentTarget.branchName || 'Principal'}</strong></p>}
                  <p>Cant. Inicial: <strong>{adjustmentTarget.quantityIn}</strong></p>
                  <p>Cant. Disponible: <strong>{adjustmentTarget.availableQuantity}</strong></p>
                </div>

                <div className="space-y-4">
                  <ComerziaSelect
                    label="Tipo de Ajuste"
                    options={adjustmentTypeOptions}
                    value={adjustmentType}
                    onChange={(e) => setAdjustmentType(e.target.value ? Number(e.target.value) : '')}
                    isRequired
                  />
                  <ComerziaInput
                    label="Cantidad a Ajustar"
                    type="number"
                    value={adjustmentQty}
                    onChange={(e) => setAdjustmentQty(e.target.value ? Number(e.target.value) : '')}
                    isRequired
                  />
                  {adjustmentQty !== '' && (
                    <div className="text-sm text-base-content/70 bg-base-200 p-3 rounded-lg flex justify-between">
                      <span>Nueva cant. disp. estimada:</span>
                      <span className="font-bold text-primary">
                        {adjustmentTarget.availableQuantity - Number(adjustmentQty)}
                      </span>
                    </div>
                  )}
                  <ComerziaTextarea
                    label="Observación"
                    value={adjustmentObs}
                    onChange={(e) => setAdjustmentObs(e.target.value)}
                    isRequired
                  />
                  <BtnSave 
                    className="w-full mt-4" 
                    label="Guardar Ajuste" 
                    onClick={handleSubmitAdjustment} 
                    isLoading={isSubmittingAdjustment} 
                  />
                </div>
              </>
            ) : (
              <>
                <h2 className="text-xl font-bold mb-2 text-primary">Registrar Entrada</h2>
                <p className="text-sm text-base-content/60 mb-6">
                  Producto: <strong>{productData.productName}</strong><br />
                  Variante: <strong>{scannedVariant.variantName}</strong>
                </p>

                <div className="space-y-4">
                  <ComerziaInput
                    label="Cantidad a Ingresar"
                    type="number"
                    value={quantityIn}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '') {
                        setQuantityIn('');
                      } else if (/^\d+$/.test(val)) {
                        setQuantityIn(Number(val));
                      }
                    }}
                    isRequired
                  />
                  {hasCostPermission && (
                    <>
                      <div className="form-control">
                        <label className="label cursor-pointer justify-start gap-4">
                          <span className="label-text">Ingresar por:</span>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="costInputType" className="radio radio-primary radio-sm" checked={costInputType === 'unit'} onChange={() => { setCostInputType('unit'); setCostInputValue(''); }} />
                            <span className="text-sm">Costo Unitario</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input type="radio" name="costInputType" className="radio radio-primary radio-sm" checked={costInputType === 'total'} onChange={() => { setCostInputType('total'); setCostInputValue(''); }} />
                            <span className="text-sm">Costo Total</span>
                          </label>
                        </label>
                      </div>

                      <ComerziaInput
                        label={costInputType === 'unit' ? 'Costo Unitario' : 'Costo Total'}
                        type="number"
                        value={costInputValue}
                        onChange={(e) => setCostInputValue(e.target.value ? Number(e.target.value) : '')}
                        isRequired
                      />
                      
                      {costInputValue !== '' && (
                        <div className="text-sm text-base-content/70 bg-primary/10 p-3 rounded-lg flex justify-between items-center border border-primary/20">
                          <span>{costInputType === 'unit' ? 'Costo Total Calculado:' : 'Costo Unitario Calculado:'}</span>
                          <span className="font-bold text-primary text-lg">
                            {costInputType === 'unit' 
                              ? (typeof quantityIn === 'number' ? quantityIn * Number(costInputValue) : 0).toFixed(2)
                              : (typeof quantityIn === 'number' && quantityIn > 0 ? Number(costInputValue) / quantityIn : 0).toFixed(2)
                            }
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  <ComerziaTextarea
                    label="Nota (Opcional)"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                  {hasCostPermission && (
                    <ComerziaSelect
                      label="Sucursal/Tienda (Opcional)"
                      options={branches.map(b => ({ value: b.id, label: b.name }))}
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                    />
                  )}
                  <BtnSave 
                    className="w-full mt-4" 
                    label="Guardar Entrada" 
                    onClick={handleSubmitEntry} 
                    isLoading={isSubmitting} 
                  />
                </div>
              </>
            )}
          </div>

          {/* Kardex Tabs */}
          <div className="lg:col-span-2 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Historial Kardex</h2>
              <div className="tabs tabs-boxed">
                <a 
                  className={`tab ${activeTab === 'entries' ? 'tab-active' : ''}`}
                  onClick={() => { setActiveTab('entries'); setPage(0); }}
                >
                  Entradas
                </a>
                {hasCostPermission && (
                  <a 
                    className={`tab ${activeTab === 'adjustments' ? 'tab-active' : ''}`}
                    onClick={() => { setActiveTab('adjustments'); setPage(0); }}
                  >
                    Ajustes Manuales
                  </a>
                )}
              </div>
            </div>

            <ComerziaTable
              data={kardexData}
              columns={(activeTab === 'entries' ? entryColumns : adjustmentColumns) as any}
              isLoading={isLoadingKardex}
              pagination={pagination}
              showRowNumbers={true}
              onRowContextMenu={(e, row) => {
                if (activeTab === 'entries' && hasCostPermission) {
                  e.preventDefault();
                  setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, row: row as StockEntryResponse });
                }
              }}
            />
          </div>
        </div>
      )}

      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        <ContextMenuItem
          icon={Settings2}
          label="Crear Ajuste Manual"
          onClick={() => {
            setAdjustmentTarget(contextMenu.row);
            setAdjustmentQty('');
            setAdjustmentType('');
            setAdjustmentObs('');
            setContextMenu(prev => ({ ...prev, isOpen: false }));
          }}
        />
        {hasCostPermission && contextMenu.row?.statusType === 331 && (
          <ContextMenuItem
            icon={DollarSign}
            label="Valorizar Stock"
            onClick={() => {
              setIsValuateModalOpen(true);
              setContextMenu(prev => ({ ...prev, isOpen: false }));
            }}
          />
        )}
      </ComerziaContextMenu>

      <ValuateStockModal
        isOpen={isValuateModalOpen}
        onClose={() => setIsValuateModalOpen(false)}
        onSuccess={() => loadKardex()}
        stockEntry={contextMenu.row}
      />

      <CreateFullProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
