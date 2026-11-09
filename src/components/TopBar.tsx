import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { ShieldCheck, Bell, LayoutGrid, Settings, LogOut, ChevronDown, CheckCircle2, User, RefreshCw, Edit3 } from 'lucide-react';
import { UserProfileModal } from './UserProfileModal';

interface TopBarProps {
  onOpenSettings?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({ onOpenSettings }) => {
  const { user, logout } = useAuth();
  const { refreshData, isRefreshing } = useData();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const getInitials = (name?: string) => {
    if (!name) return 'RC';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-[#090E17]/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Left: Cloud & Integrity Status Pills */}
      <div className="flex items-center gap-3">
        <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-[#0D1525] border border-slate-800 text-xs shadow-inner">
          <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            <span>Cloud Database Live</span>
          </div>
          <span className="text-slate-600">•</span>
          <button
            onClick={() => refreshData(true)}
            disabled={isRefreshing}
            title="Click to force refresh from database"
            className="flex items-center gap-1.5 text-slate-400 hover:text-[#38BDF8] transition text-[11px] group"
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-[#0EA5E9]' : 'group-hover:rotate-180 transition-transform duration-300'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Cached'}</span>
          </button>
        </div>
      </div>

      {/* Right: Actions & User Profile */}
      <div className="flex items-center gap-3">
        {/* Settings button */}
        <button
          onClick={onOpenSettings}
          title="System Settings"
          className="w-9 h-9 rounded-xl bg-[#0D1525] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Grid Launcher */}
        <button
          title="Apps & Tools"
          className="w-9 h-9 rounded-xl bg-[#0D1525] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>

        {/* Notifications */}
        <button
          title="Notifications"
          className="w-9 h-9 rounded-xl bg-[#0D1525] border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white flex items-center justify-center relative transition"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-[#0284C7] rounded-full" />
        </button>

        {/* User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-xl bg-[#0D1525] border border-slate-800 hover:border-slate-700 transition"
          >
            <div className="w-8 h-8 rounded-lg bg-[#0284C7]/20 border border-[#0284C7]/60 flex items-center justify-center text-[#38BDF8] font-bold text-xs shadow-inner overflow-hidden">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user?.name || 'Avatar'}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : (
                getInitials(user?.name)
              )}
            </div>
            <div className="text-left hidden sm:block">
              <div className="text-xs font-bold text-white tracking-wide flex items-center gap-1">
                {user?.name || 'Romel Cabiling'}
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              </div>
              <div className="text-[10px] text-slate-400 leading-none mt-0.5">
                {user?.title || (user?.role === 'dean' ? 'College Dean' : 'Faculty Instructor')}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-[#0D1525] border border-slate-800 rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2.5 border-b border-slate-800">
                <p className="text-xs font-semibold text-white">{user?.name}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#0284C7]/15 border border-[#0284C7]/30 text-[10px] font-semibold text-[#38BDF8]">
                  <span>{user?.department || 'College of Computing Studies'}</span>
                </div>
              </div>

              <div className="py-1">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    setIsProfileModalOpen(true);
                  }}
                  className="w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-slate-800/70 text-slate-200 flex items-center gap-2 transition"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>Edit Profile & Avatar</span>
                </button>
              </div>

              <div className="pt-1 border-t border-slate-800">
                <button
                  onClick={() => {
                    logout();
                    setShowProfileMenu(false);
                  }}
                  className="w-full px-3 py-2 text-xs text-left rounded-lg hover:bg-rose-500/10 text-rose-400 flex items-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </header>
  );
};
