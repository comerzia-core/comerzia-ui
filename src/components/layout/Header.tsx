import { useAuthStore } from "../../stores/useAuthStore";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { Bell, User as UserIcon } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

export const Header = () => {
  const userProfile = useAuthStore((state) => state.userProfile);
  const currentTime = useCurrentTime();

  // Obtenemos iniciales para el avatar por si no hay foto
  const initials = userProfile?.firstName 
    ? `${userProfile.firstName[0]}${userProfile.paternalLastName?.[0] || ''}`
    : "US";

  return (
    <div className="navbar bg-base-100 px-6 py-4 border-b border-base-200 justify-between">
      
      {/* SECCIÓN IZQUIERDA: Saludo y Fecha */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-base-content">
          Hola, {userProfile?.firstName || 'Usuario'}
        </h1>
        <p className="text-sm text-base-content/60 font-medium mt-1 capitalize">
          {currentTime}
        </p>
      </div>

      {/* SECCIÓN DERECHA: Acciones y Perfil */}
      <div className="flex items-center gap-6">
        
        {/* Toggle de Tema (Ya lo tenías, lo movemos aquí) */}
        <ThemeToggle />

        {/* Notificaciones */}
        <div className="indicator cursor-pointer hover:scale-110 transition-transform">
          <span className="indicator-item badge badge-primary badge-xs ring-2 ring-base-100"></span> 
          <Bell className="w-6 h-6 text-base-content/70 hover:text-primary transition-colors" />
        </div>

        {/* Separador vertical */}
        <div className="h-8 w-px bg-base-300 mx-2"></div>

        {/* Perfil de Usuario */}
        <div className="flex items-center gap-3 cursor-pointer group">
            <div className="text-right hidden md:block">
                <p className="text-sm font-bold group-hover:text-primary transition-colors">
                    {userProfile?.username || 'Invitado'}
                </p>
                <p className="text-xs text-base-content/50">
                    {userProfile?.roles?.[0] || 'Sin Rol'}
                </p>
            </div>

            <div className="avatar placeholder ring-2 ring-base-200 ring-offset-2 ring-offset-base-100 rounded-xl group-hover:ring-primary transition-all">
                <div className="bg-neutral text-neutral-content rounded-xl w-10">
                    {userProfile?.imageUrl ? (
                         <img src={userProfile.imageUrl} alt="Avatar" />
                    ) : (
                        <span className="text-sm font-bold">{initials}</span>
                    )}
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};