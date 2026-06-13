import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCompanyById } from "../services/companyService";
import type { SaasCompanyDetailResponse } from "../types/company";
import { CompanyBranchesTab } from "../components/companies/tabs/CompanyBranchesTab";
import { CompanyEmployeesTab } from "../components/companies/tabs/CompanyEmployeesTab";
// import { CompanyEmployeesTab } from "../components/companies/tabs/CompanyEmployeesTab";
// import { formatDateForUser } from "../../../utils/date"; 

export const CompanyDashboardPage = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    
    const [company, setCompany] = useState<SaasCompanyDetailResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(0);

    const fetchDetail = useCallback(async () => {
        if (!id) return;
        try {
            setIsLoading(true);
            const data = await getCompanyById(id);
            setCompany(data);
        } catch (error) {
            console.error("Failed to load company details", error);
            // Volver si la empresa no existe
            navigate('/saas/tenants');
        } finally {
            setIsLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        fetchDetail();
    }, [fetchDetail]);

    if (isLoading) {
        return <div className="flex justify-center p-20"><span className="loading loading-spinner loading-lg text-primary"></span></div>;
    }

    if (!company) return null;

    return (
        <div className="flex flex-col gap-6 p-6">
            
            {/* Cabecera / Info Rápida */}
            <div className="flex items-center gap-4 bg-base-100 p-6 rounded-xl shadow-sm border border-base-200">
                <div className="avatar">
                    <div className="w-16 rounded-xl border border-base-300">
                        {company.settings?.companyLogoUrl ? (
                            <img src={company.settings.companyLogoUrl} alt="Logo" />
                        ) : (
                            <div className="bg-base-200 w-full h-full flex items-center justify-center font-bold text-base-content/50">
                                {company.legalName.substring(0, 2).toUpperCase()}
                            </div>
                        )}
                    </div>
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-base-content">{company.legalName}</h1>
                    <p className="text-sm text-base-content/70">
                        NIT: {company.taxId} | Comercial: {company.commercialName}
                    </p>
                </div>
                <div className="ml-auto">
                    {/* Botón estandarizado de "Regresar" o breadcrumb */}
                    <button onClick={() => navigate('/saas/tenants')} className="btn btn-sm btn-ghost">
                        Volver al Listado
                    </button>
                </div>
            </div>

            {/* Sistema de Tabs (Manejado por Estado Local) */}
            <div className="w-full">
                <div className="tabs tabs-boxed bg-base-200 p-1 rounded-t-xl gap-1 font-semibold">
                    <a className={`tab ${activeTab === 0 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(0)}>
                        Configuración General
                    </a>
                    <a className={`tab ${activeTab === 1 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(1)}>
                        Suscripciones
                    </a>
                    <a className={`tab ${activeTab === 2 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(2)}>
                        Sucursales
                    </a>
                    <a className={`tab ${activeTab === 3 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(3)}>
                        Empleados
                    </a>
                </div>

                {/* Renderizado de Componentes según Tab Activo (Lazy Loading implicito) */}
                <div className="bg-base-100 rounded-b-xl border border-t-0 border-base-200 p-6 min-h-[400px]">
                    
                    {activeTab === 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <h3 className="col-span-full font-bold text-lg border-b pb-2 mb-2">Ajustes Locales</h3>
                            <div className="flex flex-col"><span className="text-xs text-gray-500">Moneda</span><span className="font-medium">{company.settings?.currencyCode}</span></div>
                            <div className="flex flex-col"><span className="text-xs text-gray-500">Zona Horaria</span><span className="font-medium">{company.settings?.timezone}</span></div>
                            <div className="flex flex-col"><span className="text-xs text-gray-500">Impuesto Default</span><span className="font-medium">{company.settings?.taxName} ({company.settings?.taxPercentage}%)</span></div>
                        </div>
                    )}

                    {activeTab === 1 && (
                        <div>
                            <h3 className="font-bold text-lg border-b pb-2 mb-4">Historial de Suscripciones</h3>
                            {/* Renderizarías aquí otra <ComerziaTable> sencilla con company.subscriptionHistory */}
                            <pre className="text-xs bg-base-200 p-4 rounded-lg overflow-x-auto">
                                {JSON.stringify(company.subscriptionHistory, null, 2)}
                            </pre>
                        </div>
                    )}

                    {activeTab === 2 && (
                        <CompanyBranchesTab companyId={company.id} />
                    )}

                    {activeTab === 3 && (
                        <CompanyEmployeesTab companyId={company.id} />
                    )}

                </div>
            </div>
        </div>
    );
};