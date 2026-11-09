import React from 'react';
import { Section, Subject } from '../api/types';
import { normalizeMatrixCategories } from '../utils/matrix';
import { Users, BookOpen, Clock, ArrowRight, Upload } from 'lucide-react';

interface ClassSectionCardProps {
  section: Section;
  subjects: Subject[];
  onOpenGradebook: (subjectId: string) => void;
  onUploadRoster?: (sectionId: string) => void;
}

export const ClassSectionCard: React.FC<ClassSectionCardProps> = ({
  section,
  subjects,
  onOpenGradebook,
  onUploadRoster,
}) => {
  return (
    <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl p-5 mb-4 shadow-sm hover:border-slate-700 transition">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-black text-white tracking-wide">
            {section.name}
          </h3>
          <span className="px-2.5 py-0.5 rounded-full bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8] text-[11px] font-bold">
            {section.gradeLevelOrYear || '2nd Year College'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            <span>{section.academicYear || '2025-2026'}</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            <span>{section.studentCount ?? 0} Students</span>
          </div>
          <span className="text-slate-700">•</span>
          <div className="flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>{subjects.length} Course{subjects.length === 1 ? '' : 's'}</span>
          </div>

          {onUploadRoster && (
            <button
              onClick={() => onUploadRoster(section.id)}
              className="ml-2 px-2.5 py-1 rounded-lg bg-[#111A2D] hover:bg-slate-800 border border-slate-700/80 text-white text-[11px] font-semibold flex items-center gap-1.5 transition"
            >
              <Upload className="w-3 h-3 text-slate-300" />
              <span>Upload Roster</span>
            </button>
          )}
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {subjects.map((sub) => {
          const scheduleText = (() => {
            if (!sub.schedule || sub.schedule.length === 0) return 'TBA Schedule';
            const f2f = sub.schedule.find((s) => s.mode === 'f2f');
            const online = sub.schedule.find((s) => s.mode === 'online');
            if (f2f && online) {
              return `${f2f.day.slice(0, 3)} ${f2f.startTime}-${f2f.endTime} (F2F) • ${online.day.slice(0, 3)} ${online.startTime}-${online.endTime} (Online)`;
            }
            return sub.schedule
              .map((s) => `${s.day.slice(0, 3)} ${s.startTime}-${s.endTime} (${s.mode === 'online' ? 'Online' : 'F2F'})`)
              .join(' • ');
          })();

          const matrixCount = normalizeMatrixCategories(sub.matrix).length || 3;

          return (
            <div
              key={sub.id}
              className="bg-[#111A2D] border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between hover:border-[#0284C7]/40 transition group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-black text-[#0EA5E9] tracking-wider">
                    {sub.code}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60">
                    {matrixCount} Matrix Items
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-[#38BDF8] transition truncate">
                  {sub.name}
                </h4>
              </div>

              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/60 text-[11px]">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span className="truncate">{scheduleText}</span>
                </div>
                <button
                  onClick={() => onOpenGradebook(sub.id)}
                  className="flex items-center gap-1 text-[#0EA5E9] hover:text-[#38BDF8] font-bold transition ml-2 shrink-0"
                >
                  <span>Gradebook</span>
                  <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
