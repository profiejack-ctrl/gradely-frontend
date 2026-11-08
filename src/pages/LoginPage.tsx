import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Server } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const backendUrl = (import.meta.env.VITE_API_URL || 'http://localhost:3001').replace(/\/+$/, '');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password) {
      setError('Please enter both email/ID and password.');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await login(identifier.trim(), password);
    } catch (err: any) {
      const errMsg = err?.message || 'Invalid Student ID / Email or password';
      setError(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B13] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#0284C7]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#65A30D]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="text-center mb-8 relative z-10">
        <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-glow mb-4">
          <img src="/logo.svg" alt="Gradely Logo" className="w-12 h-12" />
        </div>
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Gradely</h1>
          <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
            FACULTY
          </span>
        </div>
        <p className="text-slate-400 text-sm mt-1">Classroom OS v3.4 • Tablet Redesign</p>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#0D1525]/90 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="flex items-center justify-between pb-6 mb-6 border-b border-slate-800/80">
          <div>
            <h2 className="text-xl font-bold text-white">Sign In</h2>
            <p className="text-xs text-slate-400 mt-0.5">Faculty, Dean & Student Authentication</p>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-glow" />
            Supabase Auth
          </div>
        </div>

        {/* Inline Notification Message */}
        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-start gap-3 text-rose-300 text-xs leading-relaxed animate-in fade-in duration-150">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="font-medium">{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Email Address or Student ID
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="name@gradely.edu or Student ID"
                className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 bg-[#0284C7] hover:bg-[#0369A1] text-white font-semibold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-glow transition disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-block w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>Sign In to Portal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Dean Account Quick Access */}
        <div className="mt-4 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Dean Administrator:</span>
            <button
              type="button"
              onClick={() => {
                setIdentifier('dean@gradely.edu');
                setPassword('password123');
              }}
              className="text-[#38BDF8] hover:text-sky-300 font-semibold text-[11px] bg-[#0284C7]/15 border border-[#0284C7]/30 px-2.5 py-1 rounded-lg transition"
            >
              Autofill Dean Login
            </button>
          </div>
          <p className="text-[10px] text-slate-500 mt-1.5">
            Default: <span className="font-mono text-slate-400">dean@gradely.edu</span> • Password: <span className="font-mono text-slate-400">password123</span>
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5 text-slate-400">
            <ShieldCheck className="w-4 h-4 text-[#0EA5E9]" />
            <span>Encrypted Session</span>
          </div>
          <span className="text-slate-500 font-mono text-[11px]">BCrypt & Supabase Auth</span>
        </div>
      </div>

      {/* Backend connection footer pill */}
      <div className="mt-6 flex items-center gap-2 text-xs text-slate-500">
        <Server className="w-3.5 h-3.5 text-emerald-400" />
        <span>Connected to backend at <span className="text-slate-400 font-mono">{backendUrl}</span></span>
      </div>
    </div>
  );
};
