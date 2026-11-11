import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  MapPin,
  Tag,
  Trash2,
  AlertCircle,
  Sparkles,
  BookOpen,
  Award,
  PartyPopper,
  CheckCircle2,
  CalendarCheck,
  Search,
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { api } from '../api/client';
import { CalendarEvent } from '../api/types';
import { AddEventModal } from '../components/AddEventModal';

export const CalendarPage: React.FC = () => {
  const { events, removeEventLocal } = useData();
  const { success, error: toastError, info } = useToast();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'exam' | 'holiday' | 'activity'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDayEvents, setSelectedDayEvents] = useState<{ date: string; events: CalendarEvent[] } | null>(null);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<CalendarEvent | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Filter events by selected category
  const filteredEvents = useMemo(() => {
    if (selectedCategory === 'all') return events;
    return events.filter(e => e.type === selectedCategory);
  }, [events, selectedCategory]);

  // Map events by date (YYYY-MM-DD)
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const evt of filteredEvents) {
      const d = evt.date;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(evt);
    }
    return map;
  }, [filteredEvents]);

  // Calendar calculations
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const todayIso = new Date().toISOString().slice(0, 10);

  // Generate calendar cells (6 rows x 7 cols = 42 slots)
  const calendarDays = useMemo(() => {
    const days: Array<{
      dayNum: number;
      isCurrentMonth: boolean;
      isoDate: string;
      isToday: boolean;
      dayEvents: CalendarEvent[];
    }> = [];

    // Previous month padding
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dNum = daysInPrevMonth - i;
      const prevMonthIdx = month === 0 ? 11 : month - 1;
      const prevYearNum = month === 0 ? year - 1 : year;
      const iso = `${prevYearNum}-${String(prevMonthIdx + 1).padStart(2, '0')}-${String(dNum).padStart(2, '0')}`;
      days.push({
        dayNum: dNum,
        isCurrentMonth: false,
        isoDate: iso,
        isToday: iso === todayIso,
        dayEvents: eventsByDate.get(iso) || [],
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        isCurrentMonth: true,
        isoDate: iso,
        isToday: iso === todayIso,
        dayEvents: eventsByDate.get(iso) || [],
      });
    }

    // Next month padding to fill grid
    const remainingSlots = 42 - days.length;
    for (let d = 1; d <= remainingSlots; d++) {
      const nextMonthIdx = month === 11 ? 0 : month + 1;
      const nextYearNum = month === 11 ? year + 1 : year;
      const iso = `${nextYearNum}-${String(nextMonthIdx + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        dayNum: d,
        isCurrentMonth: false,
        isoDate: iso,
        isToday: iso === todayIso,
        dayEvents: eventsByDate.get(iso) || [],
      });
    }

    return days;
  }, [year, month, firstDayOfWeek, daysInMonth, daysInPrevMonth, todayIso, eventsByDate]);

  // Upcoming events (today and future)
  const upcomingEvents = useMemo(() => {
    return events
      .filter(e => e.date >= todayIso)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 6);
  }, [events, todayIso]);

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This will also remove it from the Student Mobile app.`)) {
      return;
    }

    setIsDeletingId(id);
    try {
      await api.deleteEvent(id);
      removeEventLocal(id);
      info(`Event "${title}" deleted`);
      if (selectedEventForDetail?.id === id) {
        setSelectedEventForDetail(null);
      }
    } catch (err: any) {
      toastError(err?.message || 'Failed to delete event');
    } finally {
      setIsDeletingId(null);
    }
  };

  const getEventBadgeStyle = (type: string) => {
    switch (type) {
      case 'exam':
        return 'bg-amber-500/15 border-amber-500/40 text-amber-300';
      case 'holiday':
        return 'bg-rose-500/15 border-rose-500/40 text-rose-300';
      case 'activity':
        return 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300';
      default:
        return 'bg-sky-500/15 border-sky-500/40 text-sky-300';
    }
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <Award className="w-3 h-3 text-amber-400 shrink-0" />;
      case 'holiday':
        return <PartyPopper className="w-3 h-3 text-rose-400 shrink-0" />;
      case 'activity':
        return <CalendarCheck className="w-3 h-3 text-emerald-400 shrink-0" />;
      default:
        return <BookOpen className="w-3 h-3 text-sky-400 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#0284C7]/10 to-transparent pointer-events-none" />

        <div className="relative z-10 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#090E17] border-2 border-[#0EA5E9] flex items-center justify-center text-2xl font-black text-[#38BDF8] shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            <CalendarIcon className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Academic & Event Calendar</h1>
              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Syncs with Student Mobile App</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Schedule midterm/finals examination schedules, official holidays, and campus activities. All published dates sync directly with student mobile timetables and push notifications.
            </p>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event to Calendar</span>
          </button>
        </div>
      </div>

      {/* 2. Main Grid: Calendar View (Left 8 cols) | Upcoming & Details (Right 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Interactive Monthly Calendar (~68%) */}
        <div className="lg:col-span-8 bg-[#0D1525] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            {/* Month Navigator */}
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight min-w-[180px]">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-xl p-1">
                <button
                  onClick={prevMonth}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={goToToday}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                >
                  Today
                </button>
                <button
                  onClick={nextMonth}
                  className="w-7 h-7 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { id: 'all', label: 'All' },
                { id: 'exam', label: 'Exams' },
                { id: 'holiday', label: 'Holidays' },
                { id: 'activity', label: 'Activities' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition border ${
                    selectedCategory === cat.id
                      ? 'bg-[#0284C7] border-[#0284C7] text-white shadow-glow'
                      : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[11px] text-slate-400 py-1">
            <span className="text-rose-400">Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span className="text-sky-400">Sat</span>
          </div>

          {/* 42 Calendar Day Cells */}
          <div className="grid grid-cols-7 gap-1.5">
            {calendarDays.map((cell, idx) => {
              const hasEvents = cell.dayEvents.length > 0;
              return (
                <div
                  key={`${cell.isoDate}-${idx}`}
                  onClick={() => {
                    if (hasEvents) {
                      setSelectedDayEvents({ date: cell.isoDate, events: cell.dayEvents });
                    }
                  }}
                  className={`min-h-[92px] p-2 rounded-xl border flex flex-col justify-between transition group relative ${
                    cell.isToday
                      ? 'bg-[#0284C7]/15 border-[#0284C7] ring-1 ring-[#0284C7]/50'
                      : cell.isCurrentMonth
                      ? 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80'
                      : 'bg-slate-950/40 border-slate-900/60 text-slate-600'
                  } ${hasEvents ? 'cursor-pointer' : ''}`}
                >
                  {/* Day header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-black ${
                        cell.isToday
                          ? 'w-6 h-6 rounded-full bg-[#0284C7] text-white flex items-center justify-center -ml-1 -mt-1 shadow-sm'
                          : cell.isCurrentMonth
                          ? 'text-slate-200'
                          : 'text-slate-600'
                      }`}
                    >
                      {cell.dayNum}
                    </span>

                    {cell.dayEvents.length > 0 && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-400">
                        {cell.dayEvents.length}
                      </span>
                    )}
                  </div>

                  {/* Event Badges List */}
                  <div className="space-y-1 my-1 overflow-hidden">
                    {cell.dayEvents.slice(0, 2).map((evt) => (
                      <div
                        key={evt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEventForDetail(evt);
                        }}
                        className={`px-1.5 py-0.5 rounded-lg border text-[10px] font-bold truncate flex items-center gap-1 transition hover:scale-[1.02] ${getEventBadgeStyle(
                          evt.type
                        )}`}
                        title={evt.title}
                      >
                        {getEventIcon(evt.type)}
                        <span className="truncate">{evt.title}</span>
                      </div>
                    ))}
                    {cell.dayEvents.length > 2 && (
                      <div className="text-[9px] font-bold text-slate-400 pl-1">
                        +{cell.dayEvents.length - 2} more
                      </div>
                    )}
                  </div>

                  {/* Empty state bottom spacer */}
                  <div />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Upcoming Events & Event Detail (~32%) */}
        <div className="lg:col-span-4 space-y-5">
          {/* Selected Event Details Card */}
          {selectedEventForDetail ? (
            <div className="bg-[#0D1525] border border-[#0284C7]/40 rounded-2xl p-5 shadow-glow space-y-3 relative">
              <div className="flex items-center justify-between">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${getEventBadgeStyle(selectedEventForDetail.type)}`}>
                  {selectedEventForDetail.type}
                </span>
                <button
                  onClick={() => setSelectedEventForDetail(null)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  ✕ Close
                </button>
              </div>

              <h3 className="text-base font-black text-white leading-snug">
                {selectedEventForDetail.title}
              </h3>

              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-3.5 h-3.5 text-[#38BDF8]" />
                  <span>
                    {selectedEventForDetail.date}
                    {selectedEventForDetail.endDate ? ` to ${selectedEventForDetail.endDate}` : ''}
                  </span>
                </div>

                {selectedEventForDetail.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{selectedEventForDetail.time}</span>
                  </div>
                )}

                {selectedEventForDetail.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-rose-400" />
                    <span>{selectedEventForDetail.location}</span>
                  </div>
                )}

                {selectedEventForDetail.subjectName && (
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{selectedEventForDetail.subjectName}</span>
                  </div>
                )}
              </div>

              {selectedEventForDetail.description && (
                <p className="text-xs text-slate-400 bg-slate-900/60 border border-slate-800 p-2.5 rounded-xl leading-relaxed">
                  {selectedEventForDetail.description}
                </p>
              )}

              <div className="pt-2 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => handleDeleteEvent(selectedEventForDetail.id, selectedEventForDetail.title)}
                  disabled={isDeletingId === selectedEventForDetail.id}
                  className="text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isDeletingId === selectedEventForDetail.id ? 'Deleting...' : 'Delete Event'}</span>
                </button>
              </div>
            </div>
          ) : null}

          {/* Upcoming Schedule Card */}
          <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Upcoming Academic Events</h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                {upcomingEvents.length} events
              </span>
            </div>

            {upcomingEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No upcoming events recorded yet. Click "Add Event" to schedule exams, holidays, or activities!
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingEvents.map((evt) => {
                  const isToday = evt.date === todayIso;
                  return (
                    <div
                      key={evt.id}
                      onClick={() => setSelectedEventForDetail(evt)}
                      className={`p-3 rounded-xl border transition cursor-pointer hover:border-slate-700 ${
                        isToday ? 'bg-[#0284C7]/10 border-[#0284C7]/40' : 'bg-slate-900/60 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full border uppercase ${getEventBadgeStyle(evt.type)}`}>
                          {evt.type}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">
                          {isToday ? (
                            <span className="text-emerald-400 font-bold">● Today</span>
                          ) : (
                            evt.date
                          )}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-white leading-tight mb-1">
                        {evt.title}
                      </h4>
                      {evt.time && (
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{evt.time}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Event Modal */}
      <AddEventModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
};
