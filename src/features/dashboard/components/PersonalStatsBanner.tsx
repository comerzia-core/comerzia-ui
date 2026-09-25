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
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary/10 via-primary/5 to-base-100 border border-primary/20 p-5 sm:p-6 shadow-sm">
      {/* Elemento decorativo de fondo */}
      <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

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

        {/* Lado derecho: Métricas personales y puesto en el ranking */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto">
          {/* Métrica 1: Ventas Totales */}
          <div className="bg-base-100/90 backdrop-blur-xs p-3 rounded-2xl border border-base-200/80 shadow-2xs text-left">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/50 uppercase tracking-wider block flex items-center gap-1">
              <TrendingUp size={12} className="text-primary" />
              Tus Ventas
            </span>
            <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-primary mt-1 block">
              {formatMoney(stats.grossSales)}
            </span>
          </div>

          {/* Métrica 2: Tickets */}
          <div className="bg-base-100/90 backdrop-blur-xs p-3 rounded-2xl border border-base-200/80 shadow-2xs text-left">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/50 uppercase tracking-wider block flex items-center gap-1">
              <Receipt size={12} className="text-sky-500" />
              Tickets
            </span>
            <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-base-content mt-1 block">
              {stats.transactions} <span className="text-[11px] font-normal text-base-content/50">ops</span>
            </span>
          </div>

          {/* Métrica 3: Unidades */}
          <div className="bg-base-100/90 backdrop-blur-xs p-3 rounded-2xl border border-base-200/80 shadow-2xs text-left">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/50 uppercase tracking-wider block flex items-center gap-1">
              <ShoppingBag size={12} className="text-emerald-500" />
              Unidades
            </span>
            <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-base-content mt-1 block">
              {stats.unitsSold} <span className="text-[11px] font-normal text-base-content/50">uds</span>
            </span>
          </div>

          {/* Métrica 4: Puesto de Gamificación */}
          <div className="bg-base-100/90 backdrop-blur-xs p-3 rounded-2xl border border-base-200/80 shadow-2xs text-left">
            <span className="text-[10px] sm:text-[11px] font-bold text-base-content/50 uppercase tracking-wider block flex items-center gap-1">
              <Trophy size={12} className="text-amber-500" />
              Tu Posición
            </span>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-sm sm:text-base lg:text-lg font-extrabold font-mono text-amber-500">
                #{stats.rankingPosition}
              </span>
              <span className="text-[11px] text-base-content/50 font-medium">
                de {stats.totalSellers}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
