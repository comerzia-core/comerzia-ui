import { useEffect } from 'react';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { ComerziaPreviewPanel } from '../../../components/ui/ComerziaPreviewPanel';
import { getThemeLabel, isThemeId } from '../../../config/themes';
import { useToast } from '../../../context/ToastContext';
import { useThemeStore } from '../../../stores/useThemeStore';
import { ThemeGallery } from './ThemeGallery';

export function ThemePreferencePanel() {
  const state = useThemeStore();
  const { error: toastError } = useToast();
  useEffect(() => { if (state.error) toastError(state.error); }, [state.error, toastError]);
  useEffect(() => {
    const receive = (event: StorageEvent) => {
      const current = useThemeStore.getState();
      if (!current.owner || !isThemeId(event.newValue) || event.key !== `comerzia.theme.user.${current.owner}` || current.isOpen || current.isSaving || current.error) return;
      current.bindProfile(current.owner, event.newValue, current.sessionToken!, current.revision);
    };
    window.addEventListener('storage', receive);
    return () => window.removeEventListener('storage', receive);
  }, []);
  if (!state.isOpen) return null;
  return <ComerziaPreviewPanel title="Elige tu tema" onClose={state.close} footer={
    <div className="space-y-2">
      {state.error && <p role="alert" className="text-xs text-error">{state.error}</p>}
      <div className="flex items-center gap-3">
        <span className="text-xs text-base-content/60 flex-1">Se guarda al cerrar.</span>
        <ComerziaButton type="button" label="Listo" variant="primary" onClick={state.close} className="btn-sm !min-h-11" />
      </div>
    </div>}>
    <p className="text-xs text-base-content/60 mb-3">Prueba los colores sobre tu pantalla.</p>
    <ThemeGallery selected={state.theme} onSelect={state.preview} />
  </ComerziaPreviewPanel>;
}

export function AppearancePreferences() {
  const state = useThemeStore();
  return <section className="space-y-4">
    <div><h3 className="font-bold">Apariencia</h3>
      <p className="text-sm text-base-content/60">Prueba un tema y cierra el selector para guardarlo en tu cuenta.</p></div>
    <p className="text-sm">Tema actual: <strong>{getThemeLabel(state.theme)}</strong>
      {state.isSaving && <span role="status" className="text-base-content/60 ml-2">Guardando…</span>}</p>
    {state.error && <div className="flex items-center gap-3"><p role="alert" className="text-xs text-error flex-1">{state.error}</p>
      <ComerziaButton label="Reintentar" variant="primary" onClick={state.retry} className="btn-sm" /></div>}
    <ThemeGallery expanded selected={state.theme} onSelect={theme => { state.open(); state.preview(theme); }} />
  </section>;
}
