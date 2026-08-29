import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getCompanyById } from "../services/companyService";
import type { SaasCompanyDetailResponse } from "../types/company";
import { CompanyBranchesTab } from "../components/companies/tabs/CompanyBranchesTab";
import { CompanyEmployeesTab } from "../components/companies/tabs/CompanyEmployeesTab";
import { CompanySubscriptionsTab } from "../components/companies/tabs/CompanySubscriptionsTab";
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
        <div className="flex flex-col gap-6 p-4 sm:p-6 animate-fade-in">
            
            {/* Cabecera / Info Rápida */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-base-100 p-4 sm:p-6 rounded-2xl shadow-sm border border-base-200">
                <div className="flex items-center gap-4">
                    <div className="avatar">
                        <div className="w-14 sm:w-16 rounded-xl border border-base-300">
                            {company.saasCompanySettingsResponse?.companyLogoUrl ? (
                                <img src={company.saasCompanySettingsResponse.companyLogoUrl} alt="Logo" />
                            ) : (
                                <div className="bg-base-200 w-full h-full flex items-center justify-center font-bold text-base-content/50">
                                    {company.legalName.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-base-content leading-tight">{company.legalName}</h1>
                        <p className="text-xs sm:text-sm text-base-content/70 mt-0.5">
                            NIT: {company.taxId} | Comercial: {company.commercialName}
                        </p>
                    </div>
                </div>
                <div className="w-full sm:w-auto sm:ml-auto">
                    <button onClick={() => navigate('/saas/tenants')} className="btn btn-sm btn-ghost w-full sm:w-auto">
                        Volver al Listado
                    </button>
                </div>
            </div>

            {/* Sistema de Tabs (Manejado por Estado Local) */}
            <div className="w-full">
                <div className="tabs tabs-boxed bg-base-200 p-1 rounded-t-xl gap-1 font-semibold overflow-x-auto flex-nowrap">
                    <a className={`tab text-xs sm:text-sm whitespace-nowrap ${activeTab === 0 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(0)}>
                        Configuración General
                    </a>
                    <a className={`tab text-xs sm:text-sm whitespace-nowrap ${activeTab === 1 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(1)}>
                        Suscripciones
                    </a>
                    <a className={`tab text-xs sm:text-sm whitespace-nowrap ${activeTab === 2 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(2)}>
                        Sucursales
                    </a>
                    <a className={`tab text-xs sm:text-sm whitespace-nowrap ${activeTab === 3 ? 'tab-active !bg-base-100 shadow-sm' : ''}`} onClick={() => setActiveTab(3)}>
                        Empleados
                    </a>
                </div>

                {/* Renderizado de Componentes según Tab Activo (Lazy Loading implicito) */}
                <div className="bg-base-100 rounded-b-xl border border-t-0 border-base-200 p-4 sm:p-6 min-h-[400px]">
                    
                    {/* TAB 1: Ajustes Generales Mejorados visualmente */}
                    {activeTab === 0 && (
                        <div className="p-6">
                            <h3 className="font-bold text-lg border-b pb-2 mb-6">Parámetros de Operación</h3>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                                    <span className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Moneda Principal</span>
                                    <span className="text-lg font-bold">{company.saasCompanySettingsResponse?.currencyCode || 'No definida'}</span>
                                </div>
                                
                                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                                    <span className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Zona Horaria</span>
                                    <span className="text-lg font-bold">{company.saasCompanySettingsResponse?.timezone || 'UTC'}</span>
                                </div>
                                
                                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200">
                                    <span className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Impuesto por Defecto</span>
                                    <span className="text-lg font-bold">
                                        {company.saasCompanySettingsResponse?.taxName} ({company.saasCompanySettingsResponse?.taxPercentage}%)
                                    </span>
                                </div>

                                <div className="bg-base-200/50 p-4 rounded-xl border border-base-200 md:col-span-3">
                                    <span className="block text-xs font-semibold text-base-content/60 uppercase tracking-wider mb-1">Pie de Ticket (Impresión)</span>
                                    <p className="text-sm italic text-base-content/80">
                                        "{company.saasCompanySettingsResponse?.ticketFooterText || 'Sin texto configurado'}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 2: Suscripciones - Ahora con la tabla */}
                    {activeTab === 1 && (
                        <CompanySubscriptionsTab 
                            subscriptions={company.subscriptionHistory} 
                            // Pasamos el timezone de la empresa configurada, con un fallback seguro a UTC
                            companyTimezone={company.saasCompanySettingsResponse?.timezone || 'UTC'} 
                        />
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