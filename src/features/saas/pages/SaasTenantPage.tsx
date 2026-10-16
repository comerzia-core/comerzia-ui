import { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Building2, CreditCard, Store, Users, FileText, Calendar, Clock, Globe2, ShieldAlert, CheckCircle2, DollarSign } from 'lucide-react';
import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave, BtnAccess, BtnEdit } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformData, usePlatformAction } from '../hooks/usePlatformData';
import { platformService } from '../services/platformService';
import { TenantAccountTable } from '../components/TenantAccountTable';
import { TenantSubscriptionPanel } from '../components/TenantSubscriptionPanel';
import { TenantBranchTable } from '../components/TenantBranchTable';
import { SaasCompanyProfileEditor } from '../components/SaasCompanyProfileEditor';
import { formatDateForUser } from '../../../utils/date';
import type { SaasCompanyDetailResponse } from '../types/company';

type TenantTab = 'summary' | 'subscription' | 'branches' | 'users';

export function SaasTenantPage() {
  const { id = '' } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermission();

  const base = '/saas/companies/' + encodeURIComponent(id);
  const query = usePlatformData<SaasCompanyDetailResponse>(base);

  const [profileEditor, setProfileEditor] = useState(false);
  const [statusEditor, setStatusEditor] = useState(false);
  const [reason, setReason] = useState('');
  const [shake, setShake] = useState(0);

  // Sincronización de pestañas con query param (?tab=...)
  const tabParam = searchParams.get('tab') as TenantTab | null;
  const initialTab: TenantTab = tabParam === 'subscription' || tabParam === 'branches' || tabParam === 'users'
    ? tabParam
    : 'summary';

  const [activeTab, setActiveTab] = useState<TenantTab>(initialTab);

  useEffect(() => {
    if (tabParam && ['summary', 'subscription', 'branches', 'users'].includes(tabParam)) {
      setActiveTab(tabParam as TenantTab);
    }
  }, [tabParam]);

  const handleTabChange = (nextTab: TenantTab) => {
    setActiveTab(nextTab);
    setSearchParams({ tab: nextTab });
  };

  const statusAction = usePlatformAction(() =>
    platformService.patch(base + '/status', { active: !query.data!.status, reason })
  );

  if (query.isPending) {
    return (
      <div className="flex items-center justify-center py-16 gap-3 text-base-content/60" role="status">
        <span className="loading loading-spinner loading-md text-primary" />
        <span className="text-sm font-medium">Cargando ficha de la empresa…</span>
      </div>
    );
  }

  if (!query.data || query.isError) {
    return (
      <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
        <span>No se pudo cargar la información de la empresa.</span>
      </div>
    );
  }

  const company = query.data;

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA EMPRESA (PC & MOBILE) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 min-w-0">
          <div className="p-2 sm:p-2.5 rounded-2xl bg-primary/10 text-primary shrink-0 mt-0.5">
            <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight break-words">
                {company.commercialName}
              </h1>
              <span className={`badge badge-sm font-semibold ${company.status ? 'badge-success text-success-content' : 'badge-error text-error-content'}`}>
                {company.status ? 'Habilitada' : 'Suspendida'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 flex items-center gap-1.5 flex-wrap">
              <span>{company.legalName}</span>
              <span>·</span>
              <span className="font-mono font-medium">NIT {company.taxId}</span>
            </p>
          </div>
        </div>

        {/* Acciones principales de cabecera */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {can('SYS_COMPANIES_MANAGE') && (
            <BtnAccess
              disabledAccess={!company.status}
              responsive={false}
              label={company.status ? 'Suspender empresa' : 'Habilitar empresa'}
              onClick={() => {
                setReason('');
                setShake(0);
                setStatusEditor(true);
              }}
            />
          )}
        </div>
      </div>

      {/* 2. SELECTOR DE PESTAÑAS (Estilo estándar idéntico a Impresoras y Hardware) */}
      <div className="border-b border-base-200">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar scroll-smooth">
          {/* TAB 1: RESUMEN */}
          <button
            type="button"
            onClick={() => handleTabChange('summary')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'summary'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
            }`}
          >
            <FileText size={15} className="shrink-0" />
            <span>Resumen</span>
          </button>

          {/* TAB 2: SUSCRIPCIÓN */}
          <button
            type="button"
            onClick={() => handleTabChange('subscription')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'subscription'
                ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
            }`}
          >
            <CreditCard size={15} className="shrink-0" />
            <span>Suscripción</span>
          </button>

          {/* TAB 3: SUCURSALES (In-place, sin salir de la ficha) */}
          {can('SYS_COMPANIES_MANAGE') && (
            <button
              type="button"
              onClick={() => handleTabChange('branches')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'branches'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                  : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
              }`}
            >
              <Store size={15} className="shrink-0" />
              <span>Sucursales</span>
            </button>
          )}

          {/* TAB 4: USUARIOS */}
          {can('SYS_TENANT_USERS_READ') && (
            <button
              type="button"
              onClick={() => handleTabChange('users')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-primary text-primary bg-primary/5 rounded-t-xl'
                  : 'border-transparent text-base-content/60 hover:text-base-content hover:bg-base-200/50 rounded-t-xl'
              }`}
            >
              <Users size={15} className="shrink-0" />
              <span>Usuarios</span>
            </button>
          )}
        </div>
      </div>

      {/* 3. CONTENIDO DE LAS PESTAÑAS */}
      <div className="space-y-6">
        {/* TAB 1: RESUMEN CORPORATIVO Y FINANCIERO */}
        {activeTab === 'summary' && (
          <div className="space-y-6 animate-fade-in">
            {/* Tarjeta de Información General */}
            <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-5">
              <div className="flex items-center justify-between gap-3 border-b border-base-200 pb-3">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-bold text-base text-base-content">
                    Perfil Comercial y Fiscal
                  </h3>
                </div>
                {can('SYS_COMPANIES_MANAGE') && (
                  <BtnEdit onClick={() => setProfileEditor(true)} label="Editar perfil" responsive={false} />
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium">Estado Operativo</span>
                  <div className="flex items-center gap-2 font-semibold">
                    {company.status ? (
                      <span className="text-success flex items-center gap-1.5">
                        <CheckCircle2 size={16} /> Empresa habilitada
                      </span>
                    ) : (
                      <span className="text-error flex items-center gap-1.5">
                        <ShieldAlert size={16} /> Empresa suspendida
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium">Correo Electrónico</span>
                  <p className="font-medium text-base-content">{company.email || 'Sin configurar'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium">Teléfono de Contacto</span>
                  <p className="font-medium text-base-content">{company.phoneNumber || 'Sin configurar'}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium">Dirección Fiscal / Legal</span>
                  <p className="font-medium text-base-content">{company.address || 'Sin configurar'}</p>
                </div>

                {company.registeredAt && (
                  <div className="space-y-1">
                    <span className="text-base-content/60 font-medium flex items-center gap-1">
                      <Calendar size={13} /> Fecha de Registro
                    </span>
                    <p className="font-medium text-base-content">{formatDateForUser(company.registeredAt)}</p>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium flex items-center gap-1">
                    <Clock size={13} /> Zona Horaria
                  </span>
                  <p className="font-medium text-base-content">
                    {company.saasCompanySettingsResponse?.timezone ?? 'Sin configurar'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium flex items-center gap-1">
                    <Globe2 size={13} /> Moneda Principal
                  </span>
                  <p className="font-medium text-base-content">
                    {company.saasCompanySettingsResponse?.currencyCode ?? 'Sin configurar'}
                  </p>
                </div>
              </div>
            </ComerziaSurface>

            {/* Tarjeta de Resumen Financiero (Visible si tiene SYS_FINANCE_READ) */}
            {can('SYS_FINANCE_READ') && company.financialSummary && (
              <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-4">
                <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                  <DollarSign className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-bold text-base text-base-content">
                    Resumen financiero
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs sm:text-sm">
                  <div className="bg-base-200/50 p-3.5 rounded-xl border border-base-200">
                    <span className="text-base-content/60 text-xs">Recaudación acumulada (LTV)</span>
                    <p className="text-base sm:text-lg font-bold text-base-content mt-1">
                      {company.financialSummary.lifetimeValue.toFixed(2)} Bs
                    </p>
                  </div>
                  <div className="bg-base-200/50 p-3.5 rounded-xl border border-base-200">
                    <span className="text-base-content/60 text-xs">MRR Contratado</span>
                    <p className="text-base sm:text-lg font-bold text-primary mt-1">
                      {company.financialSummary.currentMrr.toFixed(2)} Bs
                    </p>
                  </div>
                  <div className="bg-base-200/50 p-3.5 rounded-xl border border-base-200">
                    <span className="text-base-content/60 text-xs">Pagos confirmados</span>
                    <p className="text-base sm:text-lg font-bold text-base-content mt-1">
                      {company.financialSummary.totalPaymentsCount} pagos
                    </p>
                  </div>
                </div>
              </ComerziaSurface>
            )}
          </div>
        )}

        {/* TAB 2: SUSCRIPCIÓN */}
        {activeTab === 'subscription' && (
          <div className="animate-fade-in">
            <TenantSubscriptionPanel companyId={id} />
          </div>
        )}

        {/* TAB 3: SUCURSALES (In-place) */}
        {activeTab === 'branches' && can('SYS_COMPANIES_MANAGE') && (
          <div className="animate-fade-in">
            <TenantBranchTable companyId={id} />
          </div>
        )}

        {/* TAB 4: USUARIOS */}
        {activeTab === 'users' && can('SYS_TENANT_USERS_READ') && (
          <div className="animate-fade-in">
            <TenantAccountTable companyId={id} />
          </div>
        )}
      </div>

      {/* MODAL: EDICIÓN DE PERFIL */}
      {profileEditor && (
        <SaasCompanyProfileEditor company={company} onClose={() => setProfileEditor(false)} />
      )}

      {/* MODAL: SUSPENSIÓN / HABILITACIÓN DE EMPRESA */}
      <ComerziaModal
        isOpen={statusEditor}
        onClose={() => {
          if (!statusAction.isPending) setStatusEditor(false);
        }}
        title={company.status ? 'Suspender empresa' : 'Habilitar empresa'}
        actions={
          <BtnSave
            responsive={false}
            label="Confirmar"
            isLoading={statusAction.isPending}
            onClick={() => {
              if (!reason.trim()) {
                setShake(value => value + 1);
                return;
              }
              statusAction.mutate(undefined, { onSuccess: () => setStatusEditor(false) });
            }}
          />
        }
      >
        <p className="text-xs sm:text-sm text-base-content/70 mb-4">
          La suspensión bloquea la operación de la tienda y mantiene disponible la gestión de pagos.
        </p>
        <ComerziaInput
          label="Motivo"
          isRequired
          maxLength={500}
          value={reason}
          onChange={event => setReason(event.target.value)}
          shakeKey={shake}
          error={shake && !reason.trim() ? 'Indica el motivo.' : undefined}
        />
      </ComerziaModal>
    </div>
  );
}
