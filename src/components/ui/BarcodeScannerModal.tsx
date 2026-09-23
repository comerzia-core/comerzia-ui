// src/components/ui/BarcodeScannerModal.tsx
import { ComerziaModal } from "./ComerziaModal";
import { ComerziaBarcodeScanner } from "./ComerziaBarcodeScanner";
import { BtnCancel } from "./CrudButtons";
import { ScanBarcode } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  title?: string;
}

export const BarcodeScannerModal = ({
  isOpen,
  onClose,
  onScan,
  title = "Escanear Código de Barras",
}: Props) => {
  const handleSuccess = (code: string) => {
    onScan(code);
    onClose();
  };

  return (
    <ComerziaModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <ScanBarcode size={20} className="text-primary" />
          <span>{title}</span>
        </div>
      }
      size="sm"
    >
      <div className="flex flex-col gap-4">
        {isOpen && <ComerziaBarcodeScanner onScanSuccess={handleSuccess} />}
        <div className="flex justify-end pt-2">
          <BtnCancel label="Cerrar" onClick={onClose} responsive={false} />
        </div>
      </div>
    </ComerziaModal>
  );
};
