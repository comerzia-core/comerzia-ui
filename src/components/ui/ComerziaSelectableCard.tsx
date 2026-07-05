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
                cursor-pointer border rounded-2xl p-5 flex gap-4 transition-all duration-300 ease-out items-center relative overflow-hidden group
                ${selected
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/10 ring-2 ring-primary translate-y-[1px]'
                    : 'border-base-300 bg-base-100 hover:border-primary/50 hover:bg-base-200/50 hover:shadow-xl hover:-translate-y-1'
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
                <div className={`flex items-center justify-center rounded-xl transition-all duration-300 ${selected ? 'text-primary scale-110 drop-shadow-sm' : 'text-base-content/50 group-hover:text-primary group-hover:scale-110'}`}>
                    {icon}
                </div>
            )}
            {/* Contenido de Textos */}
            <div className="flex flex-col flex-1 min-w-0 pr-8">
                <span className={`font-bold text-base leading-tight transition-colors duration-300 ${selected ? 'text-primary' : 'text-base-content group-hover:text-primary'}`}>
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
                absolute top-1/2 -translate-y-1/2 right-4 flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300
                ${selected ? 'bg-primary text-primary-content scale-100 shadow-md' : 'bg-base-300 text-base-content/20 scale-75 opacity-0 group-hover:opacity-100 group-hover:scale-90 group-hover:bg-primary/20 group-hover:text-primary'}
            `}>
                <Check size={14} strokeWidth={3} />
            </div>

        </label>
    );
};
