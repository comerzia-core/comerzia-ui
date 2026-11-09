import { useEffect, useRef, useState } from "react";
import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { type BarcodeFormat } from "@zxing/library";
import { createBarcodeHints, DEFAULT_BARCODE_FORMATS, isBarcodeReadMiss } from "../utils/barcodeScanning";
import { cameraRequestFallback, confirmedRearDevice, curateScannerCameras, initializeScannerOptics,
  primaryCameraCorrection, readCameraSettings, scannerVideoConstraints, setScannerTorch } from "../utils/scannerCamera";

interface ScannerOptions {
  onScanSuccess: (code: string) => void;
  onScanError?: (error: Error) => void;
  formats?: BarcodeFormat[];
}

interface DetectedBarcode {
  rawValue?: string;
  format?: string;
}

interface BarcodeDetectorInstance {
  detect(source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap): Promise<DetectedBarcode[]>;
}

interface BarcodeDetectorConstructor {
  new (options?: { formats: string[] }): BarcodeDetectorInstance;
  getSupportedFormats?(): Promise<string[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorConstructor;
  }
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

function createNativeBarcodeDetector(): BarcodeDetectorInstance | null {
  if (typeof window === "undefined" || !("BarcodeDetector" in window) || !window.BarcodeDetector) {
    return null;
  }
  try {
    return new window.BarcodeDetector({
      formats: [
        "qr_code",
        "ean_13",
        "ean_8",
        "code_128",
        "code_39",
        "upc_a",
        "upc_e",
        "itf",
        "codabar",
      ],
    });
  } catch (err) {
    console.debug("Native BarcodeDetector format fallback:", err);
    try {
      return new window.BarcodeDetector();
    } catch {
      return null;
    }
  }
}

let cachedCuratedDevices: MediaDeviceInfo[] = [];
let cachedPrimaryRearDeviceId: string | undefined;

export function useBarcodeScanner({ onScanSuccess, onScanError, formats = DEFAULT_BARCODE_FORMATS }: ScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initializationRef = useRef<Promise<void>>(Promise.resolve());
  const successRef = useRef(onScanSuccess);
  const errorRef = useRef(onScanError);
  const defaultDeviceIdRef = useRef("");
  const torchRequestedRef = useRef(true);
  const torchChangingRef = useRef(false);
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [automaticDeviceId, setAutomaticDeviceId] = useState("");
  const primaryCorrectionAttemptedRef = useRef(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>(() => cachedCuratedDevices);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasTorch, setHasTorch] = useState(false);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchStateKnown, setIsTorchStateKnown] = useState(false);
  const [isTorchChanging, setIsTorchChanging] = useState(false);
  const [isCameraSwitched, setIsCameraSwitched] = useState(false);
  const formatsKey = formats.join(",");

  useEffect(() => { successRef.current = onScanSuccess; }, [onScanSuccess]);
  useEffect(() => { errorRef.current = onScanError; }, [onScanError]);

  useEffect(() => {
    let disposed = false;
    let stream: MediaStream | null = null;
    let controls: IScannerControls | null = null;
    let nativeScanning = true;
    let nativeTimer: ReturnType<typeof setTimeout> | null = null;
    const video = videoRef.current;

    const stop = () => {
      disposed = true;
      nativeScanning = false;
      if (nativeTimer) {
        clearTimeout(nativeTimer);
        nativeTimer = null;
      }
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
      setIsTorchStateKnown(false);
      setIsTorchChanging(true);
      torchRequestedRef.current = true;
      torchChangingRef.current = true;
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("La cámara requiere un navegador compatible y HTTPS o localhost.");

        const requestedDeviceId = activeDeviceId || automaticDeviceId || cachedPrimaryRearDeviceId;
        try {
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: scannerVideoConstraints(requestedDeviceId) });
        } catch (error) {
          const fallback = cameraRequestFallback(error, requestedDeviceId);
          if (!fallback || disposed) throw error;
          if (!activeDeviceId) cachedPrimaryRearDeviceId = undefined;
          stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: fallback });
        }
        if (disposed) { stop(); return; }
        streamRef.current = stream;

        const track = stream.getVideoTracks()[0];
        if (!track) throw new DOMException("No video track is available.", "NotFoundError");
        const actualDeviceId = readCameraSettings(track).deviceId || "";
        if (!activeDeviceId && actualDeviceId) defaultDeviceIdRef.current = actualDeviceId;
        setIsCameraSwitched(!!actualDeviceId && actualDeviceId !== defaultDeviceIdRef.current);

        // Enumerar después del permiso y en segundo plano: no retrasar el video ni los lectores.
        void navigator.mediaDevices.enumerateDevices().then(devices => {
          if (disposed || streamRef.current !== stream) return;
          const videoInputs = devices.filter(device => device.kind === "videoinput");
          const correction = !activeDeviceId && !primaryCorrectionAttemptedRef.current
            ? primaryCameraCorrection(track, videoInputs) : undefined;
          if (correction) {
            // Una única corrección identificada, no una búsqueda entre todos los lentes.
            primaryCorrectionAttemptedRef.current = true;
            setAutomaticDeviceId(correction);
            return;
          }
          const confirmedRear = confirmedRearDevice(track, videoInputs);
          if (confirmedRear && (!activeDeviceId || activeDeviceId === defaultDeviceIdRef.current)) cachedPrimaryRearDeviceId = confirmedRear;
          const curated = curateScannerCameras(videoInputs, confirmedRear || defaultDeviceIdRef.current);
          cachedCuratedDevices = curated;
          setVideoDevices(curated);
        }).catch(() => {});

        video.srcObject = stream;
        try { await video.play(); }
        catch { /* El lector vuelve a comprobar la reproducción del video. */ }
        if (disposed) { stop(); return; }
        setIsLoading(false);
        // Un controlador que deje pendientes los ajustes ópticos no debe detener la lectura.
        void initializeScannerOptics(track).then(optical => {
          if (disposed || streamRef.current !== stream) return;
          setHasTorch(optical.available);
          setIsTorchStateKnown(typeof optical.enabled === "boolean");
          setIsTorchOn(optical.enabled === true);
          torchRequestedRef.current = optical.enabled ?? true;
        }).catch(error => {
          console.debug("Camera optical initialization unavailable:", error);
        }).finally(() => {
          if (disposed || streamRef.current !== stream) return;
          torchChangingRef.current = false;
          setIsTorchChanging(false);
        });

        // Motor nativo acelerado por hardware (Chromium / Android NPU) para QR y barras curvados
        const nativeDetector = createNativeBarcodeDetector();
        if (nativeDetector) {
          const pollNative = async () => {
            if (!nativeScanning || disposed || !video) return;
            if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && !video.paused) {
              try {
                const barcodes = await nativeDetector.detect(video);
                if (barcodes.length > 0 && barcodes[0].rawValue?.trim()) {
                  const code = barcodes[0].rawValue.trim();
                  nativeScanning = false;
                  stop();
                  successRef.current(code);
                  return;
                }
              } catch {
                // Cuadro transitorio no listo o sin código visible
              }
            }
            if (nativeScanning && !disposed) {
              nativeTimer = setTimeout(pollNative, 60);
            }
          };
          nativeTimer = setTimeout(pollNative, 60);
        }

        // Motor ZXing robusto con TRY_HARDER para respaldo universal y pruebas
        const enabledFormats = formatsKey.split(",").filter(Boolean).map(Number) as BarcodeFormat[];
        const reader = new BrowserMultiFormatReader(createBarcodeHints(enabledFormats), {
          delayBetweenScanAttempts: 80,
        });

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
            const code = result.getText().trim();
            stop();
            successRef.current(code);
          }
        });

        if (disposed) { stop(); return; }
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

    const devicesChanged = () => {
      cachedPrimaryRearDeviceId = undefined;
      cachedCuratedDevices = [];
      if (!streamRef.current || disposed) return;
      void navigator.mediaDevices.enumerateDevices().then(devices => {
        if (disposed) return;
        const curated = curateScannerCameras(devices.filter(device => device.kind === "videoinput"), defaultDeviceIdRef.current);
        cachedCuratedDevices = curated;
        setVideoDevices(curated);
      }).catch(() => {});
    };
    navigator.mediaDevices?.addEventListener?.("devicechange", devicesChanged);
    initializationRef.current = initializationRef.current.then(start);
    return () => {
      navigator.mediaDevices?.removeEventListener?.("devicechange", devicesChanged);
      stop();
    };
  }, [activeDeviceId, automaticDeviceId, formatsKey]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentTrack = streamRef.current?.getVideoTracks()[0];
    const currentId = (currentTrack && readCameraSettings(currentTrack).deviceId) || activeDeviceId || defaultDeviceIdRef.current;
    const index = videoDevices.findIndex(device => device.deviceId === currentId);
    const nextIndex = index >= 0 ? (index + 1) % videoDevices.length : 0;
    const nextDeviceId = videoDevices[nextIndex].deviceId;
    setActiveDeviceId(nextDeviceId);
    setIsCameraSwitched(nextDeviceId !== defaultDeviceIdRef.current);
  };

  const toggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !hasTorch || torchChangingRef.current) return;
    const next = !torchRequestedRef.current;
    torchChangingRef.current = true;
    setIsTorchChanging(true);
    try {
      const actual = await setScannerTorch(track, next);
      if (streamRef.current?.getVideoTracks()[0] === track) {
        torchRequestedRef.current = actual ?? next;
        setIsTorchStateKnown(typeof actual === "boolean");
        setIsTorchOn(actual === true);
      }
    } catch (error) { console.error("Camera torch change failed:", error); }
    finally {
      if (streamRef.current?.getVideoTracks()[0] === track) {
        torchChangingRef.current = false;
        setIsTorchChanging(false);
      }
    }
  };

  return {
    videoRef,
    errorMessage,
    isLoading,
    hasTorch,
    isTorchOn,
    isTorchStateKnown,
    isTorchChanging,
    isCameraSwitched,
    toggleTorch,
    toggleCamera,
    canSwitchCamera: videoDevices.length > 1,
  };
}

