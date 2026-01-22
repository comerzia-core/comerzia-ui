import { NavLink, useLocation } from "react-router-dom";
import type { MenuItem } from "../../features/auth/types";
import { IconRenderer } from "../ui/IconRenderer";
// import { ChevronRight } from "lucide-react"; // Flecha bonita

const MenuItemRenderer = ({ item }: { item: MenuItem }) => {
    const location = useLocation();
    const hasChildren = item.children && item.children.length > 0;
    
    // Lógica para saber si este menú debe estar abierto
    // Si la URL actual empieza con la ruta de alguno de mis hijos, debo estar abierto.
    const isActiveParent = hasChildren && item.children?.some(child => 
        location.pathname.startsWith(child.route)
    );

    // Lógica para saber si soy el item activo (solo para hijos o items sin hijos)
    const isActiveLink = item.route && location.pathname === item.route;

    // ESTILO TIPO "ZARVIS"
    const baseLinkClass = `
        flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
        text-sm font-medium
    `;

    const activeLinkClass = "bg-primary/10 text-primary font-bold"; // Fondo suave y texto color primario
    const inactiveLinkClass = "text-base-content/70 hover:bg-base-200 hover:text-base-content";

    // CASO 1: SUBMENÚ (Padre)
    if (hasChildren) {
        return (
            <li className="mb-1">
                {/* Usamos el details de HTML pero forzamos el 'open' inicial si es el padre activo */}
                <details open={isActiveParent} className="group">
                    <summary className={`
                        list-none cursor-pointer flex items-center justify-between
                        ${baseLinkClass} ${isActiveParent ? 'text-primary' : 'text-base-content/80'}
                        hover:bg-base-200
                    `}>
                        <div className="flex items-center gap-3">
                            <IconRenderer iconName={item.icon} size={20} />
                            <span>{item.name}</span>
                        </div>
                        
                        {/* Nuestra flecha personalizada que rota con CSS */}
                        {/* <ChevronRight 
                            size={16} 
                            className="transition-transform duration-300 group-open:rotate-90"
                        /> */}
                    </summary>
                    
                    {/* Lista de Hijos con indentación y línea guía */}
                    <ul className="pl-4 mt-1 border-l-2 border-base-200 ml-6 space-y-1">
                        {item.children!.map((child) => (
                            <MenuItemRenderer key={child.id} item={child} />
                        ))}
                    </ul>
                </details>
            </li>
        );
    }

    // CASO 2: ENLACE DIRECTO (Hijo o Root simple)
    return (
        <li className="mb-1">
            <NavLink 
                to={item.route || "#"}
                className={({ isActive }) => `
                    ${baseLinkClass}
                    ${isActive ? activeLinkClass : inactiveLinkClass}
                `}
            >
                {/* Si es activo, mostramos un puntito o cambiamos el icono */}
                <IconRenderer iconName={item.icon} size={20} />
                <span>{item.name}</span>
                
                {/* "Puntito" estilo Zarvis si está activo */}
                {isActiveLink && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-primary shadow-lg shadow-primary/50"></span>
                )}
            </NavLink>
        </li>
    );
};

// ... (El resto del componente SidebarMenu container sigue igual) ...
// Solo asegúrate de importar MenuItemRenderer arriba
interface Props {
    menuTree: MenuItem[];
    isLoading: boolean;
}

export const SidebarMenu = ({ menuTree, isLoading }: Props) => {
    if (isLoading) {
         return <div className="p-4 space-y-4">{/* Skeletons... */}</div>;
    }

    return (
        <aside className="bg-base-200 w-80 h-full flex flex-col border-r border-base-300">
            {/* 1. HEADER FIJO (Logo) */}
            <div className="h-16 flex items-center gap-3 px-6 border-b border-base-300 bg-base-200 shrink-0">
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-content font-bold shadow-lg shadow-primary/40">
                    C
                </div>
                <span className="text-xl font-bold tracking-wide text-base-content">Comerzia</span>
            </div>

            {/* 2. AREA SCROLLABLE (La lista del menú) */}
            {/* 'flex-1' toma el espacio restante, 'overflow-y-auto' permite scroll solo aquí */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden py-4 custom-scrollbar">
                <ul className="menu px-4 w-full">
                    {Array.isArray(menuTree) && menuTree.map((item) => (
                        <MenuItemRenderer key={item.id} item={item} />
                    ))}
                </ul>
            </div>

            {/* 3. FOOTER FIJO (Opcional: Versión o Usuario) */}
            <div className="p-4 border-t border-base-300 bg-base-200 shrink-0">
                <p className="text-xs text-center opacity-50">v1.0.0 Enterprise</p>
            </div>
        </aside>
    );
};