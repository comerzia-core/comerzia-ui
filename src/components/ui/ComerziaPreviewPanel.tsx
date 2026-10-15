import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ComerziaButton } from './ComerziaButton';

interface Props { title: string; onClose: () => void; children: ReactNode; footer: ReactNode }

/** Panel modal sin desenfoque: mantiene visible la vista que se está personalizando. */
export function ComerziaPreviewPanel({ title, onClose, children, footer }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault(); event.stopImmediatePropagation(); onClose();
    };
    window.addEventListener('keydown', escape, true);
    return () => window.removeEventListener('keydown', escape, true);
  }, [onClose]);
  return createPortal(
    <dialog ref={dialogRef} aria-labelledby={titleId} className="comerzia-preview-panel"
      onCancel={event => { event.preventDefault(); onClose(); }}
      onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) onClose(); }}>
      <div className="flex flex-col min-h-0 h-full bg-base-100 text-base-content rounded-t-2xl sm:rounded-2xl overflow-hidden border border-base-300 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-base-200 shrink-0">
          <h2 id={titleId} className="font-bold">{title}</h2>
          <ComerziaButton type="button" variant="ghost" isIconOnly icon={<X size={18} />}
            aria-label="Cerrar selector de temas" onClick={onClose} className="!min-h-11 !min-w-11" />
        </div>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 flex-1">{children}</div>
        <div className="px-4 py-3 border-t border-base-200 shrink-0">{footer}</div>
      </div>
    </dialog>, document.body,
  );
}
