import { useState, useRef, useEffect } from 'react';
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
import { useAuthStore } from '../../../stores/useAuthStore';
import { branchService } from '../../organization/services/branchService';
import type { BranchResponse } from '../../organization/types/branch';

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
  const [barcode, setBarcode] = useState('');
  const [productData, setProductData] = useState<ScannerProductResponse | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { error: toastError, success: toastSuccess } = useToast();
  
  // Entry Form State
  const [quantityIn, setQuantityIn] = useState<number | ''>('');
  const [unitCost, setUnitCost] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branches, setBranches] = useState<BranchResponse[]>([]);

  const { hasRole, userProfile } = useAuthStore();
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

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    if (isOwner) {
      branchService.getBranches(0, 100).then(res => setBranches(res.content));
    }
  }, [isOwner]);

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

  const handleScan = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      if (!barcode.trim()) {
        setShakeKey(prev => prev + 1);
        return;
      }
      setIsLoadingScan(true);
      setProductData(null);
      setQuantityIn('');
      setUnitCost('');
      setNote('');
      try {
        const res = await commercialService.scanBarcode(barcode.trim());
        setProductData(res);
      } catch (err: any) {
        if (err.response?.status === 404) {
          toastError("No se encontró el producto escaneado");
        } else {
          toastError(err.response?.data?.message || 'Producto no encontrado');
        }
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

  const handleSubmitEntry = async () => {
    if (!scannedVariant || !quantityIn || (isOwner && unitCost === '')) {
      toastError("Completa todos los campos obligatorios.");
      return;
    }
    setIsSubmitting(true);
    try {
      await commercialService.createStockEntry({
        variantId: scannedVariant.variantId,
        quantityIn: Number(quantityIn),
        unitCost: isOwner ? Number(unitCost) : 0,
        note: note || undefined
      }, isOwner ? (selectedBranchId || undefined) : undefined);
      toastSuccess("Entrada registrada exitosamente.");
      setQuantityIn('');
      setUnitCost('');
      setNote('');
      loadKardex(); // Reload kardex
    } catch (e: any) {
      toastError(e.response?.data?.message || "Error al registrar la entrada.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const entryColumns: Column<StockEntryResponse>[] = [
    { header: 'Fecha', render: (row: StockEntryResponse) => new Date(row.entryDate).toLocaleString() },
    isOwner && { header: 'Sucursal', accessorKey: 'branchName' },
    { header: 'Cant. Inicial', accessorKey: 'quantityIn' },
    { header: 'Disponible', accessorKey: 'availableQuantity' },
    isOwner && { header: 'Costo Unit.', render: (row: StockEntryResponse) => <CurrencyCell amount={row.unitCost} currencyCode={currencyCode} /> },
    isOwner && { header: 'Costo Total', render: (row: StockEntryResponse) => <CurrencyCell amount={row.totalCost} currencyCode={currencyCode} /> },
    { header: 'Nota', accessorKey: 'note' },
    { header: 'Estado', render: (row: StockEntryResponse) => (
      <span className={`badge badge-sm ${row.status ? 'badge-success' : 'badge-error'}`}>
        {row.status ? 'Activo' : 'Agotado/Anulado'}
      </span>
    )}
  ].filter(Boolean) as Column<StockEntryResponse>[];

  const adjustmentColumns: Column<StockAdjustmentResponse>[] = [
    { header: 'Fecha', render: (row: StockAdjustmentResponse) => new Date(row.date).toLocaleString() },
    { header: 'Tipo', render: (row: StockAdjustmentResponse) => row.adjustmentType === 1 ? 'Merma' : 'Sobrante' },
    { header: 'Cantidad', accessorKey: 'quantity' },
    isOwner && { header: 'Costo Unit.', render: (row: StockAdjustmentResponse) => <CurrencyCell amount={row.unitCost} currencyCode={currencyCode} /> },
    isOwner && { header: 'Costo Total', render: (row: StockAdjustmentResponse) => <CurrencyCell amount={row.totalCost} currencyCode={currencyCode} /> },
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-up">
          {/* Formulario de Entrada Rápida */}
          <div className="lg:col-span-1 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200">
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
                onChange={(e) => setQuantityIn(e.target.value ? Number(e.target.value) : '')}
                isRequired
              />
              {isOwner && (
                <ComerziaInput
                  label="Costo Unitario de Entrada"
                  type="number"
                  value={unitCost}
                  onChange={(e) => setUnitCost(e.target.value ? Number(e.target.value) : '')}
                  isRequired
                />
              )}
              <ComerziaTextarea
                label="Nota (Opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              {isOwner && (
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
                <a 
                  className={`tab ${activeTab === 'adjustments' ? 'tab-active' : ''}`}
                  onClick={() => { setActiveTab('adjustments'); setPage(0); }}
                >
                  Ajustes Manuales
                </a>
              </div>
            </div>

            <ComerziaTable
              data={kardexData}
              columns={(activeTab === 'entries' ? entryColumns : adjustmentColumns) as any}
              isLoading={isLoadingKardex}
              pagination={pagination}
              showRowNumbers={true}
            />
          </div>
        </div>
      )}

      <CreateFullProductModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {}}
      />
    </div>
  );
};
