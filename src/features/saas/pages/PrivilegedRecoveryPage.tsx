import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { ComerziaInput } from '../../../components/ui/ComerziaInput';
import { ComerziaModal } from '../../../components/ui/ComerziaModal';
import { usePrivilegedRecovery } from '../../security/hooks/usePrivilegedRecovery';
import { MfaStepUpModal } from '../../security/components/MfaStepUpModal';

export function PrivilegedRecoveryPage() {
  const flow = usePrivilegedRecovery();
  const [username, setUsername] = useState('');
  const [identityCase, setIdentityCase] = useState('');
  const [verified, setVerified] = useState(false);
  const step = flow.stepUp;
  return <div className="space-y-5 max-w-5xl mx-auto">
    <h1 className="text-xl font-bold flex items-center gap-2"><ShieldCheck />Recuperación privilegiada</h1>
    <p className="text-sm text-base-content/70">Dos operadores deben comprobar la identidad por separado. Completen las aprobaciones y la emisión en cinco minutos. El titular seguirá necesitando su contraseña.</p>
    <form className="card bg-base-100 border border-base-200 p-4 gap-4" onSubmit={event => {
      event.preventDefault(); void flow.execute('create', undefined, { targetUsername: username.trim(), identityCase: identityCase.trim() });
    }}>
      <ComerziaInput label="Usuario a recuperar" value={username} maxLength={80} isRequired onChange={event => setUsername(event.target.value)} />
      <ComerziaInput label="Expediente de identidad verificada" value={identityCase} maxLength={120} isRequired onChange={event => setIdentityCase(event.target.value)} placeholder="RECUPERACION-2026-001" />
      <button className="btn btn-primary self-start" disabled={flow.busy || !/^[A-Za-z0-9._/-]{12,120}$/.test(identityCase.trim())}>Crear solicitud</button>
    </form>
    {flow.error && <p role="alert" className="text-error text-sm">{flow.error}</p>}
    {flow.query.isError && <p role="alert">No se pudo consultar la lista.</p>}
    <label className="flex gap-3 text-sm items-start"><input type="checkbox" className="checkbox checkbox-sm" checked={verified} onChange={event => setVerified(event.target.checked)} />He verificado personalmente la identidad por un canal conocido y he registrado las evidencias en el expediente. No me baso solo en esta solicitud.</label>
    <div className="space-y-3">{flow.query.data?.map(request => <article key={request.reference} className="rounded-2xl border border-base-200 p-4 bg-base-100 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="font-semibold">{request.targetUsername}</h2><p className="text-sm">{request.identityCase}</p><p className="text-xs text-base-content/60">{request.approvals} de 2 aprobaciones · vence {new Date(request.expiresAt).toLocaleTimeString()}</p></div>
      <div className="flex gap-2"><button className="btn btn-sm" disabled={!verified || flow.busy || request.approvals >= 2} onClick={() => { void flow.execute('approve', request.reference); setVerified(false); }}>Aprobar identidad</button>
        <button className="btn btn-primary btn-sm" disabled={flow.busy || request.approvals !== 2} onClick={() => void flow.execute('issue', request.reference)}>Emitir autorización</button></div>
    </article>)}</div>
    <ComerziaModal isOpen={!!flow.authorization} onClose={flow.clearAuthorization} title="Autorización temporal" size="sm">
      <p className="text-sm mb-3">Se muestra una sola vez. Entrégala al titular por un canal seguro; vence en 10 minutos. No reemplaza su contraseña.</p>
      <ComerziaInput label="Autorización" value={flow.authorization?.token ?? ''} readOnly autoComplete="off" />
    </ComerziaModal>
    <MfaStepUpModal isOpen={step.isStepUpOpen} action={step.stepUpAction} targetId={step.stepUpTarget} onSuccess={step.handleSuccess} onCancel={step.handleCancel} />
  </div>;
}
