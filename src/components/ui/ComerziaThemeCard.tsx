import { Check, Moon, Sun, type LucideIcon } from 'lucide-react';
import { ComerziaButton } from './ComerziaButton';

interface Props { name: string; description: string; themeId: string; isDark: boolean; icon: LucideIcon; selected: boolean; onSelect: () => void }

export function ComerziaThemeCard({ name, description, themeId, isDark, icon: Icon, selected, onSelect }: Props) {
  return <ComerziaButton type="button" variant="ghost" aria-label={`Elegir ${name}`} aria-pressed={selected}
    onClick={onSelect} className={`!h-auto !min-w-0 !p-2.5 !justify-start !rounded-xl text-left !shadow-none ${selected ? '!border-primary ring-1 ring-primary' : '!border-base-300'}`}
    icon={<div className="w-full min-w-0 space-y-2">
      <div className="flex items-center gap-1.5"><Icon size={16} className="shrink-0" />
        <span className="font-semibold text-xs truncate flex-1">{name}</span>
        {selected ? <Check size={16} className="text-primary shrink-0" /> : isDark ? <Moon size={12} /> : <Sun size={12} />}
      </div>
      <div data-theme={themeId} className="flex gap-1 rounded-lg bg-base-200 p-2" aria-hidden="true">
        <span className="h-4 flex-1 rounded bg-base-100" /><span className="h-4 flex-1 rounded bg-primary" />
        <span className="h-4 flex-1 rounded bg-secondary" /><span className="h-4 flex-1 rounded bg-accent" />
      </div>
      <span className="text-[11px] font-normal text-base-content/60 block truncate">{description}</span>
    </div>} />;
}
