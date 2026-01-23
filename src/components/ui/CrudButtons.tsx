import { Save, X, Trash2, Pencil, FileSpreadsheet, FileText } from "lucide-react";
import { ComerziaButton } from "./ComerziaButton";

// Tipos para pasar props extra (como onClick)
interface BaseBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    label?: string; // Por si quieres sobreescribir el texto por defecto
}

// 1. BOTÓN GUARDAR (Verde + Icono Save)
export const BtnSave = ({ label = "Guardar", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="save" 
        label={label} 
        icon={<Save size={18} />} 
        {...props} 
    />
);

// 2. BOTÓN CANCELAR (Rojo + Icono X)
export const BtnCancel = ({ label = "Cancelar", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="cancel" 
        label={label} 
        icon={<X size={18} />} 
        {...props} 
    />
);

// 3. BOTÓN EDITAR (Azul + Lapiz + Redondo)
export const BtnEdit = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="edit" 
        isIconOnly 
        icon={<Pencil size={16} />} 
        tooltip="Editar registro"
        {...props} 
    />
);

// 4. BOTÓN ELIMINAR TABLA (Rojo + Basurero + Redondo)
export const BtnDeleteIcon = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="delete" 
        isIconOnly 
        icon={<Trash2 size={16} />} 
        tooltip="Eliminar registro"
        {...props} 
    />
);

// 5. BOTÓN ELIMINAR NORMAL (Con texto, para confirmaciones)
export const BtnDelete = ({ label = "Eliminar", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="delete" 
        label={label}
        icon={<Trash2 size={18} />} 
        {...props} 
    />
);

// 6. REPORTES
export const BtnExcel = ({ label = "Exportar Excel", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="excel" 
        label={label}
        icon={<FileSpreadsheet size={18} />} 
        {...props} 
    />
);

export const BtnPDF = ({ label = "Exportar PDF", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="pdf" 
        label={label}
        icon={<FileText size={18} />} 
        {...props} 
    />
);