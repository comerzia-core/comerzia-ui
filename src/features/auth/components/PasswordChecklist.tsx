import { CheckCircle2, XCircle } from "lucide-react";
import { useMemo } from "react";

interface Props {
    passwordValue: string;
    showErrors: boolean; // Se activa cuando el usuario intenta enviar sin cumplir
}

export const PasswordChecklist = ({ passwordValue, showErrors }: Props) => {
    
    // Evaluamos las reglas en tiempo real
    const validations = useMemo(() => [
        { 
            id: 'length', 
            label: "Entre 8 y 64 caracteres", 
            isValid: passwordValue.length >= 8 && passwordValue.length <= 64 
        },
        { 
            id: 'uppercase', 
            label: "Al menos una letra mayúscula", 
            isValid: /[A-Z]/.test(passwordValue) 
        },
        { 
            id: 'lowercase', 
            label: "Al menos una letra minúscula", 
            isValid: /[a-z]/.test(passwordValue) 
        },
        { 
            id: 'number', 
            label: "Al menos un número", 
            isValid: /\d/.test(passwordValue) 
        }
    ], [passwordValue]);

    return (
        <div className="bg-base-200/50 rounded-xl p-4 border border-base-200 space-y-2 mt-4 animate-fade-in">
            <h4 className="text-sm font-bold text-base-content/80 mb-2">Password Requirements:</h4>
            <ul className="space-y-1.5">
                {validations.map((rule) => {
                    // Si intenta guardar y no es válido, se pone rojo. Si es válido, verde. Sino, neutral.
                    const isError = showErrors && !rule.isValid;
                    
                    let textColor = "text-base-content/50";
                    if (rule.isValid) textColor = "text-success font-medium";
                    else if (isError) textColor = "text-error font-medium";

                    return (
                        <li key={rule.id} className={`flex items-center gap-2 text-sm transition-colors ${textColor}`}>
                            {rule.isValid ? (
                                <CheckCircle2 size={16} className="text-success" />
                            ) : (
                                <XCircle size={16} className={isError ? "text-error" : "opacity-40"} />
                            )}
                            {rule.label}
                        </li>
                    );
                })}
            </ul>
        </div>
    );
};