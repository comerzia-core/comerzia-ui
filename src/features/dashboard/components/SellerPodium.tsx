// src/features/dashboard/components/SellerPodium.tsx
import React from 'react';
import type { DashboardSellerRankingResponse } from '../types/dashboard';
import { Crown, Medal, Award, Receipt, ShoppingBag } from 'lucide-react';

interface Props {
  topSellers: DashboardSellerRankingResponse[];
  currencyCode: string;
  hasFinancialPermission: boolean;
}

export const SellerPodium: React.FC<Props> = ({
  topSellers,
  currencyCode,
  hasFinancialPermission
}) => {
  if (!topSellers || topSellers.length === 0) return null;

  const formatMoney = (amount: number | null | undefined): string => {
    const num = Number(amount) || 0;
    return `${currencyCode} ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const first = topSellers[0];
  const second = topSellers.length > 1 ? topSellers[1] : null;
  const third = topSellers.length > 2 ? topSellers[2] : null;

  // Helper para renderizar la tarjeta de cada escalón del podio
  const renderPodiumStep = (
    seller: DashboardSellerRankingResponse | null,
    position: 1 | 2 | 3
  ) => {
    if (!seller) {
      return (
        <div className="flex-1 max-w-[260px] opacity-20 flex flex-col items-center justify-end">
          <div className="w-16 h-16 rounded-full bg-base-300 mb-3" />
          <div
            className={`w-full rounded-t-3xl border-t-2 border-base-300 bg-base-200/40 ${
              position === 1 ? 'h-44 sm:h-52' : position === 2 ? 'h-32 sm:h-40' : 'h-24 sm:h-32'
            }`}
          />
        </div>
      );
    }

    const config = {
      1: {
        pedestalHeight: 'h-44 sm:h-56',
        pedestalBg: 'bg-gradient-to-t from-amber-500/25 via-amber-500/10 to-amber-500/5',
        pedestalBorder: 'border-t-4 border-amber-400',
        ringColor: 'ring-4 ring-amber-400 shadow-lg shadow-amber-500/25',
        badgeBg: 'bg-amber-400 text-amber-950 font-extrabold',
        badgeIcon: Crown,
        badgeLabel: '1º Lugar',
        titleColor: 'text-amber-500',
        avatarSize: 'w-16 h-16 sm:w-20 sm:h-20 text-xl sm:text-2xl',
        pedestalNumber: '1'
      },
      2: {
        pedestalHeight: 'h-32 sm:h-44',
        pedestalBg: 'bg-gradient-to-t from-slate-400/25 via-slate-400/10 to-slate-400/5',
        pedestalBorder: 'border-t-4 border-slate-400',
        ringColor: 'ring-4 ring-slate-400 shadow-md shadow-slate-400/20',
        badgeBg: 'bg-slate-300 text-slate-800 font-extrabold',
        badgeIcon: Medal,
        badgeLabel: '2º Lugar',
        titleColor: 'text-slate-400',
        avatarSize: 'w-14 h-14 sm:w-16 sm:h-16 text-lg sm:text-xl',
        pedestalNumber: '2'
      },
      3: {
        pedestalHeight: 'h-24 sm:h-36',
        pedestalBg: 'bg-gradient-to-t from-amber-700/25 via-amber-700/10 to-amber-700/5',
        pedestalBorder: 'border-t-4 border-amber-600',
        ringColor: 'ring-4 ring-amber-600 shadow-md shadow-amber-700/20',
        badgeBg: 'bg-amber-600 text-white font-extrabold',
        badgeIcon: Award,
        badgeLabel: '3º Lugar',
        titleColor: 'text-amber-600',
        avatarSize: 'w-12 h-12 sm:w-14 sm:h-14 text-base sm:text-lg',
        pedestalNumber: '3'
      }
    }[position];

    const BadgeIcon = config.badgeIcon;
    const initials = seller.sellerName
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    return (
      <div className="flex-1 max-w-[260px] flex flex-col items-center justify-end z-10 transition-transform duration-200 hover:-translate-y-1">
        {/* Cabecera del Vendedor: Avatar, Nombre e Insignia */}
        <div className="flex flex-col items-center text-center mb-3 w-full px-1">
          {/* Badge flotante de puesto */}
          <div className="mb-2">
            <span
              className={`badge badge-sm inline-flex items-center gap-1 px-2.5 py-1 text-[11px] rounded-full shadow-xs ${config.badgeBg}`}
            >
              <BadgeIcon size={12} className="shrink-0" />
              <span>{config.badgeLabel}</span>
            </span>
          </div>

          {/* Avatar con anillo luminoso */}
          <div className="relative mb-2">
            {seller.photoUrl ? (
              <img
                src={seller.photoUrl}
                alt={seller.sellerName}
                className={`${config.avatarSize} rounded-full object-cover ${config.ringColor} bg-base-100`}
              />
            ) : (
              <div
                className={`${config.avatarSize} rounded-full bg-base-200 text-base-content flex items-center justify-center font-bold ${config.ringColor}`}
              >
                {initials}
              </div>
            )}
          </div>

          {/* Nombre del vendedor */}
          <h4 className="font-bold text-xs sm:text-sm text-base-content truncate w-full" title={seller.sellerName}>
            {seller.sellerName}
          </h4>

          {/* Monto de Ventas */}
          <span className="text-sm sm:text-base lg:text-lg font-bold font-mono text-primary mt-0.5 block truncate w-full">
            {formatMoney(seller.totalGrossSales)}
          </span>

          {/* Resumen de tickets y unidades */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-0.5 sm:gap-1.5 mt-1 text-[10px] sm:text-[11px] text-base-content/60 font-mono whitespace-nowrap">
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
              <Receipt size={10} className="shrink-0" />
              {seller.totalTransactions} tickets
            </span>
            <span className="hidden sm:inline">•</span>
            <span className="inline-flex items-center gap-0.5 whitespace-nowrap">
              <ShoppingBag size={10} className="shrink-0" />
              {seller.totalUnitsSold} uds
            </span>
          </div>

          {/* Margen financiero (si tiene permiso) */}
          {hasFinancialPermission && seller.marginPercentage !== null && (
            <div className="mt-1">
              <span
                className={`badge badge-xs text-[10px] font-mono font-bold ${
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
        </div>

        {/* El pedestal físico / escalón del podio */}
        <div
          className={`w-full rounded-t-3xl ${config.pedestalBorder} ${config.pedestalBg} ${config.pedestalHeight} flex flex-col items-center justify-between p-3 relative overflow-hidden shadow-lg`}
        >
          {/* Número gigante de fondo */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-15">
            <span className="text-7xl sm:text-8xl font-black font-mono tracking-tighter text-base-content">
              {config.pedestalNumber}
            </span>
          </div>

          {/* Ticket promedio en la parte superior del pedestal */}
          <div className="relative z-10 w-full text-center">
            <span className="text-[9px] sm:text-[10px] text-base-content/60 block uppercase tracking-wider font-semibold">
              Ticket Promedio
            </span>
            <span className="text-xs sm:text-sm font-bold font-mono text-base-content">
              {formatMoney(seller.averageTicket)}
            </span>
          </div>

          {/* Barra inferior decorativa */}
          <div className="relative z-10 w-10 sm:w-16 h-1 rounded-full bg-base-content/20" />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full bg-base-100 rounded-3xl border border-base-200 p-4 sm:p-6 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-base-content flex items-center gap-2">
            <Crown size={18} className="text-amber-400" />
            Podio de Vendedores Estrella
          </h3>
          <p className="text-xs text-base-content/60">
            Los 3 mejores colaboradores con mayor desempeño en el período seleccionado.
          </p>
        </div>
      </div>

      {/* Disposición del podio olímpico: 2º Lugar (Izquierda), 1º Lugar (Centro), 3º Lugar (Derecha) */}
      <div className="flex items-end justify-center gap-2 sm:gap-4 md:gap-6 pt-6 pb-2 min-h-[340px]">
        {renderPodiumStep(second, 2)}
        {renderPodiumStep(first, 1)}
        {renderPodiumStep(third, 3)}
      </div>
    </div>
  );
};
