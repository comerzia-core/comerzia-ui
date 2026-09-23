import { createContext, useContext, useState, useRef, useCallback, useMemo, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  closing: boolean;
}

interface ToastContextType {
  addToast: (message: string, type: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Componente individual de Toast con soporte para Swipe/Drag hacia la derecha (Mobile & PC)
interface ToastItemProps {
  toast: Toast;
  onClose: (id: number) => void;
}

const ToastItem = ({ toast, onClose }: ToastItemProps) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const isPointerDownRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Si se hace clic en el botón X de cerrar, ignorar el drag
    if ((e.target as HTMLElement).closest("button")) return;

    isPointerDownRef.current = true;
    startXRef.current = e.clientX;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    const currentX = e.clientX;
    const deltaX = currentX - startXRef.current;

    // Permitir arrastre hacia la derecha, con leve resistencia hacia la izquierda
    if (deltaX > 0) {
      setIsDragging(true);
      setDragX(deltaX);
    } else {
      setDragX(Math.max(-12, deltaX * 0.15));
    }
  };

  const handlePointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isPointerDownRef.current) return;
    isPointerDownRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch (_) {}

    // Si se arrastró más de 70px hacia la derecha, descartar la notificación
    if (dragX > 70) {
      onClose(toast.id);
    } else {
      setIsDragging(false);
      setDragX(0);
    }
  };

  const config = getToastConfig(toast.type);

  // Estilo dinámico durante el arrastre o transición al soltar
  const swipeStyle = isDragging
    ? {
        transform: `translateX(${dragX}px)`,
        opacity: Math.max(0.15, 1 - dragX / 220),
        transition: "none",
        cursor: "grabbing",
      }
    : {
        transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined,
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        cursor: "grab",
      };

  return (
    <div
      className={`pointer-events-none flex justify-end w-full max-w-full ${
        toast.closing ? "animate-toast-out" : "animate-toast-in"
      }`}
    >
      <div
        role="alert"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        style={{
          ...swipeStyle,
          touchAction: "pan-y", // Permite desplazamiento vertical nativo y captura swipe horizontal
        }}
        className={`
          pointer-events-auto flex items-start gap-3 p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-md select-none
          w-full max-w-[calc(100vw-1.5rem)] sm:w-auto sm:min-w-[340px] sm:max-w-md active:cursor-grabbing
          ${config.cardClass}
        `}
      >
        <div className={`mt-0.5 shrink-0 pointer-events-none ${config.iconClass}`}>
          {getIcon(toast.type)}
        </div>

        <p className="font-semibold text-xs sm:text-sm flex-1 leading-snug break-words pointer-events-none select-none">
          {toast.message}
        </p>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose(toast.id);
          }}
          className={`btn btn-xs btn-ghost btn-circle shrink-0 -mr-1 -mt-0.5 transition-colors ${config.closeBtnClass}`}
          title="Cerrar notificación"
        >
          <X size={16} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const activeMessages = useRef<Set<string>>(new Set());

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const startClosing = useCallback((id: number) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast) {
        activeMessages.current.delete(toast.message);
      }
      return prev.map((t) => (t.id === id ? { ...t, closing: true } : t));
    });

    // Esperar a que concluya la animación de salida (300ms) antes de desmontar
    setTimeout(() => {
      removeToast(id);
    }, 300);
  }, [removeToast]);

  const addToast = useCallback((message: string, type: ToastType) => {
    if (activeMessages.current.has(message)) return;

    const id = Date.now();
    activeMessages.current.add(message);

    setToasts((prev) => [...prev, { id, message, type, closing: false }]);

    // Auto-cierre tras 3.5 segundos
    setTimeout(() => {
      startClosing(id);
    }, 3500);
  }, [startClosing]);

  const success = useCallback((msg: string) => addToast(msg, "success"), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, "error"), [addToast]);
  const warning = useCallback((msg: string) => addToast(msg, "warning"), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, "info"), [addToast]);

  const contextValue = useMemo(
    () => ({ addToast, success, error, warning, info }),
    [addToast, success, error, warning, info]
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      {/* Portal seguro: no captura toques ajenos en mobile ni desktop */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            aria-live="polite"
            className="fixed top-4 right-0 z-[100000] flex flex-col items-end gap-2.5 w-full max-w-full pointer-events-none px-3 sm:px-6"
          >
            {toasts.map((toast) => (
              <ToastItem
                key={toast.id}
                toast={toast}
                onClose={startClosing}
              />
            ))}
          </div>,
          document.body
        )}
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast debe usarse dentro de ToastProvider");
  return context;
};

// Utilidades de Configuración Visual de Alto Contraste (Light & Dark Mode)
const getToastConfig = (type: ToastType) => {
  switch (type) {
    case "success":
      return {
        cardClass:
          "bg-emerald-50/95 text-emerald-950 border-emerald-300 dark:bg-emerald-950/95 dark:text-emerald-50 dark:border-emerald-600/70 shadow-emerald-500/10 dark:shadow-black/60 ring-1 ring-emerald-500/20",
        iconClass: "text-emerald-600 dark:text-emerald-400",
        closeBtnClass:
          "text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200/60 dark:hover:bg-emerald-900/60",
      };
    case "error":
      return {
        cardClass:
          "bg-rose-50/95 text-rose-950 border-rose-300 dark:bg-rose-950/95 dark:text-rose-50 dark:border-rose-600/70 shadow-rose-500/10 dark:shadow-black/60 ring-1 ring-rose-500/20",
        iconClass: "text-rose-600 dark:text-rose-400",
        closeBtnClass:
          "text-rose-700 dark:text-rose-300 hover:bg-rose-200/60 dark:hover:bg-rose-900/60",
      };
    case "warning":
      return {
        cardClass:
          "bg-amber-50/95 text-amber-950 border-amber-300 dark:bg-amber-950/95 dark:text-amber-50 dark:border-amber-600/70 shadow-amber-500/10 dark:shadow-black/60 ring-1 ring-amber-500/20",
        iconClass: "text-amber-600 dark:text-amber-400",
        closeBtnClass:
          "text-amber-800 dark:text-amber-300 hover:bg-amber-200/60 dark:hover:bg-amber-900/60",
      };
    case "info":
      return {
        cardClass:
          "bg-sky-50/95 text-sky-950 border-sky-300 dark:bg-sky-950/95 dark:text-sky-50 dark:border-sky-600/70 shadow-sky-500/10 dark:shadow-black/60 ring-1 ring-sky-500/20",
        iconClass: "text-sky-600 dark:text-sky-400",
        closeBtnClass:
          "text-sky-700 dark:text-sky-300 hover:bg-sky-200/60 dark:hover:bg-sky-900/60",
      };
  }
};

const getIcon = (type: ToastType) => {
  const size = 20;
  switch (type) {
    case "success":
      return <CheckCircle2 size={size} className="stroke-[2.2]" />;
    case "error":
      return <XCircle size={size} className="stroke-[2.2]" />;
    case "warning":
      return <AlertTriangle size={size} className="stroke-[2.2]" />;
    case "info":
      return <Info size={size} className="stroke-[2.2]" />;
  }
};