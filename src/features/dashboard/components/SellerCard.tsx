// src/features/dashboard/components/SellerCard.tsx
import React from 'react';
import type { DashboardSellerRankingResponse } from '../types/dashboard';
import { TrendingUp } from 'lucide-react';

interface Props {
  seller: DashboardSellerRankingResponse;
  index: number;
  currencyCode: string;
  hasFinancialPermission: boolean;
}

const SELLER_THEMES = [
  {
    border: 'border-l-indigo-500',
    badge: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    avatar: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 ring-indigo-500/30',
    accentText: 'text-indigo-600 dark:text-indigo-400'
  },
  {
    border: 'border-l-violet-500',
    badge: 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/30',
    avatar: 'bg-violet-500/15 text-violet-600 dark:text-violet-300 ring-violet-500/30',
    accentText: 'text-violet-600 dark:text-violet-400'
  },
  {
    border: 'border-l-cyan-500',
    badge: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
    avatar: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 ring-cyan-500/30',
    accentText: 'text-cyan-600 dark:text-cyan-400'
  },
  {
    border: 'border-l-fuchsia-500',
    badge: 'bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-300 border-fuchsia-500/30',
    avatar: 'bg-fuchsia-500/15 text-fuchsia-600 dark:text-fuchsia-300 ring-fuchsia-500/30',
    accentText: 'text-fuchsia-600 dark:text-fuchsia-400'
  },
  {
    border: 'border-l-emerald-500',
    badge: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    avatar: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 ring-emerald-500/30',
    accentText: 'text-emerald-600 dark:text-emerald-400'
  },
  {
    border: 'border-l-rose-500',
    badge: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30',
    avatar: 'bg-rose-500/15 text-rose-600 dark:text-rose-300 ring-rose-500/30',
    accentText: 'text-rose-600 dark:text-rose-400'
  },
  {
    border: 'border-l-teal-500',
    badge: 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/30',
    avatar: 'bg-teal-500/15 text-teal-600 dark:text-teal-300 ring-teal-500/30',
    accentText: 'text-teal-600 dark:text-teal-400'
  },
  {
    border: 'border-l-sky-500',
    badge: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/30',
    avatar: 'bg-sky-500/15 text-sky-600 dark:text-sky-300 ring-sky-500/30',
    accentText: 'text-sky-600 dark:text-sky-400'
  }
];

export const SellerCard: React.FC<Props> = ({
  seller,
  index,
  currencyCode,
  hasFinancialPermission
}) => {
  const theme = SELLER_THEMES[index % SELLER_THEMES.length];

  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const initials = seller.sellerName
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <article
      className={`card bg-base-100 p-4 rounded-2xl shadow-xs border border-base-200 border-l-4 ${theme.border} hover:shadow-md transition-all duration-200 flex flex-col justify-between`}
    >
      <div>
        {/* Cabecera: Avatar, Nombre y Posición */}
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {seller.photoUrl ? (
              <img
                src={seller.photoUrl}
                alt={seller.sellerName}
                className="w-11 h-11 rounded-full object-cover ring-2 ring-base-300 shrink-0"
              />
            ) : (
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ring-2 ${theme.avatar}`}
              >
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <h4 className="font-bold text-sm text-base-content leading-snug truncate" title={seller.sellerName}>
                {seller.sellerName}
              </h4>
              <span className="text-[11px] text-base-content/50 font-mono block truncate">
                ID: {seller.employeeId}
              </span>
            </div>
          </div>

          {/* Badge de Posición */}
          <span
            className={`badge badge-sm font-black font-mono px-2.5 py-1 shrink-0 rounded-xl border ${theme.badge}`}
          >
            #{seller.position}
          </span>
        </div>

        {/* Monto de Ventas */}
        <div className="bg-base-200/40 rounded-xl p-3 mb-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-base-content/50 uppercase tracking-wider block">
              Ventas Totales
            </span>
            <TrendingUp size={14} className={theme.accentText} />
          </div>
          <span className="text-base sm:text-lg font-bold font-mono text-base-content block mt-0.5">
            {formatMoney(seller.totalGrossSales)}
          </span>
        </div>

        {/* Grilla 3 columnas de actividad operativa */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
          <div className="bg-base-200/30 p-2 rounded-xl border border-base-200/50">
            <span className="text-[10px] text-base-content/50 block font-sans">Tickets</span>
            <strong className="text-base-content font-bold block mt-0.5">
              {seller.totalTransactions}
            </strong>
          </div>
          <div className="bg-base-200/30 p-2 rounded-xl border border-base-200/50">
            <span className="text-[10px] text-base-content/50 block font-sans">Unidades</span>
            <strong className="text-base-content font-bold block mt-0.5">
              {seller.totalUnitsSold}
            </strong>
          </div>
          <div className="bg-base-200/30 p-2 rounded-xl border border-base-200/50">
            <span className="text-[10px] text-base-content/50 block font-sans">Ticket Prom.</span>
            <strong className="text-base-content font-bold block mt-0.5 truncate">
              {formatMoney(seller.averageTicket)}
            </strong>
          </div>
        </div>
      </div>

      {/* Bloque Financiero (Solo si tiene permiso de confidencialidad) */}
      {hasFinancialPermission && seller.marginPercentage !== null && (
        <div className="mt-3 pt-2.5 border-t border-base-200 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1 text-base-content/60">
            <span>Utilidad:</span>
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
              {formatMoney(seller.netProfit)}
            </strong>
          </div>
          <span
            className={`badge badge-xs text-[10px] font-bold ${
              seller.marginPercentage >= 30
                ? 'badge-success text-white'
                : seller.marginPercentage >= 15
                ? 'badge-warning text-white'
                : 'badge-error text-white'
            }`}
          >
            {Number(seller.marginPercentage).toFixed(1)}% Margen
          </span>
        </div>
      )}
    </article>
  );
};
