import { ComerziaBadge } from "../../../../components/ui/ComerziaBadge";
import { TravesiaTable, type Column } from "../../../../components/ui/ComerziaTable";
import { CrudButtons } from "../../../../components/ui/CrudButtons";

// 1. Definimos la interfaz local de lo que esperamos recibir de la API
export interface TenantRow {
    id: number;
    companyName: string;
    documentNumber: string;
    subscriptionPlan: string;
    status: string; // 'ACTIVE', 'SUSPENDED', etc.
}

interface Props {
    data: TenantRow[];
    isLoading: boolean;
    onEdit: (tenant: TenantRow) => void;
    onDelete: (tenant: TenantRow) => void;
}

export const TenantsTable = ({ data, isLoading, onEdit, onDelete }: Props) => {
    
    // 2. Definimos las columnas específicas para los Tenants
    const columns: Column<TenantRow>[] = [
        { 
            header: "Empresa", 
            accessorKey: "companyName",
            className: "font-bold text-base-content" 
        },
        { 
            header: "Documento", 
            accessorKey: "documentNumber" 
        },
        { 
            header: "Plan Actual", 
            accessorKey: "subscriptionPlan" 
        },
        { 
            header: "Estado", 
            render: (row) => <ComerziaBadge label={row.status} /> 
        },
        { 
            header: "Acciones", 
            className: "text-right w-24",
            render: (row) => (
                <CrudButtons 
                    onEdit={() => onEdit(row)} 
                    onDelete={() => onDelete(row)} 
                />
            ) 
        }
    ];

    // 3. Renderizamos tu tabla genérica pasándole esta configuración
    return (
        <TravesiaTable<TenantRow> 
            data={data} 
            columns={columns} 
            isLoading={isLoading} 
            // Opcional: Pintar la fila entera de rojizo si está suspendido
            rowClassName={(row) => row.status === 'SUSPENDED' ? 'bg-error/10' : ''}
        />
    );
};