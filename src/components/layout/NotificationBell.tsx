import React, { useEffect, useRef, useState } from 'react';
import { Bell, X, ShieldAlert, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useUserNotifications } from '../../features/security/hooks/useUserNotifications';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { notifications, dismissMutation } = useUserNotifications();

  // Cerrar al hacer clic fuera o presionar escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  const handleDismiss = (reference: string, e: React.MouseEvent) => {
    e.stopPropagation();
    dismissMutation.mutate(reference);
  };

  const handleAction = (actionUrl: string | null) => {
    setIsOpen(false);
    if (actionUrl) {
      navigate(actionUrl);
    }
  };

  const count = notifications.length;

  return (
    <div ref={dropdownRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="btn btn-ghost btn-circle btn-sm sm:btn-md relative text-base-content/80 hover:text-base-content"
        aria-label="Notificaciones"
        aria-expanded={isOpen}
      >
        <Bell size={20} />
        {count > 0 && (
          <span className="badge badge-primary badge-xs absolute top-1 right-1 font-bold min-w-4 h-4 px-1 flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-base-100 rounded-2xl shadow-xl border border-base-200 z-50 overflow-hidden animate-fade-in"
          role="menu"
        >
          {/* Header */}
          <div className="p-3.5 border-b border-base-200 flex items-center justify-between bg-base-200/40">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <span className="text-sm font-bold text-base-content">Notificaciones</span>
              {count > 0 && (
                <span className="badge badge-sm badge-ghost text-xs font-semibold">{count}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-xs btn-circle text-base-content/60"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-base-200">
            {count === 0 ? (
              <div className="p-8 text-center text-base-content/60 text-xs">
                <Bell size={28} className="mx-auto mb-2 opacity-30" />
                No tienes notificaciones pendientes
              </div>
            ) : (
              notifications.map((item) => (
                <div
                  key={item.reference}
                  className="p-3.5 hover:bg-base-200/40 transition-colors cursor-pointer group"
                  onClick={() => handleAction(item.actionUrl)}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
                      <ShieldAlert size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-bold text-base-content truncate">{item.title}</p>
                        <button
                          type="button"
                          onClick={(e) => handleDismiss(item.reference, e)}
                          className="text-base-content/40 hover:text-error transition-colors p-1"
                          title="Descartar notificación"
                          aria-label="Descartar"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <p className="text-xs text-base-content/70 mt-1 leading-relaxed line-clamp-2">
                        {item.message}
                      </p>
                      {item.actionUrl && (
                        <div className="mt-2 flex items-center gap-1 text-[11px] font-semibold text-primary">
                          <span>Ver detalles</span>
                          <ExternalLink size={10} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
