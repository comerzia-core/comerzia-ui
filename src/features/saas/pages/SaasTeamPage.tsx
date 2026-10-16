import { useState } from 'react';
import { ShieldCheck, Pencil, KeyRound, Unlock, Lock } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaSelect } from '../../../components/ui/ComerziaSelect';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCreate, BtnSave } from '../../../components/ui/CrudButtons';
import { useDebounce } from '../../../hooks/useDebounce';
import { usePermission } from '../../../hooks/usePermission';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import { TemporaryCredentialsModal } from '../components/TemporaryCredentialsModal';
import type { SaasStaffSummary } from '../types/staff';
import type { PlatformAccount, TemporaryCredentials } from '../types/platform';

export function SaasTeamPage() {
  const query = usePlatformPage<PlatformAccount>('/saas/team');
  const context = useSaasContextMenu<PlatformAccount>();
  const { can } = usePermission();
  const { options } = useLoadDictionaries([DICTIONARIES.SAAS_TEAM_ROLE]);

  const [editor, setEditor] = useState<PlatformAccount | 'new' | null>(null);
  const [memberSearch, setMemberSearch] = useState('');
  const memberQuery = useDebounce(memberSearch, 300);
  const available = usePlatformPage<SaasStaffSummary>(
    '/saas/team/members',
    { withoutAccount: 'true', active: 'true', query: memberQuery },
    editor === 'new'
  );

  const [memberId, setMemberId] = useState('');
  const [lockTarget, setLockTarget] = useState<PlatformAccount | null>(null);
  const [reason, setReason] = useState('');
  const [form, setForm] = useState({
    username: '',
    roleCodes: [] as number[],
    disabled: false,
  });
  const [shake, setShake] = useState(0);
  const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);

  const lock = usePlatformAction(() =>
    platformService.post('/saas/team/' + encodeURIComponent(lockTarget!.id) + '/lock', {
      reason,
    })
  );

  const save = usePlatformAction(async () =>
    editor === 'new'
      ? platformService.post<TemporaryCredentials>('/saas/team/accounts', {
          memberId,
          username: form.username || null,
          roleCodes: form.roleCodes,
        })
      : platformService.patch<PlatformAccount>(
          '/saas/team/' + encodeURIComponent((editor as PlatformAccount).id),
          { roleCodes: form.roleCodes, disabled: form.disabled }
        )
  );

  const reset = usePlatformAction((row: PlatformAccount) =>
    platformService.post<TemporaryCredentials>(
      '/saas/team/' + encodeURIComponent(row.id) + '/reset-password'
    )
  );

  const unlock = usePlatformAction((row: PlatformAccount) =>
    platformService.post('/saas/team/' + encodeURIComponent(row.id) + '/unlock')
  );

  const openEditor = (row: PlatformAccount | 'new') => {
    setMemberSearch('');
    setMemberId('');
    setShake(0);
    setForm({
      username: '',
      roleCodes: row === 'new' ? [] : row.roleCodes,
      disabled: row === 'new' ? false : row.disabled,
    });
    setEditor(row);
  };

  return (
    <div className="space-y-6 w-full animate-fade-in">
      {/* 1. HEADER DE LA PÁGINA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7 text-primary shrink-0 mt-0.5" />
          <div>
            <h1 className="text-lg sm:text-2xl font-bold text-base-content tracking-tight">
              Seguridad del equipo matriz
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 mt-0.5 leading-relaxed">
              Gestión de cuentas y roles para operadores del panel administrativo SaaS.
            </p>
          </div>
        </div>

        {can('SYS_TEAM_MANAGE') && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <BtnCreate
              responsive={false}
              label="Crear acceso"
              onClick={() => openEditor('new')}
            />
          </div>
        )}
      </div>

      {query.isError && (
        <div className="alert alert-error text-sm rounded-2xl shadow-xs" role="alert">
          <span>No se pudo cargar el equipo de plataforma.</span>
        </div>
      )}

      {/* 2. TABLA RESPONSIVA */}
      <ComerziaResponsiveTable
        data={query.data?.content ?? []}
        pagination={query.pagination}
        isLoading={query.isPending}
        onActions={(event, row, centered) => {
          if (can('SYS_TEAM_MANAGE') && row.roleCodes.length) {
            context.open(event, row, centered);
          }
        }}
        columns={[
          { header: 'Nombre', accessorKey: 'fullName' },
          {
            header: 'Usuario',
            render: row => <span className="font-mono text-xs font-semibold">{row.username}</span>,
          },
          {
            header: 'Roles',
            render: row =>
              row.roleCodes.length ? (
                <div className="flex flex-wrap gap-1">
                  {row.roleCodes.map(code => (
                    <span key={code} className="badge badge-xs badge-neutral font-medium">
                      {options[DICTIONARIES.SAAS_TEAM_ROLE]?.find(o => o.value === code)?.label ??
                        'Rol'}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="badge badge-xs badge-outline">Cuenta protegida</span>
              ),
          },
          {
            header: 'Acceso',
            render: row => (
              <span
                className={`badge badge-sm font-semibold ${
                  row.disabled
                    ? 'badge-error text-error-content'
                    : row.locked
                    ? 'badge-warning text-warning-content'
                    : 'badge-success text-success-content'
                }`}
              >
                {row.disabled ? 'Deshabilitado' : row.locked ? 'Bloqueado' : 'Habilitado'}
              </span>
            ),
          },
        ]}
      />

      {/* 3. MENÚ CONTEXTUAL */}
      <ComerziaContextMenu {...context.menu} onClose={context.close}>
        {can('SYS_TEAM_MANAGE') && !!context.menu.item?.roleCodes.length && (
          <>
            <ContextMenuItem
              icon={Pencil}
              label="Editar accesos"
              onClick={() => {
                if (context.menu.item) openEditor(context.menu.item);
                context.close();
              }}
            />
            <ContextMenuItem
              icon={KeyRound}
              label="Restablecer contraseña"
              onClick={() => {
                if (context.menu.item) reset.mutate(context.menu.item, { onSuccess: setCredentials });
                context.close();
              }}
            />
            {!context.menu.item?.locked && (
              <ContextMenuItem
                icon={Lock}
                label="Bloquear cuenta"
                onClick={() => {
                  setLockTarget(context.menu.item);
                  setReason('');
                  context.close();
                }}
              />
            )}
            {context.menu.item?.locked && (
              <ContextMenuItem
                icon={Unlock}
                label="Desbloquear cuenta"
                onClick={() => {
                  if (context.menu.item) unlock.mutate(context.menu.item);
                  context.close();
                }}
              />
            )}
          </>
        )}
      </ComerziaContextMenu>

      {/* MODAL: CREAR / EDITAR ACCESO */}
      <ComerziaModal
        isOpen={!!editor}
        onClose={() => {
          if (!save.isPending) setEditor(null);
        }}
        title={editor === 'new' ? 'Crear acceso al colaborador' : 'Accesos del colaborador'}
        actions={
          <BtnSave
            responsive={false}
            isLoading={save.isPending}
            onClick={() => {
              if (!form.roleCodes.length || (editor === 'new' && !memberId)) {
                setShake(v => v + 1);
                return;
              }
              save.mutate(undefined, {
                onSuccess: value => {
                  if ('temporaryPassword' in value) setCredentials(value);
                  setEditor(null);
                },
              });
            }}
          />
        }
      >
        <div className="space-y-4">
          {editor === 'new' && (
            <>
              <ComerziaInput
                label="Buscar colaborador"
                aria-label="Buscar colaborador"
                placeholder="Nombre o correo..."
                value={memberSearch}
                onChange={event => {
                  setMemberSearch(event.target.value);
                  setMemberId('');
                  available.pagination.onPageChange(0);
                }}
              />
              <ComerziaSelect
                label="Colaborador"
                aria-label="Colaborador"
                isRequired
                value={memberId}
                enableDefaultOption
                placeholder="Seleccionar colaborador"
                options={(available.data?.content ?? []).map(member => ({
                  value: member.id,
                  label: `${member.fullName} (${member.jobTitle ?? 'Sin cargo'})`,
                }))}
                onChange={event => setMemberId(event.target.value)}
                shakeKey={shake}
                error={shake && !memberId ? 'Selecciona un colaborador.' : undefined}
              />
              <ComerziaInput
                label="Usuario (opcional)"
                aria-label="Usuario (opcional)"
                placeholder="Sugerido automáticamente si se omite"
                value={form.username}
                onChange={event => setForm(v => ({ ...v, username: event.target.value }))}
              />
            </>
          )}

          <div className="space-y-2">
            <span className="text-xs font-semibold text-base-content/70">
              Roles de plataforma asignados *
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-base-200/50 rounded-xl border border-base-200">
              {(options[DICTIONARIES.SAAS_TEAM_ROLE] ?? []).map(role => {
                const checked = form.roleCodes.includes(Number(role.value));
                return (
                  <ComerziaCheckbox
                    key={role.value}
                    label={role.label}
                    checked={checked}
                    onChange={selected =>
                      setForm(v => ({
                        ...v,
                        roleCodes: selected
                          ? [...v.roleCodes, Number(role.value)]
                          : v.roleCodes.filter(c => c !== Number(role.value)),
                      }))
                    }
                  />
                );
              })}
            </div>
            {shake > 0 && !form.roleCodes.length && (
              <span className="text-xs text-error">Asigna al menos un rol de plataforma.</span>
            )}
          </div>

          {editor !== 'new' && (
            <ComerziaCheckbox
              label="Cuenta deshabilitada"
              checked={form.disabled}
              onChange={disabled => setForm(v => ({ ...v, disabled }))}
            />
          )}
        </div>
      </ComerziaModal>

      {/* MODAL: BLOQUEAR CUENTA */}
      <ComerziaModal
        isOpen={!!lockTarget}
        onClose={() => {
          if (!lock.isPending) setLockTarget(null);
        }}
        title="Bloquear cuenta de plataforma"
        size="sm"
        actions={
          <BtnSave
            responsive={false}
            label="Bloquear"
            disabled={!reason.trim()}
            isLoading={lock.isPending}
            onClick={() =>
              lock.mutate(undefined, { onSuccess: () => setLockTarget(null) })
            }
          />
        }
      >
        <p className="text-xs sm:text-sm text-base-content/80 mb-4">
          Se impedirá el inicio de sesión a <strong>{lockTarget?.fullName}</strong> ({lockTarget?.username}).
        </p>
        <ComerziaInput
          label="Motivo de bloqueo"
          aria-label="Motivo de bloqueo"
          isRequired
          maxLength={500}
          value={reason}
          onChange={e => setReason(e.target.value)}
        />
      </ComerziaModal>

      <TemporaryCredentialsModal
        value={credentials}
        onClose={() => setCredentials(null)}
      />
    </div>
  );
}
