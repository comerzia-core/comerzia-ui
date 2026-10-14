import type { ReactNode } from 'react';
import { ComerziaButton } from './ComerziaButton';
import { ComerziaRowNumber } from './ComerziaRowNumber';

interface Props {
  number: number;
  image: ReactNode;
  label: string;
  description?: string;
  onSelect: () => void;
}

/** La selección y la imagen tienen controles independientes, también para teclado y lectores de pantalla. */
export function ComerziaImageSearchOption({ number, image, label, description, onSelect }: Props) {
  return (
    <li className="list-none flex items-center gap-3 p-2.5 sm:p-3 rounded-xl hover:bg-primary/10 group">
      <ComerziaRowNumber value={number} />
      <div className="w-14 h-14 sm:w-16 sm:h-16 overflow-hidden rounded-xl bg-base-200 shrink-0">{image}</div>
      <ComerziaButton type="button" variant="ghost" onClick={onSelect} aria-label={`Seleccionar ${label}`}
        className="flex-1 !min-w-0 !h-auto !min-h-11 !p-0 !justify-start !border-0 !shadow-none text-left"
        icon={<div className="min-w-0 flex-1">
          <span className="font-bold text-base sm:text-lg block break-words leading-tight">{label}</span>
          {description && <span className="text-xs text-base-content/70 block truncate mt-0.5">{description}</span>}
        </div>} />
    </li>
  );
}
