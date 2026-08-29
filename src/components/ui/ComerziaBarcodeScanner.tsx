// src/components/ui/ComerziaBarcodeScanner.tsx
import { useEffect, useRef, useState } from "react";
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);

  const hints = useRef(new Map());
  hints.current.set(DecodeHintType.POSSIBLE_FORMATS, formats);

  useEffect(() => {
    let isMounted = true;
    let controls: IScannerControls | null = null;

    const startScanning = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // 1. Validar soporte de API WebRTC en el navegador
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("El navegador no soporta acceso a la cámara o el entorno no es seguro (requiere HTTPS o localhost).");
        }

        // 2. Solicitar permiso explícito al usuario.
        // Esto dispara inmediatamente la ventana emergente de permisos nativos del navegador.
        const probeStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } }
        });

        // Detener los tracks temporales del probe para liberar el sensor de video
        probeStream.getTracks().forEach((t) => t.stop());

        if (!isMounted) return;

        // 3. Enumerar dispositivos ahora que los permisos están concedidos y se tienen los labels reales
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!isMounted) return;

        setVideoDevices(devices);

        // 4. Seleccionar la mejor cámara (trasera si existe, o la primera disponible)
        let chosenDeviceId = activeDeviceId;
        if (!chosenDeviceId && devices.length > 0) {
          const backCam = devices.find((d) =>
            d.label.toLowerCase().match(/back|rear|environment|trasera|posterior|externa/)
          );
          chosenDeviceId = backCam ? backCam.deviceId : devices[0].deviceId;
          setActiveDeviceId(chosenDeviceId);
        }

        if (!videoRef.current) return;

        // 5. Configurar lector ZXing
        const codeReader = new BrowserMultiFormatReader(hints.current, {
          delayBetweenScanAttempts: 120, // Previene sobrecalentamiento y optimiza el consumo de batería
        });

        // 6. Iniciar decodificación continua
        const activeControls = await codeReader.decodeFromVideoDevice(
          chosenDeviceId || undefined,
          videoRef.current,
          (result, _error, c) => {
            if (!isMounted) return;
            controls = c;

            if (result) {
              const rawText = result.getText().trim();
              // Sanitización estricta de entrada antes de propagar
              const sanitized = rawText.replace(/[^\w\-./$ %*+]/gi, "");
              if (sanitized) {
                onScanSuccess(sanitized);
              }
            }
          }
        );

        controls = activeControls;
        controlsRef.current = activeControls;
        setIsLoading(false);
      } catch (err: any) {
        if (!isMounted) return;
        console.error("Error iniciando cámara:", err);
        setIsLoading(false);

        let msg = "No se pudo acceder a la cámara.";
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          msg = "Permiso de cámara denegado. Por favor, autoriza el acceso a la cámara en los ajustes del navegador.";
        } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
          msg = "No se encontró ningún sensor de cámara disponible en este dispositivo.";
        } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
          msg = "La cámara está ocupada por otra aplicación o pestaña del navegador.";
        } else if (err.message) {
          msg = err.message;
        }

        setErrorMessage(msg);
        if (onScanError && err instanceof Error) {
          onScanError(err);
        }
      }
    };

    startScanning();

    // Cleanup estricto para apagar la cámara y liberar tracks de memoria
    return () => {
      isMounted = false;
      if (controls) {
        try {
          controls.stop();
        } catch (_) {}
      }
      if (controlsRef.current) {
        try {
          controlsRef.current.stop();
        } catch (_) {}
        controlsRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream;
          stream.getTracks().forEach((t) => t.stop());
          videoRef.current.srcObject = null;
        } catch (_) {}
      }
    };
  }, [activeDeviceId, onScanSuccess, onScanError]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === activeDeviceId);
    const nextIndex = (currentIndex + 1) % videoDevices.length;
    setActiveDeviceId(videoDevices[nextIndex].deviceId);
  };

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-base-200 rounded-xl text-center">
        <CameraOff size={40} className="text-error mb-2" />
        <p className="font-bold text-base-content">Acceso a cámara no disponible</p>
        <p className="text-xs text-base-content/60 mt-1 max-w-xs">
          {errorMessage}
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
        autoPlay
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
