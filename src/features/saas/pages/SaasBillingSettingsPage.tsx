import { useState } from 'react';
import { QrCode, Building2, CreditCard, HelpCircle, Image as ImageIcon } from 'lucide-react';
import { ComerziaSurface } from '../../../components/ui/ComerziaSurface';
import { BtnEdit } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { usePlatformData } from '../hooks/usePlatformData';
import { BillingSettingsModal } from '../components/BillingSettingsModal';
import type { BillingSettings } from '../../organization/types/subscription';

export function SaasBillingSettingsPage() {
  const settings = usePlatformData<BillingSettings>('/saas/billing/settings');
  const [editing, setEditing] = useState(false);
  const { can } = usePermission();

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Cuenta y QR oficial
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Cuenta bancaria e imagen oficial de pago QR que se presentan en el checkout de renovación.
            </p>
          </div>
        </div>

        {can('SYS_BILLING_SETTINGS_MANAGE') && settings.data && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <BtnEdit
              label="Modificar datos o QR"
              responsive={false}
              onClick={() => setEditing(true)}
            />
          </div>
        )}
      </div>

      {settings.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar la configuración de cobro.</span>
        </div>
      )}

      {settings.isPending && (
        <div className="flex items-center justify-center py-16 gap-3 text-base-content/60" role="status">
          <span className="loading loading-spinner loading-md text-primary" />
          <span className="text-sm font-medium">Cargando datos de cobro oficiales…</span>
        </div>
      )}

      {/* 2. TARJETAS DE INFORMACIÓN Y VISOR QR */}
      {settings.data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna Izquierda: Datos de la cuenta bancaria */}
          <div className="lg:col-span-2 space-y-6">
            <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-base-200 pb-3">
                <CreditCard className="w-5 h-5 text-primary shrink-0" />
                <h3 className="font-bold text-base text-base-content">
                  Datos de Transferencia Bancaria
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium">Titular Receptor</span>
                  <p className="font-semibold text-base-content text-sm sm:text-base">
                    {settings.data.receiverName}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium flex items-center gap-1">
                    <Building2 size={13} /> Entidad Bancaria
                  </span>
                  <p className="font-medium text-base-content">
                    {settings.data.bankName || 'Sin configurar'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium">Número de Cuenta</span>
                  <p className="font-mono font-bold text-base-content">
                    {settings.data.accountNumber || 'Sin configurar'}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-base-content/60 font-medium">Moneda Oficial</span>
                  <p className="font-medium text-base-content">
                    {settings.data.currency || 'BOB'}
                  </p>
                </div>
              </div>

              {/* Indicaciones para el cliente */}
              <div className="pt-2 border-t border-base-200 space-y-1.5">
                <span className="text-base-content/60 font-medium flex items-center gap-1 text-xs">
                  <HelpCircle size={13} /> Indicaciones mostradas a los clientes
                </span>
                <p className="text-xs sm:text-sm text-base-content/80 bg-base-200/50 p-3 rounded-xl border border-base-200 leading-relaxed">
                  {settings.data.instructions || 'Sin instrucciones adicionales.'}
                </p>
              </div>
            </ComerziaSurface>
          </div>

          {/* Columna Derecha: Código QR Oficial */}
          <div className="space-y-6">
            <ComerziaSurface className="p-5 sm:p-6 rounded-2xl border border-base-200 bg-base-100 shadow-xs flex flex-col items-center text-center space-y-4">
              <div className="w-full flex items-center justify-between border-b border-base-200 pb-3">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-primary shrink-0" />
                  <h3 className="font-bold text-base text-base-content">
                    QR Oficial de Cobro
                  </h3>
                </div>
              </div>

              {settings.data.qrUrl ? (
                <div className="p-3 bg-white rounded-2xl border border-base-200 shadow-xs flex items-center justify-center max-w-[260px] w-full aspect-square">
                  <img
                    alt="QR oficial de cobro"
                    src={settings.data.qrUrl}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full aspect-square max-w-[260px] rounded-2xl border border-dashed border-base-300 flex flex-col items-center justify-center p-6 text-base-content/40 text-xs">
                  <QrCode size={40} className="mb-2 opacity-30" />
                  <span>QR pendiente de configuración</span>
                </div>
              )}

              <p className="text-xs text-base-content/60 leading-relaxed">
                Este código QR es el que se descarga automáticamente cuando los clientes seleccionan el método QR en la tienda.
              </p>
            </ComerziaSurface>
          </div>
        </div>
      )}

      {/* MODAL DE EDICIÓN */}
      {editing && settings.data && (
        <BillingSettingsModal value={settings.data} onClose={() => setEditing(false)} />
      )}
    </div>
  );
}
