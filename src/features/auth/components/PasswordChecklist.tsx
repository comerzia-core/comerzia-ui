import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";

interface Props {
    passwordValue?: string;
    showErrors: boolean; // Se activa cuando el usuario intenta enviar sin cumplir
}

export const PasswordChecklist = ({ passwordValue = "", showErrors }: Props) => {
    // Evaluamos las reglas en tiempo real blindando contra cualquier valor no string
    const val = typeof passwordValue === 'string' ? passwordValue : '';

    const validations = useMemo(() => [
        { 
            id: 'length', 
            label: "Entre 8 y 64 caracteres", 
            isValid: val.length >= 8 && val.length <= 64 
        },
        { 
            id: 'uppercase', 
            label: "Al menos una letra mayúscula", 
            isValid: /[A-Z]/.test(val) 
        },
        { 
            id: 'lowercase', 
            label: "Al menos una letra minúscula", 
            isValid: /[a-z]/.test(val) 
        },
        { 
            id: 'number', 
            label: "Al menos un número", 
            isValid: /\d/.test(val) 
        }
    ], [val]);

    return (
        <div className="bg-base-200/50 rounded-xl p-4 border border-base-200 space-y-2 mt-4 animate-fade-in">
            <h4 className="text-xs font-bold uppercase tracking-wider text-base-content/70 mb-2">Requisitos de la contraseña:</h4>
            <ul className="space-y-1.5">
                {validations.map((rule) => {
                    const isError = showErrors && !rule.isValid;
                    
                    let textColor = "text-base-content/50";
                    if (rule.isValid) textColor = "text-success font-medium";
                    else if (isError) textColor = "text-error font-medium";

                    return (
                        <li key={rule.id} className={`flex items-center gap-2 text-xs sm:text-sm transition-colors ${textColor}`}>
                            {rule.isValid ? (
                                <CheckCircle2 size={16} className="text-success shrink-0" />
                            ) : (
                                <XCircle size={16} className={`shrink-0 ${isError ? "text-error" : "opacity-40"}`} />
                            )}
                            <span>{rule.label}</span>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};