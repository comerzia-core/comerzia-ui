import React, { forwardRef } from "react";

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

// ✅ forwardRef es obligatorio para usar con react-hook-form
export const TravesiaSelect = forwardRef<HTMLSelectElement, Props>(({ 
    label, options, error, isLoading, isRequired, shakeKey,
    placeholder = "Seleccione...", 
    enableDefaultOption = false,
    className,
    ...props 
}, ref) => {
    
    // Clonamos los props para manipularlos de forma segura
    const selectProps = { ...props };

    // 🚀 MAGIA SENIOR: Soporte dual para Controlled y Uncontrolled
    if ('value' in props) {
        // MODO CONTROLADO (useState o Controller):
        // Garantizamos que nunca sea null/undefined para que no de errores
        selectProps.value = props.value ?? "";
    } else {
        // MODO NO CONTROLADO (react-hook-form con register directo):
        // Forzamos que inicie vacío (defaultValue) para que caiga en el placeholder 
        // y no en la 1ra opción visualmente.
        if (!('defaultValue' in props)) {
            selectProps.defaultValue = "";
        }
    }

    return (
        <div 
            key={error && shakeKey ? `err-${shakeKey}` : undefined}
            className={`form-control w-full ${error ? "animate-shake" : ""}`}
        >
            {label && (
                <label className="label">
                    <span className={`label-text font-semibold flex gap-1 ${error ? "text-error" : ""}`}>
                        {label}
                        {isRequired && <span className="text-error" title="Campo obligatorio">*</span>}
                    </span>
                </label>
            )}
            
            <select 
                ref={ref} // ✅ Asignamos el ref al DOM real
                className={`select select-bordered w-full ${error ? "select-error bg-error/5" : ""} ${className || ''}`} 
                disabled={isLoading}
                {...selectProps} // ✅ Pasamos los props inteligentemente procesados
            >
                {/* Opción Placeholder */}
                <option disabled={isLoading || !enableDefaultOption} value="">
                    {isLoading ? "Cargando datos..." : placeholder}
                </option>
                
                {/* Lista de Opciones */}
                {!isLoading && options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>

            {error && (
                <label className="label">
                    <span className="label-text-alt text-error font-medium">{error}</span>
                </label>
            )}
        </div>
    );
});

TravesiaSelect.displayName = "TravesiaSelect";