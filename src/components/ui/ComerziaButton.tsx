import React from "react";

// Agregamos las nuevas variantes a la lista
type ButtonVariant = 
  | "primary" | "secondary" | "neutral" | "ghost" | "white"
  | "save" | "delete" | "cancel" | "edit" // CRUD Básico
  | "excel" | "pdf" // Reportes
  | "overlay"
  | "success" | "error" | "warning" | "info" | "create" | "steps"; 

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string; // Ahora es opcional (porque los botones redondos no llevan texto)
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  isIconOnly?: boolean; // Nueva prop para hacerlos redondos
  tooltip?: string; // Útil para botones sin texto
  responsive?: boolean; // <--- 1. NUEVA PROPIEDAD
}

export const ComerziaButton = ({ 
  label, 
  variant = "primary", 
  isLoading = false, 
  icon,
  fullWidth = false,
  isIconOnly = false,
  className = "",
  tooltip,
  responsive = false, // Por defecto es falso (comportamiento normal)
  ...props 
}: Props) => {

  const getVariantClass = () => {
    switch (variant) {
      // Clases mapeadas en index.css
      case "save": return "btn-comerzia-save border-none"; 
      case "delete": return "btn-comerzia-delete border-none";
      case "cancel": return "btn-comerzia-delete border-none"; // Reusamos el rojo para cancelar como pediste
      
      case "edit": return "btn-comerzia-edit border-none";
      case "excel": return "btn-comerzia-excel border-none";
      case "pdf": return "btn-comerzia-pdf border-none";
      case "create": return "btn-comerzia-create border-none";
      
      case "steps": return "btn-comerzia-steps border-none";
      case "ghost": return "btn-comerzia-ghost text-white"; 
      case "error": return "btn-comerzia-error border-none"; 
      case "warning": return "btn-comerzia-warning border-none";
      case "success": return "btn-comerzia-success border-none";
      // Defaults de DaisyUI
      case "neutral": return "btn-neutral text-white";

      case "white": return "bg-white text-base-content hover:bg-gray-100 border-none"; 
      case "overlay": return "bg-black/40 hover:bg-black/60 text-white border-none backdrop-blur-[2px] shadow-sm";
      default: return "btn-comerzia-primary text-white";
    }
  };

  const content = (
    <button 
      className={`
        btn 
        ${getVariantClass()} 
        ${fullWidth ? "w-full" : ""}
        ${isIconOnly 
            ? "btn-circle btn-sm md:btn-md" 
            : "px-4 min-w-[100px] sm:min-w-[120px] gap-2" 
        }
        shadow-sm hover:shadow-md transition-all
        ${className}
      `} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="loading loading-spinner"></span> : icon}
      {!isIconOnly && label && (
          <span className={responsive ? "hidden sm:inline" : ""}>
            {label}
          </span>
      )}
    </button>
  );

  // Si tiene tooltip, lo envolvemos
  if (tooltip) {
    return (
      <div 
        className={`tooltip ${fullWidth ? 'w-full block' : 'inline-block'}`} 
        data-tip={tooltip}
      >
        {content}
      </div>
    );
  }

  return content;
};