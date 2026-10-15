import type { MouseEvent } from 'react';
import { ComerziaTable, type Column, type TablePaginationConfig } from './ComerziaTable';
import { BtnBack, BtnNext } from './CrudButtons';

interface Props<T extends { id: string | number }> {
  data: T[]; columns: Column<T>[]; isLoading?: boolean; pagination: TablePaginationConfig;
  onActions?: (event: MouseEvent, item: T, centered: boolean) => void;
}
export function ComerziaResponsiveTable<T extends { id: string | number }>({ data, columns, isLoading, pagination, onActions }: Props<T>) {
  const { currentPage: page, pageSize, totalElements, totalPages, onPageChange } = pagination;
  return <div>
    <div className="hidden md:block"><ComerziaTable data={data} columns={columns} isLoading={isLoading} pagination={pagination}
      showRowNumbers onRowContextMenu={(event, item) => onActions?.(event, item, false)} /></div>
    <div className="md:hidden space-y-3">
      {isLoading && <div role="status" className="p-6 text-center">Cargando…</div>}
      {!isLoading && !data.length && <p className="p-6 text-center text-base-content/60">Sin registros.</p>}
      {data.map((item, index) => <article key={item.id} onClick={event => onActions?.(event, item, true)}
        className="card bg-base-100 p-4 rounded-2xl border border-base-200 space-y-2">
        <span className="text-xs text-base-content/50">{page * pageSize + index + 1}</span>
        {columns.map((column, index) => <div key={index} className="flex justify-between gap-3 text-sm min-w-0">
          <span className="text-base-content/60 shrink-0">{column.header}</span>
          <span className="text-right break-words min-w-0">{column.render ? column.render(item) : String(item[column.accessorKey!] ?? '—')}</span>
        </div>)}
      </article>)}
      <div className="flex items-center justify-between gap-2 text-xs whitespace-nowrap bg-base-100 p-3 rounded-xl border border-base-200">
        <span>{totalElements} registros · {page + 1}/{Math.max(totalPages, 1)}</span>
        <div className="flex gap-1"><BtnBack label="Anterior" responsive={false} disabled={!page || isLoading} onClick={() => onPageChange(page - 1)} />
          <BtnNext label="Siguiente" responsive={false} disabled={page + 1 >= totalPages || isLoading} onClick={() => onPageChange(page + 1)} /></div>
      </div>
    </div>
  </div>;
}
