import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import type { TemporaryCredentials } from '../types/platform';
export function TemporaryCredentialsModal({ value, onClose }: { value: TemporaryCredentials | null; onClose: () => void }) {
  return <ComerziaModal isOpen={!!value} onClose={onClose} title="Acceso temporal" size="sm">
    <p className="text-sm mb-4">Entrega estos datos a la persona indicada. Deberá cambiar la contraseña al ingresar.</p>
    <dl className="space-y-3"><div><dt>Usuario</dt><dd className="font-mono break-all">{value?.username}</dd></div>
      <div><dt>Contraseña temporal</dt><dd className="font-mono break-all select-all">{value?.temporaryPassword}</dd></div></dl>
  </ComerziaModal>;
}
