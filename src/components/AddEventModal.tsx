import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Tag, BookOpen, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { CalendarEvent } from '../api/types';

interface AddEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialDate?: string;
  onEventCreated?: (event: CalendarEvent) => void;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({
  isOpen,
  onClose,
  initialDate,
  onEventCreated,
}) => {
  const { subjects, addEventLocal } = useData();
  const { success, error: toastError } = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<'exam' | 'holiday' | 'activity' | 'class'>('exam');
  const [date, setDate] = useState(initialDate || new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError('Event title is required');
      return;
    }
    if (!date) {
      setError('Event date is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const selectedSubject = subjects.find(s => s.id === subjectId);

    try {
      const res = await api.createEvent({
        title: cleanTitle,
        type,
        date,
        endDate: endDate.trim() || undefined,
        time: time.trim() || undefined,
        location: location.trim() || undefined,
        description: description.trim() || undefined,
        subjectId: selectedSubject?.id || undefined,
        subjectName: selectedSubject ? `${selectedSubject.code} - ${selectedSubject.name}` : undefined,
      });

      if (res && res.success && res.event) {
        addEventLocal(res.event);
        if (onEventCreated) onEventCreated(res.event);
        success(`Event "${cleanTitle}" added and synced to mobile app!`);
        onClose();
        // Reset form
        setTitle('');
        setDescription('');
        setTime('');
        setLocation('');
        setEndDate('');
      } else {
        setError('Failed to create event. Please try again.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickTypes = [
    { id: 'exam', label: 'Examination', icon: '📝', color: 'from-amber-500/20 to-orange-500/10 border-amber-500/40 text-amber-300' },
    { id: 'holiday', label: 'Holiday / Break', icon: '🎉', color: 'from-rose-500/20 to-red-500/10 border-rose-500/40 text-rose-300' },
    { id: 'activity', label: 'Campus Activity', icon: '🏆', color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/40 text-emerald-300' },
    { id: 'class', label: 'Special Class', icon: '📚', color: 'from-sky-500/20 to-blue-500/10 border-sky-500/40 text-sky-300' },
  ] as const;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#0B132B] border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-800/80 flex items-center justify-between bg-[#070D1F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0284C7]/20 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8]">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Add Calendar Event</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Syncs to Student App</span>
                </span>
              </h2>
              <p className="text-xs text-slate-400">Schedule examinations, holidays, and campus events.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Event Type selector */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-2">Event Category *</label>
            <div className="grid grid-cols-2 gap-2">
              {quickTypes.map((t) => {
                const isSelected = type === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setType(t.id)}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-xs font-bold text-left transition ${
                      isSelected
                        ? `bg-gradient-to-r ${t.color} border-current shadow-sm`
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="text-base">{t.icon}</span>
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Event Title */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Event Title *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Midterm Periodical Examination Week"
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] focus:ring-1 focus:ring-[#0284C7] transition"
            />
          </div>

          {/* Date Range (Start Date + End Date) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>Start Date *</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0284C7] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>End Date (Optional)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#0284C7] transition"
              />
            </div>
          </div>

          {/* Time & Location */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Time (Optional)</span>
              </label>
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="e.g. 08:00 AM - 12:00 PM"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] transition"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-rose-400" />
                <span>Location (Optional)</span>
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Lab 208 / Main Campus"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] transition"
              />
            </div>
          </div>

          {/* Subject Link (Optional) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Link to Subject (Optional)</span>
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#0284C7] transition"
            >
              <option value="">General (All Courses & Students)</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.code} - {sub.name} ({sub.sectionName || 'Section'})
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Description & Guidelines</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Instructions, guidelines, coverage, or holiday announcements..."
              className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] transition"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#0284C7] hover:bg-[#0369A1] disabled:opacity-50 text-white font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 shadow-glow transition"
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  <span>Saving & Syncing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publish & Sync Event</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
