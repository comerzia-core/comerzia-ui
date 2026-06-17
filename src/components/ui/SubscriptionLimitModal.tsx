// src/components/ui/SubscriptionLimitModal.tsx
import { ConfirmationModal } from './ConfirmationModal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  backendMessage: string; // El mensaje crudo en inglés que viene del backend
}

export const SubscriptionLimitModal = ({ isOpen, onClose, backendMessage }: Props) => {
  
  // Función que mapea la palabra clave del backend a nuestro texto en español
  const getLimitDetails = (msg: string) => {
    const lowerMsg = msg.toLowerCase() || '';

    if (lowerMsg.includes('branch')) {
      return {
        title: "Límite de Sucursales Alcanzado",
        message: "Tu plan actual ha llegado al máximo de sucursales permitidas. Para seguir creciendo y abrir nuevas ubicaciones, por favor mejora tu suscripción."
      };
    }
    
    if (lowerMsg.includes('user') || lowerMsg.includes('employee') || lowerMsg.includes('staff')) {
      return {
        title: "Límite de Usuarios Alcanzado",
        message: "Has alcanzado la cantidad máxima de personal permitida en tu plan. Mejora tu suscripción para integrar a más miembros a tu equipo."
      };
    }
    
    if (lowerMsg.includes('product')) {
      return {
        title: "Límite de Productos Alcanzado",
        message: "Tu catálogo está al límite de su capacidad actual. Actualiza tu plan para añadir más productos y expandir tu inventario."
      };
    }

    // Fallback genérico por si en el futuro agregan un límite nuevo en el backend
    return {
      title: "Límite de Suscripción Alcanzado",
      message: "Has alcanzado una de las restricciones de tu plan actual. Por favor, considera mejorar tu suscripción para continuar expandiendo tu operación."
    };
  };

  const details = getLimitDetails(backendMessage);

  return (
    <ConfirmationModal
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onClose} // Por ahora, el botón principal solo cierra (o podría llevar a la página de planes)
      title={details.title}
      message={
        <div className="flex flex-col gap-3 items-center">
          <p className="text-base-content/80 font-medium">
            {details.message}
          </p>
          {/* Un toque de diseño extra: Badge premium para incitar al Upgrade */}
          <div className="badge badge-warning gap-1 p-3 mt-2 text-xs font-bold uppercase shadow-sm">
            Requiere Upgrade
          </div>
        </div>
      }
      confirmText="Entendido"
      cancelText="Volver"
      variant="warning"
    />
  );
};