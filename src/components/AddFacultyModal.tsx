import React, { useState } from 'react';
import { api } from '../api/client';
import {
  X,
  UserPlus,
  Mail,
  Lock,
  Building,
  GraduationCap,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';

interface AddFacultyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFacultyCreated?: (newFaculty: any) => void;
}

export const AddFacultyModal: React.FC<AddFacultyModalProps> = ({
  isOpen,
  onClose,
  onFacultyCreated,
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [title, setTitle] = useState('Faculty Instructor');
  const [department, setDepartment] = useState('College of Computing Studies');
  const [role, setRole] = useState<'teacher' | 'dean'>('teacher');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdInfo, setCreatedInfo] = useState<{ email: string; password: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required.');
      return;
    }

    if (password && password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const generatedPass = password.trim() || `Fac_${Math.random().toString(36).substring(2, 6)}!${Date.now().toString().slice(-4)}`;
      const result = await api.createTeacher({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: generatedPass,
        role,
        title: title.trim(),
        department: department.trim(),
      });

      setCreatedInfo({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: result.initialPassword || generatedPass,
      });

      onFacultyCreated?.(result);
    } catch (err: any) {
      setError(err?.message || 'Failed to create faculty account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = () => {
    if (!createdInfo) return;
    const text = `Gradely Faculty Credentials:\nName: ${createdInfo.name}\nEmail: ${createdInfo.email}\nPassword: ${createdInfo.password}\nLogin Portal: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setTitle('Faculty Instructor');
    setDepartment('College of Computing Studies');
    setPassword('');
    setError(null);
    setCreatedInfo(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0D1525] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#111A2D]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0284C7]/20 border border-[#0284C7]/40 flex items-center justify-center text-[#38BDF8]">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">Create Faculty Account</h2>
              <p className="text-xs text-slate-400">Add instructors, professors, and academic personnel</p>
            </div>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {createdInfo ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm text-emerald-200">Account Created Successfully!</h4>
                  <p className="text-xs text-emerald-300/90 mt-0.5">
                    The faculty account is active and can now log into the portal.
                  </p>
                </div>
              </div>

              {/* Credentials Card */}
              <div className="p-4 rounded-xl bg-[#111A2D] border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Credentials Summary</span>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs font-semibold text-[#38BDF8] hover:text-sky-300 transition"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy All</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Full Name</span>
                    <span className="text-white font-semibold">{createdInfo.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800">
                    <span className="text-slate-400">Login Email</span>
                    <span className="text-sky-400 font-mono font-semibold">{createdInfo.email}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Initial Password</span>
                    <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      {createdInfo.password}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700 text-white text-xs font-semibold transition"
                >
                  Add Another Faculty
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-sky-600 text-white text-xs font-bold transition shadow-lg shadow-sky-900/30"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
              )}

              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Prof. Alan Turing"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                />
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">
                  Email Address <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. turing@gradely.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* Title & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Academic Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Assistant Professor"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-300">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. College of Computing Studies"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </div>

              {/* Role selection */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">Portal Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('teacher')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition ${
                      role === 'teacher'
                        ? 'bg-[#0284C7]/20 border-[#0284C7] text-white'
                        : 'bg-[#111A2D] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Faculty Instructor
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('dean')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold text-center transition ${
                      role === 'dean'
                        ? 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                        : 'bg-[#111A2D] border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    College Dean
                  </button>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Initial Password</span>
                  <span className="text-[10px] text-slate-500">Leave blank to auto-generate</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min 8 characters (or auto-generated)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl pl-9 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[#0284C7] hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg shadow-sky-900/30"
                >
                  {isSubmitting ? (
                    <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  <span>Create Faculty Account</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
