import { useState, useEffect } from 'react';
import { Sliders, Shield, Store, Globe, Building2, AlertCircle, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/axios';
import { useToast } from '../../../context/ToastContext';
import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';

interface SaasPlatformSettings {
    platformMode: 'PRIVATE' | 'PUBLIC';
    publicRegistrationEnabled: boolean;
    publicLandingEnabled: boolean;
    publicCatalogsEnabled: boolean;
    platformBrandName: string;
    registrationDisabledMessage: string;
    updatedAt?: string;
    updatedBy?: string;
}

export function SaasPlatformSettingsPage() {
    const queryClient = useQueryClient();
    const { success, error: toastError } = useToast();

    const { data: settings, isLoading, isError } = useQuery<SaasPlatformSettings>({
        queryKey: ['saas-platform-settings'],
        queryFn: async () => {
            const res = await api.get('/saas/settings/platform');
            return res.data?.data || res.data;
        }
    });

    const [form, setForm] = useState<SaasPlatformSettings>({
        platformMode: 'PRIVATE',
        publicRegistrationEnabled: false,
        publicLandingEnabled: false,
        publicCatalogsEnabled: false,
        platformBrandName: 'Comerzia ERP',
        registrationDisabledMessage: 'El registro público de empresas se encuentra inhabilitado en esta plataforma.'
    });

    useEffect(() => {
        if (settings) {
            setForm({
                platformMode: settings.platformMode || 'PRIVATE',
                publicRegistrationEnabled: Boolean(settings.publicRegistrationEnabled),
                publicLandingEnabled: Boolean(settings.publicLandingEnabled),
                publicCatalogsEnabled: Boolean(settings.publicCatalogsEnabled),
                platformBrandName: settings.platformBrandName || 'Comerzia ERP',
                registrationDisabledMessage: settings.registrationDisabledMessage || 'El registro público de empresas se encuentra inhabilitado en esta plataforma.'
            });
        }
    }, [settings]);

    const mutation = useMutation({
        mutationFn: async (updated: SaasPlatformSettings) => {
            const res = await api.put('/saas/settings/platform', updated);
            return res.data?.data || res.data;
        },
        onSuccess: () => {
            success('Ajustes de plataforma actualizados correctamente.');
            queryClient.invalidateQueries({ queryKey: ['saas-platform-settings'] });
            queryClient.invalidateQueries({ queryKey: ['platform-config'] });
        },
        onError: () => {
            toastError('No se pudieron guardar los ajustes de plataforma.');
        }
    });

    const applyPreset = (mode: 'PRIVATE' | 'PUBLIC') => {
        if (mode === 'PRIVATE') {
            setForm(prev => ({
                ...prev,
                platformMode: 'PRIVATE',
                publicRegistrationEnabled: false,
                publicLandingEnabled: false,
                publicCatalogsEnabled: false
            }));
        } else {
            setForm(prev => ({
                ...prev,
                platformMode: 'PUBLIC',
                publicRegistrationEnabled: true,
                publicLandingEnabled: true
            }));
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        mutation.mutate(form);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-20 gap-3 text-base-content/60">
                <span className="loading loading-spinner loading-md text-primary" />
                <span className="text-sm font-medium">Cargando ajustes de plataforma…</span>
            </div>
        );
    }

    if (isError) {
        return (
            <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
                <AlertCircle size={18} />
                <span>No se pudieron consultar los ajustes de plataforma. Verifica tus permisos de SAAS_OWNER.</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 w-full animate-fade-in">
            {/* 1. HEADER DE LA PÁGINA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                    <Sliders className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
                    <div>
                        <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
                            Ajustes de plataforma y gobernanza
                        </h1>
                        <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
                            Control exclusivo del SAAS Owner para conmutar entre Modo Corporativo Privado y Modo SaaS Público, y gestionar catálogos públicos.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={handleSave}
                    disabled={mutation.isPending}
                    className="btn btn-primary gap-2 shadow-sm rounded-xl px-5"
                >
                    <Save size={18} />
                    {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
                </button>
            </div>

            <form onSubmit={handleSave} className="space-y-6">
                {/* 2. SELECTOR DE MODO PRESET */}
                <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-4">
                    <h2 className="text-base font-bold text-base-content flex items-center gap-2">
                        <Building2 size={19} className="text-primary" />
                        Modo de operación del servidor
                    </h2>
                    <p className="text-xs sm:text-sm text-base-content/70">
                        Selecciona el perfil base para este servidor. Aplica los valores recomendados para VPS dedicado o para VPS comercial.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div
                            onClick={() => applyPreset('PRIVATE')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                form.platformMode === 'PRIVATE'
                                    ? 'border-primary bg-primary/5 shadow-xs'
                                    : 'border-base-200 hover:border-base-300 bg-base-100'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-base-content flex items-center gap-1.5">
                                    <Shield size={16} className="text-primary" />
                                    Modo Corporativo Privado
                                </span>
                                {form.platformMode === 'PRIVATE' && (
                                    <span className="badge badge-primary badge-sm gap-1">Activo</span>
                                )}
                            </div>
                            <p className="text-xs text-base-content/70 leading-relaxed">
                                Ideal para el VPS de clientes perpetuos. Redirige la raíz directamente al Login Corporativo (DaisyUI), inhabilita el auto-registro y oculta menciones de servicio SaaS.
                            </p>
                        </div>

                        <div
                            onClick={() => applyPreset('PUBLIC')}
                            className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                form.platformMode === 'PUBLIC'
                                    ? 'border-primary bg-primary/5 shadow-xs'
                                    : 'border-base-200 hover:border-base-300 bg-base-100'
                            }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className="font-bold text-sm text-base-content flex items-center gap-1.5">
                                    <Globe size={16} className="text-primary" />
                                    Modo SaaS Comercial Público
                                </span>
                                {form.platformMode === 'PUBLIC' && (
                                    <span className="badge badge-primary badge-sm gap-1">Activo</span>
                                )}
                            </div>
                            <p className="text-xs text-base-content/70 leading-relaxed">
                                Para el VPS de acceso masivo. Activa la Landing comercial de Comerzia con catálogo de planes, beneficios y permite que cualquier usuario cree una nueva empresa.
                            </p>
                        </div>
                    </div>
                </ComerziaSurface>

                {/* 3. SWITCHES GRANULARES */}
                <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-5">
                    <h2 className="text-base font-bold text-base-content flex items-center gap-2">
                        <Sliders size={19} className="text-primary" />
                        Control granular de características (Feature Flags)
                    </h2>

                    <div className="divide-y divide-base-200">
                        {/* Switch 1: Auto-registro */}
                        <div className="py-4 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-sm text-base-content">
                                    Registro público de nuevas empresas
                                </h3>
                                <p className="text-xs text-base-content/70 mt-0.5">
                                    Permite crear cuentas y empresas desde las rutas públicas (`/register`, registro con Google). Si se desactiva, los endpoints responden 403 Forbidden.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-md"
                                checked={form.publicRegistrationEnabled}
                                onChange={e => setForm(prev => ({ ...prev, publicRegistrationEnabled: e.target.checked }))}
                            />
                        </div>

                        {/* Switch 2: Landing page comercial */}
                        <div className="py-4 flex items-center justify-between gap-4">
                            <div>
                                <h3 className="font-semibold text-sm text-base-content">
                                    Landing page comercial en raíz (`/`)
                                </h3>
                                <p className="text-xs text-base-content/70 mt-0.5">
                                    Muestra la portada de presentación y venta de planes. Si se desactiva, la raíz redirige automáticamente al Login de acceso.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-md"
                                checked={form.publicLandingEnabled}
                                onChange={e => setForm(prev => ({ ...prev, publicLandingEnabled: e.target.checked }))}
                            />
                        </div>

                        {/* Switch 3: Catálogos públicos (Storefront) */}
                        <div className="py-4 flex items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-sm text-base-content">
                                        Catálogos públicos (Storefront)
                                    </h3>
                                    <span className="badge badge-warning badge-xs font-semibold">EN DESARROLLO</span>
                                </div>
                                <p className="text-xs text-base-content/70 mt-0.5">
                                    Habilita los catálogos públicos y rutas de storefront (`/c/:slug`). Mientras esté desactivado, el menú en los inquilinos y las rutas públicas permanecerán completamente ocultos y bloqueados.
                                </p>
                            </div>
                            <input
                                type="checkbox"
                                className="toggle toggle-primary toggle-md"
                                checked={form.publicCatalogsEnabled}
                                onChange={e => setForm(prev => ({ ...prev, publicCatalogsEnabled: e.target.checked }))}
                            />
                        </div>
                    </div>
                </ComerziaSurface>

                {/* 4. TEXTOS Y MARCA INSTITUCIONAL */}
                <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-4">
                    <h2 className="text-base font-bold text-base-content flex items-center gap-2">
                        <Store size={19} className="text-primary" />
                        Identidad del portal institucional
                    </h2>

                    <div className="grid grid-cols-1 gap-4">
                        <ComerziaInput
                            id="platformBrandName"
                            name="platformBrandName"
                            label="Nombre de marca / Título del sistema"
                            value={form.platformBrandName}
                            maxLength={150}
                            onChange={e => setForm(prev => ({ ...prev, platformBrandName: e.target.value }))}
                        />

                        <ComerziaInput
                            id="registrationDisabledMessage"
                            name="registrationDisabledMessage"
                            label="Mensaje cuando el registro esté inhabilitado"
                            value={form.registrationDisabledMessage}
                            maxLength={255}
                            onChange={e => setForm(prev => ({ ...prev, registrationDisabledMessage: e.target.value }))}
                        />
                    </div>
                </ComerziaSurface>
            </form>
        </div>
    );
}
