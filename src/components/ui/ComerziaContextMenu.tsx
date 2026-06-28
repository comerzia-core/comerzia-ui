import { useEffect, useRef, ReactNode } from "react";
import { createPortal } from "react-dom";

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
      className="menu bg-base-100 w-52 rounded-box shadow-xl border border-base-200 fixed z-[10000] p-2"
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
