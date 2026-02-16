import type { ReactNode } from 'react';

interface AppLayoutProps {
  header: ReactNode;
  actionBar: ReactNode;
  leftPanel: ReactNode;
  rightPanel: ReactNode;
}

export function AppLayout({ header, actionBar, leftPanel, rightPanel }: AppLayoutProps) {
  return (
    <div className="h-full bg-slate-900 flex flex-col">
      {header}
      {actionBar}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel: poker table + strategy */}
        <div className="w-2/5 flex flex-col overflow-y-auto border-r border-slate-700">
          {leftPanel}
        </div>
        {/* Right panel: Range/Matrix tabs */}
        <div className="w-3/5 flex flex-col overflow-hidden">
          {rightPanel}
        </div>
      </div>
    </div>
  );
}
