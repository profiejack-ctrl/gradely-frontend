import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export type ToastType = 'error' | 'success' | 'warning' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: {
    error: (message: string) => void;
    success: (message: string) => void;
    warning: (message: string) => void;
    info: (message: string) => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  const toast = {
    error: (msg: string) => addToast(msg, 'error'),
    success: (msg: string) => addToast(msg, 'success'),
    warning: (msg: string) => addToast(msg, 'warning'),
    info: (msg: string) => addToast(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Floating Toast Container */}
      <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const typeStyles = {
            error: {
              bg: 'bg-[#18111A] border-rose-500/50 text-rose-200',
              icon: AlertCircle,
              iconColor: 'text-rose-400',
              badge: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            },
            success: {
              bg: 'bg-[#0E1B18] border-emerald-500/50 text-emerald-200',
              icon: CheckCircle2,
              iconColor: 'text-emerald-400',
              badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            },
            warning: {
              bg: 'bg-[#1C180E] border-amber-500/50 text-amber-200',
              icon: AlertTriangle,
              iconColor: 'text-amber-400',
              badge: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            },
            info: {
              bg: 'bg-[#0D1525] border-[#0284C7]/50 text-slate-200',
              icon: Info,
              iconColor: 'text-[#38BDF8]',
              badge: 'bg-[#0284C7]/20 text-[#38BDF8] border-[#0284C7]/30',
            },
          };

          const s = typeStyles[t.type];
          const Icon = s.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3 transition-all transform translate-y-0 opacity-100 animate-in fade-in slide-in-from-top-3 duration-200 ${s.bg}`}
            >
              <div className="mt-0.5 shrink-0">
                <Icon className={`w-5 h-5 ${s.iconColor}`} />
              </div>
              <div className="flex-1 text-xs leading-relaxed font-medium">
                {t.message}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-slate-400 hover:text-white p-0.5 rounded transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context.toast;
};
