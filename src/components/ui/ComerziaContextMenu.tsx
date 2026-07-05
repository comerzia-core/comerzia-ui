import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Edit, Trash2, DollarSign, ExternalLink, type LucideIcon } from "lucide-react";

export interface ComerziaContextMenuProps {
  isOpen: boolean;
  x: number;
  y: number;
  onClose: () => void;
  children: ReactNode;
}

export const ComerziaContextMenu = ({ isOpen, x, y, onClose, children }: ComerziaContextMenuProps) => {
  const menuRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    const handleScroll = () => {
      if (isOpen) onClose();
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("scroll", handleScroll, true);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Ajuste básico para evitar que el menú se salga de la pantalla si está muy cerca de los bordes
  const adjustedX = x;
  const adjustedY = y;

  return createPortal(
    <ul
      ref={menuRef}
      className="menu menu-md bg-base-100 w-60 rounded-box shadow-2xl border border-base-200 fixed z-[10000] p-2 gap-1"
      style={{ top: adjustedY, left: adjustedX }}
      onClick={(e) => {
        e.stopPropagation();
        onClose(); // Cerrar el menú al hacer clic en cualquier opción
      }}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </ul>,
    document.body
  );
};

export interface ContextMenuItemProps {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: "default" | "error";
  disabled?: boolean;
  isExternalLink?: boolean;
}

export const ContextMenuItem = ({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
  isExternalLink = false,
}: ContextMenuItemProps) => {
  const baseClasses = "flex items-center justify-between px-3 py-2 transition-colors rounded-md w-full";
  const variantClasses = disabled
    ? ""
    : variant === "error" 
      ? "text-error hover:bg-error hover:text-error-content" 
      : "hover:bg-base-200 hover:text-primary";
  const disabledClasses = disabled ? "opacity-50 cursor-not-allowed pointer-events-none" : "";

  return (
    <li>
      <button
        type="button"
        className={`${baseClasses} ${variantClasses} ${disabledClasses}`}
        onClick={onClick}
        disabled={disabled}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon size={16} />}
          {label}
        </div>
        {isExternalLink && <ExternalLink size={14} className="opacity-50" />}
      </button>
    </li>
  );
};
