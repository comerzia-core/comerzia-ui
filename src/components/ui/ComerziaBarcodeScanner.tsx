// src/components/ui/ComerziaBarcodeScanner.tsx
import { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { CameraOff, Loader2, RefreshCw } from "lucide-react";

interface Props {
  onScanSuccess: (code: string) => void;
  onScanError?: (error: Error) => void;
  formats?: BarcodeFormat[];
}

export const ComerziaBarcodeScanner = ({
  onScanSuccess,
  onScanError,
  formats = [
    BarcodeFormat.EAN_13,
    BarcodeFormat.EAN_8,
    BarcodeFormat.CODE_128,
    BarcodeFormat.CODE_39,
    BarcodeFormat.QR_CODE,
  ],
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  const hints = useRef(new Map());
  hints.current.set(DecodeHintType.POSSIBLE_FORMATS, formats);

  const initCameras = useCallback(async () => {
    try {
      setIsLoading(true);
      const devices = await BrowserMultiFormatReader.listVideoInputDevices();
      setVideoDevices(devices);

      if (devices.length > 0) {
        // Priorizar la cámara trasera en smartphones
        const backCamera = devices.find((d) =>
          d.label.toLowerCase().match(/back|rear|environment|trasera/)
        );
        setActiveDeviceId(backCamera ? backCamera.deviceId : devices[0].deviceId);
        setHasPermission(true);
      } else {
        setHasPermission(false);
      }
    } catch (err) {
      setHasPermission(false);
      if (onScanError && err instanceof Error) onScanError(err);
    } finally {
      setIsLoading(false);
    }
  }, [onScanError]);

  useEffect(() => {
    initCameras();
  }, [initCameras]);

  useEffect(() => {
    if (!activeDeviceId || !videoRef.current) return;

    const codeReader = new BrowserMultiFormatReader(hints.current, {
      delayBetweenScanAttempts: 120, // Previene sobrecalentamiento y ahorro de batería
    });

    let isMounted = true;

    codeReader
      .decodeFromVideoDevice(
        activeDeviceId,
        videoRef.current,
        (result, _error, controls) => {
          if (!isMounted) return;
          controlsRef.current = controls;

          if (result) {
            const rawText = result.getText().trim();
            // Sanitización estricta de entrada antes de propagar
            const sanitized = rawText.replace(/[^\w\-./$ %*+]/gi, "");
            onScanSuccess(sanitized);
          }
        }
      )
      .catch((err) => {
        if (isMounted) {
          setHasPermission(false);
          if (onScanError && err instanceof Error) onScanError(err);
        }
      });

    // Cleanup estricto para apagar la cámara y liberar tracks de memoria
    return () => {
      isMounted = false;
      if (controlsRef.current) {
        controlsRef.current.stop();
        controlsRef.current = null;
      }
    };
  }, [activeDeviceId, onScanSuccess, onScanError]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setActiveDeviceId(videoDevices[nextIndex].deviceId);
  };

  if (hasPermission === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-base-200 rounded-xl text-center">
        <CameraOff size={40} className="text-error mb-2" />
        <p className="font-bold text-base-content">Acceso a cámara denegado o no disponible</p>
        <p className="text-xs text-base-content/60 mt-1">
          Verifique los permisos en el navegador y compruebe que la conexión sea HTTPS segura o localhost.
        </p>
      </div>
    );
  }

  return (
    <div className="relative w-full aspect-square max-h-[340px] bg-black rounded-xl overflow-hidden shadow-inner flex items-center justify-center">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-base-300 text-base-content/60 gap-2">
          <Loader2 className="animate-spin text-primary" size={32} />
          <span className="text-xs font-semibold">Iniciando sensor óptico...</span>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Mira de enfoque estilo Comerzia */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-3/4 h-1/2 border-2 border-primary/80 rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.35)]">
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-error/70 animate-pulse" />
        </div>
      </div>

      {videoDevices.length > 1 && (
        <button
          type="button"
          onClick={toggleCamera}
          className="btn btn-circle btn-sm btn-neutral absolute bottom-3 right-3 z-30 opacity-80 hover:opacity-100"
          title="Cambiar Lente"
        >
          <RefreshCw size={16} />
        </button>
      )}
    </div>
  );
};
