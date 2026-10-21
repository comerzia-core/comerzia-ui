import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cameraRequestFallback, confirmedRearDevice, curateScannerCameras, initializeScannerOptics,
  primaryCameraCorrection, scannerVideoConstraints, setScannerTorch } from '../src/utils/scannerCamera.ts';

const device = (deviceId, label) => ({ deviceId, label, kind: 'videoinput' });
const cameras = [device('front', 'Front camera'), device('ultra', 'Back ultra wide camera'), device('main', 'Back main wide camera')];
const camera = (id, facingMode) => ({ label: '', getSettings: () => ({ deviceId: id, facingMode }) });

test('first acquisition requests a rear camera without trusting enumeration order', () => {
  const constraints = scannerVideoConstraints();
  assert.deepEqual(constraints.facingMode, { ideal: 'environment' });
  assert.equal(constraints.deviceId, undefined);
  assert.deepEqual(scannerVideoConstraints('confirmed-main').deviceId, { exact: 'confirmed-main' });
});

test('a normal wide main lens is retained and auxiliary lenses are excluded from manual rotation', () => {
  assert.equal(primaryCameraCorrection(camera('main', 'environment'), cameras), undefined);
  assert.deepEqual(curateScannerCameras(cameras, 'main').map(value => value.deviceId), ['main', 'front']);
  assert.equal(primaryCameraCorrection(camera('ultra', 'environment'), cameras), 'main');
  assert.equal(primaryCameraCorrection(camera('front', 'user'), cameras), 'main');
});

test('ambiguous lens names or missing torch do not cause speculative camera switching', () => {
  const devices = [device('back-two', 'Back camera 2'), device('back-one', 'Back camera 1')];
  assert.equal(primaryCameraCorrection(camera('back-two', 'environment'), devices), undefined);
  assert.equal(primaryCameraCorrection(camera('anonymous'), [device('anonymous', ''), device('other', '')]), undefined);
  assert.equal(confirmedRearDevice(camera('front', 'user'), cameras), undefined);
  assert.equal(confirmedRearDevice(camera('ultra', 'environment'), cameras), undefined);
  assert.equal(confirmedRearDevice(camera('main', 'environment'), cameras), 'main');
  assert.equal(confirmedRearDevice(camera('anonymous'), [device('anonymous', '')]), undefined);
});

test('unclassified desktop webcams remain available for manual switching', () => {
  const devices = [device('usb-one', 'USB Camera'), device('usb-two', 'Logitech Camera')];
  assert.deepEqual(curateScannerCameras(devices, 'usb-one').map(value => value.deviceId), ['usb-one', 'usb-two']);
});

test('stale devices and incompatible dimensions have a bounded fallback, permission and hardware errors do not', () => {
  assert.equal(cameraRequestFallback(new DOMException('No permission', 'NotAllowedError'), 'main'), undefined);
  assert.equal(cameraRequestFallback(new DOMException('Busy', 'NotReadableError'), 'main'), undefined);
  assert.deepEqual(cameraRequestFallback(new DOMException('Missing', 'NotFoundError'), 'old').facingMode, { ideal: 'environment' });
  const dimensions = Object.assign(new Error('Resolution'), { name: 'OverconstrainedError', constraint: 'width' });
  const relaxed = cameraRequestFallback(dimensions, 'main');
  assert.deepEqual(relaxed.deviceId, { exact: 'main' });
  assert.equal(relaxed.width.min, undefined);
});

function opticalTrack({ ignoredTorch = false, unknownTorch = false, rejectZoom = false, failFirstBundle = false, supportsTorch = true } = {}) {
  let constraints = scannerVideoConstraints('main');
  let settings = { deviceId: 'main', facingMode: 'environment', torch: false, focusMode: 'single-shot', zoom: 1 };
  const requests = [];
  return {
    readyState: 'live', requests,
    getCapabilities: () => ({ torch: supportsTorch, focusMode: ['continuous'], zoom: { min: 1, max: 4 } }),
    getSettings: () => { const value = { ...settings }; if (unknownTorch) delete value.torch; return value; },
    getConstraints: () => structuredClone(constraints),
    applyConstraints: async value => {
      requests.push(structuredClone(value));
      if (failFirstBundle && requests.length === 1) throw new DOMException('Combined request rejected', 'OverconstrainedError');
      constraints = structuredClone(value);
      settings = { ...settings, torch: false, focusMode: 'single-shot', zoom: 1 };
      for (const group of value.advanced ?? []) {
        if ((rejectZoom && 'zoom' in group) || (ignoredTorch && 'torch' in group)) continue;
        Object.assign(settings, group);
      }
    },
  };
}

test('an unavailable zoom cannot silently discard flashlight and autofocus', async () => {
  const track = opticalTrack({ rejectZoom: true });
  assert.deepEqual(await initializeScannerOptics(track), { available: true, enabled: true });
  assert.equal(track.getSettings().focusMode, 'continuous');
  assert.equal(track.getSettings().zoom, 1);
  assert.equal(track.requests.length, 1);
});

test('manual flashlight changes preserve resolution, autofocus and the existing 1.25 zoom', async () => {
  const track = opticalTrack();
  await initializeScannerOptics(track);
  assert.equal(await setScannerTorch(track, false), false);
  assert.equal(track.getSettings().focusMode, 'continuous');
  assert.equal(track.getSettings().zoom, 1.25);
  assert.deepEqual(track.getConstraints().width, scannerVideoConstraints('main').width);
  assert.equal(await setScannerTorch(track, true), true);
});

test('resolved but ignored torch requests remain off, and missing feedback remains unknown', async () => {
  const ignored = opticalTrack({ ignoredTorch: true });
  assert.deepEqual(await initializeScannerOptics(ignored), { available: true, enabled: false });
  assert.equal(ignored.requests.length, 2);
  const unknown = opticalTrack({ unknownTorch: true });
  assert.deepEqual(await initializeScannerOptics(unknown), { available: true, enabled: undefined });
});

test('driver failure falls back to torch and autofocus without losing the torch constraint', async () => {
  const track = opticalTrack({ failFirstBundle: true });
  assert.deepEqual(await initializeScannerOptics(track), { available: true, enabled: true });
  assert.equal(track.getSettings().focusMode, 'continuous');
  assert.equal(track.requests.length, 3);
});
