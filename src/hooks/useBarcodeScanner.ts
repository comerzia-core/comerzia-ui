import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { type BarcodeFormat } from "@zxing/library";
import { createBarcodeHints, DEFAULT_BARCODE_FORMATS, isBarcodeReadMiss } from "../utils/barcodeScanning";

interface ScannerOptions {
  onScanSuccess: (code: string) => void;
  onScanError?: (error: Error) => void;
  formats?: BarcodeFormat[];
}

interface CameraCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
}

interface CameraConstraints extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
}

function cameraErrorMessage(error: Error): string {
  if (["NotAllowedError", "PermissionDeniedError"].includes(error.name))
    return "Permiso de cámara denegado. Autoriza el acceso en los ajustes del navegador.";
  if (["NotFoundError", "DevicesNotFoundError"].includes(error.name))
    return "No se encontró una cámara disponible en este dispositivo.";
  if (["NotReadableError", "TrackStartError"].includes(error.name))
    return "La cámara está ocupada por otra aplicación o pestaña.";
  return error.message || "No se pudo acceder a la cámara.";
}

export function useBarcodeScanner({ onScanSuccess, onScanError, formats = DEFAULT_BARCODE_FORMATS }: ScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initializationRef = useRef<Promise<void>>(Promise.resolve());
  const successRef = useRef(onScanSuccess);
  const errorRef = useRef(onScanError);
  const defaultDeviceIdRef = useRef("");
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);
  const formatsKey = formats.join(",");

  useEffect(() => { successRef.current = onScanSuccess; }, [onScanSuccess]);
  useEffect(() => { errorRef.current = onScanError; }, [onScanError]);

  useEffect(() => {
    let disposed = false;
    let stream: MediaStream | null = null;
    let controls: IScannerControls | null = null;
    const video = videoRef.current;

    const stop = () => {
      disposed = true;
      // Algunos lectores apagan la linterna de forma asíncrona después de detener el track.
      try {
        void Promise.resolve(controls?.stop()).catch(error => console.debug("Camera scanner cleanup failed:", error));
      } catch (error) { console.debug("Camera scanner cleanup failed:", error); }
      stream?.getTracks().forEach(track => track.stop());
      if (streamRef.current === stream) streamRef.current = null;
      if (video && video.srcObject === stream) video.srcObject = null;
    };

    const start = async () => {
      if (disposed || !video) return;
      setIsLoading(true);
      setErrorMessage(null);
      setHasTorch(false);
      setIsTorchOn(false);
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("La cámara requiere un navegador compatible y HTTPS o localhost.");
        // Conservar la selección de lente y las restricciones de la versión de producción.
        const devices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (disposed) return;
        setVideoDevices(devices);
        const backCamera = devices.find(device => /back|rear|environment|trasera|posterior|externa/i.test(device.label));
        const chosenDeviceId = activeDeviceId || backCamera?.deviceId || devices[0]?.deviceId;
        if (!activeDeviceId) defaultDeviceIdRef.current = chosenDeviceId || "";
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: chosenDeviceId ? { deviceId: { exact: chosenDeviceId } } : { facingMode: "environment" },
        });
        if (disposed) { stop(); return; }
        streamRef.current = stream;
        const track = stream.getVideoTracks()[0];
        if (track) {
          const deviceId = track.getSettings().deviceId || "";
          if (!activeDeviceId) defaultDeviceIdRef.current = deviceId;
          const capabilities: CameraCapabilities = track.getCapabilities?.() ?? {};
          setHasTorch(capabilities.torch === true);
          if (capabilities.torch === true) {
            try {
              const lighting: CameraConstraints = { torch: true };
              await track.applyConstraints({ advanced: [lighting] });
              if (!disposed) setIsTorchOn(true);
            } catch (error) { console.debug("Default camera torch activation is unavailable:", error); }
          }
          if (disposed) { stop(); return; }
          const optical: CameraConstraints = {};
          if (capabilities.focusMode?.includes("continuous")) optical.focusMode = "continuous";
          if (Object.keys(optical).length) {
            try { await track.applyConstraints({ advanced: [optical] }); }
            catch (error) { console.debug("Continuous camera focus is unavailable:", error); }
          }
        }
        if (disposed) { stop(); return; }
        const enabledFormats = formatsKey.split(",").filter(Boolean).map(Number) as BarcodeFormat[];
        const reader = new BrowserMultiFormatReader(createBarcodeHints(enabledFormats),
          { delayBetweenScanAttempts: 100 });

        controls = await reader.decodeFromStream(stream, video, (result, _error, activeControls) => {
          if (disposed) return;
          controls = activeControls;
          if (_error && !isBarcodeReadMiss(_error)) {
            stop();
            console.error("Camera barcode capture failed:", _error);
            setIsLoading(false);
            setErrorMessage("No se pudo procesar la imagen de la cámara. Cierra el escáner y vuelve a abrirlo.");
            errorRef.current?.(_error);
            return;
          }
          if (result && result.getText().trim()) {
            const code = result.getText();
            stop();
            successRef.current(code);
          }
        });
        if (disposed) { stop(); return; }
        setIsLoading(false);
      } catch (cause: unknown) {
        if (disposed) return;
        const error = cause instanceof Error ? cause : new Error("No se pudo iniciar la cámara.");
        stop();
        console.error("Camera initialization failed:", error);
        setIsLoading(false);
        setErrorMessage(cameraErrorMessage(error));
        errorRef.current?.(error);
      }
    };

    // Serializar inicializaciones evita que una lente pendiente vuelva a abrirse tras cambiarla o cerrar el modal.
    initializationRef.current = initializationRef.current.then(start);
    return stop;
  }, [activeDeviceId, formatsKey]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentId = activeDeviceId || defaultDeviceIdRef.current;
    const index = videoDevices.findIndex(device => device.deviceId === currentId);
    const nextDeviceId = videoDevices[(index + 1) % videoDevices.length].deviceId;
    setActiveDeviceId(nextDeviceId);
    setIsCameraSwitched(nextDeviceId !== defaultDeviceIdRef.current);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !hasTorch) return;
    const next = !isTorchOn;
    const optical: CameraConstraints = { torch: next };
    try {
      await track.applyConstraints({ advanced: [optical] });
      if (streamRef.current?.getVideoTracks()[0] === track) setIsTorchOn(next);
    } catch (error) { console.error("Camera torch change failed:", error); }
  };

  return { videoRef, errorMessage, isLoading, hasTorch, isTorchOn, isCameraSwitched, toggleTorch, toggleCamera,
    canSwitchCamera: videoDevices.length > 1 };
}
