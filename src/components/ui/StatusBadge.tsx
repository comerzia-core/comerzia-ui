import { ComerziaBadge } from "./ComerziaBadge";
import { STATUS_COLOR_MAP } from "../../config/badgeConfig";

interface Props {
    statusName: string;
    statusCode: number; // El código que viene del backend (ej. 901)
}

export const StatusBadge = ({ statusName, statusCode }: Props) => {
    
    // Buscamos el color en el mapa global. 
    // Si el backend nos manda un código que aún no hemos mapeado, usamos "ghost" por defecto.
    const variant = STATUS_COLOR_MAP[statusCode] || "ghost";

    return (
        <ComerziaBadge 
            label={statusName} 
            variant={variant} 
        />
    );
};