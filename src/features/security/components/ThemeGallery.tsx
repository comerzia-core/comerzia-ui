import { THEMES, type ThemeId } from '../../../config/themes';
import { ComerziaThemeCard } from '../../../components/ui/ComerziaThemeCard';

interface Props { selected: ThemeId; onSelect: (theme: ThemeId) => void; expanded?: boolean }
export function ThemeGallery({ selected, onSelect, expanded = false }: Props) {
  return <div className={`grid grid-cols-2 gap-2 ${expanded ? 'xl:grid-cols-3' : ''}`}>
    {THEMES.map(theme => <ComerziaThemeCard key={theme.id} name={theme.label} description={theme.description}
      themeId={theme.id} icon={theme.icon} isDark={theme.mode === 'dark'} selected={selected === theme.id}
      onSelect={() => onSelect(theme.id)} />)}
  </div>;
}
