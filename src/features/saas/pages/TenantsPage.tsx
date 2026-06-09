import { useState } from "react";
import { BtnCreate } from "../../../components/ui/CrudButtons";
import { TenantsTable, type TenantRow } from "../components/tenants/TenantsTable";
// import { CreateTenantWizard } from "../components/tenants/CreateTenantWizard"; // Lo crearemos en el sig. paso

export const TenantsPage = () => {
    // Estados simulados (Luego los conectaremos a Zustand o React Query)
    const [isLoading, setIsLoading] = useState(false);
    const [tenants, setTenants] = useState<TenantRow[]>([
        { id: 1, companyName: "TechCorp S.A.", documentNumber: "123456789", subscriptionPlan: "Enterprise", status: "ACTIVE" },
        { id: 2, companyName: "Boutique Bella", documentNumber: "987654321", subscriptionPlan: "Basic", status: "SUSPENDED" },
    ]);
    const [isWizardOpen, setIsWizardOpen] = useState(false);

    // Handlers
    const handleEdit = (tenant: TenantRow) => {
        console.log("Editando tenant:", tenant);
        // Abrir modal de edición
    };

    const handleDelete = (tenant: TenantRow) => {
        console.log("Eliminando tenant:", tenant);
        // Abrir modal de confirmación destructiva
    };

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header de la página */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Directorio de Empresas</h1>
                    <p className="text-base-content/60 text-sm mt-1">
                        Gestiona los clientes (Tenants) que utilizan la plataforma SaaS.
                    </p>
                </div>
                
                {/* Botón estandarizado de tu UI Kit */}
                <BtnCreate 
                    label="Nueva Empresa" 
                    onClick={() => setIsWizardOpen(true)} 
                />
            </div>

            {/* La tabla inteligente */}
            <div className="card bg-base-100 shadow-sm border border-base-200">
                <div className="card-body p-0">
                    <TenantsTable 
                        data={tenants} 
                        isLoading={isLoading} 
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </div>
            </div>

            {/* Aquí insertaremos el Wizard de Creación en el próximo paso */}
            {/* {isWizardOpen && (
                <CreateTenantWizard onClose={() => setIsWizardOpen(false)} />
            )} */}
        </div>
    );
};