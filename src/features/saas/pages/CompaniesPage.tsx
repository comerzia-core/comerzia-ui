import { useEffect, useState, useCallback } from "react";
import { CompaniesTable } from "../components/companies/CompaniesTable";
import { CreateCompanyWizard } from "../components/companies/CreateCompanyWizard";
import { getCompanies } from "../services/companyService";
import type { SaasCompanyListResponse } from "../types/company";
import { Plus } from "lucide-react"; // Para el botón de crear

export const CompaniesPage = () => {
    const [companies, setCompanies] = useState<SaasCompanyListResponse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [isWizardOpen, setIsWizardOpen] = useState(false); // Estado del modal

    const fetchCompanies = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getCompanies();
            setCompanies(data);
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    const handleCreateSuccess = () => {
        // Al crear con éxito, recargamos la lista
        fetchCompanies();
    };

    return (
        <div className="flex flex-col gap-6 p-6">
            
            {/* Header */}
            <div className="flex justify-between items-center bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Empresas (Tenants)</h1>
                    <p className="text-sm text-base-content/70">
                        Administración global de clientes SaaS
                    </p>
                </div>
                
                {/* Botón estandarizado de creación */}
                <button 
                    onClick={() => setIsWizardOpen(true)}
                    className="btn btn-primary btn-sm rounded-lg"
                >
                    <Plus size={16} /> Nueva Empresa
                </button>
            </div>

            <CompaniesTable 
                data={companies} 
                isLoading={isLoading} 
            />

            {/* Modal Wizard Inyectado */}
            <CreateCompanyWizard 
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={handleCreateSuccess}
            />
            
        </div>
    );
};