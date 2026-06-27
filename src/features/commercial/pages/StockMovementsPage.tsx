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

  // Tabs and Kardex State
  const [activeTab, setActiveTab] = useState<'entries' | 'adjustments'>('entries');
  const [kardexData, setKardexData] = useState<any[]>([]);
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(20);
  const [totalElements, setTotalElements] = useState(0);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

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
      } else {
        const res = await commercialService.getStockAdjustments(scannedVariant.variantId, page, size);
        setKardexData(res.content);
        setTotalElements(res.totalElements);
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

  const handleSubmitEntry = async () => {
    if (!scannedVariant || !quantityIn || !unitCost) {
      toastError("Completa la cantidad y el costo unitario.");
      return;
    }
    setIsSubmitting(true);
    try {
      await commercialService.createStockEntry({
        variantId: scannedVariant.variantId,
        quantityIn: Number(quantityIn),
        unitCost: Number(unitCost),
        note: note || undefined
      });
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
    { header: 'Fecha', render: (row) => new Date(row.entryDate).toLocaleString() },
    { header: 'Cant. Inicial', accessorKey: 'quantityIn' },
    { header: 'Disponible', accessorKey: 'availableQuantity' },
    { header: 'Costo Unit.', render: (row) => `$${row.unitCost.toFixed(2)}` },
    { header: 'Costo Total', render: (row) => `$${row.totalCost.toFixed(2)}` },
    { header: 'Nota', accessorKey: 'note' },
    { header: 'Estado', render: (row) => (
      <span className={`badge badge-sm ${row.status ? 'badge-success' : 'badge-error'}`}>
        {row.status ? 'Activo' : 'Agotado/Anulado'}
      </span>
    )}
  ];

  const adjustmentColumns: Column<StockAdjustmentResponse>[] = [
    { header: 'Fecha', render: (row) => new Date(row.date).toLocaleString() },
    { header: 'Tipo', render: (row) => row.adjustmentType === 1 ? 'Merma' : 'Sobrante' },
    { header: 'Cantidad', accessorKey: 'quantity' },
    { header: 'Costo Unit.', render: (row) => `$${row.unitCost.toFixed(2)}` },
    { header: 'Costo Total', render: (row) => `$${row.totalCost.toFixed(2)}` },
    { header: 'Observación', accessorKey: 'observation' },
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
              <ComerziaInput
                label="Costo Unitario de Entrada"
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value ? Number(e.target.value) : '')}
                isRequired
              />
              <ComerziaTextarea
                label="Nota (Opcional)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
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
