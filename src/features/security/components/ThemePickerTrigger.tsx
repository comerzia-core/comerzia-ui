import { Loader2, Palette } from 'lucide-react';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { useThemeStore } from '../../../stores/useThemeStore';

export function ThemePickerTrigger({ onOpen, className }: { onOpen?: () => void; className?: string } = {}) {
  const open = useThemeStore(state => state.open);
  const isSaving = useThemeStore(state => state.isSaving);
  const handleClick = () => {
    onOpen?.();
    open();
  };
  return <ComerziaButton type="button" variant="ghost" isIconOnly
    icon={isSaving ? <Loader2 size={18} className="animate-spin" /> : <Palette size={18} />}
    onClick={handleClick} aria-label="Elegir tema" aria-busy={isSaving} title={isSaving ? 'Guardando tema…' : 'Cambiar tema'}
    className={`!min-h-9 !min-w-9 ${className || ''}`} />;
}
