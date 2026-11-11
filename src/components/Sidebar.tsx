import React from 'react';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Layers,
  Sliders,
  Sparkles,
  Table,
  CalendarCheck,
  Calendar,
  Users,
  GraduationCap,
  Settings,
  Cloud,
} from 'lucide-react';

export type NavItem =
  | 'dashboard'
  | 'classes'
  | 'subjects'
  | 'calendar'
  | 'ai-plans'
  | 'gradebook'
  | 'attendance'
  | 'students'
  | 'faculty';

interface SidebarProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onOpenSettings?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
}) => {
  const { user } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavItem,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'classes' as NavItem,
      label: 'Classes & Sections',
      icon: Layers,
    },
    {
      id: 'subjects' as NavItem,
      label: 'Subjects & Matrix',
      icon: Sliders,
    },
    {
      id: 'calendar' as NavItem,
      label: 'Event Calendar',
      icon: Calendar,
      badge: 'SYNC',
    },
    {
      id: 'ai-plans' as NavItem,
      label: 'AI Learning Plans',
      icon: Sparkles,
      badge: 'BETA',
    },
    {
      id: 'gradebook' as NavItem,
      label: 'Gradebook Sheet',
      icon: Table,
    },
    {
      id: 'attendance' as NavItem,
      label: 'Attendance Roll',
      icon: CalendarCheck,
    },
    {
      id: 'students' as NavItem,
      label: 'Student Directory',
      icon: Users,
    },
    ...(user?.role === 'dean'
      ? [
          {
            id: 'faculty' as NavItem,
            label: 'Faculty & Staff',
            icon: GraduationCap,
            badge: 'DEAN',
          },
        ]
      : []),
  ];

  return (
    <aside className="w-64 bg-[#090E17] border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      {/* Top Brand Header */}
      <div>
        <div className="p-5 pb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1.5 shadow-glow">
              <img src="/logo.svg" alt="Gradely Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight text-white">Gradely</span>
                <span className="bg-amber-500/15 text-amber-400 border border-amber-500/30 text-[10px] font-bold px-1.5 py-0.5 rounded tracking-wide">
                  {user?.role === 'dean' ? 'DEAN' : 'FACULTY'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium tracking-tight">
                Classroom OS v3.4
              </div>
            </div>
          </div>
        </div>

        {/* Section Label */}
        <div className="px-5 mb-2 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {user?.role === 'dean' ? 'DEAN ADMINISTRATION' : 'INSTRUCTOR PORTAL'}
          </span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        {/* Navigation Links */}
        <nav className="px-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-[#0284C7]/20 border border-[#0284C7]/50 text-white shadow-glow'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                      isActive
                        ? 'bg-[#0284C7] text-white shadow-sm'
                        : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 text-[9px] font-extrabold px-1.5 py-0.2 rounded">
                      {item.badge}
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-3.5 rounded-full bg-[#0EA5E9] shadow-[0_0_8px_#0EA5E9]" />
                  )}
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer Status */}
      <div className="p-4 m-3 rounded-xl bg-[#0D1525] border border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-300 font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
          <span className="text-xs">Synced Cloud</span>
        </div>
        <button
          onClick={onOpenSettings}
          title="Settings"
          className="text-slate-400 hover:text-white transition p-1 hover:bg-slate-800 rounded-lg"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
