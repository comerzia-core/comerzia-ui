import { Construction, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ComerziaButton } from "../../../components/ui/ComerziaButton";
import { BtnBack } from "../../../components/ui/CrudButtons";

export const UnderConstruction = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[65vh] text-center px-4 space-y-5 animate-fade-in">
      <div className="p-5 bg-warning/10 border border-warning/20 rounded-full text-warning shadow-lg shadow-warning/10 animate-bounce">
        <Construction size={56} strokeWidth={1.75} />
      </div>

      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-base-content tracking-tight">
          Módulo en Construcción
        </h1>
        <p className="text-xs sm:text-sm text-base-content/60 leading-relaxed">
          Esta funcionalidad ya se encuentra registrada en el sistema, pero su vista e interfaz gráfica se encuentran actualmente en fase de programación activa.
        </p>
      </div>

      <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2 w-full max-w-xs sm:max-w-none sm:w-auto">
        <BtnBack 
          label="Volver Atrás"
          onClick={() => navigate(-1)}
          className="w-full sm:w-auto"
        />
        <ComerziaButton 
          variant="primary"
          label="Ir al Inicio"
          icon={<Home size={18} />}
          onClick={() => navigate('/dashboard', { replace: true })}
          className="w-full sm:w-auto"
        />
      </div>
    </div>
  );
};