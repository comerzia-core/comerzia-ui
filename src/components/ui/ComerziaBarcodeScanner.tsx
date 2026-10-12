import { type BarcodeFormat } from "@zxing/library";
import { CameraOff, Loader2 } from "lucide-react";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { BtnScannerCamera, BtnFlashlight } from "./CrudButtons";

interface Props {
  onScanSuccess: (code: string) => void;
  onScanError?: (error: Error) => void;
  formats?: BarcodeFormat[];
}

export const ComerziaBarcodeScanner = (props: Props) => {
  const { videoRef, errorMessage, isLoading, hasTorch, isTorchOn, isCameraSwitched, toggleTorch, toggleCamera,
    canSwitchCamera } = useBarcodeScanner(props);
  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-base-200 rounded-xl text-center">
        <CameraOff size={40} className="text-error mb-2" />
        <p className="font-bold text-base-content">Acceso a cámara no disponible</p>
        <p className="text-xs text-base-content/60 mt-1 max-w-xs">{errorMessage}</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <div className="relative w-full aspect-square max-h-[350px] bg-black rounded-2xl overflow-hidden shadow-2xl border-2 border-base-300">
        {isLoading && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-base-300 text-base-content/70 gap-2">
            <Loader2 className="animate-spin text-primary" size={34} />
            <span className="text-xs font-bold">Iniciando cámara...</span>
          </div>
        )}
        <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-4/5 h-2/5 border-2 border-primary/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
            <div className="absolute inset-x-0 top-1/2 h-px bg-error/70" />
          </div>
        </div>
        {!isLoading && (hasTorch || canSwitchCamera) && (
          <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-auto">
            {hasTorch ? <BtnFlashlight enabled={isTorchOn} overlay onClick={toggleTorch} /> : <div />}
            {canSwitchCamera && <BtnScannerCamera switched={isCameraSwitched} onClick={toggleCamera} />}
          </div>
        )}
      </div>
      <p className="text-xs text-base-content/70 text-center">
        Coloca las barras en horizontal y deja visibles ambos márgenes blancos. Aleja un poco la etiqueta si no enfoca.
      </p>
    </div>
  );
};
