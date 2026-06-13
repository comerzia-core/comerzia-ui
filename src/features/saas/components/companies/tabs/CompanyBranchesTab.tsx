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
        <div className="p-4 bg-base-100 rounded-b-xl border border-t-0 border-base-200">
            <h2 className="text-lg font-bold mb-4">Sucursales ({totalElements})</h2>
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
                        setCurrentPage(0); // Reset a la página 0 al cambiar tamaño
                    }
                }}
            />
        </div>
    );
};