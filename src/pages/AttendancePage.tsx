import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useData } from '../context/DataContext';
import { api } from '../api/client';
import { NavItem } from '../components/Sidebar';
import { parseNameParts } from './StudentsPage';
import {
  CalendarCheck,
  Check,
  Clock,
  X,
  HelpCircle,
  Search,
  Save,
  Loader2,
  Table,
  CheckCircle2,
  AlertCircle,
  Users,
  ChevronDown,
  Sparkles,
  Trash2,
  History,
} from 'lucide-react';

interface AttendancePageProps {
  initialSubjectId?: string;
  onNavigate?: (tab: NavItem, subjectId?: string) => void;
}

type AttendanceStatus = 'present' | 'late' | 'absent' | 'excused';

export const AttendancePage: React.FC<AttendancePageProps> = ({ initialSubjectId, onNavigate }) => {
  const { subjects, sections, students, refreshData } = useData();

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(initialSubjectId || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<'prelim' | 'midterm' | 'finals'>('prelim');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | AttendanceStatus>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Attendance status mapping: studentId -> status (Defaults to 'absent')
  const [attendanceMap, setAttendanceMap] = useState<Record<string, AttendanceStatus>>({});
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [savedRecordIds, setSavedRecordIds] = useState<string[]>([]);
  const [savedPeriodForDate, setSavedPeriodForDate] = useState<string | null>(null);
  const [recordedDates, setRecordedDates] = useState<Array<{ date: string; period: string; count: number }>>([]);

  const [isLoadingRecords, setIsLoadingRecords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDeleteDate, setConfirmDeleteDate] = useState<string | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const lastInitialSubjectIdRef = useRef<string | undefined>(undefined);
  const hasInitializedRef = useRef<boolean>(false);

  // Initialize selection when subjects or sections load
  useEffect(() => {
    if (subjects.length === 0 && sections.length === 0) return;

    // 1. If parent explicitly passed a NEW initialSubjectId that hasn't been applied yet
    if (initialSubjectId && initialSubjectId !== lastInitialSubjectIdRef.current) {
      lastInitialSubjectIdRef.current = initialSubjectId;
      hasInitializedRef.current = true;
      setSelectedSubjectId(initialSubjectId);
      const sub = subjects.find((s) => s.id === initialSubjectId);
      if (sub?.sectionId) {
        setSelectedSectionId(sub.sectionId);
      }
      return;
    }

    // 2. Default initialization on first mount
    if (!hasInitializedRef.current) {
      if (initialSubjectId) {
        lastInitialSubjectIdRef.current = initialSubjectId;
        hasInitializedRef.current = true;
        setSelectedSubjectId(initialSubjectId);
        const sub = subjects.find((s) => s.id === initialSubjectId);
        if (sub?.sectionId) {
          setSelectedSectionId(sub.sectionId);
        }
      } else if (sections.length > 0) {
        hasInitializedRef.current = true;
        setSelectedSectionId(sections[0].id);
        const secSubs = subjects.filter((s) => s.sectionId === sections[0].id);
        if (secSubs.length > 0) {
          setSelectedSubjectId(secSubs[0].id);
        } else if (subjects.length > 0) {
          setSelectedSubjectId(subjects[0].id);
        }
      } else if (subjects.length > 0) {
        hasInitializedRef.current = true;
        setSelectedSubjectId(subjects[0].id);
        if (subjects[0].sectionId) {
          setSelectedSectionId(subjects[0].sectionId);
        }
      }
    }
  }, [initialSubjectId, subjects, sections]);

  // The active section is whatever section is currently chosen
  const activeSectionId =
    selectedSectionId ||
    subjects.find((s) => s.id === selectedSubjectId)?.sectionId ||
    sections[0]?.id ||
    '';

  const activeSection = sections.find((sec) => sec.id === activeSectionId) || sections[0] || null;

  // Subjects taught in this active section only
  const availableSubjectsForSection = useMemo(() => {
    if (!activeSectionId) return [];
    return subjects.filter((s) => s.sectionId === activeSectionId);
  }, [subjects, activeSectionId]);

  // Active subject
  const activeSubject = useMemo(() => {
    if (availableSubjectsForSection.length === 0) return null;
    return (
      availableSubjectsForSection.find((s) => s.id === selectedSubjectId) ||
      availableSubjectsForSection[0]
    );
  }, [availableSubjectsForSection, selectedSubjectId]);

  // Section Change Handler
  const handleSectionChange = (newSecId: string) => {
    setSelectedSectionId(newSecId);
    const matchingSubjects = subjects.filter((s) => s.sectionId === newSecId);
    if (matchingSubjects.length > 0) {
      setSelectedSubjectId(matchingSubjects[0].id);
    } else {
      setSelectedSubjectId('');
    }
  };

  // Subject Change Handler
  const handleSubjectChange = (newSubId: string) => {
    setSelectedSubjectId(newSubId);
    const targetSub = subjects.find((s) => s.id === newSubId);
    if (targetSub?.sectionId && targetSub.sectionId !== activeSectionId) {
      setSelectedSectionId(targetSub.sectionId);
    }
  };

  // Students enrolled in this class/section
  const sectionStudents = useMemo(() => {
    if (!activeSectionId) return [];
    return students.filter(
      (s) =>
        s.sectionId === activeSectionId ||
        (s.sectionIds && s.sectionIds.includes(activeSectionId))
    );
  }, [students, activeSectionId]);

  // Load existing attendance records for selected subject & date + recorded dates summary
  useEffect(() => {
    if (!activeSubject?.id) return;

    let isMounted = true;
    setIsLoadingRecords(true);

    api
      .getSubjectAttendance(activeSubject.id, date)
      .then(async (res) => {
        if (!isMounted) return;

        const newMap: Record<string, AttendanceStatus> = {};
        const newNotes: Record<string, string> = {};
        const ids: string[] = [];
        let foundPeriod: string | null = null;

        if (res?.records && Array.isArray(res.records)) {
          res.records.forEach((rec) => {
            if (rec.id) ids.push(rec.id);
            if (!foundPeriod && rec.period) foundPeriod = rec.period;
            if (rec.student_id && rec.status) {
              newMap[rec.student_id] = rec.status;
              if (rec.note) newNotes[rec.student_id] = rec.note;
            }
          });
        }

        // Initialize any missing students to 'absent' by default
        sectionStudents.forEach((stud) => {
          if (!newMap[stud.id]) {
            newMap[stud.id] = 'absent';
          }
        });

        setAttendanceMap(newMap);
        setNotesMap(newNotes);
        setSavedRecordIds(ids);
        setSavedPeriodForDate(foundPeriod);

        if (Array.isArray(res?.recordedDates)) {
          setRecordedDates(res.recordedDates);
        } else {
          // Graceful fallback: derive recordedDates from full subject attendance
          try {
            const allSubjectAtt = await api.getSubjectAttendance(activeSubject.id);
            if (!isMounted) return;
            const dateMap = new Map<string, { date: string; period: string; count: number }>();
            (allSubjectAtt?.records || []).forEach((rec) => {
              if (!rec.date) return;
              const prev = dateMap.get(rec.date);
              if (prev) prev.count += 1;
              else dateMap.set(rec.date, { date: rec.date, period: rec.period || 'prelim', count: 1 });
            });
            setRecordedDates(
              Array.from(dateMap.values()).sort((a, b) => b.date.localeCompare(a.date))
            );
          } catch {}
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch attendance records:', err);
        const initialMap: Record<string, AttendanceStatus> = {};
        sectionStudents.forEach((stud) => {
          initialMap[stud.id] = 'absent';
        });
        setAttendanceMap(initialMap);
        setSavedRecordIds([]);
        setSavedPeriodForDate(null);
      })
      .finally(() => {
        if (isMounted) setIsLoadingRecords(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeSubject?.id, date, sectionStudents.length, reloadCounter]);

  // Filtered and Sorted students
  const processedStudents = useMemo(() => {
    const list = sectionStudents.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        (s.studentNumber && s.studentNumber.includes(search));
      if (!matchesSearch) return false;

      const current = attendanceMap[s.id] || 'absent';
      if (statusFilter !== 'all' && current !== statusFilter) return false;

      return true;
    });

    return list.sort((a, b) => {
      const pA = parseNameParts(a.name || '');
      const pB = parseNameParts(b.name || '');
      const cmp = pA.lastName.localeCompare(pB.lastName, undefined, { sensitivity: 'base' });
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [sectionStudents, search, statusFilter, sortOrder, attendanceMap]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let present = 0;
    let late = 0;
    let absent = 0;
    let excused = 0;

    sectionStudents.forEach((s) => {
      const status = attendanceMap[s.id] || 'absent';
      if (status === 'present') present++;
      else if (status === 'late') late++;
      else if (status === 'absent') absent++;
      else if (status === 'excused') excused++;
    });

    const total = sectionStudents.length;
    const effectivePresent = present + late * 0.5;
    const rate = total > 0 ? Math.round((effectivePresent / total) * 100) : 0;

    return { total, present, late, absent, excused, rate };
  }, [sectionStudents, attendanceMap]);

  const setStatus = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({ ...prev, [studentId]: status }));
  };

  // Mark all filtered students as Absent (Default)
  const handleMarkAllAbsent = () => {
    const nextMap = { ...attendanceMap };
    processedStudents.forEach((s) => {
      nextMap[s.id] = 'absent';
    });
    setAttendanceMap(nextMap);
  };

  // Mark all filtered students as Present
  const handleMarkAllPresent = () => {
    const nextMap = { ...attendanceMap };
    processedStudents.forEach((s) => {
      nextMap[s.id] = 'present';
    });
    setAttendanceMap(nextMap);
  };

  // Save Roll Call to Backend
  const handleSaveRollCall = async () => {
    if (!activeSubject) return;

    setIsSaving(true);
    setFeedback(null);

    const records = sectionStudents.map((stud) => ({
      subjectId: activeSubject.id,
      studentId: stud.id,
      date,
      period,
      status: attendanceMap[stud.id] || 'absent',
      note: notesMap[stud.id] || undefined,
    }));

    try {
      await api.saveAttendanceBatch(records);
      setReloadCounter((c) => c + 1);
      refreshData(true).catch(() => {});
      setFeedback({
        type: 'success',
        message: `Successfully saved roll call for ${records.length} students on ${date}.`,
      });
      setTimeout(() => setFeedback(null), 3500);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Failed to save attendance roll call to database.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Roll Call on Specific Date
  const handleConfirmDeleteRollCall = async () => {
    if (!activeSubject || !confirmDeleteDate) return;

    const targetDate = confirmDeleteDate;
    setIsDeleting(true);
    setFeedback(null);

    try {
      const res = await api.deleteAttendanceRollByDate(
        activeSubject.id,
        targetDate,
        targetDate === date ? savedRecordIds : []
      );
      setConfirmDeleteDate(null);

      // Update local state immediately
      setRecordedDates((prev) => prev.filter((item) => item.date !== targetDate));
      if (targetDate === date) {
        const resetMap: Record<string, AttendanceStatus> = {};
        sectionStudents.forEach((stud) => {
          resetMap[stud.id] = 'absent';
        });
        setAttendanceMap(resetMap);
        setNotesMap({});
        setSavedRecordIds([]);
        setSavedPeriodForDate(null);
      }

      setReloadCounter((c) => c + 1);
      refreshData(true).catch(() => {});

      setFeedback({
        type: 'success',
        message: `Deleted attendance roll for ${targetDate} (${res.deletedCount || 0} records removed).`,
      });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setConfirmDeleteDate(null);
      setFeedback({
        type: 'error',
        message: err?.message || `Failed to delete attendance roll for ${targetDate}.`,
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const hasSavedForSelectedDate =
    savedRecordIds.length > 0 || recordedDates.some((d) => d.date === date);

  return (
    <div className="space-y-6">
      {/* 1. Header & Subject / Section Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <CalendarCheck className="w-5 h-5 text-emerald-400" />
              <span>Attendance Roll Call</span>
            </h1>
            <span className="px-2.5 py-0.5 rounded-md bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8] text-xs font-black">
              {activeSubject?.code || 'IPT101'}
            </span>
            <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              Default: Absent
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Track daily student participation, tardiness, and verified RFID kiosk roll calls.
          </p>
        </div>

        {/* Section & Subject Selectors */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">Class / Section</label>
            <select
              value={activeSectionId}
              onChange={(e) => handleSectionChange(e.target.value)}
              className="bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7] max-w-[220px] truncate font-semibold cursor-pointer"
            >
              {sections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec.gradeLevelOrYear || '2nd Year'})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">Subject Course</label>
            <select
              value={activeSubject?.id || ''}
              onChange={(e) => handleSubjectChange(e.target.value)}
              disabled={availableSubjectsForSection.length === 0}
              className="bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#0284C7] max-w-[280px] truncate font-bold text-[#38BDF8] cursor-pointer disabled:opacity-50"
            >
              {availableSubjectsForSection.length === 0 ? (
                <option value="">No subjects in this section</option>
              ) : (
                availableSubjectsForSection.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.code} - {sub.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Quick jump to Gradebook */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold text-transparent block">Nav</label>
            <button
              onClick={() => onNavigate?.('gradebook', activeSubject?.id)}
              className="px-3 py-2 rounded-xl bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              title="Open Gradebook for this subject"
            >
              <Table className="w-3.5 h-3.5 text-sky-400" />
              <span>Gradebook</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-3 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-in fade-in duration-150 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="p-1 rounded text-slate-400 hover:text-white transition"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 2. KPI Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total Enrolled */}
        <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Enrolled Roster</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-white">{metrics.total}</span>
            <span className="text-[10px] text-slate-500 font-bold">Students</span>
          </div>
        </div>

        {/* Present */}
        <div className="bg-[#0D1525] border border-emerald-950/60 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-emerald-400">Present</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-emerald-400">{metrics.present}</span>
            <span className="text-[10px] text-emerald-500/70 font-bold">
              {metrics.total > 0 ? Math.round((metrics.present / metrics.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Late */}
        <div className="bg-[#0D1525] border border-amber-950/60 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-amber-400">Late</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-amber-400">{metrics.late}</span>
            <span className="text-[10px] text-amber-500/70 font-bold">
              {metrics.total > 0 ? Math.round((metrics.late / metrics.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Absent (Default) */}
        <div className="bg-[#0D1525] border border-rose-950/60 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-rose-400">Absent (Default)</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-rose-400">{metrics.absent}</span>
            <span className="text-[10px] text-rose-500/70 font-bold">
              {metrics.total > 0 ? Math.round((metrics.absent / metrics.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Excused */}
        <div className="bg-[#0D1525] border border-sky-950/60 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-sky-400">Excused</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-sky-400">{metrics.excused}</span>
            <span className="text-[10px] text-sky-500/70 font-bold">
              {metrics.total > 0 ? Math.round((metrics.excused / metrics.total) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* Attendance Rate */}
        <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-3 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-slate-400">Attendance Rate</span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-xl font-black text-white">{metrics.rate}%</span>
            <span className={`text-[10px] font-bold ${metrics.rate >= 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {metrics.rate >= 80 ? 'Good' : 'Needs Attn'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Session Controls & Bulk Actions Toolbar */}
      <div className="bg-[#0D1525] border border-slate-800 rounded-2xl p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Date, Period, Bulk Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Date Picker */}
            <div className="flex items-center gap-1.5 bg-[#111A2D] border border-slate-700/80 rounded-xl px-3 py-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Date:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="bg-transparent text-xs text-white focus:outline-none [color-scheme:dark]"
              />
            </div>

            {/* Period Selector */}
            <div className="flex items-center gap-1.5 bg-[#111A2D] border border-slate-700/80 rounded-xl px-3 py-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Period:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as any)}
                className="bg-transparent text-xs text-white font-bold capitalize focus:outline-none cursor-pointer"
              >
                <option value="prelim" className="bg-[#0D1525] text-white">Prelim</option>
                <option value="midterm" className="bg-[#0D1525] text-white">Midterm</option>
                <option value="finals" className="bg-[#0D1525] text-white">Finals</option>
              </select>
            </div>

            {/* Date Record Indicator */}
            {hasSavedForSelectedDate ? (
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold">
                Recorded ({savedRecordIds.length || recordedDates.find((d) => d.date === date)?.count || 0})
                {savedPeriodForDate ? ` • ${savedPeriodForDate}` : ''}
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-400 text-[11px] font-semibold">
                Not Recorded
              </span>
            )}

            <div className="h-5 w-px bg-slate-800 mx-1 hidden sm:block" />

            {/* Mark All as Absent Button (Highlighted as Default Action) */}
            <button
              onClick={handleMarkAllAbsent}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              title="Reset everyone to Absent"
            >
              <X className="w-3.5 h-3.5" />
              <span>Mark All as Absent (Default)</span>
            </button>

            {/* Mark All as Present Button */}
            <button
              onClick={handleMarkAllPresent}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Mark All Present</span>
            </button>
          </div>

          {/* Right: Delete Roll Call + Save Roll Call Buttons */}
          <div className="flex items-center gap-2.5">
            {hasSavedForSelectedDate && (
              <button
                type="button"
                onClick={() => setConfirmDeleteDate(date)}
                disabled={isDeleting || isSaving}
                className="px-3.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/40 font-bold text-xs flex items-center gap-1.5 transition disabled:opacity-50"
                title={`Delete all attendance records saved on ${date}`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Roll Call</span>
              </button>
            )}

            <button
              onClick={handleSaveRollCall}
              disabled={isSaving || isDeleting}
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-sky-500/20 transition disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Roll Call...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Roll Call</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Recorded Dates History Strip (quick jump or delete accidental date) */}
        {recordedDates.length > 0 && (
          <div className="pt-2.5 border-t border-slate-800/80 flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1.5 mr-1">
              <History className="w-3.5 h-3.5 text-sky-400" />
              <span>Saved Roll Dates ({recordedDates.length}):</span>
            </span>
            {recordedDates.map((item) => {
              const isSelected = item.date === date;
              return (
                <div
                  key={item.date}
                  className={`inline-flex items-center rounded-lg border text-[11px] transition ${
                    isSelected
                      ? 'bg-[#0284C7]/20 border-[#0284C7]/60 text-sky-300'
                      : 'bg-[#111A2D] border-slate-700/80 text-slate-300 hover:border-slate-500'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setDate(item.date)}
                    className="px-2.5 py-1 font-semibold flex items-center gap-1.5"
                    title={`View attendance on ${item.date}`}
                  >
                    <span className="font-mono">{item.date}</span>
                    <span className="text-[10px] opacity-75 capitalize">
                      ({item.period} • {item.count})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteDate(item.date)}
                    disabled={isDeleting}
                    className="pr-2 pl-1 py-1 text-slate-400 hover:text-rose-400 transition disabled:opacity-50"
                    title={`Delete roll call for ${item.date}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Filter & Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search student name or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7]"
          />
        </div>

        {/* Status Filter Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {(['all', 'present', 'late', 'absent', 'excused'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition border ${
                statusFilter === st
                  ? 'bg-[#0284C7] text-white border-[#0284C7]'
                  : 'bg-[#0D1525] text-slate-400 hover:text-white border-slate-800'
              }`}
            >
              {st}
            </button>
          ))}

          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value as 'asc' | 'desc')}
            className="bg-[#0D1525] border border-slate-800 rounded-xl py-1.5 px-2.5 text-xs text-white focus:outline-none focus:border-[#0284C7] ml-2"
          >
            <option value="asc">Last Name (A-Z)</option>
            <option value="desc">Last Name (Z-A)</option>
          </select>
        </div>
      </div>

      {/* 5. Student Roll Call Roster List */}
      <div className="bg-[#090E17] border border-slate-800/90 rounded-2xl overflow-hidden shadow-xl">
        {isLoadingRecords ? (
          <div className="py-16 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-[#0284C7]" />
            <span>Loading session attendance records...</span>
          </div>
        ) : !activeSubject ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No subjects assigned to this section yet. Add a subject or select a different class / section.
          </div>
        ) : processedStudents.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs">
            No students found in this class section matching your filters.
          </div>
        ) : (
          <div className="divide-y divide-slate-800/70">
            {processedStudents.map((stud, idx) => {
              // Defaults to 'absent'
              const current = attendanceMap[stud.id] || 'absent';
              const nameParts = parseNameParts(stud.name || '');

              return (
                <div
                  key={stud.id}
                  className="p-3.5 sm:px-5 flex flex-wrap items-center justify-between gap-4 hover:bg-[#111A2D]/40 transition"
                >
                  {/* Student Identity */}
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <span className="text-xs font-mono text-slate-500 w-6 text-right shrink-0">
                      {idx + 1}.
                    </span>

                    <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs overflow-hidden shrink-0">
                      {stud.avatar ? (
                        <img src={stud.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="font-bold text-sky-400 text-xs">
                          {nameParts.lastName.charAt(0) || stud.name.charAt(0)}
                        </span>
                      )}
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {nameParts.lastName ? `${nameParts.lastName}, ${nameParts.firstNames}` : stud.name}
                      </h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {stud.studentNumber || stud.id}
                      </span>
                    </div>
                  </div>

                  {/* 4-State Attendance Buttons */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Present */}
                    <button
                      type="button"
                      onClick={() => setStatus(stud.id, 'present')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        current === 'present'
                          ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Present</span>
                    </button>

                    {/* Late */}
                    <button
                      type="button"
                      onClick={() => setStatus(stud.id, 'late')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        current === 'late'
                          ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                          : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Late</span>
                    </button>

                    {/* Absent (Default) */}
                    <button
                      type="button"
                      onClick={() => setStatus(stud.id, 'absent')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        current === 'absent'
                          ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                          : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Absent</span>
                    </button>

                    {/* Excused */}
                    <button
                      type="button"
                      onClick={() => setStatus(stud.id, 'excused')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                        current === 'excused'
                          ? 'bg-[#0284C7] text-white shadow-md shadow-sky-500/20'
                          : 'bg-[#111A2D] text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Excused</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Roll Call Confirmation Modal */}
      {confirmDeleteDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-[#0D1525] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">Delete Attendance Roll Call</h3>
                  <p className="text-[11px] text-slate-400">
                    {activeSubject?.code} • {activeSection?.name || 'Class'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => !isDeleting && setConfirmDeleteDate(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete all attendance records saved on{' '}
                <span className="font-mono font-bold text-white bg-slate-800 px-1.5 py-0.5 rounded">
                  {confirmDeleteDate}
                </span>
                ?
              </p>
              <p className="text-[11px] text-rose-300/90 bg-rose-500/10 border border-rose-500/20 rounded-xl p-3">
                This will remove that date's roll call from the gradebook and student portals. You can re-record it anytime later if needed.
              </p>
            </div>

            <div className="px-5 py-4 bg-[#090E17] border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDeleteDate(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRollCall}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-rose-500/20 transition disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Roll Call</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
