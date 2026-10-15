import { useState, type MouseEvent } from 'react';
export function useSaasContextMenu<T>() {
  const [menu, setMenu] = useState<{ item: T | null; isOpen: boolean; x: number; y: number; isCentered: boolean }>({ item: null, isOpen: false, x: 0, y: 0, isCentered: false });
  return { menu, close: () => setMenu(value => ({ ...value, isOpen: false })), open: (event: MouseEvent, item: T, isCentered: boolean) => {
    event.preventDefault(); event.stopPropagation(); setMenu({ item, isOpen: true, x: event.clientX, y: event.clientY, isCentered });
  } };
}
