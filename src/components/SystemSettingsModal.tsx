import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { api } from '../api/client';
import {
  X,
  Settings,
  AlertTriangle,
  Trash2,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  Server,
  Lock,
  LogOut,
} from 'lucide-react';

interface SystemSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SystemSettingsModal: React.FC<SystemSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, logout } = useAuth();
  const { refreshData, isRefreshing } = useData();

  const [confirmText, setConfirmText] = useState('');
  const [isConfirmingWipe, setIsConfirmingWipe] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const [wipeSuccess, setWipeSuccess] = useState<string | null>(null);
  const [wipeError, setWipeError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleClearDatabase = async () => {
    if (confirmText.trim().toUpperCase() !== 'CLEAR') {
      setWipeError('Please type CLEAR to confirm.');
      return;
    }

    setIsWiping(true);
    setWipeError(null);

    try {
      const res = await api.clearDatabase();
      setWipeSuccess(res.message || 'Database successfully cleared. All students removed, Dean account retained.');
      setIsConfirmingWipe(false);
      setConfirmText('');

      // Invalidate frontend cache and trigger refresh
      api.invalidateCache();
      await refreshData(true);

      // If current user is not a dean, log them out after 2 seconds
      if (user?.role !== 'dean') {
        setTimeout(() => {
          logout();
        }, 2200);
      }
    } catch (err: any) {
      setWipeError(err?.message || 'Failed to clear database. Ensure you have Dean permissions.');
    } finally {
      setIsWiping(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0D1525] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111A2D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center text-[#38BDF8]">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">System Settings</h2>
              <p className="text-xs text-slate-400">Database administration and local storage controls</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Status Message */}
          {wipeSuccess && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-emerald-200 mb-1">Database Cleared Successfully!</p>
                <p className="leading-relaxed">{wipeSuccess}</p>
                <p className="mt-2 text-emerald-400 font-semibold">
                  You can now log in using the Dean account (<span className="underline">dean@gradely.edu</span> / <span className="underline">password123</span>) to add new faculty.
                </p>
              </div>
            </div>
          )}

          {wipeError && (
            <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sm text-rose-200 mb-0.5">Operation Error</p>
                <p className="leading-relaxed">{wipeError}</p>
              </div>
            </div>
          )}

          {/* 1. Account & Connection Info */}
          <div className="p-4 rounded-xl bg-[#111A2D]/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Logged-in User</span>
              <span className="text-white font-bold">{user?.name} ({user?.email})</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">System Role</span>
              <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase tracking-wider ${
                user?.role === 'dean'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-sky-500/20 text-sky-300 border border-sky-500/40'
              }`}>
                {user?.role === 'dean' ? 'College Dean' : 'Faculty Instructor'}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Database Connection</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
                Supabase PostgreSQL (Live)
              </span>
            </div>
          </div>

          {/* 2. Client Cache Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Caching</h3>
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#111A2D]/50 border border-slate-800">
              <div>
                <p className="text-xs font-semibold text-white">Browser Cache</p>
                <p className="text-[11px] text-slate-400">Purge local cache and re-fetch latest data from server</p>
              </div>
              <button
                onClick={() => {
                  api.invalidateCache();
                  refreshData(true);
                }}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-medium flex items-center gap-1.5 transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Clear Cache'}</span>
              </button>
            </div>
          </div>

          {/* 3. Danger Zone: Clear Database */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Danger Zone</span>
            </h3>

            <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/30 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-rose-200">Clear Database (Clean Slate)</h4>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Permanently deletes all student masterlists, sections, subjects, assessments, grades, and attendance records.
                  Leaves only the <strong className="text-white">College Dean account</strong> (<span className="text-sky-300 font-mono">dean@gradely.edu</span>) active so you can start fresh and create faculty accounts.
                </p>
              </div>

              {!isConfirmingWipe ? (
                <button
                  type="button"
                  onClick={() => setIsConfirmingWipe(true)}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-rose-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clear Entire Database...</span>
                </button>
              ) : (
                <div className="p-3.5 rounded-lg bg-[#070B13] border border-rose-500/50 space-y-3 animate-in fade-in duration-150">
                  <p className="text-xs text-rose-300 font-semibold">
                    Are you absolutely sure? To proceed, type <span className="text-white font-mono bg-rose-500/30 px-1 py-0.5 rounded">CLEAR</span> below:
                  </p>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type CLEAR to confirm"
                    className="w-full bg-[#111A2D] border border-rose-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                  />
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      disabled={confirmText.trim().toUpperCase() !== 'CLEAR' || isWiping}
                      onClick={handleClearDatabase}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 transition"
                    >
                      {isWiping ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Wiping Database...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Confirm Permanent Wipe</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsConfirmingWipe(false);
                        setConfirmText('');
                        setWipeError(null);
                      }}
                      className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-[#111A2D] text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-500" />
            <span>Dean Administrative Controls</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
