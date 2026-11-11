import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { StatCard } from '../components/StatCard';
import { QuickActionCard } from '../components/QuickActionCard';
import { ClassSectionCard } from '../components/ClassSectionCard';
import { AssessmentList } from '../components/AssessmentList';
import { ResetPasswordModal } from '../components/ResetPasswordModal';
import { NavItem } from '../components/Sidebar';
import {
  Layers,
  BookOpen,
  Users,
  Award,
  Table,
  CalendarCheck,
  Sliders,
  Key,
  FolderKanban,
  ArrowRight,
  CheckCircle2,
  Plus,
  Calendar,
  Sparkles,
} from 'lucide-react';

interface DashboardPageProps {
  onNavigate: (tab: NavItem) => void;
  onOpenGradebookForSubject?: (subjectId: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onNavigate,
  onOpenGradebookForSubject,
}) => {
  const { user } = useAuth();
  const { sections, subjects, students, assessments, overview, events } = useData();
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const totalClassesCount = sections.length;
  const totalCoursesCount = subjects.length;
  const totalStudentsCount = students.length;
  const classAverage = overview?.stats?.classAverage
    ? `${overview.stats.classAverage}%`
    : sections.length > 0
    ? '0%'
    : '--';

  const userDisplayName = user?.name || user?.email?.split('@')[0] || 'Faculty Instructor';
  const userInitials = (user?.name || user?.email || 'FC')
    .trim()
    .split(/\s+/)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const handleOpenGradebook = (subjectId?: string) => {
    if (subjectId && onOpenGradebookForSubject) {
      onOpenGradebookForSubject(subjectId);
    }
    onNavigate('gradebook');
  };

  return (
    <div className="space-y-6">
      {/* 1. Welcome Hero Banner */}
      <div className="bg-[#0D1525] border border-slate-800/80 rounded-2xl p-6 shadow-sm flex items-center gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-gradient-to-l from-[#0284C7]/10 to-transparent pointer-events-none" />

        {/* Cyan bordered square avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl bg-[#090E17] border-2 border-[#0EA5E9] flex items-center justify-center text-xl font-black text-[#38BDF8] shadow-[0_0_20px_rgba(14,165,233,0.3)]">
            {userInitials}
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-[#0D1525] flex items-center justify-center text-white">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Welcome Text */}
        <div className="relative z-10">
          <h1 className="text-2xl font-black text-white tracking-tight">
            Welcome, {userDisplayName}
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Manage sections, customize grading matrices, record attendance, and monitor real-time class standing.
          </p>
        </div>
      </div>

      {/* 2. Key KPI Stat Cards (4 in a row) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          value={totalClassesCount}
          label="My Classes"
          icon={Layers}
          variant="blue"
        />
        <StatCard
          value={totalCoursesCount}
          label="Active Courses"
          icon={BookOpen}
          variant="teal"
        />
        <StatCard
          value={totalStudentsCount}
          label="Total Students"
          icon={Users}
          variant="cyan"
        />
        <StatCard
          value={classAverage}
          label="Class Average"
          icon={Award}
          variant="amber"
        />
      </div>

      {/* 3. Quick Action Cards (5 in a row) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <QuickActionCard
          title="Open Gradebook"
          description="Spreadsheet for Quizzes, Activities, Projects & Exam scoring."
          icon={Table}
          variant="blue"
          onClick={() => handleOpenGradebook()}
        />
        <QuickActionCard
          title="Daily Attendance"
          description="Roll call with Present, Late, Absent, or Excused status tracking."
          icon={CalendarCheck}
          variant="emerald"
          onClick={() => onNavigate('attendance')}
        />
        <QuickActionCard
          title="Event Calendar"
          description="Schedule exams, holidays & school events synced with Student App."
          icon={Calendar}
          variant="blue"
          onClick={() => onNavigate('calendar')}
        />
        <QuickActionCard
          title="Grading Matrices"
          description="Customize percentage weights per course with real-time 100%..."
          icon={Sliders}
          variant="amber"
          onClick={() => onNavigate('subjects')}
        />
        <QuickActionCard
          title="Reset Password"
          description="Revert forgotten credentials to Student ID with mandatory update."
          icon={Key}
          variant="rose"
          onClick={() => setIsResetModalOpen(true)}
        />
      </div>

      {/* 4. Split Section: Classes & Active Courses (Left) | Assessment Activity (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (~68%) */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#0EA5E9]" />
              <h2 className="text-sm font-bold text-white tracking-wide">
                Classes & Active Courses
              </h2>
            </div>
            <button
              onClick={() => onNavigate('classes')}
              className="flex items-center gap-1 text-xs font-bold text-[#0284C7] hover:text-[#38BDF8] transition"
            >
              <span>Manage Classes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Section Cards */}
          <div>
            {sections.length === 0 ? (
              <div className="bg-[#0D1525] border border-dashed border-slate-800 rounded-2xl p-8 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-xl bg-slate-800/60 flex items-center justify-center mb-3 text-slate-500">
                  <FolderKanban className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">No Classes Assigned Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Your assigned academic sections and courses will appear here once registered.
                </p>
                <button
                  onClick={() => onNavigate('classes')}
                  className="mt-4 bg-[#0284C7] hover:bg-[#0369A1] text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-glow transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Go to Classes & Add Section</span>
                </button>
              </div>
            ) : (
              sections.slice(0, 3).map((section) => {
                const secSubjects = subjects.filter((s) => s.sectionId === section.id);
                return (
                  <ClassSectionCard
                    key={section.id}
                    section={section}
                    subjects={secSubjects}
                    onOpenGradebook={handleOpenGradebook}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Right Column (~32%) */}
        <div className="lg:col-span-4">
          <AssessmentList
            assessments={assessments}
            onSelectAssessment={() => handleOpenGradebook()}
          />
        </div>
      </div>

      {/* Reset Student Password Modal */}
      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        students={students}
      />
    </div>
  );
};
