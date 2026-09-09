import { FileQuestion, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ComerziaButton } from "../../../components/ui/ComerziaButton";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-4 animate-fade-in">
      {/* Icono envuelto con colores neutros */}
      <div className="p-5 bg-base-200/80 border border-base-300 rounded-full text-base-content/60 shadow-md">
        <FileQuestion size={60} strokeWidth={1.75} />
      </div>
      
      <div className="space-y-1">
        <span className="text-6xl sm:text-7xl font-black text-primary tracking-tighter block">
          404
        </span>
        <h2 className="text-xl sm:text-2xl font-bold text-base-content">
          Página No Encontrada
        </h2>
      </div>
      
      <p className="text-xs sm:text-sm text-base-content/60 max-w-md leading-relaxed">
        La dirección URL solicitada no existe, fue eliminada o movida a otra ubicación.
        Por favor verifica la ruta o regresa a la vista principal.
      </p>
      
      <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-3 w-full max-w-xs sm:max-w-none sm:w-auto">
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