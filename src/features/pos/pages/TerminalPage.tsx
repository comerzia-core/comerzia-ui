import { useEffect, useState } from 'react';
import { posService } from '../services/posService';
import type { ShiftSummaryResponse } from '../types/pos';
import { ShoppingCart, AlertCircle, Clock, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../../stores/useAuthStore';

export const TerminalPage = () => {
  const [summary, setSummary] = useState<ShiftSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { userProfile } = useAuthStore();
  const roles = userProfile?.roles || [];
  const isCashier = roles.includes('CASHIER');
  

  useEffect(() => {
    if (!isCashier) {
      setError("Vista exclusiva para el rol CAJERO.");
      setIsLoading(false);
      return;
    }
    loadSummary();
  }, [isCashier]);

  const loadSummary = async () => {
    try {
      const data = await posService.getMyActiveShiftSummary();
      setSummary(data);
    } catch (err: any) {
      if (err.response?.status === 404 || err.response?.status === 400 || err.response?.data?.message?.includes("OPEN shift") || err.response?.data?.message?.includes("active shift")) {
        setError("Aún no tienes un turno asignado. Ve a Turnos y Arqueos para abrir tu caja.");
      } else {
        setError("Ocurrió un error al cargar la terminal.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-100px)]">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-100px)] gap-4 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-warning/20 flex items-center justify-center text-warning mb-2 shadow-lg shadow-warning/10">
          <AlertCircle size={48} />
        </div>
        <h2 className="text-3xl font-bold text-base-content text-center max-w-md leading-tight">
          {error}
        </h2>
        <p className="text-base-content/60 text-center max-w-sm mb-4">
          Para poder utilizar la terminal de ventas, necesitas aperturar tu caja o que un administrador te asigne un turno.
        </p>
        <Link to="/pos/shifts" className="btn btn-primary gap-2 shadow-lg shadow-primary/30">
          <Clock size={18} /> Ir a Turnos y Arqueos
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-base-content tracking-tight">Terminal de Cobro</h1>
          <p className="text-base-content/60 mt-1">Resumen del Turno Actual</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <ShoppingCart size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Caja Activa</p>
              <h3 className="text-xl font-bold">{summary?.cashName}</h3>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-info/10 text-info flex items-center justify-center">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Apertura</p>
              <h3 className="text-xl font-bold">
                {summary?.openedAt ? new Date(summary.openedAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '-'}
              </h3>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 text-success flex items-center justify-center">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Ingresos Totales</p>
              <h3 className="text-xl font-bold">${summary?.totalInflows.toFixed(2)}</h3>
            </div>
          </div>
        </div>

        <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-error/10 text-error flex items-center justify-center">
              <TrendingDown size={24} />
            </div>
            <div>
              <p className="text-base-content/60 text-sm font-medium">Egresos Totales</p>
              <h3 className="text-xl font-bold">${summary?.totalOutflows.toFixed(2)}</h3>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-base-100 rounded-2xl p-6 shadow-sm border border-base-200 min-h-[400px] flex items-center justify-center">
         <p className="text-base-content/40 text-lg">Interfaz de Venta en Desarrollo...</p>
      </div>

    </div>
  );
};
