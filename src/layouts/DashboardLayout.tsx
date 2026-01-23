import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarMenu } from "../components/layout/SidebarMenu";
import { getMyMenuTree } from "../services/menuService";
import type { MenuItem } from "../features/auth/types";
import { Header } from "../components/layout/Header"; // <--- Importamos el nuevo Header
import { useAuthStore } from "../stores/useAuthStore"; // <--- Importamos el store

export const DashboardLayout = () => {
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  
  // Obtenemos la función para cargar perfil del store
  const fetchUserProfile = useAuthStore(state => state.fetchUserProfile);

  useEffect(() => {
    // 1. Cargamos el Menú
    getMyMenuTree()
        .then(setMenuTree)
        .finally(() => setLoadingMenu(false));

    // 2. Cargamos el Perfil del Usuario (Aquí ocurre la magia)
    fetchUserProfile();

  }, []); // Se ejecuta solo una vez al montar el layout

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      
      <div className="drawer-content flex flex-col bg-base-100 min-h-screen">
        
        {/* Usamos nuestro nuevo componente HEADER */}
        {/* Nota: El botón de menú móvil lo movemos dentro del Header si quieres, 
            o lo dejas flotante. Por diseño 'Zarvis', el header suele estar limpio. */}
        <Header />

        <div className="p-6 fade-in flex-1 bg-base-200/30">
            <Outlet /> 
        </div>
      </div> 
      
      <div className="drawer-side z-40">
        <label htmlFor="my-drawer-2" className="drawer-overlay"></label> 
        <SidebarMenu menuTree={menuTree} isLoading={loadingMenu} />
      </div>
    </div>
  );
};