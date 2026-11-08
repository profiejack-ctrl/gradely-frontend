import React, { useState } from 'react';
import { X, Key, Search, Check, Copy, AlertCircle, ShieldAlert } from 'lucide-react';
import { api } from '../api/client';
import { User } from '../api/types';

interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  students?: User[];
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  students = [],
}) => {
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const filtered = students.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.studentNumber?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 5);

  const handleReset = async () => {
    if (!selectedStudent) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.resetStudentPassword(selectedStudent.id);
      setTempPassword(res.initialPassword || selectedStudent.studentNumber || 'Reset Successful');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset student password.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (tempPassword) {
      navigator.clipboard.writeText(tempPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#0D1525] border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white p-1 hover:bg-slate-800 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Reset Student Credentials</h3>
            <p className="text-xs text-slate-400">Revert student access to mandatory password change</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {tempPassword ? (
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs">
              Credentials reset successfully for <span className="font-bold text-white">{selectedStudent?.name}</span>.
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Temporary Password / Default Access Key
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={tempPassword}
                  className="w-full bg-[#111A2D] border border-slate-700 rounded-xl py-2.5 px-3.5 text-sm font-mono text-white select-all"
                />
                <button
                  onClick={handleCopy}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 shrink-0 transition"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                The student must update this password upon next sign-in.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={() => {
                  setTempPassword(null);
                  setSelectedStudent(null);
                  onClose();
                }}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold transition"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
                Select Student
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search by name or student ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-[#111A2D] border border-slate-700 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            </div>

            {/* Student selection options */}
            <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-800/80 rounded-xl p-1 bg-[#111A2D]/50">
              {filtered.length > 0 ? (
                filtered.map((student) => {
                  const isSelected = selectedStudent?.id === student.id;
                  return (
                    <button
                      key={student.id}
                      type="button"
                      onClick={() => setSelectedStudent(student)}
                      className={`w-full text-left p-2.5 rounded-lg text-xs flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-[#0284C7]/20 border border-[#0284C7]/50 text-white'
                          : 'hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-white">{student.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {student.studentNumber || student.id} • {student.email}
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[#38BDF8]" />}
                    </button>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  {students.length === 0 ? 'No students loaded' : 'No matching students found'}
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Resetting will immediately invalidate current credentials and issue a verified reset token.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!selectedStudent || loading}
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
