// src/components/ui/ComerziaBarcodeScanner.tsx
import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { CameraOff, Loader2, RefreshCw, Flashlight, FlashlightOff } from "lucide-react";

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
    BarcodeFormat.UPC_A,
    BarcodeFormat.UPC_E,
    BarcodeFormat.ITF,
    BarcodeFormat.CODABAR,
  ],
}: Props) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const hasScannedRef = useRef<boolean>(false);
  const onScanSuccessRef = useRef(onScanSuccess);
  const onScanErrorRef = useRef(onScanError);

  const defaultDeviceIdRef = useRef<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeDeviceId, setActiveDeviceId] = useState<string>("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [hasTorch, setHasTorch] = useState<boolean>(false);
  const [isTorchOn, setIsTorchOn] = useState<boolean>(false);
  const [isCameraSwitched, setIsCameraSwitched] = useState<boolean>(false);

  // Mantener actualizadas las referencias de callbacks sin reiniciar el efecto
  useEffect(() => {
    onScanSuccessRef.current = onScanSuccess;
  }, [onScanSuccess]);

  useEffect(() => {
    onScanErrorRef.current = onScanError;
  }, [onScanError]);

  const hints = useRef(new Map());
  hints.current.set(DecodeHintType.POSSIBLE_FORMATS, formats);

  // Función utilitaria para liberar completamente cualquier stream y control activo
  const stopAllMedia = () => {
    if (controlsRef.current) {
      try {
        controlsRef.current.stop();
      } catch (_) {}
      controlsRef.current = null;
    }

    if (streamRef.current) {
      try {
        // Apagar linterna si estaba encendida antes de liberar tracks
        const track = streamRef.current.getVideoTracks()[0];
        if (track) {
          try {
            track.applyConstraints({ advanced: [{ torch: false }] as any });
          } catch (_) {}
        }
        streamRef.current.getTracks().forEach((track) => {
          track.stop();
        });
      } catch (_) {}
      streamRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        videoRef.current.srcObject = null;
      } catch (_) {}
    }

    setIsTorchOn(false);
    setHasTorch(false);
  };

  useEffect(() => {
    let isMounted = true;
    hasScannedRef.current = false;
    setIsTorchOn(false);
    setHasTorch(false);

    const startScanning = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        // 1. Validar soporte de API WebRTC en el navegador
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "El navegador no soporta acceso a la cámara o el entorno no es seguro (requiere HTTPS o localhost)."
          );
        }

        // 2. Enumerar dispositivos de video
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!isMounted) return;

        setVideoDevices(devices);

        // 3. Seleccionar la mejor cámara (trasera si existe, o la primera disponible)
        let chosenDeviceId = activeDeviceId;
        if (!chosenDeviceId && devices.length > 0) {
          const backCam = devices.find((d) =>
            d.label.toLowerCase().match(/back|rear|environment|trasera|posterior|externa/)
          );
          chosenDeviceId = backCam ? backCam.deviceId : devices[0].deviceId;
          defaultDeviceIdRef.current = chosenDeviceId;
        }

        if (!videoRef.current || !isMounted) return;

        // 4. Configurar lector ZXing optimizado para códigos 1D
        const codeReader = new BrowserMultiFormatReader(hints.current, {
          delayBetweenScanAttempts: 100, // Escaneo rápido de alta frecuencia
        });

        // 5. Iniciar decodificación continua
        const activeControls = await codeReader.decodeFromVideoDevice(
          chosenDeviceId || undefined,
          videoRef.current,
          (result, _error, c) => {
            if (!isMounted || hasScannedRef.current) return;
            controlsRef.current = c;

            if (result) {
              const rawText = result.getText().trim();
              const sanitized = rawText.replace(/[^\w\-./$ %*+]/gi, "");

              if (sanitized) {
                // Marcar como escaneado y APAGAR la cámara inmediatamente
                hasScannedRef.current = true;
                stopAllMedia();
                onScanSuccessRef.current?.(sanitized);
              }
            }
          }
        );

        // Si se desmontó mientras se esperaba la inicialización de la cámara, apagarla inmediatamente
        if (!isMounted || hasScannedRef.current) {
          try {
            activeControls.stop();
          } catch (_) {}
          stopAllMedia();
          return;
        }

        controlsRef.current = activeControls;

        // Capturar referencia al stream del video para limpieza garantizada y configuración óptica avanzada
        if (videoRef.current && videoRef.current.srcObject) {
          const stream = videoRef.current.srcObject as MediaStream;
          streamRef.current = stream;

          const videoTrack = stream.getVideoTracks()[0];
          if (videoTrack) {
            const capabilities = (videoTrack.getCapabilities ? videoTrack.getCapabilities() : {}) as any;

            // Verificar si el dispositivo cuenta con linterna trasera y encenderla por defecto
            if (capabilities && 'torch' in capabilities) {
              setHasTorch(true);
              try {
                await videoTrack.applyConstraints({
                  advanced: [{ torch: true }] as any
                });
                setIsTorchOn(true);
              } catch (tErr) {
                console.debug('Default torch activation not supported by driver:', tErr);
              }
            }

            // Aplicar autoenfoque continuo dinámico para evitar desenfoques en distancias cortas (Macro Focus)
            try {
              const advancedConstraints: any[] = [];
              if (capabilities?.focusMode && Array.isArray(capabilities.focusMode) && capabilities.focusMode.includes('continuous')) {
                advancedConstraints.push({ focusMode: 'continuous' });
              }
              if (advancedConstraints.length > 0) {
                await videoTrack.applyConstraints({ advanced: advancedConstraints });
              }
            } catch (focusErr) {
              console.debug('Autofocus constraint not supported by driver:', focusErr);
            }
          }
        }

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
        if (onScanErrorRef.current && err instanceof Error) {
          onScanErrorRef.current(err);
        }
      }
    };

    startScanning();

    // Cleanup estricto e infalible al desmontar o cambiar lente
    return () => {
      isMounted = false;
      stopAllMedia();
    };
  }, [activeDeviceId]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentId = activeDeviceId || defaultDeviceIdRef.current || videoDevices[0].deviceId;
    const currentIndex = videoDevices.findIndex((d) => d.deviceId === currentId);
    const nextIndex = (currentIndex >= 0 ? currentIndex + 1 : 1) % videoDevices.length;
    const nextDevice = videoDevices[nextIndex];
    setActiveDeviceId(nextDevice.deviceId);
    setIsCameraSwitched(nextDevice.deviceId !== defaultDeviceIdRef.current);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !hasTorch) return;

    const nextState = !isTorchOn;
    try {
      await track.applyConstraints({
        advanced: [{ torch: nextState }] as any,
      });
      setIsTorchOn(nextState);
    } catch (err) {
      console.error("Error al activar/desactivar la linterna:", err);
    }
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
    <div className="relative w-full aspect-square max-h-[350px] bg-black rounded-2xl overflow-hidden shadow-2xl flex items-center justify-center border-2 border-base-300">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-base-300 text-base-content/70 gap-2">
          <Loader2 className="animate-spin text-primary" size={34} />
          <span className="text-xs font-bold tracking-wide">Iniciando sensor óptico...</span>
        </div>
      )}

      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        autoPlay
        playsInline
        muted
      />

      {/* Mira de enfoque estilo Comerzia para Códigos 1D */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-4/5 h-2/5 border-2 border-primary/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
          <div className="absolute inset-x-0 top-1/2 h-0.5 bg-error/90 animate-pulse" />
        </div>
      </div>

      {/* Barra de Controles Notorios y Táctiles (Linterna y Cambio de Lente) */}
      {!isLoading && (hasTorch || videoDevices.length > 1) && (
        <div className="absolute bottom-3 inset-x-3 z-30 flex items-center justify-between gap-2 pointer-events-auto">
          {/* Botón Linterna */}
          {hasTorch ? (
            <button
              type="button"
              onClick={toggleTorch}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 backdrop-blur-md border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 select-none ${
                isTorchOn
                  ? "bg-warning text-black font-black shadow-warning/20"
                  : "bg-black/75 text-white hover:bg-black/90"
              }`}
              title={isTorchOn ? "Apagar Linterna" : "Encender Linterna"}
            >
              {isTorchOn ? (
                <>
                  <FlashlightOff size={16} className="shrink-0 text-black" />
                  <span>Flash: ON</span>
                </>
              ) : (
                <>
                  <Flashlight size={16} className="text-warning shrink-0" />
                  <span>Flash: OFF</span>
                </>
              )}
            </button>
          ) : (
            <div />
          )}

          {/* Botón Cambiar Lente */}
          {videoDevices.length > 1 && (
            <button
              type="button"
              onClick={toggleCamera}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 backdrop-blur-md border-none outline-none focus:outline-none focus-visible:outline-none ring-0 focus:ring-0 select-none ${
                isCameraSwitched
                  ? "bg-warning text-black font-black shadow-warning/20"
                  : "bg-black/75 text-white hover:bg-black/90"
              }`}
              title="Alternar entre cámara frontal y trasera"
            >
              <RefreshCw
                size={15}
                className={`shrink-0 transition-transform duration-300 ${
                  isCameraSwitched ? "text-black rotate-180" : "text-warning"
                }`}
              />
              <span>Girar Cámara</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};
