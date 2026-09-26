// src/components/ui/ProductFormBarcodeField.tsx
import { useState } from "react";
import { ComerziaInput } from "./ComerziaInput";
import { BtnScan } from "./CrudButtons";
import { BarcodeScannerModal } from "./BarcodeScannerModal";

interface Props {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
  error?: string;
  shakeKey?: number;
}

export const ProductFormBarcodeField = ({
  value,
  onChange,
  label = "Código de Barras",
  placeholder = "7771234567890",
  isRequired = false,
  disabled = false,
  error,
  shakeKey,
}: Props) => {
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  return (
    <div className="w-full min-w-0">
      <div className="flex items-end gap-1.5 w-full min-w-0">
        <div className="flex-1 min-w-0">
          <ComerziaInput
            label={label}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            isRequired={isRequired}
            disabled={disabled}
            error={error}
            shakeKey={shakeKey}
          />
        </div>
        {!disabled && (
          <BtnScan
            onClick={() => setIsScannerOpen(true)}
            className="btn-sm mb-0.5 h-[38px] min-h-0 shrink-0"
          />
        )}
      </div>

      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScan={(detectedCode) => onChange(detectedCode)}
      />
    </div>
  );
};
