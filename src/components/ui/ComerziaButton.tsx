import React from "react";

// Definimos los "sabores" de botones
type ButtonVariant = "error" | "success" | "primary" | "secondary" | "save" | "delete" | "ghost" | "neutral" | "accent" | "info" | "warning";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: React.ReactNode;
  fullWidth?: boolean; // Nueva prop para forzar ancho completo si se necesita
}

export const ComerziaButton = ({ 
  label, 
  variant = "primary", 
  isLoading = false, 
  icon,
  fullWidth = false, // Por defecto no ocupa todo, pero respeta el min-width
  className = "",
  ...props 
}: Props) => {

const getVariantClass = () => {
    switch (variant) {
      // TUS CLASES PERSONALIZADAS (Blindadas contra cambios de tema)
      case "save": return "btn-comerzia-save text-white border-none"; 
      case "delete": return "btn-comerzia-delete text-white border-none";
      case "neutral": return "btn-comerzia-neutral text-white border-none";
      
      // NUEVAS CLASES MAPEADAS
      case "info": return "btn-comerzia-info text-white border-none";
      case "success": return "btn-comerzia-success text-white border-none";
      case "warning": return "btn-comerzia-warning text-white border-none";
      case "error": return "btn-comerzia-error text-white border-none";

      // Estos suelen ser seguros dejarlos default, pero si fallan, hazles su clase también
      case "primary": return "btn-primary text-white"; 
      case "secondary": return "btn-secondary text-white";
      case "accent": return "btn-accent text-white";
      
      case "ghost": return "btn-ghost"; 
      default: return "btn-primary text-white";
    }
};

  const getIcon = () => {
    if (isLoading) return <span className="loading loading-spinner"></span>;
    if (icon) return icon;
    
    if (variant === "save") return (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
    );
    if (variant === "delete") return (
       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    );
    return null;
  };

  return (
    <button 
      className={`
        btn 
        ${getVariantClass()} 
        ${fullWidth ? "w-full" : "min-w-[120px]"}  
        gap-2 
        ${className}
      `} 
      disabled={isLoading || props.disabled}
      {...props}
    >
      {getIcon()}
      {label}
    </button>
  );
};