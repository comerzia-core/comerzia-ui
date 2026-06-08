import { FileQuestion } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4 animate-fade-in">
      {/* Icono envuelto con colores neutros/warning */}
      <div className="p-4 bg-base-300/50 rounded-full text-base-content/70">
        <FileQuestion size={72} strokeWidth={1.5} />
      </div>
      
      <h1 className="text-6xl font-black text-base-content tracking-tighter">
        404
      </h1>
      
      <h2 className="text-2xl font-bold text-base-content">
        Page Not Found
      </h2>
      
      <p className="text-base-content/60 max-w-md">
        The page you are looking for doesn't exist or has been moved. 
        Please check the URL or navigate back to the dashboard.
      </p>
      
      <div className="flex gap-4 mt-6">
        <button 
            onClick={() => navigate(-1)} 
            className="btn btn-outline"
        >
          Go Back
        </button>
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