import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { DICTIONARIES } from '../../../config/dictionaries';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { useAuthStore } from '../../../stores/useAuthStore';
import { labelService, getLabelError } from '../../pos/services/labelService';
import { hardwareService } from '../../pos/services/hardwareService';
import { HwPrintJobStatusCode, type HwPrintJobResponse, type HwDeviceResponse } from '../../pos/types/hardware';
import type { LabelContent, LabelPreview } from '../../pos/types/labels';

export const useProductLabelPrinting = (productId: string) => {
  const profile = useAuthStore(state => state.userProfile);
  const { options, isLoading: isLoadingLookups, error: lookupError, reload: reloadLookups } = useLoadDictionaries(
    [DICTIONARIES.LABEL_VARIANT, DICTIONARIES.LABEL_ROLL_SIZE, DICTIONARIES.LABEL_PRINTER],
    { scope: `${profile?.id}:${profile?.companySettings?.id}`, productId },
  );
  const variantOptions = options[DICTIONARIES.LABEL_VARIANT];
  const rollOptions = options[DICTIONARIES.LABEL_ROLL_SIZE];
  const printerOptions = options[DICTIONARIES.LABEL_PRINTER];
  const [variantId, setVariantId] = useState('');
  const [rollSizeId, setRollSizeId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [includeLogo, setIncludeLogo] = useState(false);
  const [includePrice, setIncludePrice] = useState(false);
  const [includeName, setIncludeName] = useState(true);
  const [content, setContent] = useState<LabelContent | null>(null);
  const [previewResult, setPreviewResult] = useState<{ key: string; data: LabelPreview } | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [job, setJob] = useState<HwPrintJobResponse | null>(null);
  const [device, setDevice] = useState<HwDeviceResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [shakeKey, setShakeKey] = useState(0);
  const submitLock = useRef(false);
  const currentVariantId = variantOptions.some(option => String(option.value) === variantId) ? variantId : String(variantOptions[0]?.value || '');
  const currentRollId = rollOptions.some(option => String(option.value) === rollSizeId) ? rollSizeId : String(rollOptions[0]?.value || '');
  const currentDeviceId = printerOptions.some(option => String(option.value) === deviceId) ? deviceId : String(printerOptions[0]?.value || '');
  const selectionKey = JSON.stringify([currentVariantId, currentRollId, includeLogo, includePrice, includeName, refreshKey]);
  const preview = previewResult?.key === selectionKey ? previewResult.data : null;
  const currentContent = content?.variantId === currentVariantId ? content : null;

  useEffect(() => {
    if (!currentDeviceId) return;
    let current = true;
    const load = () => hardwareService.getDeviceById(currentDeviceId)
      .then(device => { if (current) setDevice(device); })
      .catch((error: unknown) => { if (current) { setDevice(null); setError(getLabelError(error, 'No se pudo verificar la impresora.')); } });
    void load();
    const timer = window.setInterval(() => { void load(); }, 20000);
    return () => { current = false; window.clearInterval(timer); };
  }, [currentDeviceId]);

  useEffect(() => {
    if (!currentVariantId || isLoadingLookups) return;
    const controller = new AbortController();
    setContent(null); setPreviewResult(null); setIncludeLogo(false); setIncludePrice(false); setError('');
    labelService.content(currentVariantId, controller.signal).then(data => {
      if (controller.signal.aborted) return;
      setContent(data); setIncludeLogo(data.logoAvailable); setIncludePrice(data.priceAvailable);
    }).catch((error: unknown) => {
      if (!axios.isCancel(error)) setError(getLabelError(error, 'No se pudo cargar el contenido de la etiqueta.'));
    });
    return () => controller.abort();
  }, [currentVariantId, isLoadingLookups, refreshKey]);

  useEffect(() => {
    if (!currentContent || !currentRollId || isLoadingLookups) return;
    const controller = new AbortController();
    setIsPreviewLoading(true); setError('');
    const timer = window.setTimeout(() => {
      labelService.preview({ variantId: currentVariantId, rollSizeId: currentRollId, includeLogo, includePrice, includeName }, controller.signal)
        .then(data => { if (!controller.signal.aborted) setPreviewResult({ key: selectionKey, data }); })
        .catch((error: unknown) => { if (!axios.isCancel(error)) setError(getLabelError(error, 'No se pudo generar la previsualización.')); })
        .finally(() => { if (!controller.signal.aborted) setIsPreviewLoading(false); });
    }, 250);
    return () => { window.clearTimeout(timer); controller.abort(); };
  }, [currentContent, currentRollId, currentVariantId, includeLogo, includePrice, includeName, selectionKey, isLoadingLookups]);

  useEffect(() => {
    if (!job || [HwPrintJobStatusCode.COMPLETED, HwPrintJobStatusCode.FAILED, HwPrintJobStatusCode.CANCELLED].some(status => status === Number(job.status))) return;
    let stopped = false;
    const timer = window.setInterval(() => {
      hardwareService.getPrintJobById(job.id).then(updated => { if (!stopped) setJob(updated); })
        .catch((error: unknown) => { if (!stopped) setError(getLabelError(error, 'No se pudo consultar el estado del trabajo.')); });
    }, 2000);
    return () => { stopped = true; window.clearInterval(timer); };
  }, [job]);

  const currentDevice = device?.id === currentDeviceId ? device : null;
  const printerReady = Boolean(currentDevice?.reachable && currentDevice?.ready && currentDevice.lastCheckedAt && Date.parse(currentDevice.lastCheckedAt) >= Date.now() - 90000);
  const quantityValid = /^\d+$/.test(quantity) && Number(quantity) >= 1 && Number(quantity) <= 1000;
  const print = async () => {
    if (submitLock.current) return;
    if (!quantityValid || !preview || !currentDeviceId || !printerReady) { setShakeKey(value => value + 1); setError('Seleccione rollo e impresora y revise la previsualización. La cantidad debe estar entre 1 y 1000.'); return; }
    submitLock.current = true; setIsSubmitting(true); setError('');
    try { setJob(await labelService.print(preview.previewId, currentDeviceId, Number(quantity))); }
    catch (error: unknown) { setError(getLabelError(error, 'No se pudo enviar la impresión.')); }
    finally { submitLock.current = false; setIsSubmitting(false); }
  };

  return {
    variantOptions, rollOptions, printerOptions, isLoadingLookups,
    variantId: currentVariantId, rollSizeId: currentRollId, deviceId: currentDeviceId,
    setVariantId, setRollSizeId, setDeviceId, quantity, setQuantity, quantityValid,
    includeLogo, setIncludeLogo, includePrice, setIncludePrice, includeName, setIncludeName,
    content: currentContent, device: currentDevice, printerReady, preview, isPreviewLoading, isSubmitting, job, shakeKey,
    error: lookupError ? getLabelError(lookupError, 'No se pudieron cargar los tamaños o las impresoras.') : error,
    print, refreshPreview: () => { setPreviewResult(null); setRefreshKey(value => value + 1); void reloadLookups(); },
  };
};
