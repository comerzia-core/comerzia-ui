export interface ScannerCameraCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
  focusMode?: string[];
  zoom?: { min: number; max: number; step?: number };
}

export interface ScannerCameraSettings extends MediaTrackSettings {
  torch?: boolean;
}

interface OpticalConstraints extends MediaTrackConstraintSet {
  torch?: boolean;
  focusMode?: string;
  zoom?: number;
}

export function isRearCamera(label: string): boolean {
  return /back|rear|environment|trasera|posterior/i.test(label);
}

function isFrontCamera(label: string): boolean {
  return /front|selfie|\buser\b|delantera|frontal/i.test(label);
}

function isAuxiliaryCamera(label: string): boolean {
  // Una principal puede llamarse «wide»; solo excluir indicaciones explícitas de lentes auxiliares.
  return /ultra|telephoto|\btele\b|macro|depth|profundidad|0\.[3-9]\s*x/i.test(label);
}

function isNamedPrimaryCamera(label: string): boolean {
  return /\bmain\b|principal|primary|\b1(?:\.0)?\s*x\b/i.test(label);
}

export function readCameraSettings(track: MediaStreamTrack): ScannerCameraSettings {
  try { return track.getSettings(); }
  catch { return {}; }
}

function readCameraCapabilities(track: MediaStreamTrack): ScannerCameraCapabilities {
  try { return track.getCapabilities?.() ?? {}; }
  catch { return {}; }
}

export function confirmedRearDevice(track: MediaStreamTrack, devices: MediaDeviceInfo[]): string | undefined {
  const settings = readCameraSettings(track);
  const label = devices.find(device => device.deviceId === settings.deviceId)?.label || track.label || "";
  if (settings.facingMode === "user" || isFrontCamera(label) || isAuxiliaryCamera(label)) return;
  if (settings.facingMode === "environment" || isRearCamera(label)) return settings.deviceId;
}

export function primaryCameraCorrection(track: MediaStreamTrack, devices: MediaDeviceInfo[]): string | undefined {
  const settings = readCameraSettings(track);
  const current = devices.find(device => device.deviceId === settings.deviceId);
  const label = current?.label || track.label || "";
  const rear = devices.filter(device => isRearCamera(device.label) && !isFrontCamera(device.label) && !isAuxiliaryCamera(device.label));
  const primary = rear.find(device => isNamedPrimaryCamera(device.label));
  // Solo una corrección con evidencia; la falta de flash nunca identifica por sí sola una cámara equivocada.
  const clearlyWrong = settings.facingMode === "user" || isFrontCamera(label) || isAuxiliaryCamera(label);
  const candidate = primary || (clearlyWrong && rear.length === 1 ? rear[0] : undefined);
  if (candidate && candidate.deviceId !== settings.deviceId && (clearlyWrong || !isNamedPrimaryCamera(label))) return candidate.deviceId;
}

export function curateScannerCameras(devices: MediaDeviceInfo[], rearDeviceId?: string): MediaDeviceInfo[] {
  const rear = devices.filter(device => isRearCamera(device.label) && !isFrontCamera(device.label) && !isAuxiliaryCamera(device.label));
  const primary = devices.find(device => device.deviceId === rearDeviceId)
    || rear.find(device => isNamedPrimaryCamera(device.label)) || rear[0];
  const front = devices.find(device => isFrontCamera(device.label) && !isAuxiliaryCamera(device.label));
  // En equipos con webcams sin orientación conocida, conservar el cambio manual disponible.
  if (primary && !front) {
    const unclassified = devices.filter(device => device.deviceId !== primary.deviceId
      && !isRearCamera(device.label) && !isFrontCamera(device.label) && !isAuxiliaryCamera(device.label));
    return [primary, ...unclassified];
  }
  const selected = [primary, front].filter((device): device is MediaDeviceInfo => !!device);
  return selected.length ? [...new Map(selected.map(device => [device.deviceId, device])).values()] : devices.filter(device => !isAuxiliaryCamera(device.label));
}

export function scannerVideoConstraints(deviceId?: string, relaxed = false): MediaTrackConstraints {
  return {
    width: relaxed ? { ideal: 1280 } : { ideal: 1280, min: 640 },
    height: relaxed ? { ideal: 720 } : { ideal: 720, min: 480 },
    ...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } }),
  };
}

export function cameraRequestFallback(error: unknown, deviceId?: string): MediaTrackConstraints | undefined {
  if (!(error instanceof Error)) return;
  const constraint = "constraint" in error ? error.constraint : undefined;
  const unavailableDevice = !!deviceId && (error.name === "NotFoundError" || constraint === "deviceId");
  if (unavailableDevice) return scannerVideoConstraints(undefined, true);
  if (error.name === "OverconstrainedError") return scannerVideoConstraints(deviceId, true);
}

function adjustedConstraints(track: MediaStreamTrack, adjustments: OpticalConstraints): MediaTrackConstraints {
  const { advanced = [], ...base } = track.getConstraints();
  const keys = Object.keys(adjustments);
  const remaining = advanced.map(group => Object.fromEntries(Object.entries(group).filter(([key]) => !keys.includes(key))))
    .filter(group => Object.keys(group).length > 0);
  const retainedBase = Object.fromEntries(Object.entries(base).filter(([key]) => !keys.includes(key)));
  // Cada ajuste es opcional e independiente; cambiar la luz conserva resolución, enfoque y zoom.
  const groups = [...Object.entries(adjustments).map(([key, value]) => ({ [key]: value })), ...remaining];
  groups.sort((first, second) => Number("torch" in second) - Number("torch" in first));
  return { ...retainedBase, advanced: groups };
}

export async function setScannerTorch(track: MediaStreamTrack, enabled: boolean): Promise<boolean | undefined> {
  await track.applyConstraints(adjustedConstraints(track, { torch: enabled }));
  return readCameraSettings(track).torch;
}

export async function initializeScannerOptics(track: MediaStreamTrack): Promise<{ available: boolean; enabled: boolean | undefined }> {
  const capabilities = readCameraCapabilities(track);
  const available = capabilities.torch === true || (capabilities.torch === undefined && typeof readCameraSettings(track).torch === "boolean");
  const optical: OpticalConstraints = {};
  if (available) optical.torch = true;
  if (capabilities.focusMode?.includes("continuous")) optical.focusMode = "continuous";
  // Conservar el ajuste óptico que ya utilizan los dispositivos que leen correctamente.
  if (capabilities.zoom && capabilities.zoom.min <= 1.25 && capabilities.zoom.max >= 1.25) optical.zoom = 1.25;
  let adjustmentsFailed = false;
  if (Object.keys(optical).length && track.readyState !== "ended") {
    try { await track.applyConstraints(adjustedConstraints(track, optical)); }
    catch (error) { adjustmentsFailed = true; console.debug("Camera optical adjustments unavailable:", error); }
  }
  // Algunos controladores aceptan restricciones sin aplicarlas: verificar antes de dar la luz por encendida.
  if (available && readCameraSettings(track).torch !== true && track.readyState !== "ended") {
    try { await setScannerTorch(track, true); }
    catch (error) { console.debug("Camera initial torch request unavailable:", error); }
  }
  if (adjustmentsFailed && optical.focusMode && track.readyState !== "ended") {
    try { await track.applyConstraints(adjustedConstraints(track, { focusMode: optical.focusMode })); }
    catch (error) { console.debug("Camera continuous focus unavailable:", error); }
  }
  return { available, enabled: readCameraSettings(track).torch };
}
