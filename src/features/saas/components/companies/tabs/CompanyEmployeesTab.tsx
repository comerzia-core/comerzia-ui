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
        <div className="p-2 sm:p-4 bg-base-100 rounded-b-xl border border-t-0 border-base-200">
            <h2 className="text-base sm:text-lg font-bold mb-4 text-base-content">
                Personal Registrado ({totalElements})
            </h2>
            
            {/* Desktop Table */}
            <div className="hidden md:block">
                <ComerziaTable<EmployeeSummaryResponse> 
                    data={data} 
                    columns={columns} 
                    isLoading={isLoading}
                    showRowNumbers={true}
                    rowClassName={(row) => !row.userEnabled ? 'bg-error/5' : ''}
                    pagination={{
                        currentPage,
                        pageSize,
                        totalElements,
                        totalPages,
                        onPageChange: setCurrentPage,
                        onPageSizeChange: (newSize) => {
                            setPageSize(newSize);
                            setCurrentPage(0);
                        }
                    }}
                />
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
                {isLoading ? (
                    <div className="py-8 text-center">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-6 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
                        No hay empleados registrados.
                    </div>
                ) : (
                    data.map((emp) => (
                        <div key={emp.id} className={`bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs ${!emp.userEnabled ? 'bg-error/5 border-error/20' : ''}`}>
                            <div className="flex justify-between items-start">
                                <div>
                                    <span className="font-bold text-sm text-base-content block">{emp.fullName}</span>
                                    <span className="text-[11px] text-base-content/60">{emp.branchName || 'Sin sucursal'} • CI: {emp.documentNumber || '-'}</span>
                                </div>
                                <ComerziaBadge 
                                    label={emp.userEnabled ? 'Habilitado' : 'Bloqueado'} 
                                    variant={emp.userEnabled ? 'success' : 'error'} 
                                />
                            </div>
                            <div className="flex flex-wrap gap-1 pt-1">
                                {emp.roleNames.map((r) => (
                                    <span key={r} className="badge badge-neutral badge-xs text-[10px]">
                                        {r}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};