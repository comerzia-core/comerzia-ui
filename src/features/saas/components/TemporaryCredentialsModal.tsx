import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import type { TemporaryCredentials } from '../types/platform';
import { BtnCopy } from '../../../components/ui/CrudButtons';
import { useToast } from '../../../context/ToastContext';
export function TemporaryCredentialsModal({ value, onClose, companyName }: { value: TemporaryCredentials | null; onClose: () => void; companyName?: string }) {
  const toast = useToast();
  return <ComerziaModal isOpen={!!value} onClose={onClose} title="Acceso temporal" size="sm">
    {companyName && <h2 className="font-semibold mb-3 break-words">{companyName}</h2>}
    <p className="text-sm mb-4">Entrega estos datos a la persona indicada. Deberá cambiar la contraseña al ingresar.</p>
    <dl className="space-y-3"><div><dt>Usuario</dt><dd className="font-mono break-all">{value?.username}</dd></div>
      <div><dt>Contraseña temporal</dt><dd className="font-mono break-all select-all">{value?.temporaryPassword}</dd></div></dl>
    <BtnCopy responsive={false} className="mt-4" label="Copiar contraseña" onClick={async () => {
      if (!value) return;
      try { await navigator.clipboard.writeText(value.temporaryPassword); toast.success('Contraseña copiada.'); }
      catch { toast.error('No se pudo copiar. Selecciona el texto manualmente.'); }
    }} />
  </ComerziaModal>;
}
