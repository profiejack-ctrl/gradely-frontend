import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { LoginPage } from './pages/LoginPage';
import { Layout } from './components/Layout';
import { NavItem } from './components/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { ClassesPage } from './pages/ClassesPage';
import { SubjectsPage } from './pages/SubjectsPage';
import { GradebookPage } from './pages/GradebookPage';
import { AttendancePage } from './pages/AttendancePage';
import { StudentsPage } from './pages/StudentsPage';
import { AILearningPlansPage } from './pages/AILearningPlansPage';
import { FacultyPage } from './pages/FacultyPage';
import { SystemSettingsModal } from './components/SystemSettingsModal';

export const App: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<NavItem>('dashboard');
  const [activeSubjectId, setActiveSubjectId] = useState<string | undefined>(undefined);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070B13] flex flex-col items-center justify-center gap-4 text-white">
        <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center p-2 shadow-glow animate-pulse">
          <img src="/logo.svg" alt="Gradely Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
          <span className="w-2 h-2 rounded-full bg-[#0284C7] animate-ping" />
          <span>Initializing GradelySMS...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardPage
            onNavigate={(tab) => setCurrentTab(tab)}
            onOpenGradebookForSubject={(subId) => {
              setActiveSubjectId(subId);
              setCurrentTab('gradebook');
            }}
          />
        );
      case 'classes':
        return <ClassesPage onNavigate={(tab) => setCurrentTab(tab)} />;
      case 'subjects':
        return (
          <SubjectsPage
            onNavigate={(tab, subId) => {
              if (subId) setActiveSubjectId(subId);
              setCurrentTab(tab);
            }}
          />
        );
      case 'gradebook':
        return (
          <GradebookPage
            initialSubjectId={activeSubjectId}
            onNavigate={(tab, subId) => {
              if (subId) setActiveSubjectId(subId);
              setCurrentTab(tab);
            }}
          />
        );
      case 'attendance':
        return (
          <AttendancePage
            initialSubjectId={activeSubjectId}
            onNavigate={(tab, subId) => {
              if (subId) setActiveSubjectId(subId);
              setCurrentTab(tab);
            }}
          />
        );
      case 'students':
        return <StudentsPage />;
      case 'faculty':
        return <FacultyPage />;
      case 'ai-plans':
        return <AILearningPlansPage />;
      default:
        return (
          <DashboardPage
            onNavigate={(tab) => setCurrentTab(tab)}
          />
        );
    }
  };

  return (
    <DataProvider>
      <Layout
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      >
        {renderContent()}
      </Layout>

      <SystemSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </DataProvider>
  );
};
