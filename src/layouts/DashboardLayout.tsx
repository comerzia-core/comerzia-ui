import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ThemeToggle } from "../components/ui/ThemeToggle";
import { SidebarMenu } from "../components/layout/SidebarMenu"; // Importamos el componente nuevo
import { getMyMenuTree } from "../services/menuService";       // Importamos el servicio
import type { MenuItem } from "../features/auth/types";

export const DashboardLayout = () => {
  // Estado local para el menú
  const [menuTree, setMenuTree] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Cargamos el menú al iniciar
  useEffect(() => {
    const fetchMenu = async () => {
        try {
            const data = await getMyMenuTree();
            setMenuTree(data);
        } catch (error) {
            console.error("Error cargando el menú", error);
        } finally {
            setLoading(false);
        }
    };
    
    fetchMenu();
  }, []);

  return (
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      
      {/* CONTENIDO PRINCIPAL */}
      <div className="drawer-content flex flex-col bg-base-100">
        <div className="w-full navbar bg-base-300 flex justify-between">
          <div className="flex items-center">
             <div className="flex-none lg:hidden">
                <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                </label>
             </div>
             <div className="px-2 mx-2 text-xl font-bold">Comerzia ERP</div>
          </div>
          <div className="flex-none gap-2 px-2">
             <ThemeToggle />
             <div className="avatar placeholder">
                <div className="bg-neutral text-neutral-content rounded-full w-10">
                    <span className="text-xs">UI</span>
                </div>
             </div>
          </div>
        </div>

        <div className="p-6">
            <Outlet /> 
        </div>
      </div> 
      
      {/* SIDEBAR DINÁMICO */}
      <div className="drawer-side">
        <label htmlFor="my-drawer-2" className="drawer-overlay"></label> 
        
        {/* Aquí usamos el componente recursivo */}
        <SidebarMenu menuTree={menuTree} isLoading={loading} />
      
      </div>
    </div>
  );
};