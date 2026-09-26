import React, { forwardRef } from "react";
import { IconRenderer } from "./IconRenderer";
import { useShake } from "../../hooks/useShake";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: string | React.ReactNode;
  rightAction?: React.ReactNode;
  isRequired?: boolean;
  shakeKey?: number;
  helperText?: React.ReactNode;
  uppercase?: boolean;
}

export const ComerziaInput = forwardRef<HTMLInputElement, Props>(({ 
  label, error, icon, rightAction, isRequired, shakeKey, helperText, uppercase, className = "", 
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
    if (typeof e.target.value === "string") {
      let trimmed = e.target.value.trim();
      if (uppercase) trimmed = trimmed.toUpperCase();

      if (trimmed !== e.target.value) {
        e.target.value = trimmed;
        if (e.currentTarget) e.currentTarget.value = trimmed;
        if (onChange) {
          const syntheticEvent = {
            ...e,
            target: e.target,
            currentTarget: e.currentTarget || e.target,
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onChange(syntheticEvent);
        }
      }
    }
    if (onBlur) onBlur(e);
  };

  return (
    // ❌ Fuera el key dinámico. ✅ Solo aplicamos la clase CSS.
    <div className={`form-control w-full min-w-0 ${isShaking ? "animate-shake" : ""}`}>
      {label && (
        <label className="label py-1 w-full min-w-0">
          <span className={`label-text font-semibold flex gap-1 ${error ? "text-error" : ""}`}>
              {label}
              {isRequired && <span className="text-error" title="Campo obligatorio">*</span>}
          </span>
        </label>
      )}
      
      <div className="relative flex items-center w-full min-w-0">
        <input
          ref={ref}
          className={`
            input input-bordered w-full min-w-0 transition-all duration-200
            bg-base-100 text-base-content
            border-base-300 hover:border-base-content/40
            focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-base-100
            shadow-2xs
            ${error ? "!border-error !ring-error/20 bg-error/5" : ""} 
            ${icon ? "pl-11" : "pl-4"} 
            ${rightAction ? "pr-11" : "pr-4"}
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
             {typeof icon === 'string' ? <IconRenderer iconName={icon} size={18} /> : icon}
          </div>
        )}

        {rightAction && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
             {rightAction}
          </div>
        )}
      </div>

      {/* Reorganización de Helper y Error para que no roben espacio si no existen */}
      {helperText && !error && (
        <label className="label py-1 pb-0 w-full min-w-0">
            <span className="label-text-alt text-base-content/60 whitespace-normal break-words w-full">{helperText}</span>
        </label>
      )}

      {error && (
        <label className="label py-1 pb-0 w-full min-w-0">
          <span className="label-text-alt text-error font-medium whitespace-normal break-words w-full text-xs leading-tight">{error}</span>
        </label>
      )}
    </div>
  );
});

ComerziaInput.displayName = "ComerziaInput";