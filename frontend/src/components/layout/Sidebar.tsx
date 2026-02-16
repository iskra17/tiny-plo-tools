import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { HelpSection } from './HelpSection';
import { FeedbackModal } from './FeedbackModal';

const STORAGE_KEY = 'plo-tools-sidebar-collapsed';

function SolverIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="8" y="3" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <text x="6" y="12" textAnchor="middle" fill="currentColor" fontSize="7" fontWeight="bold">A</text>
    </svg>
  );
}

function EquityIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <rect x="5" y="10" width="2.5" height="5" rx="0.5" fill="currentColor" />
      <rect x="8.75" y="7" width="2.5" height="8" rx="0.5" fill="currentColor" />
      <rect x="12.5" y="4" width="2.5" height="11" rx="0.5" fill="currentColor" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 3L5 8L10 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 3L11 8L6 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <text x="10" y="14" textAnchor="middle" fill="currentColor" fontSize="11" fontWeight="bold">?</text>
    </svg>
  );
}

function FeedbackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 4h14a1 1 0 011 1v8a1 1 0 01-1 1H7l-4 3V5a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
      <circle cx="7" cy="9" r="0.8" fill="currentColor" />
      <circle cx="10" cy="9" r="0.8" fill="currentColor" />
      <circle cx="13" cy="9" r="0.8" fill="currentColor" />
    </svg>
  );
}

interface MenuItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const MENU_ITEMS: MenuItem[] = [
  { path: '/solver', label: 'Preflop Solver', icon: <SolverIcon /> },
  { path: '/equity', label: 'Equity Calculator', icon: <EquityIcon /> },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored === 'true';
    } catch {
      return false;
    }
  });

  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    } catch {
      // localStorage not available
    }
  }, [collapsed]);

  const toggleCollapsed = () => setCollapsed((prev) => !prev);

  const handleHelpClick = () => {
    if (collapsed) {
      setCollapsed(false);
    }
  };

  return (
    <>
      <div
        className={`h-screen bg-slate-950 flex flex-col flex-shrink-0 border-r border-slate-800 transition-all duration-200 ${
          collapsed ? 'w-[56px]' : 'w-[220px]'
        }`}
      >
        {/* Header: Title + Toggle button */}
        <div className="h-[48px] flex items-center px-3 border-b border-slate-800 flex-shrink-0 gap-1">
          {collapsed ? (
            <span className="text-sm font-bold text-white w-full text-center">Tiny</span>
          ) : (
            <span className="text-base font-bold text-white whitespace-nowrap flex-1">
              Tiny PLO Tools
            </span>
          )}
          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              className="flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors duration-150 p-1"
              title="Collapse sidebar"
            >
              <ChevronLeftIcon />
            </button>
          )}
        </div>

        {/* Expand button when collapsed */}
        {collapsed && (
          <div className="flex justify-center py-2 flex-shrink-0">
            <button
              onClick={toggleCollapsed}
              className="flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors duration-150 p-1.5"
              title="Expand sidebar"
            >
              <ChevronRightIcon />
            </button>
          </div>
        )}

        {/* Menu items */}
        <nav className="py-2 flex flex-col gap-0.5 px-2 flex-shrink-0">
          {MENU_ITEMS.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-md cursor-pointer transition-colors duration-150 ${
                  collapsed ? 'justify-center px-0 py-2.5' : 'px-3 py-2.5'
                } ${
                  isActive
                    ? 'bg-slate-700 text-white border-l-[3px] border-blue-500'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white border-l-[3px] border-transparent'
                }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="text-sm font-medium whitespace-nowrap overflow-hidden">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="border-t border-slate-800 mx-2 flex-shrink-0" />

        {/* Help section */}
        {collapsed ? (
          <div className="flex justify-center py-2 flex-shrink-0">
            <button
              onClick={handleHelpClick}
              className="flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors duration-150 p-1.5"
              title="Help / 도움말"
            >
              <HelpIcon />
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-3 py-2 min-h-0">
            <HelpSection />
          </div>
        )}

        {/* Separator */}
        <div className="border-t border-slate-800 mx-2 flex-shrink-0" />

        {/* Feedback button */}
        <div className="p-2 flex-shrink-0">
          <button
            onClick={() => setFeedbackOpen(true)}
            title={collapsed ? 'Feedback' : undefined}
            className={`flex items-center gap-3 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors duration-150 w-full ${
              collapsed ? 'justify-center px-0 py-2' : 'px-3 py-2'
            }`}
          >
            <span className="flex-shrink-0"><FeedbackIcon /></span>
            {!collapsed && <span className="text-sm">Feedback</span>}
          </button>
        </div>
      </div>

      {/* Feedback Modal */}
      {feedbackOpen && <FeedbackModal onClose={() => setFeedbackOpen(false)} />}
    </>
  );
}
