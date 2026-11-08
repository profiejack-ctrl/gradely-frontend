import React, { useState } from 'react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { NavItem } from '../components/Sidebar';
import {
  Layers,
  Users,
  BookOpen,
  Calendar,
  Building,
  ShieldCheck,
  Plus,
  Search,
  Upload,
  ArrowRight,
  Edit3,
  Trash2,
} from 'lucide-react';
import { AddSectionModal } from '../components/AddSectionModal';
import { UploadRosterModal } from '../components/UploadRosterModal';

interface ClassesPageProps {
  onNavigate?: (tab: NavItem) => void;
}

export const ClassesPage: React.FC<ClassesPageProps> = ({ onNavigate }) => {
  const { sections, subjects, students, addSectionLocal, enrollStudentsLocal } = useData();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isRosterModalOpen, setIsRosterModalOpen] = useState(false);
  const [targetRosterSectionId, setTargetRosterSectionId] = useState<string | undefined>(undefined);

  const filteredSections = sections.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    (s.gradeLevelOrYear && s.gradeLevelOrYear.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-[#0EA5E9]" />
            <span>Classes & Sections</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Organize student cohorts, academic year assignments, and section courses.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search classes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-[#0D1525] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#0284C7] w-40 sm:w-48"
            />
          </div>

          {/* Bulk Upload Button */}
          <button
            onClick={() => {
              setTargetRosterSectionId(undefined);
              setIsRosterModalOpen(true);
            }}
            className="bg-[#0D1525] hover:bg-slate-800 border border-slate-700/80 hover:border-slate-600 text-white font-semibold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition shadow-sm"
          >
            <Upload className="w-3.5 h-3.5 text-slate-300" />
            <span>Bulk Upload Masterlist</span>
          </button>

          {/* Create New Class Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Class</span>
          </button>
        </div>
      </div>

      {/* Grid or Empty */}
      {filteredSections.length === 0 ? (
        <div className="bg-[#0D1525] border border-dashed border-slate-800 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mb-3 text-slate-500">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white mb-1">
            {sections.length === 0 ? 'No Classes Found' : 'No Matching Classes'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mb-4">
            {sections.length === 0
              ? 'There are currently no classes or academic sections registered in your database. Start by creating a class or uploading a roster.'
              : `No classes matched your query "${search}".`}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Create Your First Section</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSections.map((sec) => {
            const secSubjects = subjects.filter((s) => s.sectionId === sec.id);
            const sectionStudentCount =
              students.filter(
                (stud) => stud.sectionId === sec.id || (stud.sectionIds && stud.sectionIds.includes(sec.id))
              ).length || sec.studentCount || 0;

            const adviserName = user?.name || 'Romel Cabiling';

            return (
              <div
                key={sec.id}
                className="bg-[#0D1525]/90 border border-slate-800/80 rounded-2xl p-5 hover:border-slate-700/90 transition flex flex-col justify-between shadow-sm relative group"
              >
                <div>
                  {/* Card Header & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-black text-white tracking-tight">{sec.name}</h3>
                      <span className="px-2 py-0.5 rounded-md bg-[#0284C7]/20 border border-[#0284C7]/40 text-[#38BDF8] text-[10px] font-bold">
                        {sec.gradeLevelOrYear || '2nd Year College'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Adviser
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        My Teaching
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-slate-500 shrink-0">
                      <button
                        className="p-1 hover:text-slate-300 transition"
                        title="Edit class"
                        onClick={() => {}}
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        className="p-1 hover:text-rose-400 transition"
                        title="Archive class"
                        onClick={() => {}}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Academic Year & Semester */}
                  <div className="flex items-center gap-2 text-xs text-slate-400 mb-3 font-medium">
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    <span>
                      {sec.academicYear || '2025-2026'} • {sec.semester || '1st Semester'}
                    </span>
                  </div>

                  {/* Section Details */}
                  <div className="space-y-1.5 text-xs text-slate-400 mb-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#0EA5E9]" />
                      <span>
                        Adviser: <strong className="text-slate-200">{adviserName}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Building className="w-3.5 h-3.5 text-slate-500" />
                      <span>Room: {sec.room || 'MV208'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 pt-1 line-clamp-2">
                      {sec.description?.replace(/\[adviser:[^\]]+\]/, '').trim() ||
                        'Standard academic section cohort.'}
                    </p>
                  </div>

                  {/* Bento 2-Col Metric Block */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-[#111A2D]/70 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#0284C7]/15 border border-[#0284C7]/30 flex items-center justify-center text-[#38BDF8] shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">
                          {sectionStudentCount} Students
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Roster List</div>
                      </div>
                    </div>

                    <div className="bg-[#111A2D]/70 border border-slate-800/80 rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-black text-white">
                          {secSubjects.length} Courses
                        </div>
                        <div className="text-[10px] text-slate-400 font-medium">Matrix Items</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom Actions */}
                <div className="flex items-center gap-2 pt-3 border-t border-slate-800/60">
                  <button
                    onClick={() => {
                      setTargetRosterSectionId(sec.id);
                      setIsRosterModalOpen(true);
                    }}
                    className="bg-[#111A2D] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5 text-slate-300" />
                    <span>Upload Roster</span>
                  </button>

                  <button
                    onClick={() => onNavigate?.('subjects')}
                    className="bg-[#111A2D] hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center justify-center gap-1.5 transition flex-1"
                  >
                    <span>Courses & Matrix</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Section Modal */}
      <AddSectionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSectionCreated={addSectionLocal}
      />

      {/* Upload Roster Modal */}
      <UploadRosterModal
        isOpen={isRosterModalOpen}
        onClose={() => setIsRosterModalOpen(false)}
        initialSectionId={targetRosterSectionId}
        sections={sections}
        onSuccess={(enrolled, secId) => enrollStudentsLocal(enrolled, secId)}
      />
    </div>
  );
};
