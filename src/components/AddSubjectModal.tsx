import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { Section, GradingMatrixTemplate, ScheduleSession, Subject, Course } from '../api/types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import {
  X,
  BookOpen,
  Calendar,
  Clock,
  Layers,
  Sparkles,
  Sliders,
  MapPin,
  Laptop,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GraduationCap,
  Library,
} from 'lucide-react';

interface AddSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  sections: Section[];
  templates: GradingMatrixTemplate[];
  courses?: Course[];
  onSubjectCreated?: (subject: Subject) => void;
  onCourseCreated?: (course: Course) => void;
  initialSectionId?: string;
}

const DAYS_OF_WEEK = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

const TIME_OPTIONS = [
  '07:00 AM', '07:30 AM', '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
  '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM'
];

import { normalizeMatrixCategories } from '../utils/matrix';
export { normalizeMatrixCategories };

export const AddSubjectModal: React.FC<AddSubjectModalProps> = ({
  isOpen,
  onClose,
  sections,
  templates,
  courses: propCourses,
  onSubjectCreated,
  onCourseCreated,
  initialSectionId,
}) => {
  const { user } = useAuth();
  const { courses: contextCourses, addCourseLocal, addSubjectLocal } = useData();
  const safeSections = sections || [];
  const safeTemplates = templates || [];
  const availableCourses = propCourses || contextCourses || [];

  const isDean = user?.role === 'dean';

  // For Dean: allow toggle between adding a Curriculum Course or directly assigning a Subject offering
  const [deanMode, setDeanMode] = useState<'curriculum' | 'offering'>('curriculum');

  // Form fields
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [units, setUnits] = useState(3);
  const [templateId, setTemplateId] = useState('');

  // 2 Specific Sessions: 1 Face-to-Face and 1 Online
  const [f2fDay, setF2fDay] = useState('Monday');
  const [f2fStartTime, setF2fStartTime] = useState('08:00 AM');
  const [f2fEndTime, setF2fEndTime] = useState('10:00 AM');
  const [f2fRoom, setF2fRoom] = useState('MV208');

  const [onlineDay, setOnlineDay] = useState('Wednesday');
  const [onlineStartTime, setOnlineStartTime] = useState('01:00 PM');
  const [onlineEndTime, setOnlineEndTime] = useState('03:00 PM');
  const [onlineMeetingUrl, setOnlineMeetingUrl] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set default section
  useEffect(() => {
    if (initialSectionId) {
      setSectionId(initialSectionId);
    } else if (safeSections.length > 0 && !sectionId) {
      setSectionId(safeSections[0].id);
    }
  }, [initialSectionId, safeSections, sectionId]);

  // Set default grading matrix template
  useEffect(() => {
    if (safeTemplates.length > 0 && !templateId) {
      const defaultTmpl = safeTemplates.find((t) => t.isDefault || t.is_default) || safeTemplates[0];
      if (defaultTmpl) {
        setTemplateId(defaultTmpl.id);
      }
    }
  }, [safeTemplates, templateId]);

  // Auto-fill room based on selected section
  useEffect(() => {
    const sec = safeSections.find((s) => s.id === sectionId);
    if (sec?.room) {
      setF2fRoom(sec.room);
    }
  }, [sectionId, safeSections]);

  // Reset or initialize modal state when opened
  useEffect(() => {
    if (isOpen) {
      setError(null);
      if (isDean) {
        setDeanMode('curriculum');
      } else {
        setDeanMode('offering');
      }
    }
  }, [isOpen, isDean]);

  // When faculty selects a course from Dean's Curriculum Catalog
  const handleSelectCatalogCourse = (courseId: string) => {
    setSelectedCourseId(courseId);
    if (!courseId || courseId === 'manual') {
      return;
    }
    const found = availableCourses.find((c) => c.id === courseId);
    if (found) {
      setName(found.name);
      setCode(found.code);
      setUnits(found.units || 3);
      if (found.gradingMatrixTemplateId) {
        setTemplateId(found.gradingMatrixTemplateId);
      }
    }
  };

  if (!isOpen) return null;

  const selectedTemplate = safeTemplates.find((t) => t.id === templateId) || safeTemplates[0];
  const templateCategories = normalizeMatrixCategories(selectedTemplate?.matrix);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a course title.');
      return;
    }
    if (!code.trim()) {
      setError('Please provide a course code (e.g. IPT101 or CS-301).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // If Dean mode is 'curriculum', create a master course in Dean's catalog
      if (isDean && deanMode === 'curriculum') {
        const newCourse = await api.createCourse({
          name: name.trim(),
          code: code.trim().toUpperCase(),
          units: Number(units) || 3,
          passingGrade: selectedTemplate?.passingGrade ?? selectedTemplate?.passing_grade ?? 75,
          gradingMatrixTemplateId: templateId || undefined,
          matrix: templateCategories.length > 0 ? templateCategories : undefined,
          department: user?.department || 'College of Information Technology',
        });

        addCourseLocal(newCourse);
        if (onCourseCreated) {
          onCourseCreated(newCourse);
        }

        setName('');
        setCode('');
        setSelectedCourseId('');
        onClose();
        return;
      }

      // Otherwise, create a subject offering for the selected section
      if (!sectionId) {
        setError('Please select a target class / section.');
        setIsSubmitting(false);
        return;
      }

      const scheduleSessions: ScheduleSession[] = [
        {
          mode: 'f2f',
          day: f2fDay,
          startTime: f2fStartTime,
          endTime: f2fEndTime,
          room: f2fRoom.trim() || 'MV208',
        },
        {
          mode: 'online',
          day: onlineDay,
          startTime: onlineStartTime,
          endTime: onlineEndTime,
          meetingUrl: onlineMeetingUrl.trim() || undefined,
        },
      ];

      const newSubject = await api.createSubject({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        sectionId,
        units: Number(units) || 3,
        passingGrade: selectedTemplate?.passingGrade ?? selectedTemplate?.passing_grade ?? 75,
        schedule: scheduleSessions,
        gradingMatrixTemplateId: templateId || undefined,
        matrix: templateCategories.length > 0 ? templateCategories : undefined,
      });

      addSubjectLocal(newSubject);
      if (onSubjectCreated) {
        onSubjectCreated(newSubject);
      }

      setName('');
      setCode('');
      setSelectedCourseId('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save. Please verify your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isCreatingCurriculum = isDean && deanMode === 'curriculum';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0D1525] border border-slate-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-8">
        {/* Header */}
        <div className="flex items-start justify-between p-6 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
              {isCreatingCurriculum ? (
                <>
                  <GraduationCap className="w-5 h-5 text-[#0284C7]" />
                  <span>Create Curriculum Course</span>
                </>
              ) : (
                <>
                  <BookOpen className="w-5 h-5 text-[#0284C7]" />
                  <span>Add Subject Offering</span>
                </>
              )}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {isCreatingCurriculum
                ? 'Create a standardized course in the curriculum catalog. Faculty can then choose this course and set their section schedules.'
                : 'Select a course from the Dean’s Curriculum Catalog, choose your class section, and set weekly schedule sessions.'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dean Tab Switcher (if user is Dean) */}
        {isDean && (
          <div className="flex border-b border-slate-800/80 bg-[#090E17]/60 px-6 pt-3 gap-2">
            <button
              type="button"
              onClick={() => setDeanMode('curriculum')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                deanMode === 'curriculum'
                  ? 'border-[#0284C7] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Library className="w-4 h-4 text-[#0284C7]" />
              <span>Curriculum Course Catalog (Master Course)</span>
            </button>
            <button
              type="button"
              onClick={() => setDeanMode('offering')}
              className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition flex items-center gap-2 ${
                deanMode === 'offering'
                  ? 'border-[#0284C7] text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-4 h-4 text-[#38BDF8]" />
              <span>Section Offering (With Schedule)</span>
            </button>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Faculty Mode: Course Catalog Selector */}
          {!isCreatingCurriculum && (
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-[#111A2D]/80 border border-slate-700/60">
              <label className="text-xs font-bold text-white flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Library className="w-4 h-4 text-[#0284C7]" />
                  <span>Select Course from Dean's Catalog</span>
                </span>
                <span className="text-[10px] text-sky-400 font-semibold bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded-md">
                  Pre-configured
                </span>
              </label>
              <select
                value={selectedCourseId}
                onChange={(e) => handleSelectCatalogCourse(e.target.value)}
                className="w-full bg-[#0D1525] border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
              >
                <option value="">-- Choose from Curriculum Courses --</option>
                {availableCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name} ({c.units || 3} Units)
                  </option>
                ))}
                <option value="manual">+ Enter Custom Course (Manual)</option>
              </select>
              <p className="text-[11px] text-slate-400">
                Choosing a curriculum course auto-fills the Title, Code, Credit Units, and Grading Matrix criteria.
              </p>
            </div>
          )}

          {/* Row 1: Course Title & Course Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Course Title</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Integrative Programming Technologies"
                className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Course Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. IPT101"
                className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-slate-500 uppercase font-bold focus:outline-none focus:border-[#0284C7]"
              />
            </div>
          </div>

          {/* Row 2: Target Section & Credit Units (Only if offering) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {!isCreatingCurriculum ? (
              <>
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Target Class / Section</label>
                  <select
                    value={sectionId}
                    onChange={(e) => setSectionId(e.target.value)}
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                  >
                    {safeSections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name} ({sec.gradeLevelOrYear || '2nd Year College'})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Credit Units</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={units}
                    onChange={(e) => setUnits(Number(e.target.value))}
                    className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                  />
                </div>
              </>
            ) : (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Credit Units</label>
                <input
                  type="number"
                  min={1}
                  max={6}
                  value={units}
                  onChange={(e) => setUnits(Number(e.target.value))}
                  className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3.5 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                />
              </div>
            )}
          </div>

          {/* Schedule Sessions: Only for Offering (Faculty or Dean offering mode) */}
          {!isCreatingCurriculum && (
            <div className="space-y-2.5 pt-2 border-t border-slate-800/80">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-[#0284C7]" />
                  <span className="text-xs font-bold text-white">Class Schedule Sessions</span>
                </div>
                <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60 font-semibold">
                  2 Sessions (1 Face-to-Face & 1 Online)
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Session 1: Face to Face */}
                <div className="bg-[#111A2D]/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-xs font-black text-white">Face-to-Face (F2F)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      On-Campus
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Day of the Week</label>
                    <select
                      value={f2fDay}
                      onChange={(e) => setF2fDay(e.target.value)}
                      className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Start Time</label>
                      <select
                        value={f2fStartTime}
                        onChange={(e) => setF2fStartTime(e.target.value)}
                        className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">End Time</label>
                      <select
                        value={f2fEndTime}
                        onChange={(e) => setF2fEndTime(e.target.value)}
                        className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Assigned Room</label>
                    <input
                      type="text"
                      value={f2fRoom}
                      onChange={(e) => setF2fRoom(e.target.value)}
                      placeholder="e.g. MV208"
                      className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </div>

                {/* Session 2: Online */}
                <div className="bg-[#111A2D]/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span className="text-xs font-black text-white">Online (Virtual)</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded-full">
                      Remote Class
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-slate-400">Day of the Week</label>
                    <select
                      value={onlineDay}
                      onChange={(e) => setOnlineDay(e.target.value)}
                      className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                    >
                      {DAYS_OF_WEEK.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">Start Time</label>
                      <select
                        value={onlineStartTime}
                        onChange={(e) => setOnlineStartTime(e.target.value)}
                        className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-slate-400">End Time</label>
                      <select
                        value={onlineEndTime}
                        onChange={(e) => setOnlineEndTime(e.target.value)}
                        className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-1.5 px-2 text-xs text-white focus:outline-none focus:border-[#0284C7]"
                      >
                        {TIME_OPTIONS.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-slate-400">Meeting Link (Optional)</label>
                    <input
                      type="text"
                      value={onlineMeetingUrl}
                      onChange={(e) => setOnlineMeetingUrl(e.target.value)}
                      placeholder="https://meet.google.com/..."
                      className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-1.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Grading Matrix Template Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800/80">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Grading Matrix Template</span>
              {selectedTemplate && (
                <span className="text-[11px] text-[#38BDF8] font-semibold">
                  Passing Threshold: {selectedTemplate.passingGrade ?? selectedTemplate.passing_grade ?? 75}%
                </span>
              )}
            </label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="w-full bg-[#111A2D] border border-slate-700/80 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7]"
            >
              {safeTemplates.map((tmpl) => (
                <option key={tmpl.id} value={tmpl.id}>
                  {tmpl.name} (Passing: {tmpl.passingGrade ?? tmpl.passing_grade ?? 75}%)
                </option>
              ))}
            </select>

            {/* Matrix Criteria Breakdown Pill Preview */}
            {templateCategories.length > 0 && (
              <div className="p-3 bg-[#111A2D]/50 rounded-xl border border-slate-800/80">
                <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[#38BDF8]" />
                  <span>Template Distribution Preview</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {templateCategories.map((cat, idx) => (
                    <span
                      key={cat.id || idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs font-semibold flex items-center gap-1.5"
                    >
                      <span>{cat.name}</span>
                      <strong className="text-[#38BDF8]">{cat.weight}%</strong>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
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
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isCreatingCurriculum ? 'Saving Course...' : 'Creating Subject...'}</span>
                </>
              ) : (
                <span>{isCreatingCurriculum ? 'Create Course in Catalog' : 'Create Subject Offering'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
