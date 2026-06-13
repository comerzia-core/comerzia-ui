import { ComerziaTable, type Column } from "../../../../components/ui/ComerziaTable";
import { ComerziaBadge } from "../../../../components/ui/ComerziaBadge";
import type { SaasCompanyListResponse } from "../../types/company";

interface Props {
    data: SaasCompanyListResponse[];
    isLoading: boolean;
    onEdit: (company: SaasCompanyListResponse) => void;
    onDelete?: (company: SaasCompanyListResponse) => void;
}

export const CompaniesTable = ({ data, isLoading }: Props) => {
    
    // Definimos las columnas tipadas estrictamente a nuestra interfaz
    const columns: Column<SaasCompanyListResponse>[] = [
        { 
            header: "Razón Social", 
            accessorKey: "legalName",
            className: "font-bold text-base-content",
            // sortable: true // Se puede habilitar en el futuro si implementamos ordenamiento local o desde el backend
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
        <ComerziaTable<SaasCompanyListResponse> 
            data={data} 
            columns={columns} 
            isLoading={isLoading} 
            // Aprovechamos la nueva funcionalidad de tu tabla para mostrar el índice numérico
            showRowNumbers={true}
            // Detalle UX: Sombreamos levemente de rojo las empresas inactivas/suspendidas
            rowClassName={(row) => !row.status ? 'bg-error/10' : ''}
        />
    );
};