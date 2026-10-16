import { useState } from 'react';
import { Layers, Pencil } from 'lucide-react';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { useAuthStore } from '../../../stores/useAuthStore';
import { usePlatformData, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import type { PlatformPlan } from '../types/platform';

export function SaasPlansPage() {
  const query = usePlatformData<PlatformPlan[]>('/saas/plans');
  const context = useSaasContextMenu<PlatformPlan>();
  const roles = useAuthStore(state => state.userProfile?.roles);
  const editable = (roles?.includes('ROOT') || roles?.includes('SAAS_OWNER')) ?? false;

  const [form, setForm] = useState<PlatformPlan | null>(null);
  const [shake, setShake] = useState(0);

  const save = usePlatformAction(() =>
    platformService.put('/saas/plans/' + form!.code, {
      name: form!.name,
      monthlyPrice: form!.monthlyPrice,
      maxBranches: form!.maxBranches,
      maxUsers: form!.maxUsers,
      maxProducts: form!.maxProducts,
    })
  );

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Planes y cupos
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Catálogo de planes comerciales, tarifas mensuales y límites máximos de recursos.
            </p>
          </div>
        </div>
      </div>

      {query.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar el catálogo de planes.</span>
        </div>
      )}

      {/* 2. TABLA RESPONSIVA DE PLANES */}
      <ComerziaResponsiveTable
        data={(query.data ?? []).map(plan => ({ ...plan, id: plan.code }))}
        isLoading={query.isPending}
        onActions={editable ? context.open : undefined}
        columns={[
          {
            header: 'Plan',
            render: row => (
              <div>
                <span className="font-bold text-base-content">{row.name}</span>
                {row.unlimited && (
                  <span className="badge badge-xs badge-primary font-bold ml-2">Ilimitado</span>
                )}
              </div>
            ),
          },
          {
            header: 'Mensual (Bs)',
            render: row => <span className="font-mono font-medium">{row.monthlyPrice.toFixed(2)}</span>,
          },
          {
            header: 'Sucursales',
            render: row => (row.unlimited ? 'Ilimitadas' : row.maxBranches),
          },
          {
            header: 'Usuarios',
            render: row => (row.unlimited ? 'Ilimitados' : row.maxUsers),
          },
          {
            header: 'Productos',
            render: row => (row.unlimited ? 'Ilimitados' : row.maxProducts),
          },
        ]}
      />

      <p className="text-xs text-base-content/50">
        Los cambios en tarifas o recursos se aplican a nuevas contrataciones y renovaciones; las suscripciones vigentes conservan sus cuotas hasta su término.
      </p>

      {/* 3. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        {editable && (
          <ContextMenuItem
            icon={Pencil}
            label="Editar plan"
            onClick={() => {
              setShake(0);
              setForm(context.menu.item);
              context.close();
            }}
          />
        )}
      </ComerziaContextMenu>

      {/* 4. MODAL DE EDICIÓN */}
      <ComerziaModal
        isOpen={!!form}
        onClose={() => {
          if (!save.isPending) setForm(null);
        }}
        title="Editar plan"
        actions={
          <BtnSave
            responsive={false}
            isLoading={save.isPending}
            disabled={!form?.name.trim()}
            onClick={() => {
              if (!form?.name.trim()) {
                setShake(v => v + 1);
                return;
              }
              save.mutate(undefined, { onSuccess: () => setForm(null) });
            }}
          />
        }
      >
        {form && (
          <div className="space-y-4">
            <ComerziaInput
              label="Nombre del plan"
              aria-label="Nombre"
              isRequired
              maxLength={100}
              value={form.name}
              shakeKey={shake}
              error={shake && !form.name.trim() ? 'Indica el nombre del plan.' : undefined}
              onChange={e => setForm({ ...form, name: e.target.value })}
            />

            <ComerziaInput
              label="Precio mensual (Bs)"
              aria-label="Precio mensual (Bs)"
              type="number"
              min={0}
              step="0.01"
              disabled={form.unlimited}
              value={form.monthlyPrice}
              onChange={e => setForm({ ...form, monthlyPrice: Number(e.target.value) })}
            />

            <ComerziaInput
              label="Límite de sucursales"
              aria-label="Sucursales"
              type="number"
              min={1}
              disabled={form.unlimited}
              value={form.maxBranches}
              onChange={e => setForm({ ...form, maxBranches: Number(e.target.value) })}
            />

            <ComerziaInput
              label="Límite de usuarios"
              aria-label="Usuarios"
              type="number"
              min={1}
              disabled={form.unlimited}
              value={form.maxUsers}
              onChange={e => setForm({ ...form, maxUsers: Number(e.target.value) })}
            />

            <ComerziaInput
              label="Límite de productos"
              aria-label="Productos"
              type="number"
              min={1}
              disabled={form.unlimited}
              value={form.maxProducts}
              onChange={e => setForm({ ...form, maxProducts: Number(e.target.value) })}
            />
          </div>
        )}
      </ComerziaModal>
    </div>
  );
}
