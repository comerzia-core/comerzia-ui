import type { ReactNode } from "react";
import { Check } from "lucide-react";
interface Props {
    title: string;
    description?: string;
    selected: boolean;
    onClick: () => void;
    icon?: ReactNode;
    className?: string;
}
export const ComerziaSelectableCard = ({ title, description, selected, onClick, icon, className = "" }: Props) => {
    return (
        <label
            className={`
                cursor-pointer border rounded-xl p-4 flex gap-4 transition-all items-start relative overflow-hidden group
                ${selected
                    ? 'border-primary bg-primary/5 shadow-sm ring-1 ring-primary/20'
                    : 'border-base-300 bg-base-100 hover:border-base-content/30 hover:bg-base-200/50 hover:shadow-sm'
                }
                ${className}
            `}
            onClick={(e) => {
                e.preventDefault(); // Evitamos que el label haga focus a inputs internos y dispare clicks dobles
                onClick();
            }}
        >
            {/* Checkbox Oculto Visualmente (solo por semántica y accesibilidad si se desea, pero onClick maneja la acción) */}
            <input
                type="checkbox"
                className="sr-only"
                checked={selected}
                readOnly
            />
            {/* Icono Principal (Opcional) */}
            {icon && (
                <div className={`mt-0.5 p-2 rounded-lg ${selected ? 'bg-primary/10 text-primary' : 'bg-base-200 text-base-content/60 group-hover:text-base-content/80'}`}>
                    {icon}
                </div>
            )}
            {/* Contenido de Textos */}
            <div className="flex flex-col flex-1 min-w-0 pr-6">
                <span className={`font-bold text-sm leading-tight transition-colors ${selected ? 'text-primary' : 'text-base-content'}`}>
                    {title}
                </span>
                {description && (
                    <span className="text-xs text-base-content/60 mt-1 leading-relaxed line-clamp-2">
                        {description}
                    </span>
                )}
            </div>
            {/* Indicador Check de Selección */}
            <div className={`
                absolute top-4 right-4 flex items-center justify-center w-5 h-5 rounded-full transition-all duration-300
                ${selected ? 'bg-primary text-primary-content scale-100' : 'bg-base-300 text-transparent scale-75 opacity-0 group-hover:opacity-50'}
            `}>
                <Check size={12} strokeWidth={3} />
            </div>

        </label>
    );
};
