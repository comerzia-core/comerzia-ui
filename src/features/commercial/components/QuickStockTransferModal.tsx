import React, { useState, useEffect, useMemo } from 'react';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { BtnCancel, BtnSave } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { useToast } from '../../../context/ToastContext';
import { commercialService } from '../services/commercialService';
import type { StockTransferBranchResponse } from '../types/commercial';
import { getThumbnailUrl } from '../../../utils/image';
import { 
  ArrowRightLeft, 
  Store, 
  Package, 
  Layers, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';

interface QuickStockTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  productVariant: {
    variantId: string;
    variantName: string;
    productName: string;
    sku: string;
    imageUrl?: string;
  };
  onTransferSuccess: () => void;
}

interface FormErrors {
  origin?: string;
  target?: string;
  quantity?: string;
}

export const QuickStockTransferModal: React.FC<QuickStockTransferModalProps> = ({
  isOpen,
  onClose,
  productVariant,
  onTransferSuccess
}) => {
  const { hasRole } = useAuthStore();
  const isOwner = hasRole('OWNER');
  const { success: toastSuccess, error: toastError } = useToast();

  const [branches, setBranches] = useState<StockTransferBranchResponse[]>([]);
  const [isLoadingBranches, setIsLoadingBranches] = useState(false);
  const [originBranchId, setOriginBranchId] = useState<string>('');
  const [targetBranchId, setTargetBranchId] = useState<string>('');
  const [quantity, setQuantity] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});

  // Limpiar y resetear formulario y errores
  const resetForm = () => {
    setQuantity('');
    setTargetBranchId('');
    setOriginBranchId('');
    setErrors({});
    setShakeKey(0);
    setIsSubmitting(false);
  };

  // Cargar sucursales activas al abrir el modal y limpiar estados
  useEffect(() => {
    if (isOpen) {
      resetForm();
      setIsLoadingBranches(true);

      commercialService.getTransferBranches()
        .then((res) => {
          const list = res || [];
          setBranches(list);

          // Si es OWNER, buscar sucursal con isCurrent para pre-seleccionar
          if (isOwner) {
            const currentBranch = list.find(b => b.isCurrent);
            if (currentBranch) {
              setOriginBranchId(currentBranch.id);
            }
          }
        })
        .catch((err) => {
          console.error("Error loading transfer branches:", err);
          toastError("No se pudieron cargar las sucursales para la transferencia.");
        })
        .finally(() => {
          setIsLoadingBranches(false);
        });
    } else {
      resetForm();
    }
  }, [isOpen, isOwner]);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Si el OWNER cambia la sucursal de origen y coincide con el destino, resetear destino sin marcar error
  const handleOriginChange = (newOriginId: string) => {
    setOriginBranchId(newOriginId);
    const destinationMatches = targetBranchId === newOriginId;

    if (destinationMatches) {
      setTargetBranchId('');
    }

    setErrors(prev => {
      const next = { ...prev };
      delete next.origin;
      if (destinationMatches) {
        delete next.target;
      }
      return next;
    });
  };

  // Manejar cambio en destino limpiando su error
  const handleTargetChange = (newTargetId: string) => {
    setTargetBranchId(newTargetId);
    if (errors.target) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.target;
        return next;
      });
    }
  };

  // Manejar cambio en cantidad limpiando su error
  const handleQuantityChange = (val: string) => {
    if (val === '') {
      setQuantity('');
    } else if (/^\d+$/.test(val)) {
      setQuantity(Number(val));
    }

    if (errors.quantity) {
      setErrors(prev => {
        const next = { ...prev };
        delete next.quantity;
        return next;
      });
    }
  };

  // Opciones para el selector de origen (exclusivo para OWNER)
  const originOptions = useMemo(() => {
    return branches.map((b) => ({
      value: b.id,
      label: b.isCurrent ? `${b.name} (Actual)` : b.name
    }));
  }, [branches]);

  // Opciones para el selector de destino
  // Regla: no listar la tienda actual (isCurrent) o la tienda origen seleccionada por OWNER
  const destinationOptions = useMemo(() => {
    return branches
      .filter((b) => {
        if (isOwner) {
          if (originBranchId) return b.id !== originBranchId;
          return !b.isCurrent;
        }
        return !b.isCurrent;
      })
      .map((b) => ({
        value: b.id,
        label: b.name
      }));
  }, [branches, isOwner, originBranchId]);

  const handleSubmit = async () => {
    const newErrors: FormErrors = {};

    // Validar tienda de origen si es OWNER
    if (isOwner && !originBranchId) {
      newErrors.origin = "Selecciona la tienda origen";
    }

    // Validar tienda de destino
    if (!targetBranchId) {
      newErrors.target = "Selecciona la tienda destino";
    }

    // Validar cantidad numérica positiva
    if (!quantity || typeof quantity !== 'number' || quantity < 1) {
      newErrors.quantity = "Ingresa una cantidad mayor a 0";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setShakeKey(prev => prev + 1);
      if (newErrors.origin) {
        toastError("Debes seleccionar la tienda de origen.");
      } else if (newErrors.target) {
        toastError("Debes seleccionar la tienda de destino.");
      } else if (newErrors.quantity) {
        toastError("Ingresa una cantidad válida mayor o igual a 1.");
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);
    try {
      await commercialService.createQuickTransfer(
        {
          targetBranchId,
          productVariantId: productVariant.variantId,
          quantity: Math.floor(quantity as number)
        },
        isOwner && originBranchId ? originBranchId : undefined
      );

      toastSuccess("Transferencia de stock realizada exitosamente.");
      handleClose();
      onTransferSuccess();
    } catch (err: any) {
      console.error("Error in quick stock transfer:", err);
      const data = err.response?.data;
      const errorCode = (data?.code || data?.errorCode || '').toString().toLowerCase();
      const status = err.response?.status;
      const rawMsg = (data?.message || '').toString();

      let errorMsg = "Error al procesar la transferencia de stock.";

      if (errorCode === 'insufficient_stock' || rawMsg.toLowerCase().includes('insufficient active stock')) {
        // Extraer cantidades si vienen formateadas como "Requested: X, Available: Y"
        const match = rawMsg.match(/Requested:\s*(\d+(?:\.\d+)?),\s*Available:\s*(\d+(?:\.\d+)?)/i);
        if (match) {
          errorMsg = `Stock insuficiente en la tienda de origen. Solicitado: ${match[1]}, Disponible: ${match[2]}.`;
        } else {
          errorMsg = "Stock insuficiente en la tienda de origen para realizar la transferencia.";
        }
      } else if (errorCode === 'same_branch_transfer' || rawMsg.toLowerCase().includes('same branch')) {
        errorMsg = "No se puede transferir stock hacia la misma tienda.";
      } else if (errorCode === 'resource_not_found' || errorCode === 'branch_not_found' || errorCode === 'product_variant_not_found' || status === 404) {
        errorMsg = "Sucursal o variante de producto no encontrada.";
      } else if (errorCode === 'invalid_quantity' || (status === 400 && rawMsg.toLowerCase().includes('quantity'))) {
        errorMsg = "La cantidad a transferir debe ser mayor a cero.";
      } else if (errorCode === 'access_denied' || status === 403) {
        errorMsg = "No cuentas con los permisos necesarios para realizar transferencias de stock.";
      } else if (errorCode === 'branch_required') {
        errorMsg = "Debes seleccionar una sucursal de origen válida.";
      } else if (status === 422) {
        errorMsg = "Stock insuficiente o no disponible en la tienda origen para realizar la transferencia.";
      } else if (status === 400) {
        errorMsg = "Solicitud de transferencia inválida. Verifica los datos seleccionados.";
      }

      toastError(errorMsg);
      setShakeKey(prev => prev + 1);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Transferencia Rápida de Stock"
      size="md"
    >
      <div className="space-y-4 pt-1">
        {/* Tarjeta de Resumen del Producto y Variante */}
        <div className="bg-base-200/50 p-3.5 rounded-2xl border border-base-200 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-base-100 border border-base-300 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
            {productVariant.imageUrl ? (
              <img
                src={getThumbnailUrl(productVariant.imageUrl)}
                alt={productVariant.productName}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={22} className="text-base-content/40" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-base-content truncate">
              {productVariant.productName}
            </h4>
            <div className="flex flex-wrap items-center gap-2 mt-0.5 text-xs text-base-content/70">
              <span className="flex items-center gap-1 font-medium truncate">
                <Layers size={13} className="text-primary shrink-0" />
                {productVariant.variantName}
              </span>
            </div>
          </div>
        </div>

        {/* Formulario de Transferencia */}
        <div className="space-y-3.5 bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs">
          {/* TIENDA ORIGEN (Solo visible para rol OWNER) */}
          {isOwner && (
            <div className="space-y-1.5 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-base-content/80 flex items-center gap-1.5">
                  <Store size={14} className="text-primary" /> Tienda Origen
                </span>
                <span className="badge badge-primary badge-outline badge-xs text-[10px] font-semibold flex items-center gap-1">
                  <ShieldCheck size={11} /> Propietario
                </span>
              </div>
              <ComerziaSelect
                placeholder={isLoadingBranches ? "Cargando sucursales..." : "Selecciona tienda origen..."}
                options={originOptions}
                value={originBranchId}
                onChange={(e) => handleOriginChange(e.target.value)}
                isLoading={isLoadingBranches}
                isRequired
                shakeKey={shakeKey}
                error={errors.origin}
              />
            </div>
          )}

          {/* TIENDA DESTINO */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-base-content/80 flex items-center gap-1.5">
              <ArrowRightLeft size={14} className="text-success" /> Tienda Destino
            </span>
            <ComerziaSelect
              placeholder={isLoadingBranches ? "Cargando sucursales..." : "Selecciona tienda destino..."}
              options={destinationOptions}
              value={targetBranchId}
              onChange={(e) => handleTargetChange(e.target.value)}
              isLoading={isLoadingBranches}
              isRequired
              shakeKey={shakeKey}
              error={errors.target}
            />
            {destinationOptions.length === 0 && !isLoadingBranches && (
              <p className="text-[11px] text-base-content/50 flex items-center gap-1 pl-1">
                <AlertCircle size={12} className="text-warning shrink-0" />
                No hay otras sucursales activas disponibles para transferir.
              </p>
            )}
          </div>

          {/* CANTIDAD A TRANSFERIR */}
          <div className="pt-1">
            <ComerziaInput
              label="Cantidad a Transferir"
              type="number"
              placeholder="Ej. 5"
              min={1}
              value={quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              isRequired
              shakeKey={shakeKey}
              error={errors.quantity}
            />
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex flex-row items-center gap-2 pt-2 border-t border-base-200 w-full sm:justify-end">
          <BtnCancel
            onClick={handleClose}
            disabled={isSubmitting}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
          <BtnSave
            onClick={handleSubmit}
            label="Transferir Stock"
            isLoading={isSubmitting}
            disabled={isLoadingBranches || destinationOptions.length === 0}
            responsive={true}
            className="flex-1 sm:flex-none sm:w-auto min-w-0"
          />
        </div>
      </div>
    </ComerziaModal>
  );
};
