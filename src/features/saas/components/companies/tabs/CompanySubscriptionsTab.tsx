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
        <div className="p-2 sm:p-4 bg-base-100 rounded-b-xl border border-t-0 border-base-200">
            <h2 className="text-base sm:text-lg font-bold mb-4 text-base-content">
                Historial de Suscripciones ({subscriptions.length})
            </h2>
            
            {/* Desktop Table */}
            <div className="hidden md:block">
                <ComerziaTable<SaasSubscriptionResponse> 
                    data={subscriptions} 
                    columns={columns} 
                    showRowNumbers={true}
                />
            </div>

            {/* Mobile Cards */}
            <div className="block md:hidden space-y-2.5">
                {subscriptions.length === 0 ? (
                    <div className="text-center py-6 text-base-content/50 bg-base-200/50 rounded-xl text-xs">
                        No hay suscripciones registradas.
                    </div>
                ) : (
                    subscriptions.map((sub) => (
                        <div key={sub.id} className="bg-base-100 p-3.5 rounded-xl border border-base-200 shadow-xs space-y-2 text-xs">
                            <div className="flex justify-between items-start">
                                <span className="font-bold text-sm text-base-content">{sub.planName}</span>
                                <StatusBadge statusName={sub.statusName} statusCode={sub.statusTypeCode} />
                            </div>
                            <div className="text-[11px] text-base-content/70 space-y-0.5">
                                <div>Desde: {formatDateForUser(sub.validFrom, companyTimezone)}</div>
                                <div>Hasta: {formatDateForUser(sub.validUntil, companyTimezone)}</div>
                            </div>
                            <div className="text-[11px] font-medium pt-1 border-t border-base-200/60">
                                🏢 {sub.maxBranches} sucursales | 👤 {sub.maxUsers} usuarios
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};