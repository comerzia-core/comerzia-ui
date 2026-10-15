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
  zoom?: { min: number; max: number; step?: number };
}

interface CameraConstraints extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
  zoom?: number;
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

// Clasificación de lentes para evitar cámaras gran angular, macro o de profundidad fijas
function isBackCameraLabel(label: string): boolean {
  return /back|rear|environment|trasera|posterior|externa/i.test(label);
}

function isFrontCameraLabel(label: string): boolean {
  return /front|selfie|user|delantera|frontal/i.test(label);
}

function isAuxiliaryCameraLabel(label: string): boolean {
  return /wide|ultra|tele|macro|depth|profundidad|0\.[3-9]x/i.test(label);
}

// Puntuación de cámara: prioriza la cámara trasera principal estándar 1x con autofoco
function scoreCamera(device: MediaDeviceInfo): number {
  const label = device.label || "";
  let score = 0;
  if (isBackCameraLabel(label)) score += 100;
  if (isFrontCameraLabel(label)) score -= 200;
  if (isAuxiliaryCameraLabel(label)) score -= 50;
  if (/main|principal|primary/i.test(label)) score += 40;
  if (/camera2?\s*0\b/i.test(label)) score += 20;
  return score;
}

// Curar dispositivos para evitar rotaciones caóticas por múltiples lentes auxiliares y selfies secundarias
function curateVideoDevices(devices: MediaDeviceInfo[]): MediaDeviceInfo[] {
  if (devices.length <= 1) return devices;

  const backDevices = devices.filter(d => isBackCameraLabel(d.label) || (!isFrontCameraLabel(d.label) && /camera2?\s*0/i.test(d.label)));
  const frontDevices = devices.filter(d => isFrontCameraLabel(d.label));

  backDevices.sort((a, b) => scoreCamera(b) - scoreCamera(a));
  frontDevices.sort((a, b) => (isAuxiliaryCameraLabel(a.label) ? 1 : 0) - (isAuxiliaryCameraLabel(b.label) ? 1 : 0));

  const curated: MediaDeviceInfo[] = [];
  if (backDevices.length > 0) {
    curated.push(backDevices[0]);
    // Permitir como máximo una trasera secundaria si no es macro o sensor de profundidad
    const secondaryBack = backDevices.slice(1).find(d => !/depth|profundidad|macro/i.test(d.label));
    if (secondaryBack) curated.push(secondaryBack);
  }
  if (frontDevices.length > 0) {
    curated.push(frontDevices[0]);
  }

  return curated.length > 0 ? curated : devices;
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

let cachedCuratedDevices: MediaDeviceInfo[] | null = null;

export function useBarcodeScanner({ onScanSuccess, onScanError, formats = DEFAULT_BARCODE_FORMATS }: ScannerOptions) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const initializationRef = useRef<Promise<void>>(Promise.resolve());
  const successRef = useRef(onScanSuccess);
  const errorRef = useRef(onScanError);
  const defaultDeviceIdRef = useRef("");
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>(() => cachedCuratedDevices || []);
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
      try {
        if (!navigator.mediaDevices?.getUserMedia)
          throw new Error("La cámara requiere un navegador compatible y HTTPS o localhost.");

        // Usar dispositivos previamente cacheados para evitar la latencia de hardware de enumerateDevices()
        let curated = cachedCuratedDevices || [];
        if (curated.length === 0) {
          try {
            const rawDevices = await BrowserMultiFormatReader.listVideoInputDevices();
            curated = curateVideoDevices(rawDevices);
            cachedCuratedDevices = curated;
          } catch { /* ignore */ }
        }
        if (disposed) return;
        setVideoDevices(curated);

        // Identificar la mejor cámara trasera candidata para evitar lentes auxiliares
        const bestBackCamera = curated.find(device => isBackCameraLabel(device.label)) || curated[0];
        const chosenDeviceId = activeDeviceId || bestBackCamera?.deviceId || curated[0]?.deviceId;

        if (!activeDeviceId && chosenDeviceId) {
          defaultDeviceIdRef.current = chosenDeviceId;
        }

        // Restricciones de video con resolución óptima de 720p para nitidez en códigos curvados
        const videoConstraints: MediaTrackConstraints = {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
        };

        if (chosenDeviceId) {
          videoConstraints.deviceId = { exact: chosenDeviceId };
        } else {
          videoConstraints.facingMode = { ideal: "environment" };
        }

        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: videoConstraints,
        });

        if (disposed) { stop(); return; }
        streamRef.current = stream;

        // Reproducir video y retirar spinner inmediatamente para un arranque fluido
        video.srcObject = stream;
        try {
          await video.play();
        } catch { /* ignorar fallo de reproducción transitorio que luego maneja el lector */ }
        if (!disposed) {
          setIsLoading(false);
        }

        // Actualizar dispositivos en segundo plano sin bloquear el arranque del video
        if (!cachedCuratedDevices || cachedCuratedDevices.some(d => !d.label)) {
          void navigator.mediaDevices.enumerateDevices().then(freshDevices => {
            if (disposed) return;
            const videoInputs = freshDevices.filter(d => d.kind === "videoinput");
            const refreshedCurated = curateVideoDevices(videoInputs);
            if (refreshedCurated.length > 0) {
              cachedCuratedDevices = refreshedCurated;
              setVideoDevices(refreshedCurated);
            }
          }).catch(() => {});
        }

        const track = stream.getVideoTracks()[0];
        if (track) {
          const actualDeviceId = track.getSettings().deviceId || chosenDeviceId || "";
          if (!activeDeviceId && actualDeviceId) {
            defaultDeviceIdRef.current = actualDeviceId;
          }

          const capabilities: CameraCapabilities = track.getCapabilities?.() ?? {};
          const hasLight = capabilities.torch === true;
          setHasTorch(hasLight);

          // Agrupar linterna, autofoco y zoom en una sola petición atómica para reducir bloqueos de IPC
          const optical: CameraConstraints = {};
          if (hasLight) {
            optical.torch = true;
          }
          if (capabilities.focusMode?.includes("continuous")) {
            optical.focusMode = "continuous";
          }
          if (capabilities.zoom && typeof capabilities.zoom === "object") {
            const { min = 1, max = 1 } = capabilities.zoom;
            if (min <= 1.25 && max >= 1.25) {
              optical.zoom = 1.25;
            }
          }

          if (Object.keys(optical).length > 0) {
            try {
              await track.applyConstraints({ advanced: [optical] });
              if (optical.torch && !disposed) setIsTorchOn(true);
            } catch (error) {
              console.debug("Atomic optical adjustments partially unavailable, applying fallbacks:", error);
              if (optical.torch) {
                try {
                  const fallbackTorch: CameraConstraints = { torch: true };
                  await track.applyConstraints({ advanced: [fallbackTorch] });
                  if (!disposed) setIsTorchOn(true);
                } catch { /* ignore */ }
              }
              if (optical.focusMode) {
                try {
                  const fallbackFocus: CameraConstraints = { focusMode: optical.focusMode };
                  await track.applyConstraints({ advanced: [fallbackFocus] });
                } catch { /* ignore */ }
              }
            }
          }
        }

        if (disposed) { stop(); return; }

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

    initializationRef.current = initializationRef.current.then(start);
    return stop;
  }, [activeDeviceId, formatsKey]);

  const toggleCamera = () => {
    if (videoDevices.length <= 1) return;
    const currentId = activeDeviceId || defaultDeviceIdRef.current;
    const index = videoDevices.findIndex(device => device.deviceId === currentId);
    const nextIndex = index >= 0 ? (index + 1) % videoDevices.length : 0;
    const nextDeviceId = videoDevices[nextIndex].deviceId;
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

  return {
    videoRef,
    errorMessage,
    isLoading,
    hasTorch,
    isTorchOn,
    isCameraSwitched,
    toggleTorch,
    toggleCamera,
    canSwitchCamera: videoDevices.length > 1,
  };
}

