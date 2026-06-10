import { TravesiaTable, type Column } from "../../../../components/ui/ComerziaTable";
import { ComerziaBadge } from "../../../../components/ui/ComerziaBadge";
import type { SaasCompanyListResponse } from "../../types/company";

interface Props {
    data: SaasCompanyListResponse[];
    isLoading: boolean;
}

export const CompaniesTable = ({ data, isLoading }: Props) => {
    
    // Definimos las columnas tipadas estrictamente a nuestra interfaz
    const columns: Column<SaasCompanyListResponse>[] = [
        { 
            header: "Razón Social", 
            accessorKey: "legalName",
            className: "font-bold text-base-content" 
        },
        { 
            header: "Nombre Comercial", 
            accessorKey: "commercialName" 
        },
        { 
            header: "NIT / Documento", 
            accessorKey: "taxId" 
        },
        { 
            header: "Plan Actual", 
            accessorKey: "currentPlanName" 
        },
        { 
            header: "Estado", 
            // Renderizamos un badge verde si es true, rojo/ghost si es false
            render: (row) => (
                <ComerziaBadge 
                    label={row.status ? 'Activo' : 'Inactivo'} 
                    variant={row.status ? 'success' : 'error'} 
                />
            ) 
        }
    ];

    return (
        <TravesiaTable<SaasCompanyListResponse> 
            data={data} 
            columns={columns} 
            isLoading={isLoading} 
            // Detalle UX: Sombreamos levemente de rojo las empresas inactivas/suspendidas
            rowClassName={(row) => !row.status ? 'bg-error/10' : ''}
        />
    );
};