import { useCallback, useEffect, useState } from 'react';
import { catalogService, catalogError } from '../services/catalogService';
import type { Administration, Draft } from '../types';

export function useCatalogAdministration() {
  const [data, setData] = useState<Administration | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [shakeKey, setShakeKey] = useState(0);
  const load = useCallback(async () => {
    try { const response = await catalogService.administration(); setData(response); setDraft(response.draft); setError(''); }
    catch (failure: unknown) { setError(catalogError(failure)); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  const change = <K extends keyof Draft>(key: K, value: Draft[K]) => { setDraft(current => current ? { ...current, [key]: value } : current); setNotice(''); };
  const save = async () => {
    if (!draft) return false;
    if (!draft.title.trim() || !draft.slug.trim() || !draft.whatsappCountry || !/^[0-9]{4,14}$/.test(draft.whatsapp)) {
      setShakeKey(value => value + 1); setError('Completa nombre, dirección, país y WhatsApp.'); return false;
    }
    setBusy(true); setError('');
    try { const response = await catalogService.save(draft); setData(response); setDraft(response.draft); setNotice('Borrador guardado.'); return true; }
    catch (failure: unknown) { setError(catalogError(failure)); return false; }
    finally { setBusy(false); }
  };
  const publish = async (published: boolean) => {
    if (!data) return;
    setBusy(true); setError('');
    try { const response = await catalogService.publish(data.draft.revision, published); setData(response); setDraft(response.draft); setNotice(published ? 'Tu catálogo está publicado.' : 'Catálogo despublicado.'); }
    catch (failure: unknown) { setError(catalogError(failure)); }
    finally { setBusy(false); }
  };
  return { data, draft, busy, error, notice, shakeKey, load, change, save, publish };
}
