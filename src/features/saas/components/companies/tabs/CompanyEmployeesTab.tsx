import { useState, useEffect, useCallback } from "react";
import { ComerziaTable, type Column } from "../../../../../components/ui/ComerziaTable";
import { ComerziaBadge } from "../../../../../components/ui/ComerziaBadge";
import { getCompanyEmployees } from "../../../services/companyService";
import type { EmployeeSummaryResponse } from "../../../types/company";
import { ShieldAlert } from "lucide-react"; // Icono para advertir cambio de contraseña

interface Props {
    companyId: string;
}

export const CompanyEmployeesTab = ({ companyId }: Props) => {
    const [data, setData] = useState<EmployeeSummaryResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados orquestadores de la paginación (Spring Boot usa índice 0)
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchEmployees = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getCompanyEmployees(companyId, currentPage, pageSize);
            setData(response.content);
            setTotalElements(response.totalElements);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error("Error fetching employees:", error);
        } finally {
            setIsLoading(false);
        }
    }, [companyId, currentPage, pageSize]);

    // Disparamos la búsqueda cada vez que cambie la página o el tamaño
    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    // Definición estricta de las columnas
    const columns: Column<EmployeeSummaryResponse>[] = [
        { 
            header: "Nombre Completo", 
            accessorKey: "fullName", 
            className: "font-bold text-base-content" 
        },
        { 
            header: "Documento", 
            // Validamos nulos explícitamente ya que tu JSON de ejemplo traía nulls
            render: (row) => row.documentNumber ? row.documentNumber : <span className="text-gray-400">-</span>
        },
        { 
            header: "Sucursal", 
            accessorKey: "branchName" 
        },
        { 
            header: "Roles", 
            render: (row) => (
                <div className="flex flex-wrap gap-1">
                    {row.roleNames.map((role) => (
                        // Renderizamos un badge pequeño neutral para cada rol
                        <div key={role} className="badge badge-neutral badge-sm text-[10px]">
                            {role}
                        </div>
                    ))}
                </div>
            ) 
        },
        { 
            header: "Acceso", 
            render: (row) => (
                <div className="flex items-center gap-2">
                    <ComerziaBadge 
                        label={row.userEnabled ? 'Habilitado' : 'Bloqueado'} 
                        variant={row.userEnabled ? 'success' : 'error'} 
                    />
                    
                    {/* Indicador de Seguridad UX: Si requiere cambio de clave, mostramos un icono de advertencia */}
                    {row.requiresPasswordChange && (
                        <div className="tooltip tooltip-warning" data-tip="Requiere cambio de contraseña">
                            <ShieldAlert size={16} className="text-warning" />
                        </div>
                    )}
                </div>
            ) 
        }
    ];

    return (
        <div className="p-4 bg-base-100 rounded-b-xl border border-t-0 border-base-200">
            <h2 className="text-lg font-bold mb-4 text-base-content">
                Personal Registrado ({totalElements})
            </h2>
            
            <ComerziaTable<EmployeeSummaryResponse> 
                data={data} 
                columns={columns} 
                isLoading={isLoading}
                showRowNumbers={true}
                // Detalle UX: Si el usuario está deshabilitado, sombreamos la fila
                rowClassName={(row) => !row.userEnabled ? 'bg-error/5' : ''}
                pagination={{
                    currentPage,
                    pageSize,
                    totalElements,
                    totalPages,
                    onPageChange: setCurrentPage,
                    onPageSizeChange: (newSize) => {
                        setPageSize(newSize);
                        setCurrentPage(0); // Regla de oro: Al cambiar tamaño, volver a página 0
                    }
                }}
            />
        </div>
    );
};