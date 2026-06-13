import { ComerziaTable, type Column } from "../../../../../components/ui/ComerziaTable";
import { StatusBadge } from "../../../../../components/ui/StatusBadge";
import { formatDateForUser } from "../../../../../utils/date";
import type { SaasSubscriptionResponse } from "../../../types/company";

interface Props {
    subscriptions: SaasSubscriptionResponse[];
}

export const CompanySubscriptionsTab = ({ subscriptions }: Props) => {
    
    // Definimos las columnas estrictamente tipadas
    const columns: Column<SaasSubscriptionResponse>[] = [
        { 
            header: "Plan", 
            accessorKey: "planName",
            className: "font-bold text-base-content" 
        },
        { 
            header: "Estado", 
            render: (row) => (
                // Utilizamos el componente inteligente para renderizar por código del backend
                <StatusBadge statusName={row.statusName} statusCode={row.statusTypeCode} />
            ) 
        },
        { 
            header: "Válido Desde", 
            // Regla de Oro: Formateo estricto de fechas UTC a Local
            render: (row) => formatDateForUser(row.validFrom) 
        },
        { 
            header: "Válido Hasta", 
            render: (row) => formatDateForUser(row.validUntil) 
        },
        { 
            header: "Límites (Sucursales / Usuarios)", 
            render: (row) => (
                <span className="text-sm">
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
                // No enviamos 'pagination' por ahora, la tabla renderizará el listado completo
                // Cuando el endpoint sea pageable, simplemente agregaremos el prop pagination aquí.
            />
        </div>
    );
};