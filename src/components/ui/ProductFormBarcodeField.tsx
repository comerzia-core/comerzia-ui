// src/components/ui/ProductFormBarcodeField.tsx
import { useState } from "react";
import { ComerziaInput } from "./ComerziaInput";
import { ComerziaButton } from "./ComerziaButton";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { ScanLine } from "lucide-react";

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
    <div className="w-full">
      <div className="flex items-end gap-1.5">
        <div className="flex-1">
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
          <ComerziaButton
            type="button"
            variant="secondary"
            icon={<ScanLine size={18} />}
            label="Escanear"
            onClick={() => setIsScannerOpen(true)}
            className="btn-sm mb-0.5 h-[38px]"
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
