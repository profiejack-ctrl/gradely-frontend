import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  value: string | number;
  label: string;
  icon: LucideIcon;
  variant: 'blue' | 'teal' | 'cyan' | 'amber';
}

export const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  icon: Icon,
  variant,
}) => {
  const variantStyles = {
    blue: {
      bg: 'bg-[#0284C7]/15',
      border: 'border-[#0284C7]/30',
      text: 'text-[#38BDF8]',
      iconBg: 'bg-[#0284C7]/20',
      glow: 'hover:border-[#0284C7]/50',
    },
    teal: {
      bg: 'bg-[#0D9488]/15',
      border: 'border-[#0D9488]/30',
      text: 'text-[#2DD4BF]',
      iconBg: 'bg-[#0D9488]/20',
      glow: 'hover:border-[#0D9488]/50',
    },
    cyan: {
      bg: 'bg-[#0EA5E9]/15',
      border: 'border-[#0EA5E9]/30',
      text: 'text-[#38BDF8]',
      iconBg: 'bg-[#0EA5E9]/20',
      glow: 'hover:border-[#0EA5E9]/50',
    },
    amber: {
      bg: 'bg-amber-500/15',
      border: 'border-amber-500/30',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/20',
      glow: 'hover:border-amber-500/50',
    },
  };

  const style = variantStyles[variant];

  return (
    <div
      className={`bg-[#0D1525] border border-slate-800/80 rounded-2xl p-4 flex items-center gap-4 transition-all duration-200 ${style.glow} hover:bg-[#111A2D] shadow-sm`}
    >
      <div
        className={`w-12 h-12 rounded-xl ${style.iconBg} border ${style.border} flex items-center justify-center ${style.text} shrink-0`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <div className="text-2xl font-black text-white tracking-tight leading-none">
          {value}
        </div>
        <div className="text-xs font-semibold text-slate-400 mt-1">
          {label}
        </div>
      </div>
    </div>
  );
};
