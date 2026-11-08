import React from 'react';
import { LucideIcon, ArrowRight } from 'lucide-react';

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  variant: 'blue' | 'emerald' | 'amber' | 'rose';
  onClick: () => void;
}

export const QuickActionCard: React.FC<QuickActionCardProps> = ({
  title,
  description,
  icon: Icon,
  variant,
  onClick,
}) => {
  const variantStyles = {
    blue: {
      iconBg: 'bg-[#0284C7]/20 text-[#38BDF8] border-[#0284C7]/40',
      hoverBorder: 'hover:border-[#0284C7]/60',
      arrowBg: 'group-hover:bg-[#0284C7] group-hover:text-white',
    },
    emerald: {
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      hoverBorder: 'hover:border-emerald-500/60',
      arrowBg: 'group-hover:bg-emerald-600 group-hover:text-white',
    },
    amber: {
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      hoverBorder: 'hover:border-amber-500/60',
      arrowBg: 'group-hover:bg-amber-600 group-hover:text-white',
    },
    rose: {
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      hoverBorder: 'hover:border-rose-500/60',
      arrowBg: 'group-hover:bg-rose-600 group-hover:text-white',
    },
  };

  const style = variantStyles[variant];

  return (
    <button
      onClick={onClick}
      className={`bg-[#0D1525] border border-slate-800/80 rounded-2xl p-4 text-left transition-all duration-200 ${style.hoverBorder} hover:bg-[#111A2D] flex flex-col justify-between group h-full shadow-sm`}
    >
      <div className="flex items-start justify-between w-full mb-3">
        <div
          className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 transition ${style.iconBg}`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div
          className={`w-7 h-7 rounded-lg bg-slate-800/60 text-slate-400 flex items-center justify-center transition-all duration-200 ${style.arrowBg}`}
        >
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
        </div>
      </div>

      <div>
        <h3 className="text-sm font-bold text-white group-hover:text-white transition">
          {title}
        </h3>
        <p className="text-[11px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
          {description}
        </p>
      </div>
    </button>
  );
};
