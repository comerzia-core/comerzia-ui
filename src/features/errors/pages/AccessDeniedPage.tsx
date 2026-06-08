import { ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const AccessDeniedPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4 animate-fade-in">
      {/* Icono envuelto en un círculo con color de error (Rojo/Peligro) */}
      <div className="p-4 bg-error/10 rounded-full text-error">
        <ShieldAlert size={64} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-3xl font-bold text-base-content">
        Access Denied
      </h1>
      
      <p className="text-base-content/60 max-w-md">
        You do not have the necessary permissions to view this module or perform this action. 
        If you believe this is a mistake, please contact your system administrator.
      </p>
      
      <div className="flex gap-4 mt-4">
        {/* Botón para regresar a la página anterior */}
        <button 
            onClick={() => navigate(-1)} 
            className="btn btn-outline"
        >
          Go Back
        </button>
        
        {/* Botón de seguridad para volver al inicio */}
        <button 
            onClick={() => navigate('/dashboard', { replace: true })} 
            className="btn btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};