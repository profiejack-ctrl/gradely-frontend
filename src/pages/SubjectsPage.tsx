import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Subject, Section, ScheduleSession, Course } from '../api/types';
import { api } from '../api/client';
import { NavItem } from '../components/Sidebar';
import {
  Sliders,
  BookOpen,
  Plus,
  Globe,
  Clock,
  Sparkles,
  Layers,
  Edit3,
  Trash2,
  Calendar,
  CheckCircle2,
  UserCheck,
  ChevronDown,
  ArrowRight,
  ClipboardList,
  GraduationCap,
  Library,
} from 'lucide-react';
import { AddSubjectModal } from '../components/AddSubjectModal';
import { normalizeMatrixCategories } from '../utils/matrix';
import { GlobalTemplatesModal } from '../components/GlobalTemplatesModal';

interface SubjectsPageProps {
  onNavigate?: (tab: NavItem, subjectId?: string) => void;
}

export const SubjectsPage: React.FC<SubjectsPageProps> = ({ onNavigate }) => {
  const {
    subjects,
    sections,
    courses,
    templates,
    addSubjectLocal,
    removeSubjectLocal,
    removeCourseLocal,
    addTemplateLocal,
    removeTemplateLocal,
    applyTemplateGloballyLocal,
  } = useData();
  const { user } = useAuth();
  const isDean = user?.role === 'dean';

  // Tabs for Dean: 'curriculum' or 'offerings'
  const [activeTab, setActiveTab] = useState<'curriculum' | 'offerings'>(isDean ? 'curriculum' : 'offerings');
  const [selectedSectionFilter, setSelectedSectionFilter] = useState('all');
  const [isAddSubjectOpen, setIsAddSubjectOpen] = useState(false);
  const [isGlobalTemplatesOpen, setIsGlobalTemplatesOpen] = useState(false);

  // Filter subjects by section
  const filteredSubjects = subjects.filter(
    (s) => selectedSectionFilter === 'all' || s.sectionId === selectedSectionFilter
  );

  // Section lookup map
  const sectionMap = new Map(sections.map((sec) => [sec.id, sec.name]));

  // Template lookup map
  const templateMap = new Map(templates.map((t) => [t.id, t]));

  // Format schedule display
  const formatScheduleDisplay = (sessions: ScheduleSession[] | undefined) => {
    if (!sessions || sessions.length === 0) return 'TBA Schedule';

    const f2f = sessions.find((s) => s.mode === 'f2f');
    const online = sessions.find((s) => s.mode === 'online');

    if (f2f && online) {
      return `${f2f.day.slice(0, 3)} ${f2f.startTime} - ${f2f.endTime} / ${online.day.slice(0, 3)} ${online.startTime} - ${online.endTime}`;
    }

    return sessions
      .map((s) => `${s.day.slice(0, 3)} ${s.startTime} - ${s.endTime}`)
      .join(' • ');
  };

  const handleDeleteSubject = async (subjectId: string, subjectName: string) => {
    if (!window.confirm(`Are you sure you want to delete course offering "${subjectName}"?`)) {
      return;
    }

    try {
      await api.deleteSubject(subjectId);
      removeSubjectLocal(subjectId);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete course offering.');
    }
  };

  const handleDeleteCourse = async (courseId: string, courseName: string) => {
    if (!window.confirm(`Are you sure you want to delete "${courseName}" from the Dean's Curriculum Catalog?`)) {
      return;
    }

    try {
      await api.deleteCourse(courseId);
      removeCourseLocal(courseId);
    } catch (err: any) {
      alert(err?.message || 'Failed to delete course from catalog.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-[#38BDF8]" />
            <span>Subjects & Curriculum Matrix</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isDean
              ? 'Manage curriculum courses, section offerings, and customize grading percentage matrices.'
              : 'View assigned course subjects, schedule sessions, and access class gradebooks.'}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Section Filter Dropdown (visible in offerings view) */}
          {activeTab === 'offerings' && (
            <div className="relative">
              <select
                value={selectedSectionFilter}
                onChange={(e) => setSelectedSectionFilter(e.target.value)}
                className="bg-[#0D1525] border border-slate-700/80 rounded-xl py-2 pl-3 pr-8 text-xs text-white appearance-none focus:outline-none focus:border-[#0284C7] cursor-pointer"
              >
                <option value="all">All Classes / Sections</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Global Templates Button */}
          <button
            onClick={() => setIsGlobalTemplatesOpen(true)}
            className="bg-[#0D1525] hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Globe className="w-4 h-4 text-[#38BDF8]" />
            <span>Grading Templates</span>
          </button>

          {/* Add Subject / Add Course Button */}
          <button
            onClick={() => setIsAddSubjectOpen(true)}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isDean && activeTab === 'curriculum' ? 'Add Curriculum Course' : 'Add Subject'}</span>
          </button>
        </div>
      </div>

      {/* Tabs for Dean */}
      {isDean && (
        <div className="flex border-b border-slate-800 gap-4">
          <button
            onClick={() => setActiveTab('curriculum')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'curriculum'
                ? 'border-[#0284C7] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Library className="w-4 h-4 text-[#0284C7]" />
            <span>Curriculum Courses Catalog</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700">
              {courses.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('offerings')}
            className={`pb-3 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'offerings'
                ? 'border-[#0284C7] text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-[#38BDF8]" />
            <span>Section Subject Offerings</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-800 text-[10px] text-slate-300 font-bold border border-slate-700">
              {filteredSubjects.length}
            </span>
          </button>
        </div>
      )}

      {/* TAB 1: CURRICULUM COURSES CATALOG (Dean View) */}
      {isDean && activeTab === 'curriculum' && (
        <div>
          {courses.length === 0 ? (
            <div className="bg-[#0D1525] border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mb-3 text-slate-500">
                <Library className="w-6 h-6 text-[#0284C7]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">No Curriculum Courses Defined Yet</h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                Create standardized curriculum courses (e.g. IPT101, CS301). Faculty can then select them when scheduling their classes without re-entering course details each time.
              </p>
              <button
                onClick={() => setIsAddSubjectOpen(true)}
                className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Curriculum Course</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((c) => {
                const tmpl = c.gradingMatrixTemplateId ? templateMap.get(c.gradingMatrixTemplateId) : null;
                const rawMatrix = normalizeMatrixCategories(c.matrix || tmpl?.matrix);
                const matrixCats = rawMatrix.length > 0 ? rawMatrix : [
                  { id: '1', name: 'Class Standing', weight: 40 },
                  { id: '2', name: 'Project (CBO)', weight: 25 },
                  { id: '3', name: 'Examination (WE)', weight: 35 },
                ];

                return (
                  <div
                    key={c.id}
                    className="bg-[#0D1525] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700/90 transition flex flex-col justify-between shadow-sm relative group"
                  >
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-black text-xs">
                            {c.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700/60">
                            {c.units || 3} Units
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-[#38BDF8] font-bold text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                            Pass: {c.passingGrade || tmpl?.passingGrade || 75}%
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteCourse(c.id, c.name)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition"
                          title="Delete Course from Catalog"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-base font-black text-white tracking-tight mb-2">
                        {c.name}
                      </h3>

                      {c.department && (
                        <p className="text-[11px] text-slate-400 mb-3">{c.department}</p>
                      )}

                      {/* Matrix Breakdown */}
                      <div className="pt-3 border-t border-slate-800/80">
                        <div className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                          <span>Grading Matrix ({tmpl?.name || 'Default Template'})</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {matrixCats.map((cat, idx) => (
                            <span
                              key={cat.id || idx}
                              className="px-2 py-0.5 rounded-md bg-[#111A2D] border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1"
                            >
                              <span>{cat.name}</span>
                              <strong className="text-[#38BDF8]">{cat.weight}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                      <span>Standard Curriculum Course</span>
                      <button
                        onClick={() => {
                          setIsAddSubjectOpen(true);
                        }}
                        className="text-[#0284C7] hover:text-[#38BDF8] font-bold flex items-center gap-1"
                      >
                        <span>Offer in Section</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SECTION SUBJECT OFFERINGS (Faculty & Dean Offerings View) */}
      {(!isDean || activeTab === 'offerings') && (
        <div>
          {filteredSubjects.length === 0 ? (
            <div className="bg-[#0D1525] border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mb-3 text-slate-500">
                <BookOpen className="w-6 h-6 text-[#0284C7]" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                {subjects.length === 0 ? 'No Subjects Found' : 'No Matching Subjects'}
              </h3>
              <p className="text-xs text-slate-400 max-w-sm mb-4">
                {subjects.length === 0
                  ? 'There are currently no active section subjects configured in the database. Add your first subject offering to get started.'
                  : `No subjects match the selected section filter.`}
              </p>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsAddSubjectOpen(true)}
                  className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Subject</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSubjects.map((sub) => {
                const sectionName = sub.sectionId
                  ? sectionMap.get(sub.sectionId) || sub.sectionName || 'BSIT - 21001'
                  : 'BSIT - 21001';

                const tmpl = sub.gradingMatrixTemplateId
                  ? templateMap.get(sub.gradingMatrixTemplateId)
                  : null;

                const rawSubMatrix = normalizeMatrixCategories(sub.matrix || tmpl?.matrix);
                const matrixCategories = rawSubMatrix.length > 0 ? rawSubMatrix : [
                  { id: '1', name: 'Class Standing', weight: 40 },
                  { id: '2', name: 'Project (CBO)', weight: 25 },
                  { id: '3', name: 'Examination (WE)', weight: 35 },
                ];

                const instructorName = user?.name || 'Romel Cabiling';
                const scheduleText = formatScheduleDisplay(sub.schedule);

                return (
                  <div
                    key={sub.id}
                    className="bg-[#0D1525] border border-slate-800/90 rounded-2xl p-5 hover:border-slate-700/90 transition flex flex-col justify-between shadow-sm relative group"
                  >
                    <div>
                      {/* Top Badges & Actions */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-black text-xs">
                            {sub.code}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 font-semibold text-[11px] border border-slate-700/60">
                            {sub.units || 3} Units
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-500/30 text-[#38BDF8] font-bold text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                            Pass: {sub.passingGrade || tmpl?.passingGrade || 75}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1 text-slate-500 shrink-0">
                          <button
                            onClick={() => setIsGlobalTemplatesOpen(true)}
                            className="p-1 hover:text-slate-300 transition"
                            title="Configure Matrix"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(sub.id, sub.name)}
                            className="p-1 hover:text-rose-400 transition"
                            title="Delete Course Offering"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h3 className="text-base font-black text-white tracking-tight mb-2">
                        {sub.name}
                      </h3>

                      {/* Section & Schedule */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mb-1.5">
                        <span className="font-semibold text-slate-300">{sectionName}</span>
                        <span className="text-slate-600">•</span>
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate">{scheduleText}</span>
                        </div>
                      </div>

                      {/* Instructor */}
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-4">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>
                          Instructor: <strong className="text-slate-300">{instructorName}</strong>
                        </span>
                      </div>

                      {/* Grading Criteria Pills Header */}
                      <div className="pt-3 border-t border-slate-800/80">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
                            <span>Grading Criteria (100%)</span>
                          </div>
                          <button
                            onClick={() => setIsGlobalTemplatesOpen(true)}
                            className="text-[11px] font-bold text-[#0284C7] hover:text-[#38BDF8] flex items-center gap-1 transition"
                          >
                            <Sliders className="w-3 h-3" />
                            <span>Edit Matrix</span>
                          </button>
                        </div>

                        {/* Criteria Pills Row */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {matrixCategories.map((cat, idx) => (
                            <span
                              key={cat.id || idx}
                              className="px-2.5 py-1 rounded-lg bg-[#111A2D] border border-slate-800 text-xs font-semibold flex items-center gap-1.5 text-slate-300"
                            >
                              <span>{cat.name}</span>
                              <strong className="text-[#38BDF8] font-bold">{cat.weight}%</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800/60">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsGlobalTemplatesOpen(true)}
                          className="bg-[#111A2D] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                        >
                          <Sliders className="w-3.5 h-3.5 text-slate-400" />
                          <span>Configure Matrix</span>
                        </button>
                        <button
                          onClick={() => onNavigate?.('ai-plans')}
                          className="bg-[#111A2D] hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>AI Learning Plan</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onNavigate?.('attendance', sub.id)}
                          className="bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-600/40 text-emerald-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition"
                        >
                          <ClipboardList className="w-3.5 h-3.5" />
                          <span>Attendance</span>
                        </button>
                        <button
                          onClick={() => onNavigate?.('gradebook', sub.id)}
                          className="bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
                        >
                          <span>Gradebook</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Add Subject / Add Course Modal */}
      <AddSubjectModal
        isOpen={isAddSubjectOpen}
        onClose={() => setIsAddSubjectOpen(false)}
        sections={sections}
        templates={templates}
        courses={courses}
        onSubjectCreated={(newSub) => addSubjectLocal(newSub)}
      />

      {/* Global Templates Modal */}
      <GlobalTemplatesModal
        isOpen={isGlobalTemplatesOpen}
        onClose={() => setIsGlobalTemplatesOpen(false)}
        templates={templates}
        subjects={subjects}
        onTemplateCreated={(tmpl) => addTemplateLocal(tmpl)}
        onTemplateDeleted={(tmplId) => removeTemplateLocal(tmplId)}
        onApplyGlobally={(tmplId) => applyTemplateGloballyLocal(tmplId)}
      />
    </div>
  );
};
