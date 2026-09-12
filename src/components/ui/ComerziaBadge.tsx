type BadgeVariant = "success" | "warning" | "error" | "info" | "neutral" | "ghost" | "secondary" | "primary";

interface Props {
    label: string;
    variant?: BadgeVariant;
    className?: string;
}

export const ComerziaBadge = ({ label, variant = "ghost", className = "" }: Props) => {

    const getVariantClass = () => {
        switch (variant) {
            case "success": return "badge-success text-white border-0"; // Verde
            case "warning": return "badge-warning text-white border-0"; // Amarillo
            case "error": return "badge-error text-white border-0";   // Rojo
            case "info": return "badge-info text-white border-0";    // Azul
            case "secondary": return "badge-secondary text-white border-0"; // Morado / Secundario
            case "primary": return "badge-primary text-white border-0";   // Primario
            case "neutral": return "bg-base-300 text-base-content/60 border-0"; // Gris oscuro
            case "ghost":
            default: return "badge-ghost opacity-70 border-0";   // Gris claro
        }
    };

    return (
        <span className={`badge ${getVariantClass()} px-3 py-3 font-medium whitespace-nowrap ${className}`}>
            {label}
        </span>
    );
};