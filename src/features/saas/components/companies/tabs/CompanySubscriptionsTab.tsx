import { ComerziaTable, type Column } from "../../../../../components/ui/ComerziaTable";
import { StatusBadge } from "../../../../../components/ui/StatusBadge";
import { formatDateForUser } from "../../../../../utils/date";
import type { SaasSubscriptionResponse } from "../../../types/company";

interface Props {
    subscriptions: SaasSubscriptionResponse[];
    companyTimezone: string; // Exigimos la zona horaria como prop
}

export const CompanySubscriptionsTab = ({ subscriptions, companyTimezone }: Props) => {
    
    const columns: Column<SaasSubscriptionResponse>[] = [
        { 
            header: "Plan", 
            accessorKey: "planName",
            className: "font-bold text-base-content" 
        },
        { 
            header: "Estado", 
            render: (row) => (
                <StatusBadge statusName={row.statusName} statusCode={row.statusTypeCode} />
            ) 
        },
        { 
            header: "Válido Desde", 
            // Inyectamos el timezone de la empresa para que las horas coincidan con su operación local
            render: (row) => formatDateForUser(row.validFrom, companyTimezone) 
        },
        { 
            header: "Válido Hasta", 
            render: (row) => formatDateForUser(row.validUntil, companyTimezone) 
        },
        { 
            header: "Límites (Suc. / Usu.)", 
            render: (row) => (
                <span className="text-sm font-medium">
                    🏢 {row.maxBranches} | 👤 {row.maxUsers}
                </span>
            )
        }
    ];

    return (
        <div className="p-4 bg-base-100 rounded-b-xl border border-t-0 border-base-200">
            <h2 className="text-lg font-bold mb-4 text-base-content">
                Historial de Suscripciones ({subscriptions.length})
            </h2>
            
            <ComerziaTable<SaasSubscriptionResponse> 
                data={subscriptions} 
                columns={columns} 
                showRowNumbers={true}
            />
        </div>
    );
};