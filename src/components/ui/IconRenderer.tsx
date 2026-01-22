import { 
    LayoutDashboard, 
    Box, 
    Users, 
    ShieldCheck, 
    Settings, 
    FileText, 
    LogOut,
    HelpCircle,
    // ChevronRight // Usaremos este para nuestra propia flecha personalizada
} from 'lucide-react';

// Mapa de Strings (API) -> Componentes Lucide
const iconMap: Record<string, any> = {
    // Nombres que vienen de tu Base de Datos (en minúsculas)
    dashboard: LayoutDashboard,
    inventory: Box,
    users: Users,
    employees: Users, // Podemos reusar iconos
    security: ShieldCheck,
    settings: Settings,
    reports: FileText,
    logout: LogOut,
    default: HelpCircle
};

interface Props {
    iconName?: string;
    className?: string;
    size?: number;
}

export const IconRenderer = ({ iconName, className = "", size = 20 }: Props) => {
    // Buscamos el icono, si no existe o es null, usamos el default
    const IconComponent = iconMap[iconName?.toLowerCase() || 'default'] || iconMap['default'];
    
    return <IconComponent className={className} size={size} />;
};