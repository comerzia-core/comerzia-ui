import React, { forwardRef } from "react";
import { IconRenderer } from "./IconRenderer";
import { useShake } from "../../hooks/useShake";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string;
  isRequired?: boolean;
  shakeKey?: number;
  helperText?: React.ReactNode;
  uppercase?: boolean;
}

export const ComerziaInput = forwardRef<HTMLInputElement, Props>(({ 
  label, error, icon, isRequired, shakeKey, helperText, uppercase, className = "", 
  onChange, onBlur, ...props 
}, ref) => {
  
  // ✅ Usamos nuestro hook sin destruir el DOM
  const isShaking = useShake(shakeKey);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (uppercase && e.target.value) {
      // Usar toUpperCase directo en el target puede hacer saltar el cursor al final
      // del input en algunos navegadores, pero es aceptable para códigos/referencias.
      e.target.value = e.target.value.toUpperCase(); 
    }
    if (onChange) onChange(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value) {
      e.target.value = e.target.value.trim();
      if (uppercase) e.target.value = e.target.value.toUpperCase();
    }
    if (onBlur) onBlur(e);
  };

  return (
    // ❌ Fuera el key dinámico. ✅ Solo aplicamos la clase CSS.
    <div className={`form-control w-full ${isShaking ? "animate-shake" : ""}`}>
      {label && (
        <label className="label py-1">
          <span className={`label-text font-semibold flex gap-1 ${error ? "text-error" : ""}`}>
              {label}
              {isRequired && <span className="text-error" title="Campo obligatorio">*</span>}
          </span>
        </label>
      )}
      
      <div className="relative">
        <input
          ref={ref}
          className={`
            input input-bordered w-full transition-colors
            focus:border-primary focus:ring-1 focus:ring-primary/20
            ${error ? "input-error bg-error/5" : ""} 
            ${icon ? "pl-10" : ""} 
            ${className}
          `}
          onChange={handleChange}
          onBlur={handleBlur}
          onWheel={(e) => {
            if (props.type === "number") (e.target as HTMLInputElement).blur();
          }}
          {...props}
        />

        {icon && (
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-base-content/50">
             <IconRenderer iconName={icon} size={18} />
          </div>
        )}
      </div>

      {/* Reorganización de Helper y Error para que no roben espacio si no existen */}
      {helperText && !error && (
        <label className="label py-1 pb-0 w-full">
            <span className="label-text-alt text-base-content/60 whitespace-normal break-words w-full">{helperText}</span>
        </label>
      )}

      {error && (
        <label className="label py-1 pb-0">
          <span className="label-text-alt text-error font-medium">{error}</span>
        </label>
      )}
    </div>
  );
});

ComerziaInput.displayName = "ComerziaInput";