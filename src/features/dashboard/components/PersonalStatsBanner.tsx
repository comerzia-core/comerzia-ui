// src/features/dashboard/components/PersonalStatsBanner.tsx
import React from 'react';
import type { DashboardSellerPersonalResponse } from '../types/dashboard';
import { Trophy, TrendingUp, Receipt, ShoppingBag, Award, Sparkles } from 'lucide-react';

interface Props {
  stats: DashboardSellerPersonalResponse;
  currencyCode: string;
}

export const PersonalStatsBanner: React.FC<Props> = ({ stats, currencyCode }) => {
  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const isPodium = stats.rankingPosition <= 3 && stats.rankingPosition > 0;
  const isLeader = stats.rankingPosition === 1;

  return (
    <div className="card bg-base-100 p-5 sm:p-6 rounded-3xl border border-base-200 shadow-xs relative overflow-hidden">
      {/* Elemento decorativo sutil de fondo */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
        {/* Lado izquierdo: Saludo e información del vendedor */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary text-primary-content flex items-center justify-center font-bold text-xl shadow-md shrink-0">
            {stats.sellerName
              .split(' ')
              .map(n => n[0])
              .slice(0, 2)
              .join('')
              .toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg sm:text-xl font-bold text-base-content leading-tight">
                ¡Hola, {stats.sellerName}!
              </h2>
              {isLeader ? (
                <span className="badge badge-warning text-amber-950 font-bold gap-1 text-xs px-2.5 py-2 shadow-xs">
                  <Sparkles size={13} className="shrink-0" />
                  ¡Líder de Ventas!
                </span>
              ) : isPodium ? (
                <span className="badge badge-success text-white font-bold gap-1 text-xs px-2.5 py-2 shadow-xs">
                  <Trophy size={13} className="shrink-0" />
                  ¡En el Podio!
                </span>
              ) : (
                <span className="badge badge-neutral font-semibold gap-1 text-xs px-2 py-1.5">
                  <Award size={13} className="shrink-0 text-primary" />
                  Vendedor Activo
                </span>
              )}
            </div>
            <p className="text-xs text-base-content/60 mt-1">
              Aquí tienes el resumen en tiempo real de tu desempeño comercial.
            </p>
          </div>
        </div>

        {/* Lado derecho: Métricas personales y puesto en el ranking con alto contraste */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3.5 w-full lg:w-auto">
          {/* Métrica 1: Ventas Totales */}
          <div className="bg-primary/5 hover:bg-primary/10 border border-primary/20 p-3 sm:p-3.5 rounded-2xl shadow-xs transition-all duration-200 text-left min-w-[130px] sm:min-w-[145px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-primary/15 text-primary flex items-center justify-center shrink-0">
                <TrendingUp size={13} />
              </div>
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Tus Ventas
              </span>
            </div>
            <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-primary tracking-tight block truncate">
              {formatMoney(stats.grossSales)}
            </span>
          </div>

          {/* Métrica 2: Tickets */}
          <div className="bg-sky-500/5 hover:bg-sky-500/10 border border-sky-500/25 p-3 sm:p-3.5 rounded-2xl shadow-xs transition-all duration-200 text-left min-w-[130px] sm:min-w-[145px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-sky-500/15 text-sky-600 dark:text-sky-400 flex items-center justify-center shrink-0">
                <Receipt size={13} />
              </div>
              <span className="text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider block">
                Tickets
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-sky-700 dark:text-sky-300">
                {stats.transactions}
              </span>
              <span className="text-[11px] font-semibold text-sky-600/70 dark:text-sky-400/70">
                órdenes
              </span>
            </div>
          </div>

          {/* Métrica 3: Unidades */}
          <div className="bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/25 p-3 sm:p-3.5 rounded-2xl shadow-xs transition-all duration-200 text-left min-w-[130px] sm:min-w-[145px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ShoppingBag size={13} />
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                Unidades
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-emerald-700 dark:text-emerald-300">
                {stats.unitsSold}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600/70 dark:text-emerald-400/70">
                uds
              </span>
            </div>
          </div>

          {/* Métrica 4: Puesto de Gamificación */}
          <div className="bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/30 p-3 sm:p-3.5 rounded-2xl shadow-xs transition-all duration-200 text-left min-w-[130px] sm:min-w-[145px]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <div className="w-6 h-6 rounded-lg bg-amber-500/25 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <Trophy size={13} />
              </div>
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
                Tu Posición
              </span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-base sm:text-lg lg:text-xl font-black font-mono text-amber-600 dark:text-amber-400">
                #{stats.rankingPosition}
              </span>
              <span className="text-[11px] font-semibold text-amber-700/70 dark:text-amber-300/70">
                de {stats.totalSellers}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
