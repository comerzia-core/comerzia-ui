import { NavLink } from "react-router-dom";
import type { MenuItem } from "../../features/auth/types";
import { IconRenderer } from "../ui/IconRenderer";

// Sub-componente recursivo para renderizar un item individual
const MenuItemRenderer = ({ item }: { item: MenuItem }) => {
    const hasChildren = item.children && item.children.length > 0;

    // CASO 1: Tiene hijos (Es un submenú desplegable)
    if (hasChildren) {
        return (
            <li>
                <details open={false}> {/* open={true} si quieres que salgan expandidos */}
                    <summary>
                        <IconRenderer iconName={item.icon} />
                        {item.name}
                    </summary>
                    <ul>
                        {/* RECURSIVIDAD: Aquí se llama a sí mismo para pintar los hijos */}
                        {item.children!.map((child) => (
                            <MenuItemRenderer key={child.id} item={child} />
                        ))}
                    </ul>
                </details>
            </li>
        );
    }

    // CASO 2: No tiene hijos (Es un enlace directo)
    return (
        <li>
            <NavLink 
                to={item.route || "#"}
                className={({ isActive }) => isActive ? "active font-bold" : ""}
            >
                <IconRenderer iconName={item.icon} />
                {item.name}
            </NavLink>
        </li>
    );
};

// Componente Principal que recibe la lista completa
interface Props {
    menuTree: MenuItem[];
    isLoading: boolean;
}

export const SidebarMenu = ({ menuTree, isLoading }: Props) => {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-4 p-4">
                <div className="skeleton h-8 w-full"></div>
                <div className="skeleton h-8 w-full"></div>
                <div className="skeleton h-8 w-full"></div>
            </div>
        );
    }

    return (
        <ul className="menu p-4 w-80 min-h-full bg-base-200 text-base-content">
            {/* Título Estático (Opcional) */}
            <li className="mb-4 text-2xl font-bold px-4">Comerzia</li>
            
            {/* Renderizado Dinámico */}
            {Array.isArray(menuTree) && menuTree.map((item) => (
                <MenuItemRenderer key={item.id} item={item} />
            ))}
        </ul>
    );
};