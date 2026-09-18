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
}

export const ComerziaModal = ({ isOpen, onClose, title, children, actions, size = "md", closeOnOutsideClick = false, variant = "form" }: Props) => {
    
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
        
    const headerBorderClass = variant === 'view' ? 'border-base-300' : 'border-base-200';
    const footerBorderClass = variant === 'view' ? 'border-base-300/50' : 'border-base-200';

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
                className={`modal-box ${sizeClasses[size]} p-0 overflow-hidden ${bgClasses} shadow-2xl relative border ${footerBorderClass}`}
                role="dialog"
                aria-modal="true"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`bg-base-200 px-6 py-4 flex justify-between items-center border-b ${headerBorderClass}`}>
                    <div className="font-bold text-lg text-base-content flex items-center gap-2">
                        {title}
                    </div>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="btn btn-sm btn-circle btn-ghost hover:bg-base-300"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                {actions && (
                    <div className={`modal-action ${bgClasses} px-6 py-4 mt-0 border-t ${footerBorderClass} flex justify-end gap-2`}>
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};