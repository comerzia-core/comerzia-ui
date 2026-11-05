import { Building2, CreditCard, Settings } from 'lucide-react';
import { formatDateForUser } from '../../../utils/date';
import { getCardImageUrl } from '../../../utils/image';
import { ComerziaSwitch } from '../../../components/ui/ComerziaSwitch';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSingleImageUploader } from '../../../components/ui/ComerziaSingleImageUploader';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { ComerziaButton } from '../../../components/ui/ComerziaButton';
import { useCompanyProfileSettings } from '../hooks/useCompanyProfileSettings';

export const CompanyProfilePage = () => {
  const { profileData, isLoading, isSaving, companyLogo, setCompanyLogo, ticketLogo, setTicketLogo,
    companyQr, setCompanyQr, shakeKey, errors, formData, setFormData, handleChange, handleSaveSettings,
    tab, setTab, canManageSettings } = useCompanyProfileSettings();

  if (isLoading || !profileData) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <span className="loading loading-spinner text-primary loading-lg"></span>
      </div>
    );
  }

  const { currentSubscription } = profileData;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* TÍTULO PRINCIPAL */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-base-content flex items-center gap-2">
            <Building2 className="w-6 h-6 text-primary" />
            Perfil de la Empresa
          </h1>
          <p className="text-base-content/70 text-sm mt-1">
            Visualiza tu información y administra la configuración de operación
          </p>
        </div>
      </div>

      <div role="tablist" aria-label="Configuración de empresa" className="flex gap-2 overflow-x-auto">
        <ComerziaButton role="tab" aria-selected={tab === 'general'} aria-controls="company-general" label="Información general" variant={tab === 'general' ? 'primary' : 'ghost'} onClick={() => setTab('general')} />
        <ComerziaButton role="tab" aria-selected={tab === 'business'} aria-controls="company-business" label="Configuración empresarial" variant={tab === 'business' ? 'primary' : 'ghost'} onClick={() => setTab('business')} />
      </div>
      <div role="tabpanel" id={'company-' + tab} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA IZQUIERDA: Info General y Suscripción (Solo Lectura) */}
        {tab === 'general' && <div className="lg:col-span-1 space-y-6">
          
          {/* TARJETA INFO BÁSICA */}
          <div className="card bg-base-100 shadow-sm border border-base-200">
            <div className="card-body p-6">
              <h2 className="card-title text-lg mb-4 text-base-content/80">Identidad Empresarial</h2>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="avatar">
                  <div className="w-16 h-16 rounded-xl border border-base-300 bg-base-200 flex items-center justify-center">
                    {profileData.companyLogoUrl ? (
                      <img src={getCardImageUrl(profileData.companyLogoUrl)} alt="Logo" className="object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-base-content/40">
                        {(profileData.legalName || profileData.commercialName || '').substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="font-bold text-lg leading-tight">{profileData.commercialName}</p>
                  <p className="text-sm text-base-content/60">NIT: {profileData.taxId}</p>
                </div>
              </div>

              <div className="space-y-4 border-t border-base-200 pt-4">
                <div>
                  <span className="text-xs font-semibold text-base-content/50 uppercase">Razón Social</span>
                  <p className="font-medium text-sm">{profileData.legalName}</p>
                </div>

              </div>
            </div>
          </div>

          {/* TARJETA SUSCRIPCIÓN (Oculta para planes Perpetuos - 705) */}
          {currentSubscription && currentSubscription.planTypeCode !== 705 && (
            <div className="card bg-base-100 shadow-xs border border-base-200">
              <div className="card-body p-6">
                <h2 className="card-title text-lg mb-4 text-primary flex items-center gap-2 font-bold">
                  <CreditCard className="w-5 h-5 text-primary" /> Tu Suscripción
                </h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-base-200 pb-2">
                    <span className="text-sm font-medium text-base-content/70">Plan</span>
                    <span className="badge badge-primary font-bold">{currentSubscription.planName}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-base-200 pb-2">
                    <span className="text-sm font-medium text-base-content/70">Estado</span>
                    <span className="font-bold text-success text-sm">{currentSubscription.statusName}</span>
                  </div>

                  <div className="flex justify-between items-center border-b border-base-200 pb-2">
                    <span className="text-sm font-medium text-base-content/70">Válido hasta</span>
                    <span className="text-sm font-semibold text-base-content">
                      {formatDateForUser(currentSubscription.validUntil)}
                    </span>
                  </div>
                  
                  <div className="pt-3 grid grid-cols-3 gap-2 text-center">
                    <div className="bg-base-200/50 rounded-xl p-2.5 border border-base-200">
                      <p className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Sucursales</p>
                      <p className="font-black text-lg text-base-content">{currentSubscription.maxBranches}</p>
                    </div>
                    <div className="bg-base-200/50 rounded-xl p-2.5 border border-base-200">
                      <p className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Usuarios</p>
                      <p className="font-black text-lg text-base-content">{currentSubscription.maxUsers}</p>
                    </div>
                    <div className="bg-base-200/50 rounded-xl p-2.5 border border-base-200">
                      <p className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Productos</p>
                      <p className="font-black text-lg text-base-content">{currentSubscription.maxProducts}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>}

        {/* COLUMNA DERECHA: Formulario de Configuración (Settings) */}
        <div className={tab === 'general' ? 'lg:col-span-2' : 'lg:col-span-3'}>
          <div className="card bg-base-100 shadow-sm border border-base-200 h-full">
            <div className="card-body p-6">
              <div className="flex gap-2 items-center mb-6">
                <Settings className="w-5 h-5 text-base-content/50" />
                <h2 className="card-title text-lg m-0">{tab === 'general' ? 'Datos e identidad' : 'Configuración empresarial'}</h2>
              </div>

              <fieldset disabled={!canManageSettings || isSaving} className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 mb-6">
                
                {tab === 'general' && <>
                {/* Zona Horaria y Moneda (Solo lectura) */}
                <ComerziaInput 
                  label="Zona Horaria (Predeterminada)" 
                  name="timezone"
                  value={formData.timezone} 
                  onChange={handleChange}
                  disabled
                  shakeKey={shakeKey}
                  error={errors.timezone}
                />
                
                <ComerziaInput 
                  label="Moneda Principal (ISO)" 
                  name="currencyCode"
                  value={formData.currencyCode} 
                  onChange={handleChange}
                  disabled
                  shakeKey={shakeKey}
                  error={errors.currencyCode}
                />

                <div className="divider md:col-span-2 my-2 text-xs font-bold text-base-content/40 uppercase tracking-widest text-center whitespace-normal break-words sm:whitespace-nowrap px-1">
                  Identidad Visual
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <ComerziaSingleImageUploader
                    label="Logo de la Empresa"
                    value={companyLogo}
                    onChange={setCompanyLogo}
                    helperText="Formato: PNG o JPG. Se usará en cabecera, sidebar y reportes."
                    compact
                  />
                  <ComerziaSingleImageUploader
                    label="Logo para Tickets"
                    value={ticketLogo}
                    onChange={setTicketLogo}
                    helperText="Optimizado para impresión en tickets y recibos térmicos."
                    compact
                  />
                  <ComerziaSingleImageUploader
                    label="Código QR de Cobro"
                    value={companyQr}
                    onChange={setCompanyQr}
                    helperText="Imagen del QR de la empresa para mostrar en terminal al cobrar."
                    compact
                  />
                </div>

                <div className="divider md:col-span-2 my-2 text-xs font-bold text-base-content/40 uppercase tracking-widest text-center whitespace-normal break-words sm:whitespace-nowrap px-1">
                  Facturación e Impuestos
                </div>

                <ComerziaInput 
                  label="Nombre del Impuesto" 
                  name="taxName"
                  value={formData.taxName} 
                  onChange={handleChange}
                  placeholder="Ej. IVA"
                  maxLength={20}
                  helperText="Se mostrará en los recibos"
                />

                <ComerziaInput 
                  label="Porcentaje de Impuesto (%)" 
                  name="taxPercentage"
                  type="number"
                  value={formData.taxPercentage} 
                  onChange={handleChange}
                  placeholder="0.00"
                />

                <div className="md:col-span-2">
                  <ComerziaInput 
                    label="Mensaje al pie del Ticket" 
                    name="ticketFooterText"
                    value={formData.ticketFooterText} 
                    onChange={handleChange}
                    placeholder="¡Gracias por su preferencia! Vuelva pronto..."
                  />
                </div>

                </>}
                {tab === 'business' && <>
                <div className="divider md:col-span-2 my-2 text-xs font-bold text-base-content/40 uppercase tracking-widest text-center whitespace-normal break-words sm:whitespace-nowrap px-1">
                  Inventario y Reabastecimiento por Defecto
                </div>

                <ComerziaInput 
                  label="Stock Mínimo por Defecto" 
                  name="defaultMinStock"
                  type="number"
                  value={formData.defaultMinStock ?? 0} 
                  onChange={handleChange}
                  placeholder="0"
                  min={0}
                  helperText="Umbral base de alerta de stock bajo cuando la variante no tiene límite asignado"
                  error={errors.defaultMinStock}
                  shakeKey={shakeKey}
                />

                <ComerziaInput 
                  label="Stock Ideal por Defecto" 
                  name="defaultIdealStock"
                  type="number"
                  value={formData.defaultIdealStock ?? 0} 
                  onChange={handleChange}
                  placeholder="0"
                  min={0}
                  helperText="Meta base de abastecimiento sugerida para compras y reposición"
                  error={errors.defaultIdealStock}
                  shakeKey={shakeKey}
                />

                <div className="divider md:col-span-2 my-2 text-xs font-bold text-base-content/40 uppercase tracking-widest text-center whitespace-normal break-words sm:whitespace-nowrap px-1">
                  Módulos de Punto de Venta y Facturación
                </div>

                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-3.5 bg-base-200/50 rounded-xl border border-base-200 flex items-center justify-between">
                    <div className="pr-3">
                      <span className="text-xs text-base-content font-bold block">
                        Asignación y Registro de Clientes
                      </span>
                      <span className="text-[11px] text-base-content/60 block mt-0.5">
                        Permite registrar y asociar clientes a las ventas en historial y terminal de cobro.
                      </span>
                    </div>
                    <ComerziaSwitch
                      disabled={!canManageSettings || isSaving}
                      checked={formData.saleCustomerRegistrationEnabled ?? true}
                      onChange={() => setFormData(prev => ({ ...prev, saleCustomerRegistrationEnabled: !(prev.saleCustomerRegistrationEnabled ?? true) }))}
                    />
                  </div>

                  <div className="p-3.5 bg-base-200/50 rounded-xl border border-base-200 flex items-center justify-between">
                    <div className="pr-3">
                      <span className="text-xs text-base-content font-bold block">
                        Impresión de Tickets Térmicos
                      </span>
                      <span className="text-[11px] text-base-content/60 block mt-0.5">
                        Habilita la emisión y reimpresión de tickets de venta y vinculación de tickeras en cajas.
                      </span>
                    </div>
                    <ComerziaSwitch
                      disabled={!canManageSettings || isSaving}
                      checked={formData.receiptPrintingEnabled ?? true}
                      onChange={() => setFormData(prev => ({ ...prev, receiptPrintingEnabled: !(prev.receiptPrintingEnabled ?? true) }))}
                    />
                  </div>
                </div>
                </>}
              </fieldset>

              {/* ACTION BUTTONS */}
              <div className="card-actions justify-end border-t border-base-200 pt-6 mt-auto w-full">
                <BtnSave disabled={!canManageSettings} onClick={handleSaveSettings} isLoading={isSaving} label="Guardar Cambios" responsive={false} className="w-full sm:w-auto" />
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
