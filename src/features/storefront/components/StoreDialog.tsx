import { useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { StoreButton } from '../../../components/ui/StoreButton';

export function StoreDialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return <dialog ref={ref} className={'store-dialog ' + (wide ? 'store-dialog--wide' : '')} aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); onClose(); }} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="store-dialog-content"><header className="store-dialog-header"><h2 id={titleId}>{title}</h2><StoreButton aria-label="Cerrar" className="store-icon" onClick={onClose}><X size={21} /></StoreButton></header>{children}</div>
  </dialog>;
}
