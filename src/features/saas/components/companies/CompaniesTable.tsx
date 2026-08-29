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
        <div>
            {/* VISTA DESKTOP: TABLA */}
            <div className="hidden md:block">
                <ComerziaTable<SaasCompanyListResponse> 
                    data={data} 
                    columns={columns} 
                    isLoading={isLoading} 
                    showRowNumbers={true}
                    rowClassName={(row) => !row.status ? 'bg-error/10' : ''}
                />
            </div>

            {/* VISTA MOBILE: CARDS */}
            <div className="block md:hidden space-y-2.5">
                {isLoading ? (
                    <div className="py-10 text-center">
                        <span className="loading loading-spinner loading-md text-primary"></span>
                    </div>
                ) : data.length === 0 ? (
                    <div className="text-center py-8 text-base-content/50 bg-base-100 rounded-xl border border-base-200 text-xs">
                        No hay empresas registradas.
                    </div>
                ) : (
                    data.map((company) => (
                        <div
                            key={company.id}
                            className={`bg-base-100 p-4 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs ${!company.status ? 'bg-error/5 border-error/20' : ''}`}
                        >
                            <div className="flex justify-between items-start">
                                <div>
                                    <Link 
                                        to={`/saas/companies/${company.id}`} 
                                        className="font-bold text-sm text-primary hover:underline block leading-tight"
                                    >
                                        {company.legalName}
                                    </Link>
                                    <span className="text-base-content/60 text-xs block mt-0.5">
                                        {company.commercialName || '-'}
                                    </span>
                                </div>
                                <ComerziaBadge 
                                    label={company.status ? 'Activo' : 'Inactivo'} 
                                    variant={company.status ? 'success' : 'error'} 
                                />
                            </div>

                            <div className="flex justify-between items-center text-[11px] text-base-content/60 pt-2 border-t border-base-200/60">
                                <span>NIT / Doc: <strong className="text-base-content/80">{company.taxId || '-'}</strong></span>
                                <span className="badge badge-primary badge-outline badge-xs font-semibold">
                                    {company.currentPlanName || 'Sin Plan'}
                                </span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};