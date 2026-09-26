import { forwardRef, useEffect, useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    label: string;
    error?: string;
    shakeKey?: number; // Para activar la animación de error
    isRequired?: boolean;
}

export const ComerziaTextarea = forwardRef<HTMLTextAreaElement, Props>(
    ({ label, error, className = "", shakeKey = 0, isRequired, onChange, onBlur, ...props }, ref) => {
        
        // Lógica de animación "Shake" (idéntica a TravesiaInput)
        const [isShaking, setIsShaking] = useState(false);
        useEffect(() => {
            if (shakeKey > 0) {
                setIsShaking(true);
                const timer = setTimeout(() => setIsShaking(false), 500);
                return () => clearTimeout(timer);
            }
        }, [shakeKey]);

        const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
            if (typeof e.target.value === "string") {
                const trimmed = e.target.value.trim();
                if (trimmed !== e.target.value) {
                    e.target.value = trimmed;
                    if (e.currentTarget) e.currentTarget.value = trimmed;
                    if (onChange) {
                        const syntheticEvent = {
                            ...e,
                            target: e.target,
                            currentTarget: e.currentTarget || e.target,
                        } as unknown as React.ChangeEvent<HTMLTextAreaElement>;
                        onChange(syntheticEvent);
                    }
                }
            }
            if (onBlur) onBlur(e);
        };

        return (
            <div className={`form-control w-full min-w-0 ${isShaking ? 'animate-shake' : ''}`}>
                {/* LABEL */}
                <label className="label py-1 w-full min-w-0">
                    <span className="label-text font-medium flex gap-1">
                        {label}
                        {isRequired && <span className="text-error">*</span>}
                    </span>
                </label>

                {/* TEXTAREA */}
                <textarea
                    ref={ref}
                    className={`
                        textarea textarea-bordered 
                        w-full min-w-0 h-24 px-4 py-3
                        bg-base-100 text-base-content
                        border-base-300 hover:border-base-content/40
                        focus:border-primary focus:ring-2 focus:ring-primary/20 focus:bg-base-100
                        shadow-2xs
                        transition-all duration-200
                        ${error ? '!border-error !ring-error/20 bg-error/5' : ''}
                        ${className}
                    `}
                    onChange={onChange}
                    onBlur={handleBlur}
                    {...props}
                />

                {/* MENSAJE DE ERROR */}
                {error && (
                    <label className="label py-1 pb-0 w-full min-w-0">
                        <span className="label-text-alt text-error font-medium whitespace-normal break-words w-full text-xs leading-tight flex items-center gap-1">
                            <AlertCircle size={12} className="shrink-0" />
                            <span>{error}</span>
                        </span>
                    </label>
                )}
            </div>
        );
    }
);

ComerziaTextarea.displayName = "ComerziaTextarea";