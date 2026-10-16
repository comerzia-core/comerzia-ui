import { History } from 'lucide-react';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { BtnExcel } from '../../../components/ui/CrudButtons';
import { formatDateForUser } from '../../../utils/date';
import { useBillingHistory } from '../hooks/useBillingHistory';

export function SaasBillingHistoryPage() {
  const history = useBillingHistory();
  const { options } = useLoadDictionaries([DICTIONARIES.SUBSCRIPTION_PAYMENT_METHOD]);

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <History className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Historial de cobros
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Registro histórico consolidado de pagos procesados y conciliación contable.
            </p>
          </div>
        </div>

        {/* Botón de Exportación CSV */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <BtnExcel
            label="Exportar CSV"
            responsive={false}
            isLoading={history.exportFile.isPending}
            onClick={() => history.exportFile.mutate(undefined)}
          />
        </div>
      </div>

      {/* 2. BARRA DE FILTROS ESTÁNDAR */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          <ComerziaInput
            label="Empresa, NIT o referencia"
            aria-label="Empresa, NIT o referencia"
            placeholder="Buscar..."
            value={history.search}
            onChange={e => history.setSearch(e.target.value)}
          />

          <ComerziaInput
            label="Usuario revisor"
            aria-label="Usuario revisor"
            placeholder="Operador..."
            value={history.operator}
            onChange={e => history.setOperator(e.target.value)}
          />

          <ComerziaInput
            label="Desde"
            aria-label="Desde"
            type="datetime-local"
            value={history.from}
            onChange={e => history.setFrom(e.target.value)}
          />

          <ComerziaInput
            label="Hasta"
            aria-label="Hasta"
            type="datetime-local"
            value={history.until}
            onChange={e => history.setUntil(e.target.value)}
          />

          <ComerziaSelect
            label="Medio de pago"
            aria-label="Medio de pago"
            options={options[DICTIONARIES.SUBSCRIPTION_PAYMENT_METHOD] ?? []}
            value={history.method}
            enableDefaultOption
            placeholder="Todos"
            onChange={e => history.setMethod(e.target.value)}
          />
        </div>
      </div>

      {history.data.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar el historial de cobros.</span>
        </div>
      )}

      {/* 3. TABLA RESPONSIVA */}
      <ComerziaResponsiveTable
        data={history.data.data?.content ?? []}
        pagination={history.data.pagination}
        isLoading={history.data.isPending}
        columns={[
          {
            header: 'Fecha',
            render: row => (row.occurredAt ? formatDateForUser(row.occurredAt) : 'Sin fecha'),
          },
          { header: 'Empresa', accessorKey: 'companyName' },
          { header: 'Plan', accessorKey: 'planName' },
          {
            header: 'Importe (Bs)',
            render: row => <span className="font-mono font-medium">{row.amount.toFixed(2)}</span>,
          },
          {
            header: 'Referencia',
            render: row => <span className="font-mono text-xs">{row.reference || '—'}</span>,
          },
          {
            header: 'Estado',
            render: row => (
              <span className={`badge badge-sm font-semibold ${row.statusLabel === 'Aprobado' ? 'badge-success text-success-content' : row.statusLabel === 'Rechazado' ? 'badge-error text-error-content' : 'badge-neutral'}`}>
                {row.statusLabel}
              </span>
            ),
          },
          {
            header: 'Medio',
            render: row =>
              options[DICTIONARIES.SUBSCRIPTION_PAYMENT_METHOD]?.find(
                option => option.value === row.paymentMethod
              )?.label ?? 'Sin especificar',
          },
          { header: 'Revisor', accessorKey: 'operator' },
          { header: 'Mensaje', accessorKey: 'message' },
        ]}
      />

      <p className="text-xs text-base-content/50">
        Las solicitudes rechazadas o canceladas no se computan dentro de la recaudación acumulada.
      </p>
    </div>
  );
}
