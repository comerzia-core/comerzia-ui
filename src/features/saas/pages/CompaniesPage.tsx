import { useEffect, useState, useCallback } from "react";
import { CompaniesTable } from "../components/companies/CompaniesTable";
import { getCompanies } from "../services/companyService";
import type { SaasCompanyListResponse } from "../types/company";
import { BtnCreate } from "../../../components/ui/CrudButtons";
// Asumiendo que BtnCreate se exporta desde CrudButtons u otro archivo de UI
// import { BtnCreate } from "../../../components/ui/CrudButtons"; 

export const CompaniesPage = () => {
    const [companies, setCompanies] = useState<SaasCompanyListResponse[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const fetchCompanies = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await getCompanies();
            setCompanies(data);
        } catch (error) {
            console.error("Failed to fetch companies:", error);
            // Aquí en un futuro puedes integrar el ToastContext para mostrar error al usuario
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Ejecutamos la petición al montar la vista
    useEffect(() => {
        fetchCompanies();
    }, [fetchCompanies]);

    return (
        <div className="flex flex-col gap-6 p-6">
            {/* Header de la vista */}
            <div className="flex justify-between items-center bg-base-100 p-4 rounded-xl shadow-sm border border-base-200">
                <div>
                    <h1 className="text-2xl font-bold text-base-content">Empresas</h1>
                    <p className="text-sm text-base-content/70">
                        Administración del portafolio global de clientes SaaS
                    </p>
                </div>
                
                {/* Botón estandarizado para futuras creaciones */}
                <BtnCreate onClick={() => console.log("Open Create Wizard")} />
            </div>

            {/* Renderizado de la tabla inteligente */}
            <CompaniesTable 
                data={companies} 
                isLoading={isLoading} 
            />
        </div>
    );
};