import { useEffect, useRef } from 'react';

interface UseMobileDrawerSwipeOptions {
  /** ID del checkbox de DaisyUI que controla el drawer (por defecto: 'my-drawer') */
  drawerId?: string;
  /** Distancia mínima en píxeles para considerar que se debe cerrar el menú */
  threshold?: number;
  /** Velocidad mínima de swipe (px/ms) para cerrar el menú por gesto rápido (flick) */
  velocityThreshold?: number;
}

/**
 * Hook para permitir el cierre del menú lateral en dispositivos móviles mediante un gesto de swipe a la izquierda.
 * Aplica un efecto visual de desplazamiento y desvanecimiento progresivo (fade-out) conectado 1:1 con el dedo del usuario.
 * Diseñado con protección contra parpadeo (anti-flicker) para evitar que el backdrop de DaisyUI reaparezca al cerrar.
 */
export const useMobileDrawerSwipe = (options: UseMobileDrawerSwipeOptions = {}) => {
  const {
    drawerId = 'my-drawer',
    threshold = 50,
    velocityThreshold = 0.35,
  } = options;

  const asideRef = useRef<HTMLElement | null>(null);

  // Estados de seguimiento por refs para máxima fluidez a 60 FPS sin re-renders innecesarios
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const currentDeltaX = useRef(0);
  const isTracking = useRef(false);
  const isSwiping = useRef(false);
  const isScrolling = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const aside = asideRef.current;
    if (!aside) return;

    const getDrawerCheckbox = (): HTMLInputElement | null => {
      return document.getElementById(drawerId) as HTMLInputElement | null;
    };

    const getContainer = (): HTMLElement | null => {
      return (aside.closest('.drawer-side') as HTMLElement | null) || aside.parentElement;
    };

    const getOverlay = (): HTMLElement | null => {
      const container = getContainer();
      return (container?.querySelector('.drawer-overlay') as HTMLElement | null) || null;
    };

    // Restablecer estilos inline para que DaisyUI retome el control total tras animar
    const resetStyles = () => {
      aside.style.transform = '';
      aside.style.opacity = '';
      aside.style.transition = '';

      const overlay = getOverlay();
      if (overlay) {
        overlay.style.opacity = '';
        overlay.style.transition = '';
      }

      const container = getContainer();
      if (container) {
        container.style.transition = '';
        container.style.visibility = '';
        container.style.opacity = '';
        container.style.pointerEvents = '';
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      // Solo actuar en modo móvil (< 1024px)
      if (window.innerWidth >= 1024) return;

      const checkbox = getDrawerCheckbox();
      // Solo actuar si el drawer está actualmente abierto
      if (!checkbox || !checkbox.checked) return;

      if (e.touches.length > 1) return;

      // Cancelar cualquier temporizador de cierre en curso si el usuario vuelve a tocar
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }

      const touch = e.touches[0];
      startX.current = touch.clientX;
      startY.current = touch.clientY;
      startTime.current = Date.now();
      currentDeltaX.current = 0;
      isTracking.current = true;
      isSwiping.current = false;
      isScrolling.current = false;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isTracking.current || window.innerWidth >= 1024) return;

      const touch = e.touches[0];
      const diffX = touch.clientX - startX.current;
      const diffY = touch.clientY - startY.current;

      // Determinar la intención del gesto si aún no está bloqueado
      if (!isSwiping.current && !isScrolling.current) {
        const absX = Math.abs(diffX);
        const absY = Math.abs(diffY);

        // Zona muerta mínima para no reaccionar a micro-movimientos
        if (absX < 8 && absY < 8) return;

        // Si el movimiento es predominantemente vertical, el usuario está haciendo scroll en el menú
        if (absY > absX) {
          isScrolling.current = true;
          return;
        }

        // Si el movimiento es horizontal y hacia la izquierda (cierre)
        if (diffX < 0) {
          isSwiping.current = true;
        } else {
          // Desplazamiento hacia la derecha no permitido (el drawer ya está en 0px)
          isScrolling.current = true;
          return;
        }
      }

      // Si el usuario está deslizando a la izquierda
      if (isSwiping.current) {
        if (e.cancelable) {
          e.preventDefault();
        }

        // Solo permitir valores negativos (hacia la izquierda)
        const deltaX = Math.min(0, diffX);
        currentDeltaX.current = deltaX;

        const asideWidth = aside.offsetWidth || 288;
        // Progreso de desvanecimiento: de 0 (abierto) a 1 (cerrado)
        const progress = Math.min(1, Math.abs(deltaX) / (asideWidth * 0.85));
        const opacity = Math.max(0, 1 - progress);

        // Aplicación directa sin retraso de transición durante el arrastre con el dedo
        aside.style.transition = 'none';
        aside.style.transform = `translateX(${deltaX}px)`;
        aside.style.opacity = String(opacity);

        // Desvanecer sincrónicamente el telón oscuro (overlay)
        const overlay = getOverlay();
        if (overlay) {
          overlay.style.transition = 'none';
          overlay.style.opacity = String(Math.max(0, 1 - Math.abs(deltaX) / asideWidth));
        }
      }
    };

    const handleTouchEnd = () => {
      if (!isTracking.current) return;
      isTracking.current = false;

      if (!isSwiping.current) {
        isScrolling.current = false;
        return;
      }

      const deltaX = currentDeltaX.current;
      const duration = Math.max(1, Date.now() - startTime.current);
      const velocity = Math.abs(deltaX) / duration;

      // Cerrar si se superó el umbral de distancia o si fue un flick rápido
      const shouldClose = Math.abs(deltaX) >= threshold || (velocity >= velocityThreshold && deltaX < -20);
      const overlay = getOverlay();

      if (shouldClose) {
        // Transición fluida de salida hacia la izquierda con desvanecimiento total
        aside.style.transition = 'transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 200ms ease-out';
        aside.style.transform = 'translateX(-100%)';
        aside.style.opacity = '0';

        if (overlay) {
          overlay.style.transition = 'opacity 200ms ease-out';
          overlay.style.opacity = '0';
        }

        // Al terminar la animación de desvanecimiento (200ms), transferimos el estado a DaisyUI sin parpadeos
        closeTimeoutRef.current = setTimeout(() => {
          const container = getContainer();
          if (container) {
            // Desactivar temporalmente transiciones en .drawer-side para evitar el delay de 100ms
            // y salto abrupto del fondo oscuro (#0006) de DaisyUI
            container.style.transition = 'none';
            container.style.visibility = 'hidden';
            container.style.opacity = '0';
            container.style.pointerEvents = 'none';
          }

          const checkbox = getDrawerCheckbox();
          if (checkbox && checkbox.checked) {
            checkbox.checked = false;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }

          // Esperar 350ms a que DaisyUI estabilice su estado oculto antes de restaurar estilos inline
          closeTimeoutRef.current = setTimeout(() => {
            resetStyles();
            isSwiping.current = false;
            isScrolling.current = false;
            closeTimeoutRef.current = null;
          }, 350);
        }, 200);
      } else {
        // Regresar suavemente a la posición completamente abierta si no alcanzó el umbral
        aside.style.transition = 'transform 200ms cubic-bezier(0.2, 0.9, 0.3, 1), opacity 200ms ease-out';
        aside.style.transform = 'translateX(0px)';
        aside.style.opacity = '1';

        if (overlay) {
          overlay.style.transition = 'opacity 200ms ease-out';
          overlay.style.opacity = '1';
        }

        closeTimeoutRef.current = setTimeout(() => {
          resetStyles();
          isSwiping.current = false;
          isScrolling.current = false;
          closeTimeoutRef.current = null;
        }, 200);
      }
    };

    const handleTouchCancel = () => {
      if (isSwiping.current) {
        aside.style.transition = 'transform 150ms ease-out, opacity 150ms ease-out';
        aside.style.transform = 'translateX(0px)';
        aside.style.opacity = '1';
        const overlay = getOverlay();
        if (overlay) {
          overlay.style.transition = 'opacity 150ms ease-out';
          overlay.style.opacity = '1';
        }
        closeTimeoutRef.current = setTimeout(() => {
          resetStyles();
          isSwiping.current = false;
          isScrolling.current = false;
          closeTimeoutRef.current = null;
        }, 150);
      }
      isTracking.current = false;
      isScrolling.current = false;
    };

    // Listener para sincronizar estado cuando el drawer se abre o cierra externamente
    const checkbox = getDrawerCheckbox();
    const handleCheckboxChange = () => {
      if (checkbox?.checked) {
        // Al abrir el drawer, cancelar cualquier timer pendiente y restaurar estilos limpios para DaisyUI
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        resetStyles();
      } else {
        // Si se cerró por otro medio (tap fuera o click en link de submenú) y no estamos en un swipe
        if (!isSwiping.current) {
          resetStyles();
        }
      }
    };

    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
          closeTimeoutRef.current = null;
        }
        resetStyles();
        isSwiping.current = false;
        isTracking.current = false;
        isScrolling.current = false;
      }
    };

    if (checkbox) {
      checkbox.addEventListener('change', handleCheckboxChange);
    }
    window.addEventListener('resize', handleResize);

    // Escuchar eventos táctiles en el menú lateral aside
    aside.addEventListener('touchstart', handleTouchStart, { passive: true });
    aside.addEventListener('touchmove', handleTouchMove, { passive: false });
    aside.addEventListener('touchend', handleTouchEnd, { passive: true });
    aside.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
      if (checkbox) {
        checkbox.removeEventListener('change', handleCheckboxChange);
      }
      window.removeEventListener('resize', handleResize);
      aside.removeEventListener('touchstart', handleTouchStart);
      aside.removeEventListener('touchmove', handleTouchMove);
      aside.removeEventListener('touchend', handleTouchEnd);
      aside.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [drawerId, threshold, velocityThreshold]);

  return { asideRef };
};
