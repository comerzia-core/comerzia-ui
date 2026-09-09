import React, { forwardRef } from "react";
import { useShake } from "../../hooks/useShake";

export interface SelectOption {
    value: string | number;
    label: string;
}

interface Props extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: SelectOption[];
    error?: string;
    placeholder?: string;
    isLoading?: boolean;
    enableDefaultOption?: boolean; 
    isRequired?: boolean;
    shakeKey?: number; 
}

export const ComerziaSelect = forwardRef<HTMLSelectElement, Props>(({ 
    label, options, error, isLoading, isRequired, shakeKey,
    placeholder = "Seleccione...", 
    enableDefaultOption = false,
    className = "",
    ...props 
}, ref) => {
    
    const isShaking = useShake(shakeKey);

    return (
        <div className={`form-control w-full ${isShaking ? "animate-shake" : ""}`}>
            {label && (
                <label className="label py-1">
                    <span className={`label-text font-semibold flex gap-1 ${error ? "text-error" : ""}`}>
                        {label}
                        {isRequired && <span className="text-error" title="Campo obligatorio">*</span>}
                    </span>
                </label>
            )}
            
            <select 
                ref={ref}
                className={`
                    select select-bordered w-full transition-all duration-200
                    bg-base-100 text-base-content
                    border-base-300 hover:border-base-content/40
                    focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-base-100
                    shadow-2xs
                    ${error ? "!border-error !ring-error/20 bg-error/5" : ""} 
                    ${className}
                `} 
                disabled={isLoading}
                // Si React Hook Form envía un valor o defaultValue, se aplica naturalemente aquí
                {...props} 
            >
                {/* Opción Placeholder neutral (value vacío) */}
                <option disabled={isLoading || !enableDefaultOption} value="">
                    {isLoading ? "Cargando..." : placeholder}
                </option>
                
                {!isLoading && options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {error && (
                <label className="label py-1 pb-0">
                    <span className="label-text-alt text-error font-medium">{error}</span>
                </label>
            )}
        </div>
    );
});

ComerziaSelect.displayName = "ComerziaSelect";