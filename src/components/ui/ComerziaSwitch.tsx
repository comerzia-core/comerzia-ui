interface Props {
    checked: boolean;
    onChange: () => void;
    isLoading?: boolean;
    disabled?: boolean;
    className?: string;
}

export const ComerziaSwitch = ({ checked, onChange, isLoading = false, disabled = false, className = "" }: Props) => {
    // Si está cargando o deshabilitado, bloqueamos el clic
    const isInteractive = !isLoading && !disabled;

    const handleClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (isInteractive) {
            onChange();
        }
    };

    return (
        <div
            onClick={handleClick}
            className={`
                relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 cursor-pointer border-2
                ${checked
                    ? 'bg-success border-success' // ENCENDIDO: Verde
                    : 'bg-base-300 border-base-300 hover:bg-base-400' // APAGADO: Gris
                } 
                ${!isInteractive ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}
            `}
            title={checked ? "Activo" : "Inactivo"}
        >
            {/* CÍRCULO INTERNO (THUMB) */}
            <span
                className={`
                    inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-300
                    ${checked ? 'translate-x-5' : 'translate-x-0.5'}
                    ${isLoading ? 'animate-pulse' : ''}
                `}
            />
        </div>
    );
};