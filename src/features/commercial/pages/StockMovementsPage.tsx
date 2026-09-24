import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { commercialService } from '../services/commercialService';
import type {
  ProductVariantIdentityResponse,
  StockEntryResponse,
  StockAdjustmentResponse,
  PendingCostEntryResponse
} from '../types/commercial';
import { useToast } from '../../../context/ToastContext';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaTextarea } from '../../../components/ui/ComerziaTextarea';
import { BtnSave, BtnCreate } from '../../../components/ui/CrudButtons';
import { ComerziaTable, type Column, type TablePaginationConfig } from '../../../components/ui/ComerziaTable';
import { CommercialProductSearchBar } from '../components/CommercialProductSearchBar';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaRadioGroup } from '../../../components/ui/ComerziaRadioGroup';
import { ComerziaBadge } from '../../../components/ui/ComerziaBadge';
import {
  Settings2,
  X,
  DollarSign,
  Coins,
  Banknote,
  SlidersHorizontal,
  ClipboardList,
  ArrowRightLeft,
  Store,
  Plus,
  Minus,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Package,
  ArrowLeft,
  AlertTriangle
} from 'lucide-react';
import { useAuthStore } from '../../../stores/useAuthStore';
import { branchService } from '../../organization/services/branchService';
import type { BranchResponse, TenantActiveBranchResponse } from '../../organization/types/branch';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { ValuateStockModal } from '../components/ValuateStockModal';
import { InventoryReportModal } from '../components/InventoryReportModal';
import { formatDateForUser } from '../../../utils/date';
import { getThumbnailUrl } from '../../../utils/image';

const CurrencyCell = ({ amount, currencyCode = 'USD' }: { amount: number, currencyCode?: string }) => {
  const safeAmount = Number(amount) || 0;
  let currencySymbol = currencyCode;
  let formattedAmount = safeAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

  try {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    const parts = formatter.formatToParts(safeAmount);
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
  const [productData, setProductData] = useState<ProductVariantIdentityResponse | null>(null);
  const [isLoadingScan, setIsLoadingScan] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const { error: toastError, success: toastSuccess } = useToast();

  // Entry Form State
  const [quantityIn, setQuantityIn] = useState<number | ''>('');
  const [branchQuantities, setBranchQuantities] = useState<Record<string, number | ''>>({});
  const [costInputType, setCostInputType] = useState<'unit' | 'total'>('unit');
  const [costInputValue, setCostInputValue] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [branches, setBranches] = useState<BranchResponse[]>([]);

  const { hasPermission, hasRole, userProfile } = useAuthStore();
  const hasCostPermission = hasPermission('COM_STOCK_COST_MANAGE');
  const hasDistributePermission = hasPermission('COM_STOCK_DISTRIBUTE');
  const hasAdjustmentReadPermission = hasPermission('COM_STOCK_ADJUSTMENT_READ');
  const hasActiveBranchesPermission = hasPermission('ORG_BRANCHES_ACTIVE_READ');
  const isOwner = hasRole('OWNER');
  const currencyCode = userProfile?.companySettings?.currencyCode || 'USD';

  // Total distribuido calculado en modo multi-tienda
  const totalDistributedQty = useMemo(() => {
    if (!hasDistributePermission) {
      return typeof quantityIn === 'number' ? quantityIn : 0;
    }
    return Object.values(branchQuantities).reduce((acc: number, curr) => {
      const val = typeof curr === 'number' ? curr : 0;
      return acc + val;
    }, 0);
  }, [hasDistributePermission, quantityIn, branchQuantities]);

  // Tabs and Kardex State
  const [activeTab, setActiveTab] = useState<'entries' | 'adjustments'>('entries');
  const [filterStockId, setFilterStockId] = useState<string | null>(null);
  const [kardexBranchId, setKardexBranchId] = useState('');
  const [activeBranches, setActiveBranches] = useState<TenantActiveBranchResponse[]>([]);
  const [isLoadingActiveBranches, setIsLoadingActiveBranches] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(null);
  const [kardexData, setKardexData] = useState<any[]>([]);
  const [isLoadingKardex, setIsLoadingKardex] = useState(false);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(5);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Pending Cost Entries State (Entradas con Costo Pendiente a primera vista)
  const [pendingCostData, setPendingCostData] = useState<PendingCostEntryResponse[]>([]);
  const [isLoadingPendingCost, setIsLoadingPendingCost] = useState(false);
  const [pendingCostPage, setPendingCostPage] = useState(0);
  const [pendingCostSize, setPendingCostSize] = useState(5);
  const [pendingCostTotalElements, setPendingCostTotalElements] = useState(0);
  const [pendingCostTotalPages, setPendingCostTotalPages] = useState(0);
  const [selectedPendingCostEntry, setSelectedPendingCostEntry] = useState<PendingCostEntryResponse | null>(null);

  // Adjustment Form State
  const [isEntryCardOpen, setIsEntryCardOpen] = useState(true);
  const [adjustmentTarget, setAdjustmentTarget] = useState<StockEntryResponse | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState<number | ''>('');
  const [adjustmentType, setAdjustmentType] = useState<number | ''>('');
  const [adjustmentObs, setAdjustmentObs] = useState('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState(false);

  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    isCentered?: boolean;
    row: StockEntryResponse | PendingCostEntryResponse | null;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    isCentered: false,
    row: null
  });

  const { options } = useLoadDictionaries([DICTIONARIES.ADJUSTMENT_TYPE, DICTIONARIES.STOCK_STATUS]);
  const adjustmentTypeOptions = options[DICTIONARIES.ADJUSTMENT_TYPE] || [];
  const stockStatusOptions = options[DICTIONARIES.STOCK_STATUS] || [];

  const [isValuateModalOpen, setIsValuateModalOpen] = useState(false);

  useEffect(() => {
    const urlBarcode = searchParams.get('barcode');
    if (urlBarcode) {
      executeScan(urlBarcode);
    }
  }, [searchParams]);

  useEffect(() => {
    if (hasCostPermission || hasDistributePermission) {
      branchService.getBranches(0, 100, true).then(res => setBranches(res.content || []));
    }
  }, [hasCostPermission, hasDistributePermission]);

  // Cargar sucursales activas para selector de filtros si tiene permiso
  useEffect(() => {
    if (hasActiveBranchesPermission) {
      setIsLoadingActiveBranches(true);
      branchService.getActiveBranches()
        .then(res => setActiveBranches(res || []))
        .catch(err => console.error('Error loading active branches:', err))
        .finally(() => setIsLoadingActiveBranches(false));
    }
  }, [hasActiveBranchesPermission]);

  const loadPendingCostEntries = async (targetPage = pendingCostPage, targetSize = pendingCostSize) => {
    if (!hasCostPermission) return;
    setIsLoadingPendingCost(true);
    try {
      const res = await commercialService.getPendingCostEntries(targetPage, targetSize);
      setPendingCostData(res.content || []);
      setPendingCostTotalElements(res.totalElements || 0);
      setPendingCostTotalPages(res.totalPages || 0);
    } catch (e) {
      console.error('Error loading pending cost entries:', e);
      setPendingCostData([]);
    } finally {
      setIsLoadingPendingCost(false);
    }
  };

  useEffect(() => {
    if (hasCostPermission) {
      loadPendingCostEntries(pendingCostPage, pendingCostSize);
    }
  }, [hasCostPermission, pendingCostPage, pendingCostSize]);

  const scannedVariant = productData ? { variantId: productData.variantId, variantName: productData.variantName } : undefined;

  useEffect(() => {
    if (scannedVariant) {
      loadKardex();
    }
  }, [productData?.variantId, activeTab, page, size, filterStockId, kardexBranchId]);

  const loadKardex = async () => {
    if (!scannedVariant) return;
    setIsLoadingKardex(true);
    try {
      if (activeTab === 'entries') {
        const res = await commercialService.getStockEntries(
          scannedVariant.variantId,
          page,
          size,
          kardexBranchId || undefined
        );
        setKardexData(res.content || []);
        setTotalElements(res.totalElements || 0);
        setTotalPages(res.totalPages || 0);
      } else {
        if (filterStockId) {
          const res = await commercialService.getAdjustmentsByStockId(filterStockId, page, size);
          setKardexData(res.content || []);
          setTotalElements(res.totalElements || 0);
          setTotalPages(res.totalPages || 0);
        } else {
          const res = await commercialService.getStockAdjustments(scannedVariant.variantId, page, size);
          setKardexData(res.content || []);
          setTotalElements(res.totalElements || 0);
          setTotalPages(res.totalPages || 0);
        }
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
    setBranchQuantities({});
    setCostInputValue('');
    setNote('');
    setFilterStockId(null);
    try {
      const res = await commercialService.identifyVariant(codeToScan.trim());
      setProductData(res);
    } catch (err: any) {
      const status = err.response?.status;
      const errorCode = err.response?.data?.errorCode;

      if (status === 404 || errorCode === 'not_found' || errorCode === 'resource_not_found') {
        toastError("No se encontró ningún producto con este código de barras o identificador.");
      } else {
        toastError(err.response?.data?.message || 'Error al conectar con el servidor.');
      }
      setShakeKey(prev => prev + 1);
    } finally {
      setIsLoadingScan(false);
    }
  };

  const handleSubmitEntry = async () => {
    if (!scannedVariant) {
      toastError("Debes escanear o seleccionar un producto.");
      return;
    }

    const qty = hasDistributePermission ? totalDistributedQty : (typeof quantityIn === 'number' ? quantityIn : 0);
    const val = typeof costInputValue === 'number' ? costInputValue : 0;
    const finalUnitCost = costInputType === 'unit' ? val : (qty > 0 ? Number((val / qty).toFixed(4)) : 0);
    const finalTotalCost = costInputType === 'total' ? val : Number((qty * val).toFixed(4));

    if (hasDistributePermission) {
      const distributions = Object.entries(branchQuantities)
        .filter(([_, q]) => typeof q === 'number' && q > 0)
        .map(([branchId, q]) => ({
          branchId,
          quantityIn: Number(q)
        }));

      if (distributions.length === 0) {
        setShakeKey(prev => prev + 1);
        toastError("Debes ingresar una cantidad mayor a cero en al menos una sucursal.");
        return;
      }

      if (hasCostPermission && costInputValue === '') {
        setShakeKey(prev => prev + 1);
        toastError("Completa el costo unitario o total.");
        return;
      }

      setIsSubmitting(true);
      try {
        await commercialService.createStockEntry({
          variantId: scannedVariant.variantId,
          unitCost: hasCostPermission ? finalUnitCost : 0,
          totalCost: hasCostPermission ? finalTotalCost : 0,
          note: note || undefined,
          branchDistributions: distributions
        });
        toastSuccess("Entrada y distribución de stock registradas exitosamente.");
        setBranchQuantities({});
        setCostInputValue('');
        setNote('');
        loadKardex();
      } catch (e: any) {
        const data = e.response?.data;
        const errorCode = data?.errorCode || data?.code;
        const message = data?.message;

        if (errorCode === 'invalid_cost_calculation' || message?.includes('Total cost provided does not match')) {
          toastError("El cálculo de costos es incorrecto. Verifica los montos ingresados.");
        } else if (errorCode === 'branch_required_for_stock_entry') {
          toastError("Se requiere especificar una sucursal para la entrada de stock.");
        } else if (errorCode === 'invalid_stock_entry') {
          toastError("Debes ingresar una cantidad válida o distribuir el stock entre las sucursales.");
        } else if (errorCode === 'access_denied') {
          toastError("No cuentas con los permisos necesarios para realizar esta operación.");
        } else if (errorCode === 'resource_not_found') {
          toastError("La variante del producto o la sucursal seleccionada no fue encontrada.");
        } else if (errorCode === 'invalid_quantity') {
          toastError("La cantidad de entrada debe ser mayor a cero.");
        } else {
          toastError(message || "Error al registrar la entrada de stock.");
        }
      } finally {
        setIsSubmitting(false);
      }
    } else {
      if (!quantityIn || (hasCostPermission && costInputValue === '')) {
        setShakeKey(prev => prev + 1);
        toastError("Completa todos los campos obligatorios.");
        return;
      }

      setIsSubmitting(true);
      try {
        await commercialService.createStockEntry(
          {
            variantId: scannedVariant.variantId,
            quantityIn: Number(quantityIn),
            unitCost: hasCostPermission ? finalUnitCost : 0,
            totalCost: hasCostPermission ? finalTotalCost : 0,
            note: note || undefined
          },
          hasCostPermission ? (selectedBranchId || undefined) : undefined
        );
        toastSuccess("Entrada de stock registrada exitosamente.");
        setQuantityIn('');
        setCostInputValue('');
        setNote('');
        loadKardex();
      } catch (e: any) {
        const data = e.response?.data;
        const errorCode = data?.errorCode || data?.code;
        const message = data?.message;

        if (errorCode === 'invalid_cost_calculation' || message?.includes('Total cost provided does not match')) {
          toastError("El cálculo de costos es incorrecto. Verifica los montos ingresados.");
        } else if (errorCode === 'branch_required_for_stock_entry') {
          toastError("Se requiere especificar una sucursal para la entrada de stock.");
        } else if (errorCode === 'invalid_stock_entry') {
          toastError("Debes ingresar una cantidad válida de entrada.");
        } else if (errorCode === 'access_denied') {
          toastError("No cuentas con los permisos necesarios para realizar esta operación.");
        } else if (errorCode === 'resource_not_found') {
          toastError("La variante del producto o la sucursal seleccionada no fue encontrada.");
        } else if (errorCode === 'invalid_quantity') {
          toastError("La cantidad de entrada debe ser mayor a cero.");
        } else {
          toastError(message || "Error al registrar la entrada de stock.");
        }
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const getMaxAdjustmentQty = (typeCode: number, target: StockEntryResponse): number | null => {
    // SHRINKAGE (301, "Merma / Pérdida"): 1 <= q <= availableQuantity
    if (typeCode === 301) {
      return target.availableQuantity;
    }
    // POSITIVE_ADJUSTMENT (302, "Ajuste Positivo / Sobrante"): 1 <= q <= (quantityIn - availableQuantity)
    if (typeCode === 302) {
      return Math.max(0, target.quantityIn - target.availableQuantity);
    }
    // CORRECTION_MINUS (303, "Corrección de error - Restar stock"): 1 <= q <= availableQuantity
    if (typeCode === 303) {
      return target.availableQuantity;
    }
    // CORRECTION_PLUS (304, "Corrección de error - Sumar stock"): q >= 1 (sin tope superior)
    if (typeCode === 304) {
      return null;
    }
    return target.availableQuantity;
  };

  const handleSubmitAdjustment = async () => {
    if (!adjustmentTarget || !adjustmentQty || !adjustmentType || !adjustmentObs) {
      toastError("Completa todos los campos obligatorios.");
      return;
    }

    const code = Number(adjustmentType);
    const qty = Number(adjustmentQty);

    if (qty <= 0) {
      toastError("La cantidad a ajustar debe ser mayor a cero.");
      return;
    }

    const maxLimit = getMaxAdjustmentQty(code, adjustmentTarget);
    if (maxLimit !== null && qty > maxLimit) {
      if (code === 301) {
        toastError(`La merma no puede superar el stock disponible actual (${maxLimit} uds).`);
      } else if (code === 302) {
        toastError(`El ajuste positivo no puede superar las unidades consumidas (${maxLimit} uds) para no exceder la cantidad inicial.`);
      } else if (code === 303) {
        toastError(`La corrección no puede restar más del stock disponible actual (${maxLimit} uds).`);
      } else {
        toastError(`La cantidad a ajustar no puede superar el límite permitido (${maxLimit} uds).`);
      }
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      await commercialService.createManualAdjustment({
        stockId: adjustmentTarget.id,
        quantity: qty,
        adjustmentType: code,
        observation: adjustmentObs
      });
      toastSuccess("Ajuste registrado exitosamente.");
      setAdjustmentTarget(null);
      loadKardex();
    } catch (e: any) {
      const data = e.response?.data;
      const errorCode = data?.errorCode || data?.code;
      const message = data?.message;

      if (errorCode === 'invalid_stock_adjustment') {
        toastError('El ajuste no es válido. La cantidad resultante excede el límite permitido.');
      } else if (errorCode === 'insufficient_stock') {
        toastError('Stock insuficiente para aplicar la reducción.');
      } else if (errorCode === 'resource_not_found') {
        toastError('Lote de stock o empleado no encontrado.');
      } else if (errorCode === 'invalid_adjustment_quantity') {
        toastError('La cantidad de ajuste debe ser mayor a cero.');
      } else if (errorCode === 'access_denied') {
        toastError('No cuentas con los permisos necesarios para realizar ajustes.');
      } else {
        toastError(message || 'Error al registrar el ajuste de stock.');
      }
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  const entryColumns: Column<StockEntryResponse>[] = [
    { header: 'Fecha', render: (row: StockEntryResponse) => <span className="whitespace-nowrap">{formatDateForUser(row.entryDate)}</span> },
    hasCostPermission && { header: 'Sucursal', render: (row: StockEntryResponse) => <span className="whitespace-nowrap">{row.branchName || '-'}</span> },
    { header: 'Cant. Inicial', render: (row: StockEntryResponse) => <span className="whitespace-nowrap">{row.quantityIn}</span> },
    { header: 'Disponible', render: (row: StockEntryResponse) => <span className="whitespace-nowrap">{row.availableQuantity}</span> },
    hasCostPermission && { header: 'Costo Unit.', render: (row: StockEntryResponse) => <span className="whitespace-nowrap"><CurrencyCell amount={row.unitCost} currencyCode={currencyCode} /></span> },
    hasCostPermission && { header: 'Costo Total', render: (row: StockEntryResponse) => <span className="whitespace-nowrap"><CurrencyCell amount={row.totalCost} currencyCode={currencyCode} /></span> },
    { header: 'Nota', accessorKey: 'note' },
    hasAdjustmentReadPermission && {
      header: 'Ajustes',
      render: (row: StockEntryResponse) => row.hasAdjustments ? (
        <span className="badge badge-xs badge-info font-semibold whitespace-nowrap gap-1 py-2 px-2.5" title="Tiene ajustes manuales de stock">
          Con Ajustes
        </span>
      ) : (
        <span className="text-base-content/30 text-xs italic whitespace-nowrap">-</span>
      )
    },
    {
      header: 'Estado',
      render: (row: StockEntryResponse) => {
        const statusObj = typeof row.statusType === 'object' ? row.statusType : null;
        const statusNum = typeof row.statusType === 'number' ? row.statusType : statusObj?.code;
        const statusLabel = statusObj?.label || stockStatusOptions.find(opt => Number(opt.value) === statusNum)?.label || 'Desconocido';
        const badgeVariant = statusNum === 331 ? 'warning' : statusNum === 332 ? 'success' : 'ghost';
        return (
          <ComerziaBadge
            label={statusLabel}
            variant={badgeVariant}
          />
        );
      }
    }
  ].filter(Boolean) as Column<StockEntryResponse>[];

  const adjustmentColumns: Column<StockAdjustmentResponse>[] = [
    { header: 'Fecha', render: (row: StockAdjustmentResponse) => <span className="whitespace-nowrap">{formatDateForUser(row.date)}</span> },
    {
      header: 'Tipo',
      render: (row: StockAdjustmentResponse) => {
        const typeObj = typeof row.adjustmentType === 'object' ? row.adjustmentType : null;
        const typeNum = typeof row.adjustmentType === 'number' ? row.adjustmentType : typeObj?.code;
        const label = typeObj?.label || adjustmentTypeOptions.find(opt => Number(opt.value) === typeNum)?.label || String(row.adjustmentType);
        return <span className="whitespace-nowrap">{label}</span>;
      }
    },
    { header: 'Cantidad', render: (row: StockAdjustmentResponse) => <span className="whitespace-nowrap">{row.quantity}</span> },
    hasCostPermission && { header: 'Costo Unit.', render: (row: StockAdjustmentResponse) => <span className="whitespace-nowrap"><CurrencyCell amount={row.unitCost} currencyCode={currencyCode} /></span> },
    hasCostPermission && { header: 'Costo Total', render: (row: StockAdjustmentResponse) => <span className="whitespace-nowrap"><CurrencyCell amount={row.totalCost} currencyCode={currencyCode} /></span> },
    { header: 'Observación', accessorKey: 'observation' },
    {
      header: 'Inventario',
      render: (row: StockAdjustmentResponse) => row.inventoryId ? (
        <button
          type="button"
          className="btn btn-ghost btn-xs text-primary gap-1 cursor-pointer hover:bg-primary/10 whitespace-nowrap"
          title="Ver reporte de inventario"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedInventoryId(row.inventoryId!);
          }}
        >
          <ClipboardList size={15} />
          <span className="text-xs font-semibold">Reporte</span>
        </button>
      ) : (
        <span className="text-base-content/30 text-xs italic whitespace-nowrap">-</span>
      )
    }
  ].filter(Boolean) as Column<StockAdjustmentResponse>[];

  const pendingCostColumns: Column<PendingCostEntryResponse>[] = [
    {
      header: 'Producto / Variante',
      render: (row: PendingCostEntryResponse) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-base-200/80 border border-base-300 overflow-hidden shrink-0 flex items-center justify-center">
            {row.imageUrl ? (
              <img
                src={getThumbnailUrl(row.imageUrl, 80)}
                alt={row.productName}
                loading="lazy"
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Package className="w-4 h-4 text-base-content/40" />
            )}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-sm text-base-content block truncate">
              {row.productName}
            </span>
            <span className="text-xs text-base-content/60 block truncate">
              {row.variantName}
            </span>
          </div>
        </div>
      )
    },
    {
      header: 'Fecha',
      render: (row: PendingCostEntryResponse) => <span className="whitespace-nowrap">{formatDateForUser(row.entryDate)}</span>
    },
    {
      header: 'Sucursal',
      render: (row: PendingCostEntryResponse) => <span className="whitespace-nowrap">{row.branchName || '-'}</span>
    },
    {
      header: 'Cantidad',
      render: (row: PendingCostEntryResponse) => (
        <span className="whitespace-nowrap font-medium font-mono">
          {row.quantityIn} uds
        </span>
      )
    },
    {
      header: 'Nota',
      render: (row: PendingCostEntryResponse) => (
        <span className="truncate max-w-xs block text-xs text-base-content/70 italic">
          {row.note || '-'}
        </span>
      )
    },
    {
      header: 'Estado',
      render: () => <ComerziaBadge label="Pendiente de Costo" variant="warning" />
    }
  ];

  const pendingCostPagination: TablePaginationConfig = {
    currentPage: pendingCostPage,
    pageSize: pendingCostSize,
    totalElements: pendingCostTotalElements,
    totalPages: pendingCostTotalPages,
    onPageChange: setPendingCostPage,
    onPageSizeChange: (newSize) => {
      setPendingCostSize(newSize);
      setPendingCostPage(0);
    }
  };

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
    <div className="space-y-6 animate-fade-in w-full">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <ArrowRightLeft className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Kardex y Movimientos
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Registro de entradas de stock, historial de movimientos y ajustes manuales.
            </p>
          </div>
        </div>
        {!isEntryCardOpen && !adjustmentTarget && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <BtnCreate
              label="Registrar Entrada"
              onClick={() => setIsEntryCardOpen(true)}
              className="w-full sm:w-auto"
            />
          </div>
        )}
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

      {/* 3. CONTENIDO: PRODUCTO ESCANEADO O LISTADO INICIAL (PENDIENTES DE COSTO) */}
      {scannedVariant && productData ? (
        <div className="space-y-4 animate-slide-up">
          {/* Botón Volver a Pendientes cuando se ha buscado un producto */}
          {hasCostPermission && (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setProductData(null);
                  setFilterStockId(null);
                  loadPendingCostEntries();
                }}
                className="btn btn-ghost btn-xs gap-1.5 text-base-content/70 hover:text-primary cursor-pointer -ml-1"
              >
                <ArrowLeft size={14} />
                <span className="font-semibold text-xs">Volver a Entradas con Costo Pendiente</span>
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario Lateral */}
            {(isEntryCardOpen || adjustmentTarget) && (
              <div className="lg:col-span-1 bg-base-100 p-6 rounded-2xl shadow-sm border border-base-200 relative">
                {adjustmentTarget ? (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-bold text-primary">Ajuste Manual Stock</h2>
                      <button onClick={() => setAdjustmentTarget(null)} className="btn btn-ghost btn-xs btn-circle"><X size={16} /></button>
                    </div>
                    <div className="text-sm text-base-content/60 mb-6 space-y-1">
                      <p>Producto: <strong>{productData.productName}</strong></p>
                      <p>Variante: <strong>{scannedVariant.variantName}</strong></p>
                      <p>Fecha Stock: <strong>{formatDateForUser(adjustmentTarget.entryDate)}</strong></p>
                      {isOwner && <p>Sucursal: <strong>{adjustmentTarget.branchName || 'Principal'}</strong></p>}
                      <p>Cant. Inicial: <strong>{adjustmentTarget.quantityIn}</strong></p>
                      <p>Cant. Disponible: <strong>{adjustmentTarget.availableQuantity}</strong></p>
                    </div>

                    <div className="space-y-4">
                      <ComerziaSelect
                        label="Tipo de Ajuste"
                        options={adjustmentTypeOptions}
                        value={adjustmentType}
                        onChange={(e) => {
                          setAdjustmentType(e.target.value ? Number(e.target.value) : '');
                          setAdjustmentQty(0);
                        }}
                        isRequired
                      />
                      <ComerziaInput
                        label="Cantidad a Ajustar"
                        type="number"
                        value={adjustmentQty}
                        onChange={(e) => {
                          let val: number | '' = e.target.value !== '' ? Number(e.target.value) : '';
                          if (typeof val === 'number') {
                            if (val < 0) val = 0;
                            if (adjustmentTarget && adjustmentType !== '') {
                              const maxLimit = getMaxAdjustmentQty(Number(adjustmentType), adjustmentTarget);
                              if (maxLimit !== null && val > maxLimit) {
                                val = maxLimit;
                              }
                            }
                          }
                          setAdjustmentQty(val);
                        }}
                        isRequired
                      />
                      {adjustmentType !== '' && adjustmentTarget && (
                        (() => {
                          const code = Number(adjustmentType);
                          const maxLimit = getMaxAdjustmentQty(code, adjustmentTarget);

                          if (code === 302 && maxLimit === 0) {
                            return (
                              <div className="p-3 bg-amber-500/15 dark:bg-amber-500/20 border border-amber-500/40 dark:border-amber-500/50 rounded-xl text-xs text-amber-950 dark:text-amber-100 font-medium -mt-2 leading-relaxed flex items-start gap-2.5 shadow-2xs">
                                <AlertTriangle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                  El lote ya cuenta con el <span className="font-bold text-black dark:text-white">100% de su stock disponible</span> ({adjustmentTarget.availableQuantity}/{adjustmentTarget.quantityIn} uds). Para registrar más unidades que las facturadas originalmente, utiliza <strong className="font-bold text-black dark:text-white underline decoration-amber-500">Corrección de error - Sumar stock</strong>.
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div className="text-[11px] text-base-content/60 flex items-center justify-between -mt-2 px-1">
                              <span>
                                {code === 301 && 'Máximo permitido (Stock disp.):'}
                                {code === 302 && 'Máximo a recuperar (Inicial - Disp.):'}
                                {code === 303 && 'Máximo a restar (Stock disp.):'}
                                {code === 304 && 'Límite máximo:'}
                              </span>
                              <span className="font-semibold font-mono text-base-content">
                                {maxLimit !== null ? `${maxLimit} uds` : 'Sin límite (Aumenta lote)'}
                              </span>
                            </div>
                          );
                        })()
                      )}
                      {adjustmentQty !== '' && (
                        <div className="text-xs sm:text-sm text-base-content/70 bg-base-200/70 p-3 rounded-xl flex flex-col gap-1.5 border border-base-200">
                          {(() => {
                            const code = Number(adjustmentType);
                            const qty = Number(adjustmentQty);
                            const isCorrection = code === 303 || code === 304;

                            if (isCorrection) {
                              const newInitial = code === 303
                                ? Math.max(0, adjustmentTarget.quantityIn - qty)
                                : adjustmentTarget.quantityIn + qty;

                              return (
                                <>
                                  <div className="flex justify-between items-center">
                                    <span>Nueva cant. inicial estimada:</span>
                                    <span className="font-bold font-mono text-primary">
                                      {newInitial} uds
                                    </span>
                                  </div>
                                  {code === 303 && qty === adjustmentTarget.quantityIn && (
                                    <div className="text-[11px] text-error font-medium pt-1 border-t border-error/20 flex items-center gap-1">
                                      <span>* El lote quedará completamente <strong>Anulado (VOIDED)</strong>.</span>
                                    </div>
                                  )}
                                </>
                              );
                            }

                            const newAvailable = code === 301
                              ? Math.max(0, adjustmentTarget.availableQuantity - qty)
                              : adjustmentTarget.availableQuantity + qty;

                            return (
                              <div className="flex justify-between items-center">
                                <span>Nueva cant. disp. estimada:</span>
                                <span className="font-bold font-mono text-primary">
                                  {newAvailable} uds
                                </span>
                              </div>
                            );
                          })()}
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
                        responsive={false}
                        onClick={handleSubmitAdjustment}
                        isLoading={isSubmittingAdjustment}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-xl font-bold text-primary">Registrar Entrada</h2>
                      <button onClick={() => setIsEntryCardOpen(false)} className="btn btn-ghost btn-xs btn-circle"><X size={16} /></button>
                    </div>
                    <p className="text-sm text-base-content/60 mb-6">
                      Producto: <strong>{productData.productName}</strong><br />
                      Variante: <strong>{scannedVariant.variantName}</strong>
                    </p>

                    <div className="space-y-4">
                      {hasDistributePermission ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-between pb-1 border-b border-base-200">
                            <label className="text-xs font-bold text-base-content flex items-center gap-1.5">
                              <Store size={15} className="text-primary" />
                              Distribución por Sucursales
                            </label>
                            <span className="text-xs font-mono text-base-content/70">
                              Total: <strong className="text-primary font-bold">{totalDistributedQty}</strong> uds
                            </span>
                          </div>

                          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                            {branches.length === 0 ? (
                              <p className="text-xs text-base-content/50 italic py-2 text-center">
                                Cargando sucursales disponibles...
                              </p>
                            ) : (
                              branches.map(branch => {
                                const currentQty = branchQuantities[branch.id];
                                return (
                                  <div
                                    key={branch.id}
                                    className="flex items-center justify-between gap-3 p-2.5 bg-base-200/50 hover:bg-base-200/80 rounded-xl border border-base-200 transition-colors"
                                  >
                                    <div className="min-w-0 flex-1">
                                      <span className="font-semibold text-xs text-base-content block truncate">
                                        {branch.name}
                                      </span>
                                      {branch.code && (
                                        <span className="font-mono text-[10px] text-base-content/50 uppercase">
                                          Cód: {branch.code}
                                        </span>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-1 bg-base-100 border border-base-300 rounded-xl p-0.5 shrink-0 shadow-2xs focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-all">
                                      <button
                                        type="button"
                                        title="Disminuir"
                                        className="btn btn-ghost btn-xs h-7 w-7 min-h-0 p-0 rounded-lg text-base-content/70 hover:text-primary hover:bg-base-200 cursor-pointer flex items-center justify-center"
                                        onClick={() => {
                                          const current = typeof currentQty === 'number' ? currentQty : 0;
                                          setBranchQuantities(prev => ({
                                            ...prev,
                                            [branch.id]: Math.max(0, current - 1)
                                          }));
                                        }}
                                      >
                                        <Minus size={13} strokeWidth={2.5} />
                                      </button>
                                      <input
                                        type="number"
                                        min="0"
                                        placeholder="0"
                                        value={currentQty === '' ? '' : currentQty ?? ''}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (val === '') {
                                            setBranchQuantities(prev => ({ ...prev, [branch.id]: '' }));
                                          } else if (/^\d+$/.test(val)) {
                                            setBranchQuantities(prev => ({ ...prev, [branch.id]: Number(val) }));
                                          }
                                        }}
                                        className="w-14 sm:w-16 text-center font-bold font-mono text-sm bg-transparent border-0 focus:outline-hidden p-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none text-base-content"
                                      />
                                      <button
                                        type="button"
                                        title="Aumentar"
                                        className="btn btn-ghost btn-xs h-7 w-7 min-h-0 p-0 rounded-lg text-base-content/70 hover:text-primary hover:bg-base-200 cursor-pointer flex items-center justify-center"
                                        onClick={() => {
                                          const current = typeof currentQty === 'number' ? currentQty : 0;
                                          setBranchQuantities(prev => ({
                                            ...prev,
                                            [branch.id]: current + 1
                                          }));
                                        }}
                                      >
                                        <Plus size={13} strokeWidth={2.5} />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      ) : (
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
                      )}

                      {hasCostPermission && (
                        <>
                          <ComerziaRadioGroup
                            label="Ingresar por:"
                            name="costInputType"
                            value={costInputType}
                            onChange={(val) => { setCostInputType(val); setCostInputValue(''); }}
                            options={[
                              { value: 'unit', label: 'Costo Unitario', icon: <Coins size={20} /> },
                              { value: 'total', label: 'Costo Total', icon: <Banknote size={20} /> }
                            ]}
                          />

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
                                  ? ((hasDistributePermission ? totalDistributedQty : (typeof quantityIn === 'number' ? quantityIn : 0)) * Number(costInputValue)).toFixed(2)
                                  : ((hasDistributePermission ? totalDistributedQty : (typeof quantityIn === 'number' ? quantityIn : 0)) > 0
                                    ? Number(costInputValue) / (hasDistributePermission ? totalDistributedQty : Number(quantityIn))
                                    : 0).toFixed(2)
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
                      {hasCostPermission && !hasDistributePermission && (
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
                        responsive={false}
                        onClick={handleSubmitEntry}
                        isLoading={isSubmitting}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Kardex Tabs and Table/Cards */}
            <div className={`${(isEntryCardOpen || adjustmentTarget) ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4 md:space-y-6 md:card md:bg-base-100 md:p-6 md:rounded-2xl md:shadow-xs md:border md:border-base-200`}>
              {/* Header / Tabs */}
              <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200 md:p-0 md:bg-transparent md:shadow-none md:border-0">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-lg sm:text-xl font-bold text-base-content">Historial Kardex</h2>
                    <div className="tabs tabs-boxed">
                      <a
                        className={`tab ${activeTab === 'entries' ? 'tab-active' : ''}`}
                        onClick={() => { setActiveTab('entries'); setFilterStockId(null); setPage(0); }}
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

                  {hasActiveBranchesPermission && activeTab === 'entries' && (
                    <div className="w-full sm:w-56">
                      <ComerziaSelect
                        placeholder="Todas las sucursales"
                        enableDefaultOption={true}
                        value={kardexBranchId}
                        onChange={e => {
                          setKardexBranchId(e.target.value);
                          setPage(0);
                        }}
                        options={activeBranches.map(b => ({
                          value: b.id,
                          label: b.name
                        }))}
                        isLoading={isLoadingActiveBranches}
                      />
                    </div>
                  )}
                </div>
              </div>

              {activeTab === 'adjustments' && filterStockId && (
                <div className="p-3 bg-info/15 border border-info/30 rounded-2xl flex items-center justify-between text-xs animate-fade-in gap-2">
                  <button
                    type="button"
                    className="btn btn-ghost btn-xs text-info hover:bg-info/20 cursor-pointer font-bold shrink-0"
                    onClick={() => {
                      setFilterStockId(null);
                      setPage(0);
                    }}
                  >
                    Ver todos los ajustes
                  </button>
                </div>
              )}

              {/* VISTA DESKTOP: TABLA KARDEX */}
              <div className="hidden md:block">
                <ComerziaTable
                  data={kardexData}
                  columns={(activeTab === 'entries' ? entryColumns : adjustmentColumns) as any}
                  isLoading={isLoadingKardex}
                  pagination={pagination}
                  showRowNumbers={true}
                  onRowContextMenu={(e, row) => {
                    if (activeTab === 'entries' && hasCostPermission) {
                      e.preventDefault();
                      setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isCentered: false, row: row as StockEntryResponse });
                    }
                  }}
                  rowClassName={() => (activeTab === 'entries' && hasCostPermission ? 'hover:!bg-primary/10 transition-colors cursor-pointer' : '')}
                />
              </div>

              {/* VISTA MOBILE: CARDS DE KARDEX (MINIMALISTA) */}
              <div className="block md:hidden space-y-2.5">
                {isLoadingKardex ? (
                  <div className="py-10 text-center">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <p className="text-xs text-base-content/50 mt-2">Cargando kardex...</p>
                  </div>
                ) : kardexData.length === 0 ? (
                  <div className="text-center py-8 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
                    No se encontraron movimientos en este historial.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {kardexData.map((item: any, index: number) => {
                      if (activeTab === 'entries') {
                        const entry = item as StockEntryResponse;
                        const statusObj = typeof entry.statusType === 'object' ? entry.statusType : null;
                        const statusNum = typeof entry.statusType === 'number' ? entry.statusType : statusObj?.code;
                        const statusLabel = statusObj?.label || (stockStatusOptions.find(o => Number(o.value) === statusNum)?.label) || 'Activo';
                        const badgeVariant = statusNum === 331 ? 'warning' : statusNum === 332 ? 'success' : 'ghost';

                        return (
                          <article
                            key={entry.id}
                            onClick={() => {
                              if (hasCostPermission) {
                                setContextMenu({ isOpen: true, x: 0, y: 0, isCentered: true, row: entry });
                              }
                            }}
                            onContextMenu={(e) => {
                              if (hasCostPermission) {
                                e.preventDefault();
                                setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isCentered: false, row: entry });
                              }
                            }}
                            className={`bg-base-100 p-3 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2 select-none ${hasCostPermission ? 'cursor-pointer hover:border-primary/40' : ''
                              }`}
                          >
                            {/* FILA 1: NUMERACIÓN, CANTIDADES Y ESTADO */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                                  {page * size + index + 1}
                                </span>
                                <div className="min-w-0">
                                  <span className="text-sm font-bold text-base-content">
                                    {entry.availableQuantity} <span className="text-xs font-normal text-base-content/50">/ {entry.quantityIn} uds</span>
                                  </span>
                                </div>
                              </div>

                              <div className="shrink-0">
                                <ComerziaBadge label={statusLabel} variant={badgeVariant} />
                              </div>
                            </div>

                            {/* FILA 2: SUCURSAL Y COSTO UNITARIO (SIN TOTAL EN MOBILE) */}
                            <div className="pl-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-base-content/70">
                              {entry.branchName ? (
                                <div className="flex items-center gap-1 truncate">
                                  <Store size={12} className="text-primary/70 shrink-0" />
                                  <span className="truncate font-medium">{entry.branchName}</span>
                                </div>
                              ) : <span />}

                              {hasCostPermission && (
                                <div className="flex items-center gap-1 shrink-0 ml-auto">
                                  <span><strong className="font-mono text-primary">{currencyCode} {(entry.unitCost || 0).toFixed(2)}</strong></span>
                                </div>
                              )}
                            </div>

                            {/* FILA 3: NOTA U OBSERVACIÓN CORTA (SI EXISTE) */}
                            {entry.note && (
                              <div className="pl-6 text-[11px] text-base-content/60 italic truncate">
                                "{entry.note}"
                              </div>
                            )}

                            {/* PIE DE TARJETA: FECHA Y BADGE DE AJUSTES */}
                            <div className="pl-6 pt-1.5 border-t border-base-200/50 flex items-center justify-between text-[11px] text-base-content/50">
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className="text-base-content/40 shrink-0" />
                                <span>{formatDateForUser(entry.entryDate)}</span>
                              </div>

                              {entry.hasAdjustments && (
                                <button
                                  type="button"
                                  className="text-[11px] text-info font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setFilterStockId(entry.id);
                                    setActiveTab('adjustments');
                                    setPage(0);
                                  }}
                                >
                                  <SlidersHorizontal size={11} /> Ver Ajustes
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      } else {
                        const adj = item as StockAdjustmentResponse;
                        const adjTypeObj = typeof adj.adjustmentType === 'object' ? adj.adjustmentType : null;
                        const adjCode = typeof adj.adjustmentType === 'number' ? adj.adjustmentType : adjTypeObj?.code;
                        const adjName = adjTypeObj?.label || (adjustmentTypeOptions.find(o => Number(o.value) === adjCode)?.label) || 'Ajuste';
                        const isNegative = adjCode === 301 || adjCode === 303;

                        return (
                          <article
                            key={adj.id}
                            className="bg-base-100 p-3 rounded-2xl border border-base-200 shadow-xs flex flex-col gap-2 select-none"
                          >
                            {/* FILA 1: NUMERACIÓN, TIPO Y CANTIDAD */}
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0">
                                  {page * size + index + 1}
                                </span>
                                <h3 className="text-sm font-semibold text-base-content leading-tight truncate">
                                  {adjName}
                                </h3>
                              </div>

                              <div className="shrink-0">
                                <span className={`badge badge-sm font-bold text-white ${isNegative ? 'badge-error' : 'badge-success'}`}>
                                  {isNegative ? '-' : '+'}{adj.quantity} uds
                                </span>
                              </div>
                            </div>

                            {/* FILA 2: COSTO UNITARIO Y REPORTE INVENTARIO */}
                            <div className="pl-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-base-content/70">
                              {adj.inventoryId ? (
                                <button
                                  type="button"
                                  className="text-xs text-primary font-semibold flex items-center gap-1 hover:underline cursor-pointer"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedInventoryId(adj.inventoryId!);
                                  }}
                                >
                                  <ClipboardList size={12} className="shrink-0" /> Reporte
                                </button>
                              ) : <span />}

                              {hasCostPermission && (adj.unitCost > 0) && (
                                <div className="flex items-center gap-1 shrink-0 ml-auto">
                                  <Coins size={12} className="text-primary/70 shrink-0" />
                                  <span>Costo: <strong className="font-mono text-primary">{currencyCode} {(adj.unitCost || 0).toFixed(2)}</strong></span>
                                </div>
                              )}
                            </div>

                            {/* FILA 3: OBSERVACIÓN (SI EXISTE) */}
                            {adj.observation && (
                              <div className="pl-6 text-[11px] text-base-content/60 italic truncate">
                                "{adj.observation}"
                              </div>
                            )}

                            {/* PIE DE TARJETA: FECHA */}
                            <div className="pl-6 pt-1.5 border-t border-base-200/50 flex items-center text-[11px] text-base-content/50">
                              <Calendar size={12} className="mr-1 text-base-content/40 shrink-0" />
                              <span>{formatDateForUser(adj.date)}</span>
                            </div>
                          </article>
                        );
                      }
                    })}
                  </div>
                )}

                {/* PAGINACIÓN MOBILE */}
                {totalElements > 0 && (
                  <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
                      <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <span>Mostrar</span>
                        <select
                          value={size}
                          onChange={(e) => {
                            setSize(Number(e.target.value));
                            setPage(0);
                          }}
                          className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                        </select>
                        <span className="whitespace-nowrap">de {totalElements} registros</span>
                      </div>
                      <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                        Página {page + 1} de {Math.max(1, totalPages)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Primera página"
                        disabled={page === 0 || isLoadingKardex}
                        onClick={() => setPage(0)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Página anterior"
                        disabled={page === 0 || isLoadingKardex}
                        onClick={() => setPage(Math.max(0, page - 1))}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Página siguiente"
                        disabled={page >= totalPages - 1 || isLoadingKardex}
                        onClick={() => setPage(page + 1)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Última página"
                        disabled={page >= totalPages - 1 || isLoadingKardex}
                        onClick={() => setPage(totalPages - 1)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </footer>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* VISTA PRINCIPAL A PRIMERA VISTA (CUANDO NO HAY PRODUCTO ESCANEADO) */
        <div className="animate-fade-in">
          {hasCostPermission ? (
            <div className="space-y-4 md:space-y-6 md:card md:bg-base-100 md:p-6 md:rounded-2xl md:shadow-xs md:border md:border-base-200">
              {/* VISTA DESKTOP: TABLA PENDIENTES DE COSTO */}
              <div className="hidden md:block">
                <ComerziaTable
                  data={pendingCostData}
                  columns={pendingCostColumns}
                  isLoading={isLoadingPendingCost}
                  pagination={pendingCostPagination}
                  showRowNumbers={true}
                  onRowContextMenu={(e, row) => {
                    e.preventDefault();
                    setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isCentered: false, row });
                  }}
                  rowClassName={() => 'hover:!bg-warning/10 transition-colors cursor-pointer'}
                />
              </div>

              {/* VISTA MOBILE: CARDS DE PENDIENTES DE COSTO (MINIMALISTAS) */}
              <div className="block md:hidden space-y-2.5">
                {isLoadingPendingCost ? (
                  <div className="py-10 text-center">
                    <span className="loading loading-spinner loading-md text-warning"></span>
                    <p className="text-xs text-base-content/50 mt-2">Cargando entradas pendientes...</p>
                  </div>
                ) : pendingCostData.length === 0 ? (
                  <div className="text-center py-10 text-base-content/50 bg-base-100 p-6 rounded-2xl border border-base-200 text-xs">
                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-success opacity-80" />
                    <p className="font-semibold text-sm text-base-content">¡Al día!</p>
                    <p className="mt-1">No hay entradas de stock pendientes de valorización.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {pendingCostData.map((entry, index) => (
                      <article
                        key={entry.id}
                        onClick={() => {
                          setContextMenu({ isOpen: true, x: 0, y: 0, isCentered: true, row: entry });
                        }}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setContextMenu({ isOpen: true, x: e.clientX, y: e.clientY, isCentered: false, row: entry });
                        }}
                        className="bg-base-100 p-3.5 rounded-2xl border border-base-200 shadow-xs active:scale-[0.99] transition-all flex flex-col gap-2 select-none cursor-pointer hover:border-warning/40"
                      >
                        {/* FILA 1: NUMERACIÓN, PRODUCTO + VARIANTE Y BADGE */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5 min-w-0 flex-1">
                            <span className="text-xs font-bold text-base-content/40 w-4 text-center shrink-0 mt-0.5">
                              {pendingCostPage * pendingCostSize + index + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-base-content leading-snug truncate">
                                {entry.productName}
                              </h3>
                              {entry.variantName && (
                                <p className="text-xs font-semibold text-primary truncate mt-0.5">
                                  {entry.variantName}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="shrink-0">
                            <ComerziaBadge label="Pendiente" variant="warning" />
                          </div>
                        </div>

                        {/* FILA 2: SUCURSAL Y CANTIDAD */}
                        <div className="pl-6 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-base-content/70">
                          {entry.branchName ? (
                            <div className="flex items-center gap-1 truncate">
                              <Store size={12} className="text-primary/70 shrink-0" />
                              <span className="truncate font-medium">{entry.branchName}</span>
                            </div>
                          ) : <span />}

                          <div className="flex items-center gap-1 shrink-0 ml-auto font-mono text-xs">
                            <span>Cantidad: <strong className="font-bold text-base-content">{entry.quantityIn}</strong> uds</span>
                          </div>
                        </div>

                        {/* FILA 3: NOTA U OBSERVACIÓN CORTA (SI EXISTE) */}
                        {entry.note && (
                          <div className="pl-6 text-[11px] text-base-content/60 italic truncate">
                            "{entry.note}"
                          </div>
                        )}

                        {/* PIE DE TARJETA: FECHA */}
                        <div className="pl-6 pt-1.5 border-t border-base-200/50 flex items-center text-[11px] text-base-content/50">
                          <Calendar size={12} className="mr-1 text-base-content/40 shrink-0" />
                          <span>{formatDateForUser(entry.entryDate)}</span>
                        </div>
                      </article>
                    ))}
                  </div>
                )}

                {/* PAGINACIÓN MOBILE PENDIENTES DE COSTO */}
                {pendingCostTotalElements > 0 && (
                  <footer className="mt-4 pt-3 pb-3 px-3 bg-base-100 border border-base-200 rounded-2xl shadow-xs" data-purpose="mobile-pagination">
                    <div className="flex items-center justify-between text-[11px] sm:text-xs text-base-content/70 mb-3 gap-2">
                      <div className="flex items-center gap-1.5 whitespace-nowrap shrink-0">
                        <span>Mostrar</span>
                        <select
                          value={pendingCostSize}
                          onChange={(e) => {
                            setPendingCostSize(Number(e.target.value));
                            setPendingCostPage(0);
                          }}
                          className="select select-bordered select-xs text-[11px] sm:text-xs font-semibold bg-base-100 h-6 min-h-6 px-1.5"
                        >
                          <option value={5}>5</option>
                          <option value={10}>10</option>
                          <option value={25}>25</option>
                        </select>
                        <span className="whitespace-nowrap">de {pendingCostTotalElements} pendientes</span>
                      </div>
                      <span className="font-semibold text-base-content/80 whitespace-nowrap shrink-0">
                        Página {pendingCostPage + 1} de {Math.max(1, pendingCostTotalPages)}
                      </span>
                    </div>

                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        aria-label="Primera página"
                        disabled={pendingCostPage === 0 || isLoadingPendingCost}
                        onClick={() => setPendingCostPage(0)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronsLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Página anterior"
                        disabled={pendingCostPage === 0 || isLoadingPendingCost}
                        onClick={() => setPendingCostPage(Math.max(0, pendingCostPage - 1))}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Página siguiente"
                        disabled={pendingCostPage >= pendingCostTotalPages - 1 || isLoadingPendingCost}
                        onClick={() => setPendingCostPage(pendingCostPage + 1)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="Última página"
                        disabled={pendingCostPage >= pendingCostTotalPages - 1 || isLoadingPendingCost}
                        onClick={() => setPendingCostPage(pendingCostTotalPages - 1)}
                        className="w-8 h-8 rounded-lg border border-base-300 bg-base-100 flex items-center justify-center text-base-content/70 hover:bg-base-200 disabled:opacity-30 transition-colors"
                      >
                        <ChevronsRight className="w-4 h-4" />
                      </button>
                    </div>
                  </footer>
                )}
              </div>
            </div>
          ) : (
            <div className="card bg-base-100 p-8 rounded-2xl shadow-xs border border-base-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-base-content">
                Consulta de Movimientos y Kardex
              </h3>
              <p className="text-xs sm:text-sm text-base-content/60 max-w-md mx-auto">
                Utiliza el buscador superior o escanea un código de barras para registrar entradas de stock o consultar el historial de movimientos de cualquier producto.
              </p>
            </div>
          )}
        </div>
      )}

      <ComerziaContextMenu
        isOpen={contextMenu.isOpen}
        x={contextMenu.x}
        y={contextMenu.y}
        isCentered={contextMenu.isCentered}
        onClose={() => setContextMenu(prev => ({ ...prev, isOpen: false }))}
      >
        {(() => {
          if (!contextMenu.row) return null;

          // Si es una fila de entrada pendiente de costo
          if ('productName' in contextMenu.row) {
            const pendingEntry = contextMenu.row as PendingCostEntryResponse;
            return (
              <>
                <ContextMenuItem
                  icon={DollarSign}
                  label="Valorizar Stock"
                  onClick={() => {
                    setSelectedPendingCostEntry(pendingEntry);
                    setIsValuateModalOpen(true);
                    setContextMenu(prev => ({ ...prev, isOpen: false }));
                  }}
                />
                <ContextMenuItem
                  icon={ArrowRightLeft}
                  label="Ver Kardex / Movimientos"
                  onClick={() => {
                    const code = pendingEntry.barCode || pendingEntry.sku;
                    setContextMenu(prev => ({ ...prev, isOpen: false }));
                    if (code) {
                      executeScan(code);
                    }
                  }}
                />
              </>
            );
          }

          // Si es una fila estándar de entrada en el Kardex
          const entry = contextMenu.row as StockEntryResponse;
          const statusObj = typeof entry.statusType === 'object' ? entry.statusType : null;
          const statusNum = typeof entry.statusType === 'number' ? entry.statusType : statusObj?.code;
          const isActiveStock = statusNum === 332;
          const isDisabled = !isActiveStock || entry.availableQuantity === 0;

          return (
            <>
              <ContextMenuItem
                icon={Settings2}
                label="Crear Ajuste Manual"
                disabled={isDisabled}
                onClick={() => {
                  if (isDisabled) return;
                  setAdjustmentTarget(entry);
                  setAdjustmentQty('');
                  setAdjustmentType('');
                  setAdjustmentObs('');
                  setContextMenu(prev => ({ ...prev, isOpen: false }));
                }}
              />
              {entry.hasAdjustments && (
                <ContextMenuItem
                  icon={SlidersHorizontal}
                  label="Ver Ajustes"
                  onClick={() => {
                    const stockId = entry.id;
                    setContextMenu(prev => ({ ...prev, isOpen: false }));
                    if (stockId) {
                      setFilterStockId(stockId);
                      setActiveTab('adjustments');
                      setPage(0);
                    }
                  }}
                />
              )}
              {hasCostPermission && statusNum === 331 && (
                <ContextMenuItem
                  icon={DollarSign}
                  label="Valorizar Stock"
                  onClick={() => {
                    setSelectedPendingCostEntry(null);
                    setIsValuateModalOpen(true);
                    setContextMenu(prev => ({ ...prev, isOpen: false }));
                  }}
                />
              )}
            </>
          );
        })()}
      </ComerziaContextMenu>

      <ValuateStockModal
        isOpen={isValuateModalOpen}
        onClose={() => {
          setIsValuateModalOpen(false);
          setSelectedPendingCostEntry(null);
        }}
        onSuccess={() => {
          if (scannedVariant) {
            loadKardex();
          }
          if (hasCostPermission) {
            loadPendingCostEntries();
          }
        }}
        stockEntry={selectedPendingCostEntry || contextMenu.row}
      />

      <InventoryReportModal
        isOpen={!!selectedInventoryId}
        onClose={() => setSelectedInventoryId(null)}
        inventoryId={selectedInventoryId}
      />
    </div>
  );
};
