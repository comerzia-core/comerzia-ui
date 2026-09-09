import type { ReactNode } from "react";
import { 
    ChevronUp, 
    ChevronDown, 
    ChevronsUpDown, 
    ChevronLeft, 
    ChevronRight, 
    ChevronsLeft, 
    ChevronsRight 
} from "lucide-react";

// --- INTERFACES DE CONFIGURACIÓN ---

export interface ColumnSort {
    id: string;      // El accessorKey de la columna
    desc: boolean;   // true = DESC, false = ASC
}

export interface TablePaginationConfig {
    totalElements: number;
    totalPages: number;
    currentPage: number; // 0-based index (Spring Boot style)
    pageSize: number;
    onPageChange: (newPage: number) => void;
    onPageSizeChange: (newSize: number) => void;
}

export interface Column<T> {
    header: string | ReactNode;
    accessorKey?: keyof T;
    render?: (item: T) => ReactNode;
    className?: string;
    sortable?: boolean; // Permite habilitar el ordenamiento en esta columna
}

interface Props<T> {
    data: T[];
    columns: Column<T>[];
    isLoading?: boolean;
    rowClassName?: (item: T) => string;
    
    // Nuevas propiedades opcionales
    showRowNumbers?: boolean;
    pagination?: TablePaginationConfig;
    sorting?: ColumnSort[]; // Estado actual del ordenamiento
    onSortingChange?: (newSorting: ColumnSort[]) => void;
    onRowClick?: (row: T) => void;
    onRowContextMenu?: (e: React.MouseEvent, row: T) => void;
}

// Opciones de paginación por defecto (pueden venir de un constants.ts)
const PAGE_SIZE_OPTIONS = [5, 10, 15, 50, 100];

export const ComerziaTable = <T extends { id: number | string }>({ 
    data, 
    columns, 
    isLoading, 
    rowClassName,
    showRowNumbers = false,
    pagination,
    sorting = [],
    onSortingChange,
    onRowClick,
    onRowContextMenu
}: Props<T>) => {
    
    // --- LÓGICA DE ORDENAMIENTO MÚLTIPLE ---
    const handleSortClick = (columnId: string) => {
        if (!onSortingChange) return;

        // Copiamos el array de ordenamiento actual
        const newSorting = [...sorting];
        const existingIndex = newSorting.findIndex(s => s.id === columnId);

        if (existingIndex >= 0) {
            // Si ya existe y es ASC, lo pasamos a DESC
            if (!newSorting[existingIndex].desc) {
                newSorting[existingIndex].desc = true;
            } else {
                // Si ya era DESC, lo quitamos del ordenamiento
                newSorting.splice(existingIndex, 1);
            }
        } else {
            // Si no existía, lo agregamos como ASC
            newSorting.push({ id: columnId, desc: false });
        }

        // Emitimos el nuevo estado al padre
        onSortingChange(newSorting);
    };

    const getSortIcon = (columnId: string) => {
        const sortParam = sorting.find(s => s.id === columnId);
        if (!sortParam) return <ChevronsUpDown size={14} className="opacity-30" />;
        return sortParam.desc ? <ChevronDown size={14} className="text-primary" /> : <ChevronUp size={14} className="text-primary" />;
    };

    // --- ESTADOS DE CARGA Y VACÍO ---
    if (isLoading) {
        return (
            <div className="flex justify-center p-10 bg-base-100 rounded-xl shadow-sm border border-base-200">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="text-center p-10 text-base-content/60 bg-base-100 rounded-xl shadow-sm border border-base-200">
                No se encontraron registros.
            </div>
        );
    }

    // --- RENDER PRINCIPAL ---
    return (
        <div className="bg-base-100 rounded-xl shadow-sm border border-base-200 overflow-hidden flex flex-col">
            
            {/* CONTENEDOR DE LA TABLA (Scroll Horizontal) */}
            <div className="overflow-x-auto w-full">
                <table className="table table-zebra w-full">
                    <thead className="bg-base-200 text-base-content uppercase text-xs font-bold">
                        <tr>
                            {/* Columna Mágica de Numeración */}
                            {showRowNumbers && <th className="w-12 text-center">#</th>}
                            
                            {/* Generación Dinámica de Columnas */}
                            {columns.map((col, idx) => {
                                const isSortable = col.sortable && col.accessorKey && onSortingChange;

                                return (
                                    <th key={idx} className={col.className}>
                                        {isSortable ? (
                                            <button 
                                                onClick={() => handleSortClick(String(col.accessorKey))}
                                                className="flex items-center gap-1 hover:text-primary transition-colors uppercase font-bold"
                                            >
                                                {col.header}
                                                {getSortIcon(String(col.accessorKey))}
                                            </button>
                                        ) : (
                                            col.header
                                        )}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, index) => {
                            const customClasses = rowClassName ? rowClassName(row) : '';
                            const shouldOverrideZebra = customClasses.includes('bg-');

                            // Cálculo de la numeración continua
                            const rowNumber = pagination 
                                ? (pagination.currentPage * pagination.pageSize) + index + 1 
                                : index + 1;

                            return (
                                <tr 
                                    key={row.id} 
                                    className={`hover transition-colors duration-200 ${customClasses} ${onRowClick ? 'cursor-pointer' : ''}`}
                                    onClick={() => onRowClick && onRowClick(row)}
                                    onContextMenu={(e) => onRowContextMenu && onRowContextMenu(e, row)}
                                >
                                    
                                    {showRowNumbers && (
                                        <td className="text-center text-base-content/50 font-medium">
                                            {rowNumber}
                                        </td>
                                    )}

                                    {columns.map((col, idx) => {
                                         if (col.render) {
                                             return (
                                                 <td key={idx} className={`${col.className} ${shouldOverrideZebra ? '!bg-inherit' : ''}`}>
                                                     {col.render(row)}
                                                 </td>
                                             );
                                         }

                                         const val = col.accessorKey ? row[col.accessorKey] : undefined;
                                         const isNullOrEmpty = val === null || val === undefined || val === '';

                                         let displayContent: ReactNode = '-';
                                         if (isNullOrEmpty) {
                                             const searchKey = `${String(col.accessorKey || '')} ${typeof col.header === 'string' ? col.header : ''}`.toLowerCase();
                                             if (searchKey.includes('descrip')) {
                                                 displayContent = <span className="text-xs text-base-content/40 italic">(sin descripción)</span>;
                                             } else if (searchKey.includes('observa')) {
                                                 displayContent = <span className="text-xs text-base-content/40 italic">(sin observación)</span>;
                                             } else if (searchKey.includes('nota') || searchKey.includes('note')) {
                                                 displayContent = <span className="text-xs text-base-content/40 italic">(sin nota)</span>;
                                             } else if (searchKey.includes('motivo') || searchKey.includes('reason')) {
                                                 displayContent = <span className="text-xs text-base-content/40 italic">(sin motivo)</span>;
                                             } else if (searchKey.includes('comentar') || searchKey.includes('comment')) {
                                                 displayContent = <span className="text-xs text-base-content/40 italic">(sin comentario)</span>;
                                             }
                                         } else {
                                             displayContent = String(val);
                                         }

                                         return (
                                             <td key={idx} className={`${col.className} ${shouldOverrideZebra ? '!bg-inherit' : ''}`}>
                                                 {displayContent}
                                             </td>
                                         );
                                     })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* --- FOOTER DE PAGINACIÓN ORQUESTADA --- */}
            {pagination && (
                <div className="p-4 border-t border-base-200 bg-base-100/50 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-base-content/70">
                    
                    {/* Izquierda: Selector de Tamaño e Info */}
                    <div className="flex items-center gap-3">
                        <span className="whitespace-nowrap">Mostrar</span>
                        <select 
                            className="select select-bordered select-sm w-20 bg-base-100"
                            value={pagination.pageSize}
                            onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                        >
                            {PAGE_SIZE_OPTIONS.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>
                        <span className="whitespace-nowrap hidden sm:inline">
                            de {pagination.totalElements} registros
                        </span>
                    </div>

                    {/* Derecha: Botones de Navegación */}
                    <div className="flex items-center gap-1">
                        <span className="mr-4 font-medium text-base-content">
                            Página {pagination.currentPage + 1} de {Math.max(1, pagination.totalPages)}
                        </span>

                        {/* Botón: Primera Página */}
                        <button 
                            className="btn btn-sm btn-circle btn-ghost"
                            disabled={pagination.currentPage === 0}
                            onClick={() => pagination.onPageChange(0)}
                            title="Primera página"
                        >
                            <ChevronsLeft size={16} />
                        </button>

                        {/* Botón: Anterior */}
                        <button 
                            className="btn btn-sm btn-circle btn-ghost"
                            disabled={pagination.currentPage === 0}
                            onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                            title="Anterior"
                        >
                            <ChevronLeft size={16} />
                        </button>

                        {/* Botón: Siguiente */}
                        <button 
                            className="btn btn-sm btn-circle btn-ghost"
                            disabled={pagination.currentPage >= pagination.totalPages - 1}
                            onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                            title="Siguiente"
                        >
                            <ChevronRight size={16} />
                        </button>

                        {/* Botón: Última Página */}
                        <button 
                            className="btn btn-sm btn-circle btn-ghost"
                            disabled={pagination.currentPage >= pagination.totalPages - 1}
                            onClick={() => pagination.onPageChange(pagination.totalPages - 1)}
                            title="Última página"
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};