import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { SidebarMenu } from "../components/layout/SidebarMenu";
import { Header } from "../components/layout/Header"; 
import { useAuthStore } from "../stores/useAuthStore"; 

export const DashboardLayout = () => {
  // 1. Consumimos datos y acciones directamente del Estado Global
  const { menuTree, isSessionReady, initializeSession } = useAuthStore();

  // 2. Estado local estrictamente para la UI
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  useEffect(() => {
    // Si el usuario entra por primera vez o recarga la página (F5), 
    // la RAM estará vacía. Disparamos la orquestación.
    if (!isSessionReady) {
        initializeSession();
    }
  }, [isSessionReady, initializeSession]); 

  // --- PANTALLA DE CARGA GLOBAL ---
  // Mientras esperamos que Promise.all (Perfil + Menú) termine, mostramos un spinner.
  // Esto evita parpadeos y que el usuario vea un Sidebar vacío por medio segundo.
  if (!isSessionReady) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-base-100">
              <div className="flex flex-col items-center gap-4">
                  <span className="loading loading-bars loading-lg text-primary"></span>
                  <p className="text-base-content/70 font-medium animate-pulse">
                      Loading workspace...
                  </p>
              </div>
          </div>
      );
  }

  // --- RENDERIZADO DEL DASHBOARD PROTEGIDO ---
  return (
    <div className="drawer lg:drawer-open bg-base-100 min-h-screen font-sans">
      
      <input id="my-drawer" type="checkbox" className="drawer-toggle" />
      
      {/* --- CONTENIDO DERECHO (Header + Página) --- */}
      <div className="drawer-content flex flex-col h-screen overflow-hidden">
        
        <Header />

        <main className="flex-1 overflow-y-auto bg-base-200/50 p-4 md:p-6 relative fade-in">
            <Outlet /> 
        </main>
      </div> 
      
      {/* --- SIDEBAR IZQUIERDO --- */}
      <div className="drawer-side z-40">
        <label htmlFor="my-drawer" aria-label="close sidebar" className="drawer-overlay"></label> 
        
        <SidebarMenu 
            menuTree={menuTree} 
            // Ya no le pasamos loading al Sidebar, porque el Layout detiene el renderizado hasta estar listo
            isLoading={false} 
            isCollapsed={isSidebarCollapsed}
            toggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>
    </div>
  );
};