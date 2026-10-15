import { Loader2, Palette } from 'lucide-react';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { useThemeStore } from '../../../stores/useThemeStore';

export function ThemePickerTrigger() {
  const open = useThemeStore(state => state.open);
  const isSaving = useThemeStore(state => state.isSaving);
  return <ComerziaButton type="button" variant="ghost" isIconOnly
    icon={isSaving ? <Loader2 size={20} className="animate-spin" /> : <Palette size={20} />}
    onClick={open} aria-label="Elegir tema" aria-busy={isSaving} title={isSaving ? 'Guardando tema…' : 'Cambiar tema'}
    className="!min-h-11 !min-w-11" />;
}
