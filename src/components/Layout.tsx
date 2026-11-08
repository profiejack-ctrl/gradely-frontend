import React, { useState } from 'react';
import { Sidebar, NavItem } from './Sidebar';
import { TopBar } from './TopBar';

interface LayoutProps {
  currentTab: NavItem;
  onSelectTab: (tab: NavItem) => void;
  onOpenSettings?: () => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({
  currentTab,
  onSelectTab,
  onOpenSettings,
  children,
}) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#070B13]">
      {/* Desktop & Tablet Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          currentTab={currentTab}
          onSelectTab={onSelectTab}
          onOpenSettings={onOpenSettings}
        />
      </div>

      {/* Main Body Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#070B13]">
        <TopBar onOpenSettings={onOpenSettings} />

        {/* Scrollable Content Container */}
        <main className="flex-1 overflow-y-auto px-6 py-6 lg:px-8">
          <div className="max-w-[1400px] mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
