import { useRef, type PointerEvent } from 'react';

/** Doble toque sin confundir desplazamientos, pulsaciones largas ni clics de ratón. */
export function useImageActivation(onActivate: () => void) {
  const start = useRef<{ x: number; y: number; time: number } | null>(null);
  const lastTap = useRef<{ x: number; y: number; time: number } | null>(null);

  return {
    onDoubleClick: onActivate,
    onPointerDown: (event: PointerEvent<HTMLElement>) => {
      if (!event.isPrimary || event.pointerType === 'mouse') return;
      start.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    },
    onPointerCancel: () => { start.current = null; lastTap.current = null; },
    onPointerUp: (event: PointerEvent<HTMLElement>) => {
      const initial = start.current;
      start.current = null;
      if (!initial || event.timeStamp - initial.time > 350 ||
          Math.hypot(event.clientX - initial.x, event.clientY - initial.y) > 10) {
        lastTap.current = null;
        return;
      }
      const previous = lastTap.current;
      if (previous && event.timeStamp - previous.time <= 350 &&
          Math.hypot(event.clientX - previous.x, event.clientY - previous.y) <= 24) {
        lastTap.current = null;
        onActivate();
      } else {
        lastTap.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };
      }
    },
  };
}
