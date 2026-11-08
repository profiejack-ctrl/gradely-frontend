import React, { useState } from 'react';
import { api } from '../api/client';
import { Section } from '../api/types';
import {
  X,
  Layers,
  Building,
  Calendar,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface AddSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSectionCreated: (newSection: Section) => void;
}

const YEAR_LEVELS = [
  '1st Year College',
  '2nd Year College',
  '3rd Year College',
  '4th Year College',
  'Senior High (Grade 11)',
  'Senior High (Grade 12)',
];

const SEMESTERS = ['1st Semester', '2nd Semester', 'Summer Term'];

export const AddSectionModal: React.FC<AddSectionModalProps> = ({
  isOpen,
  onClose,
  onSectionCreated,
}) => {
  const [name, setName] = useState('');
  const [gradeLevelOrYear, setGradeLevelOrYear] = useState('2nd Year College');
  const [academicYear, setAcademicYear] = useState('2025-2026');
  const [semester, setSemester] = useState('1st Semester');
  const [room, setRoom] = useState('MV208');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Section name (e.g. BSIT - 21001) is required.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const created = await api.createSection({
        name: name.trim(),
        gradeLevelOrYear,
        academicYear,
        semester,
        room: room.trim() || 'TBA',
        description: description.trim() || undefined,
      });

      onSectionCreated(created);
      onClose();
      // Reset form
      setName('');
      setDescription('');
      setRoom('MV208');
    } catch (err: any) {
      setError(err?.message || 'Failed to create section. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0D1525] border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">
        {/* Glow corner */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#0284C7]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white tracking-tight">Create New Section</h2>
              <p className="text-xs text-slate-400">Register an academic cohort and set classroom schedule</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/60 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section Name */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Section Name / Cohort Code <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. BSIT - 21001, BSCS - 11002"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Year Level */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Year Level / Grade</label>
            <select
              value={gradeLevelOrYear}
              onChange={(e) => setGradeLevelOrYear(e.target.value)}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
            >
              {YEAR_LEVELS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          {/* Academic Year & Semester in 2-column row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Academic Year</span>
              </label>
              <input
                type="text"
                required
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                placeholder="2025-2026"
                className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Semester / Term</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
              >
                {SEMESTERS.map((sem) => (
                  <option key={sem} value={sem}>
                    {sem}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assigned Room */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-400" />
              <span>Assigned Room / Laboratory</span>
            </label>
            <input
              type="text"
              placeholder="e.g. MV208, Computer Lab 3, Online"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">
              Cohort Description / Notes <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Standard daytime lecture and laboratory cohort"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
            />
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-glow transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Registering Section...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Create Section</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
