import { useEffect, useState, useCallback } from "react";
import { CompaniesTable } from "../components/companies/CompaniesTable";
import { CreateCompanyWizard } from "../components/companies/CreateCompanyWizard";
import { CompanyCredentialsModal } from "../components/companies/CompanyCredentialsModal";
import { getCompanies } from "../services/companyService";
import type { SaasCompanyListResponse, CompanyCreatedResponse } from "../types/company";
import { BtnCreate } from "../../../components/ui/CrudButtons";

export const CompaniesPage = () => {
    const [companies, setCompanies] = useState<SaasCompanyListResponse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    
    // Estados orquestadores de los Modales
    const [isWizardOpen, setIsWizardOpen] = useState(false);
    
    // Estado para capturar y mostrar las credenciales generadas
    const [credentialsData, setCredentialsData] = useState<CompanyCreatedResponse | null>(null);

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

    // Handler cuando el wizard termina exitosamente
    const handleCreateSuccess = (data: CompanyCreatedResponse) => {
        fetchCompanies(); // Recargamos la tabla en segundo plano
        setCredentialsData(data); // Inyectamos la data para abrir el modal de credenciales automáticamente
    };

    const handleCloseCredentials = () => {
        // Al cerrar el modal, purgamos la data de RAM por seguridad
        setCredentialsData(null);
    };

    return (
        <div className="flex flex-col gap-6 p-4 sm:p-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-base-100 p-4 rounded-2xl shadow-sm border border-base-200">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Empresas (Tenants)</h1>
                    <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
                        Administración global de clientes SaaS
                    </p>
                </div>
                
                <BtnCreate 
                    onClick={() => setIsWizardOpen(true)}
                    label="Nueva Empresa"
                    responsive={true}
                    className="w-full sm:w-auto"
                />
            </div>

            <CompaniesTable 
                data={companies} 
                isLoading={isLoading} 
            />

            {/* Modal 1: Creación */}
            <CreateCompanyWizard 
                isOpen={isWizardOpen}
                onClose={() => setIsWizardOpen(false)}
                onSuccess={handleCreateSuccess}
            />

            {/* Modal 2: Entrega de Credenciales (Solo se renderiza si credentialsData existe) */}
            <CompanyCredentialsModal
                isOpen={!!credentialsData}
                data={credentialsData}
                onClose={handleCloseCredentials}
            />
            
        </div>
    );
};