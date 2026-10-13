import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title: ReactNode;
    children: ReactNode;
    actions?: ReactNode;
    size?: "sm" | "md" | "lg" | "xl";
    closeOnOutsideClick?: boolean;
    variant?: "form" | "view";
    compact?: boolean;
}

export const ComerziaModal = ({ isOpen, onClose, title, children, actions, size = "md", closeOnOutsideClick = false, variant = "form", compact = false }: Props) => {
    
    // 1. MANEJO DE TECLA ESC (Manual, ya que quitamos el dialog nativo)
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (isOpen && e.key === "Escape") {
                onClose();
            }
        };
        window.addEventListener("keydown", handleEsc);
        return () => window.removeEventListener("keydown", handleEsc);
    }, [isOpen, onClose]);

    // Clases de tamaño
    const sizeClasses = {
        sm: "max-w-sm",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl",
    };

    // Clases de background según variante
    const bgClasses = variant === 'view' 
        ? '!bg-base-200 dark:!bg-base-300' 
        : '!bg-base-100 dark:!bg-base-100'; // Form mantiene fondo blanco.
        
    const headerBgClass = variant === 'view' ? 'bg-base-100 dark:bg-base-200' : 'bg-base-200 dark:bg-base-200/50';
    const borderClass = 'border-base-200 dark:border-base-200/50';

    // Si no está abierto, no renderizamos nada (para limpiar el DOM)
    if (!isOpen) return null;

    return (
        // 2. CAMBIO PRINCIPAL: Usamos <div> en lugar de <dialog>
        // Usamos 'modal-open' para mostrarlo.
        // z-[999] es suficiente para estar sobre la página, pero debajo del Select (z-10000)
        <div
            className="modal modal-open modal-middle bg-black/50 backdrop-blur-sm !m-0 !p-0 z-[999]"
            onClick={() => {
                if (closeOnOutsideClick) onClose();
            }}
        >
            
            <div 
                className={`modal-box ${sizeClasses[size]} p-0 overflow-hidden ${compact ? "flex flex-col !max-h-[92dvh]" : ""} ${bgClasses} shadow-2xl relative border ${borderClass}`}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`${headerBgClass} ${compact ? "px-4 py-3 sm:px-6 shrink-0" : "px-6 py-4"} flex justify-between items-center border-b ${borderClass}`}>
                    <div className="font-bold text-lg text-base-content flex items-center gap-2 min-w-0">
                        {title}
                    </div>
                    <button 
                        type="button"
                        onClick={onClose} 
                        aria-label="Cerrar ventana"
                        className={`btn btn-circle btn-ghost hover:bg-base-300 shrink-0 ${compact ? "min-h-11 min-w-11" : "btn-sm"}`}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className={`${compact ? "p-4 sm:p-6 min-h-0 overscroll-contain" : "p-6 max-h-[70vh]"} overflow-y-auto custom-scrollbar`}>
                    {children}
                </div>

                {/* Footer */}
                {actions && (
                    <div className={`modal-action ${bgClasses} ${compact ? "px-4 py-3 sm:px-6 shrink-0" : "px-6 py-4"} mt-0 border-t ${borderClass} flex justify-end gap-2`}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};