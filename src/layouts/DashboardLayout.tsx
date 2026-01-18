import { Outlet } from "react-router-dom";

export const DashboardLayout = () => {
  return (
    // Estructura "Drawer" de DaisyUI
    <div className="drawer lg:drawer-open">
      <input id="my-drawer-2" type="checkbox" className="drawer-toggle" />
      
      {/* CONTENIDO PRINCIPAL (Derecha) */}
      <div className="drawer-content flex flex-col bg-base-100">
        
        {/* Navbar Superior */}
        <div className="w-full navbar bg-base-300">
          <div className="flex-none lg:hidden">
            <label htmlFor="my-drawer-2" className="btn btn-square btn-ghost">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" className="inline-block w-6 h-6 stroke-current"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </label>
          </div>
          <div className="flex-1 px-2 mx-2 text-xl font-bold">Comerzia ERP</div>
        </div>

        {/* Aquí se inyectan las páginas (Como el <ui:insert> de JSF) */}
        <div className="p-6">
            <Outlet /> 
        </div>
      
      </div> 
      
      {/* SIDEBAR (Izquierda) */}
      <div className="drawer-side">
        <label htmlFor="my-drawer-2" className="drawer-overlay"></label> 
        <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
          {/* Logo o Título del Sidebar */}
          <li className="mb-4 text-2xl font-bold px-4">Comerzia</li>
          
          {/* Opciones del Menú */}
          <li><a>Dashboard</a></li>
          <li><a>Inventario</a></li>
          <li><a>Ventas</a></li>
          <li><a>Usuarios</a></li>
        </ul>
      
      </div>
    </div>
  );
};