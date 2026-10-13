import { useEffect, useRef, useState } from 'react';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { useAuthStore } from '../../../stores/useAuthStore';
import { hardwareService } from '../services/hardwareService';
import { getLabelError, labelService } from '../services/labelService';
import { HwPrintJobStatusCode, type HwDeviceResponse, type HwPrintJobResponse } from '../types/hardware';
import type { RollSize } from '../types/labels';
import { normalizeUtcString } from '../../../utils/date';

export const usePrinterRollCalibration = (deviceId: string, initialRollSizeId?: string) => {
  const profile = useAuthStore(state => state.userProfile);
  const { options, isLoading: isLoadingRolls, error: lookupError, reload: reloadRolls } = useLoadDictionaries(
    [DICTIONARIES.LABEL_ROLL_SIZE, DICTIONARIES.HW_PRINT_JOB_STATUS],
    { scope: `${profile?.id}:${profile?.companySettings?.id}` },
  );
  const [device, setDevice] = useState<HwDeviceResponse | null>(null);
  const [job, setJob] = useState<HwPrintJobResponse | null>(null);
  const [rollSizeId, setRollSizeId] = useState(initialRollSizeId || '');
  const [roll, setRoll] = useState<RollSize | null>(null);
  const [feedAligned, setFeedAligned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const submitLock = useRef(false);
  const mounted = useRef(true);
  const requestRevision = useRef(0);
  const rollOptions = options[DICTIONARIES.LABEL_ROLL_SIZE];
  const pending = [HwPrintJobStatusCode.PENDING, HwPrintJobStatusCode.SENT, HwPrintJobStatusCode.PRINTING]
    .some(status => status === Number(device?.calibrationStatus));
  const awaitingConfirmation = Boolean(device?.calibrationJobId && Number(device.calibrationStatus) === HwPrintJobStatusCode.COMPLETED && !device.rollVerifiedAt);
  const selectedRollId = pending && device?.loadedRollSizeId ? device.loadedRollSizeId
    : rollOptions.some(option => String(option.value) === rollSizeId) ? rollSizeId
    : rollOptions.some(option => String(option.value) === device?.loadedRollSizeId) ? device!.loadedRollSizeId!
    : String(rollOptions[0]?.value || '');
  const canConfirm = awaitingConfirmation && selectedRollId === device?.loadedRollSizeId;
  const printerReady = Boolean(device?.calibrationSupported && device.reachable && device.ready && device.lastCheckedAt
    && Date.parse(normalizeUtcString(device.lastCheckedAt)) >= Date.now() - 90000);

  const refresh = async () => {
    const revision = ++requestRevision.current;
    const next = await hardwareService.getDeviceById(deviceId);
    const nextJob = next.calibrationJobId ? await hardwareService.getPrintJobById(next.calibrationJobId) : null;
    if (mounted.current && revision === requestRevision.current) { setDevice(next); setJob(nextJob); }
    return next;
  };

  useEffect(() => {
    mounted.current = true;
    let stopped = false;
    const load = async () => {
      const revision = ++requestRevision.current;
      try {
        const next = await hardwareService.getDeviceById(deviceId);
        const nextJob = next.calibrationJobId ? await hardwareService.getPrintJobById(next.calibrationJobId) : null;
        if (!stopped && revision === requestRevision.current) { setDevice(next); setJob(nextJob); }
      } catch (error: unknown) { if (!stopped) setError(getLabelError(error, 'No se pudo consultar la calibración.')); }
    };
    void load();
    const timer = window.setInterval(() => { void load(); }, 2000);
    return () => { stopped = true; mounted.current = false; window.clearInterval(timer); };
  }, [deviceId]);

  useEffect(() => { setFeedAligned(false); }, [device?.calibrationJobId, selectedRollId]);

  useEffect(() => {
    if (!selectedRollId) return;
    const controller = new AbortController();
    setRoll(null);
    labelService.getRoll(selectedRollId, controller.signal)
      .then(next => { if (!controller.signal.aborted) setRoll(next); })
      .catch((error: unknown) => { if (!controller.signal.aborted) setError(getLabelError(error, 'No se pudieron cargar las medidas del rollo.')); });
    return () => controller.abort();
  }, [selectedRollId]);

  const calibrate = async () => {
    if (submitLock.current) return null;
    if (!selectedRollId || !roll || !printerReady || pending || roll.gapMm === 0) {
      setShakeKey(value => value + 1); setError('Seleccione un rollo con GAP entre filas y una impresora disponible.'); return null;
    }
    submitLock.current = true; setIsSubmitting(true); setError(''); setFeedAligned(false);
    try {
      const nextJob = await hardwareService.calibrateRoll(deviceId, selectedRollId);
      if (mounted.current) setJob(nextJob);
      return await refresh();
    } catch (error: unknown) { if (mounted.current) setError(getLabelError(error, 'No se pudo solicitar la calibración.')); return null; }
    finally { submitLock.current = false; if (mounted.current) setIsSubmitting(false); }
  };
  const confirm = async () => {
    if (submitLock.current || !device?.calibrationJobId || !canConfirm || !feedAligned) return null;
    submitLock.current = true; setIsSubmitting(true); setError('');
    try {
      const next = await hardwareService.confirmRoll(deviceId, device.calibrationJobId);
      requestRevision.current++;
      if (mounted.current) setDevice(next);
      return next;
    } catch (error: unknown) { if (mounted.current) setError(getLabelError(error, 'No se pudo confirmar el avance.')); return null; }
    finally { submitLock.current = false; if (mounted.current) setIsSubmitting(false); }
  };
  const cancel = async () => {
    if (submitLock.current || !device?.calibrationJobId) return;
    submitLock.current = true; setIsSubmitting(true); setError('');
    try { await hardwareService.cancelPrintJob(device.calibrationJobId); await refresh(); }
    catch (error: unknown) { if (mounted.current) setError(getLabelError(error, 'No se pudo cancelar la calibración.')); }
    finally { submitLock.current = false; if (mounted.current) setIsSubmitting(false); }
  };
  return { device, job, roll, rollOptions, rollSizeId: selectedRollId, setRollSizeId, feedAligned, setFeedAligned,
    isLoadingRolls, isSubmitting, pending, canConfirm, printerReady, shakeKey, calibrate, confirm, cancel,
    jobStatusLabel: options[DICTIONARIES.HW_PRINT_JOB_STATUS].find(option => Number(option.value) === Number(device?.calibrationStatus))?.label,
    error: lookupError ? getLabelError(lookupError, 'No se pudieron cargar los rollos.') : error,
    refreshRolls: () => { void reloadRolls(); } };
};
