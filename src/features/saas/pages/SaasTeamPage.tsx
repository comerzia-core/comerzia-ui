import { useState } from 'react';
import { Pencil, KeyRound } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaCheckbox } from '../../../components/ui/ComerziaCheckbox';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { ComerziaResponsiveTable } from '../../../components/ui/ComerziaResponsiveTable';
import { ComerziaContextMenu, ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { BtnCreate, BtnSave } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { useLoadDictionaries } from '../../../hooks/useLoadDictionaries';
import { DICTIONARIES } from '../../../config/dictionaries';
import { usePlatformPage, usePlatformAction } from '../hooks/usePlatformData';
import { useSaasContextMenu } from '../hooks/useSaasContextMenu';
import { platformService } from '../services/platformService';
import { TemporaryCredentialsModal } from '../components/TemporaryCredentialsModal';
import type { PlatformAccount, TemporaryCredentials } from '../types/platform';

export function SaasTeamPage() {
  const query = usePlatformPage<PlatformAccount>('/saas/team'); const context = useSaasContextMenu<PlatformAccount>(); const { can } = usePermission();
  const { options } = useLoadDictionaries([DICTIONARIES.SAAS_TEAM_ROLE]);
  const [editor, setEditor] = useState<PlatformAccount | 'new' | null>(null);
  const [form, setForm] = useState({ username: '', firstName: '', lastName: '', email: '', roleCodes: [] as number[], disabled: false });
  const [shake, setShake] = useState(0); const [credentials, setCredentials] = useState<TemporaryCredentials | null>(null);
  const save = usePlatformAction(async () => editor === 'new' ? platformService.post<TemporaryCredentials>('/saas/team', form)
    : platformService.patch<PlatformAccount>('/saas/team/' + encodeURIComponent((editor as PlatformAccount).id), { roleCodes: form.roleCodes, disabled: form.disabled }));
  const reset = usePlatformAction((row: PlatformAccount) => platformService.post<TemporaryCredentials>('/saas/team/' + encodeURIComponent(row.id) + '/reset-password'));
  const openEditor = (row: PlatformAccount | 'new') => { setShake(0); setForm({ username: '', firstName: '', lastName: '', email: '', roleCodes: row === 'new' ? [] : row.roleCodes, disabled: row === 'new' ? false : row.disabled }); setEditor(row); };
  return <div className="space-y-6"><div className="flex justify-between gap-3"><h1 className="text-2xl font-bold">Equipo matriz</h1>
    {can('SYS_TEAM_MANAGE') && <BtnCreate responsive={false} label="Colaborador" onClick={() => openEditor('new')} />}</div>
    {query.isError && <p role="alert">No se pudo cargar el equipo.</p>}
    <ComerziaResponsiveTable data={query.data?.content ?? []} pagination={query.pagination} isLoading={query.isPending} onActions={context.open}
      columns={[{ header: 'Nombre', accessorKey: 'fullName' }, { header: 'Usuario', accessorKey: 'username' },
        { header: 'Roles', render: row => row.roleCodes.length ? row.roleCodes.map(code => options[DICTIONARIES.SAAS_TEAM_ROLE]?.find(option => option.value === code)?.label ?? 'Rol').join(', ') : 'Cuenta protegida' },
        { header: 'Acceso', render: row => row.disabled ? 'Deshabilitado' : row.locked ? 'Bloqueado' : 'Habilitado' }]} />
    <ComerziaContextMenu {...context.menu} onClose={context.close}>
      {can('SYS_TEAM_MANAGE') && !!context.menu.item?.roleCodes.length && <>
        <ContextMenuItem icon={Pencil} label="Editar accesos" onClick={() => { if (context.menu.item) openEditor(context.menu.item); context.close(); }} />
        <ContextMenuItem icon={KeyRound} label="Restablecer contraseña" onClick={() => { if (context.menu.item) reset.mutate(context.menu.item, { onSuccess: setCredentials }); context.close(); }} />
      </>}
    </ComerziaContextMenu>
    <ComerziaModal isOpen={!!editor} onClose={() => { if (!save.isPending) setEditor(null); }} title={editor === 'new' ? 'Nuevo colaborador' : 'Accesos del colaborador'}
      actions={<BtnSave responsive={false} isLoading={save.isPending} onClick={() => {
        if (!form.roleCodes.length || (editor === 'new' && (!form.username || !form.firstName || !form.email))) { setShake(value => value + 1); return; }
        save.mutate(undefined, { onSuccess: value => { if ('temporaryPassword' in value) setCredentials(value); setEditor(null); } });
      }} />}>
      <div className="space-y-4">
        {editor === 'new' && <>{(['username', 'firstName', 'lastName', 'email'] as const).map((key, index) => <ComerziaInput key={key}
          aria-label={['Usuario', 'Nombres', 'Apellidos', 'Correo'][index]} label={['Usuario', 'Nombres', 'Apellidos', 'Correo'][index]} isRequired={key !== 'lastName'} type={key === 'email' ? 'email' : 'text'}
          value={form[key]} maxLength={key === 'username' ? 50 : 150} shakeKey={shake}
          error={shake && key !== 'lastName' && !form[key] ? 'Campo obligatorio.' : undefined} onChange={event => setForm(value => ({ ...value, [key]: event.target.value }))} />)}</>}
        <fieldset><legend className="font-semibold mb-2">Roles</legend><div className="space-y-3">{(options[DICTIONARIES.SAAS_TEAM_ROLE] ?? []).map(option =>
          <ComerziaCheckbox key={option.value} label={option.label} checked={form.roleCodes.includes(Number(option.value))}
            onChange={checked => setForm(value => ({ ...value, roleCodes: checked ? [...value.roleCodes, Number(option.value)] : value.roleCodes.filter(code => code !== Number(option.value)) }))} />)}</div>
          {shake > 0 && !form.roleCodes.length && <p className="text-error text-xs">Selecciona al menos un rol.</p>}</fieldset>
        {editor !== 'new' && <ComerziaCheckbox label="Deshabilitar acceso" checked={form.disabled} onChange={disabled => setForm(value => ({ ...value, disabled }))} />}
      </div>
    </ComerziaModal><TemporaryCredentialsModal value={credentials} onClose={() => setCredentials(null)} />
  </div>;
}
