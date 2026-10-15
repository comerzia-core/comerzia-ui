import type { HTMLAttributes } from 'react';

export function ComerziaSurface({ className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={'card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs ' + className} />;
}
