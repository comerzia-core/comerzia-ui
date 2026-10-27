import type { ButtonHTMLAttributes } from 'react';

/** Controles del escaparate público: estilo propio, independiente de la administración. */
export function StoreButton({ className = '', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" className={'store-button ' + className} {...props}>{children}</button>;
}
