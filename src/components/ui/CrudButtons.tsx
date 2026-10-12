import { Save, X, Trash2, Pencil, FileSpreadsheet, FileText, Plus, ArrowLeft, ArrowRight, ArrowRightLeft, RefreshCw, Eye, Unlock, Lock, DollarSign, Coins, Camera, Upload, ScanBarcode, Printer, Laptop, Flashlight, FlashlightOff, Settings2 } from "lucide-react";
import { ComerziaButton } from "./ComerziaButton";

// Tipos para pasar props extra (como onClick)
interface BaseBtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    isLoading?: boolean;
    label?: string; // Por si quieres sobreescribir el texto por defecto
    responsive?: boolean;
    fullWidth?: boolean;
}

// 1. BOTÓN GUARDAR (Verde + Icono Save)
export const BtnSave = ({ label = "Guardar", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="save" 
        label={label} 
        icon={<Save size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 1.1 BOTÓN GUARDAR ICONO (Verde + Icono Save + Redondo para Tablas)
export const BtnSaveIcon = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="save" 
        isIconOnly 
        icon={<Save size={16} />} 
        tooltip="Guardar"
        {...props} 
    />
);

// 2. BOTÓN CANCELAR (Rojo + Icono X)
export const BtnCancel = ({ label = "Cancelar", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="cancel" 
        label={label} 
        icon={<X size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 3. BOTÓN EDITAR (Azul + Lapiz + Redondo)
export const BtnEdit = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="edit" 
        isIconOnly 
        icon={<Pencil size={16} />} 
        {...props} 
    />
);

// 3.1 BOTÓN PRECIO (Verde/Azul + Dinero + Redondo)
export const BtnPriceIcon = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="primary" 
        isIconOnly 
        icon={<DollarSign size={16} />} 
        {...props} 
    />
);

// 4. BOTÓN ELIMINAR TABLA (Rojo + Basurero + Redondo)
export const BtnDeleteIcon = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="delete" 
        isIconOnly 
        icon={<Trash2 size={16} />} 
        {...props} 
    />
);

// 4.1 BOTÓN EXCEL TABLA (Redondo)
export const BtnExcelIcon = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="excel" 
        isIconOnly 
        icon={<FileSpreadsheet size={16} />} 
        {...props} 
    />
);

// 4.2 BOTÓN PDF TABLA (Redondo)
export const BtnPDFIcon = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="pdf" 
        isIconOnly 
        icon={<FileText size={16} />} 
        {...props} 
    />
);


// 5. BOTÓN ELIMINAR NORMAL (Con texto, para confirmaciones)
export const BtnDelete = ({ label = "Eliminar", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="delete" 
        label={label}
        icon={<Trash2 size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 6. REPORTES
export const BtnExcel = ({ label = "Exportar Excel", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="excel" 
        label={label}
        icon={<FileSpreadsheet size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

export const BtnPDF = ({ label = "Exportar PDF", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="pdf" 
        label={label}
        icon={<FileText size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 7. TABLAS
export const BtnCreate = ({ label = "Adicionar", responsive = false, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="create" 
        label={label}
        icon={<Plus size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// ==========================================
// BOTONES DE SISTEMA (Login, Modales, etc)
// ==========================================

// 7. LOGIN (Morado Primario, Ancho completo, Sin ícono)
export const BtnLogin = ({ label = "Ingresar", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="primary" // Usa el color principal del tema (Morado)
        label={label}
        fullWidth // Generalmente el login ocupa todo el ancho
        // No pasamos 'icon', y como 'primary' no tiene icono por defecto, sale limpio
        {...props} 
    />
);

// 8. MODAL: CONFIRMACIÓN DESTRUCTIVA (Rojo, Sin ícono)
export const BtnModalYes = ({ label = "Sí, Confirmar", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="delete" // Reusamos el rojo corporativo
        label={label}
        icon={null} // <--- TRUCO: Pasamos null explícitamente para anular el basurero automático
        {...props} 
    />
);

// 9. MODAL: CANCELAR / NEUTRO (Gris/Transparente, Sin ícono)
export const BtnModalNo = ({ label = "No, Cancelar", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="ghost" // O 'neutral' si lo quieres con fondo gris
        label={label}
        icon={null} // Sin ícono de X
        className="border border-base-300" // Un borde sutil para que parezca botón
        {...props} 
    />
);

/**
 * 11. COMPONENTE AGRUPADOR PARA TABLAS
 * Este es el que faltaba y causaba el error de importación.
 */
interface CrudButtonsProps {
    onEdit: () => void;
    onDelete: () => void;
}

export const CrudButtons = ({ onEdit, onDelete }: CrudButtonsProps) => {
    return (
        <div className="flex justify-end gap-1.5">
            <BtnEdit onClick={onEdit} />
            <BtnDeleteIcon onClick={onDelete} />
        </div>
    );
};

// ✅ NUEVO: Componente dedicado a exportaciones (Manteniendo el estilo REDONDO original)
interface ExportButtonsProps {
    onExportExcel: () => void;
    onExportPDF: () => void;
    disabled?: boolean;
}

export const ExportButtons = ({ onExportExcel, onExportPDF, disabled = false }: ExportButtonsProps) => {
    return (
        <div 
            className={`flex justify-end gap-1.5 ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
            title={disabled ? "Sin registros para exportar" : ""}
        >
            {/* Envolvemos en pointer-events-none cuando está deshabilitado 
                para matar el hover y el click, pero mantenemos TUS botones redondos.
            */}
            <div className={disabled ? "pointer-events-none" : ""}>
                <BtnExcelIcon 
                    onClick={onExportExcel} 
                    disabled={disabled} 
                    title={!disabled ? "Exportar lista a Excel" : undefined}
                />
            </div>
            
            <div className={disabled ? "pointer-events-none" : ""}>
                <BtnPDFIcon 
                    onClick={onExportPDF} 
                    disabled={disabled} 
                    title={!disabled ? "Exportar lista a PDF" : undefined}
                />
            </div>
        </div>
    );
};

// 13. BOTÓN ATRÁS (Ghost + Flecha Izquierda) - Para Wizards
export const BtnBack = ({ label = "Atrás", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="steps" 
        label={label} 
        responsive={responsive}
        icon={<ArrowLeft size={18} />} 
        {...props} 
    />
);

// 14. BOTÓN SIGUIENTE (Primario + Flecha Derecha) - Para Wizards
export const BtnNext = ({ label = "Siguiente", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="steps" 
        label={label} 
        responsive={responsive}
        // Nota: Por defecto el icono va a la izquierda. 
        // Si quisieras el icono a la derecha, tendrías que ajustar ComerziaButton, 
        // pero por consistencia lo dejaremos a la izquierda como el resto del sistema.
        icon={<ArrowRight size={18} />} 
        {...props} 
    />
);

// 15. BOTÓN CAMBIAR (Blanco, ideal para overlays de imágenes)
export const BtnChange = ({ label = "Cambiar", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="overlay" 
        label={label} 
        icon={<RefreshCw size={16} />} 
        responsive={responsive}
        {...props} 
    />
);

// 16. BOTÓN QUITAR (Rojo Error + X, para quitar de una lista o uploader)
export const BtnRemove = ({ label = "Quitar", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="overlay" 
        label={label} 
        icon={<X size={16} />} 
        responsive={responsive}
        {...props} 
    />
);

// 17. BOTÓN DETALLES (Primario + Ojo, para ver detalles de un registro)
export const BtnDetails = ({ label = "Ver Detalles", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="primary" 
        label={label} 
        icon={<Eye size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 18. BOTÓN REABRIR (Warning + Candado Abierto, para reabrir turnos o registros cerrados)
export const BtnReopen = ({ label = "Reabrir", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="warning" 
        label={label} 
        icon={<Unlock size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 19. BOTÓN CERRAR TURNO (Error + Candado Cerrado, para realizar arqueo o cierre)
export const BtnCloseShift = ({ label = "Arqueo y Cierre", responsive = false, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="error" 
        label={label} 
        icon={<Lock size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 20. BOTÓN ACTUALIZAR PRECIOS (Primario + Monedas, para abrir modo edición)
export const BtnUpdatePrices = ({ label = "Actualizar Precios", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="primary" 
        label={label} 
        icon={<Coins size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 21. BOTÓN VALORIZAR STOCK (Warning + Dinero)
export const BtnValuate = ({ label = "Valorizar", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="warning" 
        label={label} 
        icon={<DollarSign size={16} />} 
        responsive={responsive}
        {...props} 
    />
);

export const BtnValuateIcon = (props: BaseBtnProps) => (
    <ComerziaButton 
        variant="warning" 
        isIconOnly 
        icon={<DollarSign size={16} />} 
        tooltip="Valorizar Stock"
        {...props} 
    />
);

// 22. BOTÓN CÁMARA / FOTO (Primario + Cámara)
export const BtnCamera = ({ label = "Tomar Foto", responsive = false, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="primary" 
        label={label} 
        icon={<Camera size={16} />} 
        responsive={responsive}
        {...props} 
    />
);

// 23. BOTÓN GALERÍA / SUBIR (Neutral/Ghost + Upload)
export const BtnGallery = ({ label = "Galería", responsive = false, ...props }: BaseBtnProps) => (
    <ComerziaButton 
        variant="neutral" 
        label={label} 
        icon={<Upload size={16} />} 
        responsive={responsive}
        {...props} 
    />
);

// 24. BOTÓN ESCANEAR CÓDIGO (Primario + ScanBarcode)
export const BtnScan = ({ label = "Escanear", responsive = true, type = "button", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        type={type}
        variant="primary" 
        label={label} 
        icon={<ScanBarcode size={18} className="sm:w-5 sm:h-5" />} 
        responsive={responsive}
        {...props} 
    />
);

// 24.1 BOTÓN ESCANEAR ICONO (Redondo para campos de formulario)
export const BtnScanIcon = ({ type = "button", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        type={type}
        variant="primary" 
        isIconOnly 
        icon={<ScanBarcode size={16} />} 
        tooltip="Escanear código con cámara"
        {...props} 
    />
);

// 25. BOTÓN TRANSFERENCIA RÁPIDA (Primario + ArrowRightLeft)
export const BtnTransfer = ({ label = "Transferencia Rápida", responsive = false, type = "button", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        type={type}
        variant="primary" 
        label={label} 
        icon={<ArrowRightLeft size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 26. BOTÓN IMPRIMIR (Primario + Printer)
export const BtnPrint = ({ label = "Imprimir", responsive = false, type = "button", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        type={type}
        variant="primary" 
        label={label} 
        icon={<Printer size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 26.1 BOTÓN IMPRIMIR ICONO (Redondo para Tablas)
export const BtnPrintIcon = ({ type = "button", tooltip = "Imprimir", ...props }: BaseBtnProps & { tooltip?: string }) => (
    <ComerziaButton 
        type={type}
        variant="primary" 
        isIconOnly 
        icon={<Printer size={16} />} 
        tooltip={tooltip}
        {...props} 
    />
);

// 27. BOTÓN VINCULAR TERMINAL (Primario/Create + Laptop)
export const BtnPairTerminal = ({ label = "Vincular Terminal", responsive = false, type = "button", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        type={type}
        variant="create" 
        label={label} 
        icon={<Laptop size={18} />} 
        responsive={responsive}
        {...props} 
    />
);

// 28. BOTÓN ACTUALIZAR / RECARGAR (Neutral + RefreshCw)
export const BtnRefresh = ({ label = "Actualizar", responsive = true, type = "button", ...props }: BaseBtnProps) => (
    <ComerziaButton 
        type={type}
        variant="neutral" 
        label={label} 
        icon={<RefreshCw size={16} />} 
        responsive={responsive}
        {...props} 
    />
);


export const BtnTab = ({ label, ...props }: BaseBtnProps) => <ComerziaButton variant="ghost" label={label} {...props} />;


// Control de iluminación manual para evitar reflejos sobre etiquetas brillantes.
const scannerControlClass = "btn-sm !min-w-0 !px-3.5 !py-2 rounded-xl text-xs font-bold backdrop-blur-md";

export const BtnFlashlight = ({ enabled, overlay = false, className = "", ...props }: BaseBtnProps & { enabled: boolean; overlay?: boolean }) => (
    <ComerziaButton
        type="button"
        variant={enabled ? "warning" : overlay ? "overlay" : "neutral"}
        label={overlay ? (enabled ? "Flash: ON" : "Flash: OFF") : (enabled ? "Apagar luz" : "Encender luz")}
        aria-label={enabled ? "Apagar luz" : "Encender luz"}
        icon={enabled ? <FlashlightOff size={16} /> : <Flashlight size={16} className={overlay ? "text-warning" : ""} />}
        aria-pressed={enabled}
        className={`${overlay ? scannerControlClass : ""} ${className}`}
        {...props}
    />
);

export const BtnScannerCamera = ({ switched, className = "", ...props }: BaseBtnProps & { switched: boolean }) => (
    <ComerziaButton
        type="button"
        variant={switched ? "warning" : "overlay"}
        label="Girar Cámara"
        aria-label="Cambiar cámara"
        icon={<RefreshCw size={15} className={`transition-transform duration-300 ${switched ? "rotate-180" : "text-warning"}`} />}
        className={`${scannerControlClass} ${className}`}
        {...props}
    />
);

// Acción de configuración de hardware; la lógica permanece en el módulo que la usa.
export const BtnCalibrate = ({ label = "Calibrar rollo", responsive = true, ...props }: BaseBtnProps) => (
    <ComerziaButton variant="primary" label={label} icon={<Settings2 size={18} />} responsive={responsive} {...props} />
);
