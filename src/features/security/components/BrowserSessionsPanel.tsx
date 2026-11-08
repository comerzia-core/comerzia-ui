import { useBrowserSessions } from '../hooks/useBrowserSessions';
import { ComerziaTable } from '../../../components/ui/ComerziaTable';
import { BtnCancel, BtnRefresh } from '../../../components/ui/CrudButtons';
import { formatDateForUser } from '../../../utils/date';
export function BrowserSessionsPanel() {
  const { query, mutation, page, setPage } = useBrowserSessions();
  return <section aria-label="Sesiones abiertas" className="mt-6 space-y-4">
    <div className="flex flex-wrap gap-3 items-center justify-between">
      <h3 className="font-semibold">Sesiones abiertas</h3>
      <BtnCancel label="Cerrar todas las sesiones" responsive={false} disabled={mutation.isPending} onClick={() => mutation.mutate(null)} />
    </div>
    {query.isError ? <div role="alert">No se pudo cargar. <BtnRefresh onClick={() => void query.refetch()} /></div> :
      <ComerziaTable data={(query.data?.content ?? []).map(session => ({ ...session, id: session.reference }))}
        isLoading={query.isLoading} showRowNumbers
        columns={[
          { header: 'Sesión', render: session => session.current ? 'Este navegador' : 'Otro navegador' },
          { header: 'Inicio', render: session => formatDateForUser(session.authenticatedAt) },
          { header: 'Última actividad', render: session => formatDateForUser(session.lastActiveAt) },
          { header: '', render: session => <BtnCancel label="Cerrar sesión" responsive={false} disabled={mutation.isPending} onClick={() => mutation.mutate(session)} /> },
        ]}
        pagination={{ totalElements: query.data?.totalElements ?? 0, totalPages: query.data?.totalPages ?? 0,
          currentPage: page, pageSize: 5, onPageChange: setPage, onPageSizeChange: () => setPage(0) }} />}
  </section>;
}
