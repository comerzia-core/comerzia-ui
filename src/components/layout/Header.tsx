import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../stores/useAuthStore";
import { useCurrentTime } from "../../hooks/useCurrentTime";
import { LogOut, User as UserIcon, Settings, Shield, HelpCircle, Menu } from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";
import { 
    BtnModalYes, 
    BtnModalNo 
} from "../ui/CrudButtons";

export const Header = () => {
  const userProfile = useAuthStore((state) => state.userProfile);
  const logout = useAuthStore((state) => state.logout);
  const currentTime = useCurrentTime();
  const navigate = useNavigate();

  const initials = userProfile?.firstName 
    ? `${userProfile.firstName[0]}${userProfile.paternalLastName?.[0] || ''}`
    : "US";

  const openLogoutModal = () => {
    const modal = document.getElementById('logout_modal') as HTMLDialogElement;
    if (modal) modal.showModal();
  };

  const handleConfirmLogout = () => {
    logout();
    navigate('/login');
  };

  // Función auxiliar para cerrar el menú manualmente al hacer clic en un link
  // (Aunque el comportamiento nativo de perder foco suele hacerlo, esto asegura UX perfecta)
  const closeDropdown = () => {
    const elem = document.activeElement as HTMLElement;
    if (elem) {
      elem.blur();
    }
  };

  return (
    <>
      <div className="h-16 flex items-center justify-between px-4 sm:px-6 border-b border-base-300 bg-base-100 sticky top-0 z-30 shadow-sm">
        
        {/* IZQUIERDA */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1 mr-2">
            
            {/* BOTÓN HAMBURGUESA (Solo visible en Móvil 'lg:hidden') */}
            <label htmlFor="my-drawer" className="btn btn-square btn-ghost btn-sm sm:btn-md lg:hidden text-base-content shrink-0">
                <Menu size={22} />
            </label>

            <div className="flex flex-col min-w-0 justify-center">
                <h1 className="text-sm sm:text-base font-bold text-base-content leading-tight truncate" title={`Hola, ${userProfile?.firstName || 'Usuario'}`}>
                    Hola, {userProfile?.firstName || 'Usuario'}
                </h1>
                <p className="text-[11px] sm:text-xs text-base-content/60 font-medium capitalize truncate leading-tight mt-0.5">
                    {currentTime}
                </p>
            </div>
        </div>
        
        {/* DERECHA */}
        <div className="flex items-center gap-2 shrink-0">

          {/* --- DROPDOWN (MODO CLICK) --- */}
          {/* Quitamos 'dropdown-hover' y 'group' */}
          <div className="dropdown dropdown-end">
            
            {/* TRIGGER */}
            <label tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar placeholder ring-2 ring-transparent hover:ring-primary transition-all">
              <div className="bg-neutral text-neutral-content rounded-full w-10">
                {userProfile?.imageUrl ? (
                     <img src={userProfile.imageUrl} alt="Avatar" />
                ) : (
                    <span className="text-xl">{initials}</span>
                )}
              </div>
            </label>

            {/* CONTENIDO */}
            {/* Quitamos los hacks de 'before:' y ajustamos mt */}
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow-lg bg-base-100 rounded-box w-64 border border-base-200">
              
              <li className="menu-title px-4 py-2">
                <span className="block text-sm font-bold text-base-content">
                    {userProfile?.fullName}
                </span>
                <span className="block text-xs font-normal opacity-50 truncate">
                    {userProfile?.email}
                </span>
              </li>

              <div className="divider my-0"></div>

              <li>
                <Link to="/profile" className="py-3" onClick={closeDropdown}>
                  <UserIcon size={18} />
                  Mi Perfil
                  <span className="badge badge-ghost badge-sm ml-auto">Editar</span>
                </Link>
              </li>

              <li>
                <Link to="/settings" className="py-3" onClick={closeDropdown}>
                  <Settings size={18} />
                  Configuración
                </Link>
              </li>

              <li>
                <Link to="/security/audit" className="py-3" onClick={closeDropdown}>
                  <Shield size={18} />
                  Actividad
                </Link>
              </li>

              <div className="divider my-0"></div>

              {/* TEMA (Con el toggle corregido) */}
              <li>
                <div className="py-3 flex justify-between active:bg-transparent hover:bg-transparent cursor-default">
                   <div className="flex items-center gap-2">
                        <HelpCircle size={18} className="opacity-0" /> 
                        <span className="-ml-6">Tema</span>
                   </div>
                   {/* stopPropagation evita que el clic en el switch cierre el menú */}
                   <div onClick={(e) => e.stopPropagation()}> 
                      <ThemeToggle />
                   </div>
                </div>
              </li>

              <div className="divider my-0"></div>

              <li>
                <button 
                    onClick={() => { closeDropdown(); openLogoutModal(); }} 
                    className="text-error hover:bg-error/10 hover:text-error py-3 font-bold"
                >
                  <LogOut size={18} />
                  Cerrar Sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* MODAL LOGOUT (Sin cambios) */}
      <dialog id="logout_modal" className="modal modal-bottom sm:modal-middle">
        <div className="modal-box">
          <h3 className="font-bold text-lg text-error flex items-center gap-2">
            <LogOut /> ¿Cerrar Sesión?
          </h3>
          <p className="py-4">
            ¿Estás seguro de que quieres salir del sistema?
          </p>
          <div className="modal-action">
            {/* Opción NO (Cierra el modal) */}
            <form method="dialog">
              <BtnModalNo label="No, Cancelar" />
            </form>
            
            {/* Opción SI (Ejecuta la acción) */}
            <BtnModalYes 
                label="Sí, Cerrar Sesión" 
                onClick={handleConfirmLogout} 
            />
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
            <button>close</button>
        </form>
      </dialog>
    </>
  );
};