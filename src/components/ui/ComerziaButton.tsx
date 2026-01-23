import React from "react";

// Agregamos las nuevas variantes a la lista
type ButtonVariant = 
  | "primary" | "secondary" | "neutral" | "ghost" 
  | "save" | "delete" | "cancel" | "edit" // CRUD Básico
  | "excel" | "pdf" // Reportes
  | "success" | "error" | "warning" | "info"; 

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string; // Ahora es opcional (porque los botones redondos no llevan texto)
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  isIconOnly?: boolean; // Nueva prop para hacerlos redondos
  tooltip?: string; // Útil para botones sin texto
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
      
      // Defaults de DaisyUI
      case "neutral": return "btn-neutral text-white";
      case "ghost": return "btn-comerzia-ghost text-white"; 
      default: return "btn-comerzia-primary text-white";
    }
  };

  const content = (
    <button 
      className={`
        btn 
        ${getVariantClass()} 
        ${fullWidth ? "w-full" : ""}
        ${isIconOnly ? "btn-circle btn-sm md:btn-md" : "min-w-[120px] gap-2"} 
        shadow-sm hover:shadow-md transition-all
        ${className}
      `} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {isLoading ? <span className="loading loading-spinner"></span> : icon}
      {!isIconOnly && label}
    </button>
  );

  // Si tiene tooltip, lo envolvemos
  if (tooltip) {
    return <div className="tooltip" data-tip={tooltip}>{content}</div>;
  }

  return content;
};