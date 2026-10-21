import { Ban, KeyRound, ShieldCheck, Unlock } from 'lucide-react';
import { ContextMenuItem } from '../../../components/ui/ComerziaContextMenu';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { BtnSave } from '../../../components/ui/CrudButtons';
import { usePermission } from '../../../hooks/usePermission';
import { TemporaryCredentialsModal } from './TemporaryCredentialsModal';
import { useTenantAccountAssistance, type AssistedAccount, type AccountOperation } from '../hooks/useTenantAccountAssistance';

export function TenantAccountMenuItems({ account, onSelect }: {
  account: AssistedAccount | null;
  onSelect: (operation: AccountOperation) => void;
}) {
  const { can } = usePermission();
  if (!account) return null;
  return <>
    {can('SYS_COMPANIES_MANAGE') && <ContextMenuItem icon={account.disabled ? ShieldCheck : Ban}
      label={account.disabled ? 'Habilitar acceso' : 'Bloquear acceso'}
      onClick={() => onSelect(account.disabled ? 'enable' : 'disable')} />}
    {can('SYS_TENANT_USERS_SUPPORT') && <>
      {account.locked && <ContextMenuItem icon={Unlock} label="Desbloquear por intentos" onClick={() => onSelect('unlock')} />}
      <ContextMenuItem icon={KeyRound} label="Restablecer contraseña" onClick={() => onSelect('reset-password')} />
    </>}
  </>;
}

const operationDetails: Record<AccountOperation, { title: string; message: string }> = {
  disable: { title: 'Bloquear acceso', message: 'Se cerrarán sus sesiones. Los demás usuarios conservarán su acceso.' },
  enable: { title: 'Habilitar acceso', message: 'Podrá iniciar sesión si su empresa y su cuenta lo permiten.' },
  unlock: { title: 'Desbloquear por intentos', message: 'Se limpiarán los intentos fallidos. El bloqueo administrativo se conserva.' },
  'reset-password': { title: 'Restablecer contraseña', message: 'Se cerrarán sus sesiones y se generará una contraseña temporal.' },
};

export function TenantAccountAssistanceDialog({ assistance }: { assistance: ReturnType<typeof useTenantAccountAssistance> }) {
  const details = assistance.confirmation ? operationDetails[assistance.confirmation.operation] : undefined;
  return <>
    <ComerziaModal isOpen={!!assistance.confirmation} onClose={assistance.close} title={details?.title ?? 'Confirmar asistencia'} size="sm"
      actions={<BtnSave responsive={false} label="Confirmar" disabled={!assistance.reason.trim()} isLoading={assistance.pending} onClick={assistance.confirm} />}>
      <p className="text-sm mb-2"><strong>{assistance.confirmation?.account.fullName}</strong> ({assistance.confirmation?.account.username})
        {assistance.confirmation?.account.companyName && <> · {assistance.confirmation.account.companyName}</>}</p>
      <p className="text-sm mb-4">{details?.message}</p>
      <ComerziaInput label="Motivo de asistencia" aria-label="Motivo de asistencia" isRequired maxLength={500}
        shakeKey={assistance.shakeKey} error={assistance.shakeKey && !assistance.reason.trim() ? 'Indica el motivo.' : undefined}
        value={assistance.reason} onChange={event => assistance.setReason(event.target.value)} />
    </ComerziaModal>
    <TemporaryCredentialsModal value={assistance.credentials} onClose={assistance.clearCredentials} />
  </>;
}
