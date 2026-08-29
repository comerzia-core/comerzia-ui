import { useState, useEffect, useCallback } from "react";
import { ComerziaTable, type Column } from "../../../../../components/ui/ComerziaTable";
import { ComerziaBadge } from "../../../../../components/ui/ComerziaBadge";
import { getCompanyBranches } from "../../../services/companyService";
import type { BranchResponse } from "../../../types/company";

interface Props {
    companyId: string;
}

export const CompanyBranchesTab = ({ companyId }: Props) => {
    const [data, setData] = useState<BranchResponse[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Estados de paginación
    const [currentPage, setCurrentPage] = useState(0);
    const [pageSize, setPageSize] = useState(10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchBranches = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await getCompanyBranches(companyId, currentPage, pageSize);
            setData(response.content);
            setTotalElements(response.totalElements);
            setTotalPages(response.totalPages);
        } catch (error) {
            console.error("Error fetching branches:", error);
        } finally {
            setIsLoading(false);
        }
    }, [companyId, currentPage, pageSize]);

    useEffect(() => {
        fetchBranches();
    }, [fetchBranches]);

    const columns: Column<BranchResponse>[] = [
        { header: "Nombre", accessorKey: "name", className: "font-bold" },
        { header: "Dirección", accessorKey: "address" },
        { 
            header: "Estado", 
            render: (row) => (
                <ComerziaBadge label={row.status ? 'Activo' : 'Inactivo'} variant={row.status ? 'success' : 'error'} />
            ) 
        }
    ];

    return (
        <div className="p-2 sm:p-4 bg-base-100 rounded-b-xl border border-t-0 border-base-200">
            <h2 className="text-base sm:text-lg font-bold mb-4">Sucursales ({totalElements})</h2>
            
            {/* Desktop Table */}
            <div className="hidden md:block">
                <ComerziaTable<BranchResponse> 
                    data={data} 
                    columns={columns} 
                    isLoading={isLoading}
                    showRowNumbers={true}
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
                        No hay sucursales registradas.
                    </div>
                ) : (
                    data.map((b) => (
                        <div key={b.id} className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-1.5 text-xs">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-sm text-base-content">{b.name}</span>
                                <ComerziaBadge label={b.status ? 'Activo' : 'Inactivo'} variant={b.status ? 'success' : 'error'} />
                            </div>
                            <p className="text-base-content/70 text-xs">{b.address || 'Sin dirección'}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};