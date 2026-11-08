import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { AddFacultyModal } from '../components/AddFacultyModal';
import {
  GraduationCap,
  Plus,
  Search,
  Key,
  Trash2,
  Mail,
  Building,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Shield,
  UserCheck,
  RefreshCw,
  Users,
  X,
} from 'lucide-react';

interface Teacher {
  id: string;
  name: string;
  email: string;
  role: 'teacher' | 'dean';
  avatar?: string;
  title?: string;
  department?: string;
  sectionIds?: string[];
}

export const FacultyPage: React.FC = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Reset password state
  const [resetModalInfo, setResetModalInfo] = useState<{ name: string; email: string; tempPass: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const fetchTeachers = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeachers();
      setTeachers(data || []);
    } catch (err: any) {
      console.warn('Failed to load faculty:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleResetPassword = async (teacher: Teacher) => {
    try {
      const res = await api.resetStudentPassword(teacher.id);
      if (res.success && res.initialPassword) {
        setResetModalInfo({
          name: teacher.name,
          email: teacher.email,
          tempPass: res.initialPassword,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to reset faculty password.',
      });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    if (teacher.id === user?.id) {
      alert('You cannot delete your own account while logged in.');
      return;
    }
    if (!confirm(`Are you sure you want to remove ${teacher.name} (${teacher.email})?`)) return;

    try {
      await api.deleteTeacher(teacher.id);
      setTeachers((prev) => prev.filter((t) => t.id !== teacher.id));
      setFeedback({
        type: 'success',
        message: `Successfully removed ${teacher.name}.`,
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to delete faculty member.',
      });
      setTimeout(() => setFeedback(null), 3500);
    }
  };

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const query = search.toLowerCase();
      return (
        t.name?.toLowerCase().includes(query) ||
        t.email?.toLowerCase().includes(query) ||
        t.department?.toLowerCase().includes(query) ||
        t.title?.toLowerCase().includes(query)
      );
    });
  }, [teachers, search]);

  const stats = useMemo(() => {
    const total = teachers.length;
    const deans = teachers.filter((t) => t.role === 'dean').length;
    const instructors = teachers.filter((t) => t.role === 'teacher').length;
    return { total, deans, instructors };
  }, [teachers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-[#38BDF8]" />
              <span>Faculty & Staff Directory</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase">
              DEAN PORTAL
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Manage academic instructors, professors, department roles, and portal credentials.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-sky-600 text-white text-xs font-bold flex items-center gap-2 shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Faculty Member</span>
          </button>
        </div>
      </div>

      {/* Inline Feedback Banner */}
      {feedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-[#0D1525] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Total Academic Staff</p>
            <p className="text-2xl font-black text-white mt-0.5">{stats.total}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
            <Users className="w-5 h-5 text-sky-400" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1525] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Faculty Instructors</p>
            <p className="text-2xl font-black text-white mt-0.5">{stats.instructors}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <GraduationCap className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-[#0D1525] border border-slate-800 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase text-slate-400">Deans & Admins</p>
            <p className="text-2xl font-black text-white mt-0.5">{stats.deans}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search and Filter Row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search faculty by name, email, department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1525] border border-slate-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] transition"
          />
        </div>

        <button
          onClick={fetchTeachers}
          disabled={isLoading}
          className="px-3 py-2 rounded-xl bg-[#0D1525] hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Faculty Table */}
      <div className="bg-[#0D1525] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#111A2D] text-slate-400 uppercase tracking-wider font-bold text-[10px] border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Faculty Member</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Academic Title</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Email Address</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <span className="w-6 h-6 border-2 border-sky-400/20 border-t-sky-400 rounded-full animate-spin inline-block mb-2" />
                    <p className="text-xs">Loading faculty directory...</p>
                  </td>
                </tr>
              ) : filteredTeachers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <GraduationCap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-white">No faculty members found</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Click "+ Add Faculty Member" above to create an instructor account.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredTeachers.map((teacher) => {
                  const isCurrent = teacher.id === user?.id;
                  const isDean = teacher.role === 'dean';

                  return (
                    <tr
                      key={teacher.id}
                      className="hover:bg-slate-800/30 transition group"
                    >
                      {/* Name & Avatar */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={
                              teacher.avatar ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(teacher.name)}`
                            }
                            alt={teacher.name}
                            className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 object-cover"
                          />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{teacher.name}</span>
                              {isCurrent && (
                                <span className="bg-sky-500/20 text-sky-400 border border-sky-500/30 text-[9px] px-1.5 py-0.2 rounded font-black">
                                  YOU
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {teacher.id.slice(0, 12)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1 border ${
                            isDean
                              ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                              : 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                          }`}
                        >
                          {isDean ? <Shield className="w-3 h-3" /> : <GraduationCap className="w-3 h-3" />}
                          <span>{isDean ? 'Dean' : 'Teacher'}</span>
                        </span>
                      </td>

                      {/* Title */}
                      <td className="py-3.5 px-4 font-medium text-slate-300">
                        {teacher.title || (isDean ? 'College Dean' : 'Faculty Instructor')}
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <span className="flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                          <span>{teacher.department || 'College of Computing Studies'}</span>
                        </span>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-500" />
                          <span>{teacher.email}</span>
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleResetPassword(teacher)}
                            title="Reset password"
                            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-amber-500/20 text-slate-400 hover:text-amber-300 border border-slate-700/60 hover:border-amber-500/30 transition"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          {!isCurrent && (
                            <button
                              onClick={() => handleDeleteTeacher(teacher)}
                              title="Delete faculty account"
                              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/60 hover:border-rose-500/30 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Faculty Modal */}
      <AddFacultyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onFacultyCreated={(newFac) => {
          setTeachers((prev) => [...prev, newFac]);
        }}
      />

      {/* Reset Password Result Dialog */}
      {resetModalInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0D1525] border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <Key className="w-4 h-4" />
                <span>Password Reset Generated</span>
              </div>
              <button
                onClick={() => setResetModalInfo(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              A temporary password has been generated for{' '}
              <strong className="text-white">{resetModalInfo.name}</strong> ({resetModalInfo.email}).
            </p>

            <div className="p-3.5 rounded-xl bg-[#111A2D] border border-amber-500/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Temporary Password</p>
                <p className="text-sm font-mono font-bold text-amber-300 select-all mt-0.5">
                  {resetModalInfo.tempPass}
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(resetModalInfo.tempPass);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="px-2.5 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-1 transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Note: This temporary password is only shown once. Ensure you send it to the faculty member.
            </p>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setResetModalInfo(null)}
                className="px-4 py-2 rounded-xl bg-[#0284C7] hover:bg-sky-600 text-white text-xs font-bold transition"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
