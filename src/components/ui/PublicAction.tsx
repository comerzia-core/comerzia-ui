import type { ButtonHTMLAttributes } from 'react';
import { ArrowRight, LoaderCircle } from 'lucide-react';

// Variante visual pública, independiente de los colores operativos de los botones CRUD.
export function PublicAction({ children, busy = false, arrow = false, className = '', ...props }:
  ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; arrow?: boolean }) {
  return <button {...props} disabled={props.disabled || busy} className={`public-action ${className}`} aria-busy={busy || undefined}>
    {children}{busy ? <LoaderCircle size={19} className="animate-spin" /> : arrow ? <ArrowRight size={19} /> : null}
  </button>;
}
