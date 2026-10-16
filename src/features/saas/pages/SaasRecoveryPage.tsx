import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArchiveRestore } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import type { RecoveryRecord } from '../types/platform';
import { formatDateForUser } from '../../../utils/date';

export function SaasRecoveryPage() {
  const { companyId } = useParams();
  const [entity, setEntity] = useState('');
  const [selected, setSelected] = useState<RecoveryRecord | null>(null);
  const [reason, setReason] = useState('');
  const [shake, setShake] = useState(0);

  const { options } = useLoadDictionaries([DICTIONARIES.RECOVERY_ENTITY]);
  const path = '/saas/companies/' + encodeURIComponent(companyId ?? '') + '/recovery';
  const query = usePlatformPage<RecoveryRecord>(path, { entity }, !!companyId && !!entity);
  const context = useSaasContextMenu<RecoveryRecord>();

  const restore = usePlatformAction(() =>
    platformService.post(
      path +
        '/' +
        encodeURIComponent(selected!.id) +
        '/restore?entity=' +
        encodeURIComponent(entity),
      { reason }
    )
  );

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <ArchiveRestore className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Registros eliminados
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Recuperación y restauración forense de registros dados de baja lógica.
            </p>
          </div>
        </div>
      </div>

      {/* 2. BARRA DE FILTROS ESTÁNDAR */}
      <div className="card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center w-full">
          <div className="w-full sm:w-80">
            <ComerziaSelect
              label="Tipo de registro"
              options={options[DICTIONARIES.RECOVERY_ENTITY] ?? []}
              value={entity}
              enableDefaultOption
              placeholder="Seleccionar entidad a consultar"
              onChange={event => {
                setEntity(event.target.value);
                query.pagination.onPageChange(0);
              }}
            />
          </div>
        </div>
      </div>

      {query.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudieron consultar los registros eliminados.</span>
        </div>
      )}

      {/* 3. TABLA RESPONSIVA */}
      {entity ? (
        <ComerziaResponsiveTable
          data={query.data?.content ?? []}
          pagination={query.pagination}
          isLoading={query.isPending}
          onActions={context.open}
          columns={[
            { header: 'Nombre del registro', accessorKey: 'name' },
            {
              header: 'Fecha de eliminación',
              render: row => formatDateForUser(row.removedAt),
            },
            {
              header: 'Responsable',
              render: row => <span className="font-mono text-xs">{row.removedBy || 'Sistema'}</span>,
            },
          ]}
        />
      ) : (
        <div className="p-8 text-center bg-base-100 rounded-2xl border border-base-200 text-xs text-base-content/50">
          Selecciona un tipo de registro arriba para listar las entidades eliminadas.
        </div>
      )}

      {/* 4. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        <ContextMenuItem
          icon={ArchiveRestore}
          label="Restaurar registro"
          onClick={() => {
            setReason('');
            setShake(0);
            setSelected(context.menu.item);
            context.close();
          }}
        />
      </ComerziaContextMenu>

      {/* MODAL: RESTAURAR REGISTRO */}
      <ComerziaModal
        isOpen={!!selected}
        onClose={() => {
          if (!restore.isPending) setSelected(null);
        }}
        title="Restaurar registro eliminado"
        size="sm"
        actions={
          <BtnSave
            responsive={false}
            label="Restaurar"
            isLoading={restore.isPending}
            onClick={() => {
              if (!reason.trim()) {
                setShake(value => value + 1);
                return;
              }
              restore.mutate(undefined, { onSuccess: () => setSelected(null) });
            }}
          />
        }
      >
        <p className="text-xs sm:text-sm text-base-content/80 mb-4">
          Se reactivará <strong>{selected?.name}</strong>. El backend comprobará dependencias e integridad referencial antes de completar la operación.
        </p>
        <ComerziaInput
          label="Motivo de restauración"
          aria-label="Motivo"
          isRequired
          value={reason}
          maxLength={500}
          shakeKey={shake}
          error={shake && !reason.trim() ? 'Indica el motivo.' : undefined}
          onChange={event => setReason(event.target.value)}
        />
      </ComerziaModal>
    </div>
  );
}
