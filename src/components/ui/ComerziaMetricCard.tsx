import type { ReactNode } from 'react';
export function ComerziaMetricCard({ label, value }: { label: string; value: ReactNode }) {
  return <div className="card bg-base-100 p-4 rounded-2xl border border-base-200 shadow-xs min-w-0">
    <p className="text-sm text-base-content/60">{label}</p><strong className="text-2xl break-words">{value}</strong>
  </div>;
}
