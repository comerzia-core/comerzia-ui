import { Link } from "react-router-dom"; // Importamos Link para navegación
import { ComerziaTable, type Column } from "../../../../components/ui/ComerziaTable";
import { ComerziaBadge } from "../../../../components/ui/ComerziaBadge";
import type { SaasCompanyListResponse } from "../../types/company";

interface Props {
    data: SaasCompanyListResponse[];
    isLoading: boolean;
}

export const CompaniesTable = ({ data, isLoading }: Props) => {
    
    const columns: Column<SaasCompanyListResponse>[] = [
        { 
            header: "Razón Social", 
            // Modificamos el render para que sea un botón/enlace interactivo
            render: (row) => (
                <Link 
                    to={`/saas/companies/${row.id}`} 
                    className="font-bold text-primary hover:underline transition-all"
                >
                    {row.legalName}
                </Link>
            )
        },
        { header: "Nombre Comercial", accessorKey: "commercialName" },
        { header: "NIT / Documento", accessorKey: "taxId" },
        { header: "Plan Actual", accessorKey: "currentPlanName" },
        { 
            header: "Estado", 
            render: (row) => (
                <ComerziaBadge 
                    label={row.status ? 'Activo' : 'Inactivo'} 
                    variant={row.status ? 'success' : 'error'} 
                />
            ) 
        }
        // Eliminamos la columna de Acciones y CrudButtons como solicitaste
    ];

    return (
        <ComerziaTable<SaasCompanyListResponse> 
            data={data} 
            columns={columns} 
            isLoading={isLoading} 
            showRowNumbers={true}
            rowClassName={(row) => !row.status ? 'bg-error/10' : ''}
        />
    );
};