import { AppProvider, useAppContext } from '../context/AppContext';
import { RangeDataProvider } from '../hooks/useRangeData';
import { AppLayout } from '../components/layout/AppLayout';
import { LeftPanel } from '../components/layout/LeftPanel';
import { RightPanel } from '../components/layout/RightPanel';
import { PositionActionBar } from '../components/PositionActionBar';

function Header() {
  const { state, dispatch } = useAppContext();
  const { simulations, currentSimId, simsLoading } = state;

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex items-center justify-between flex-shrink-0">
      <h1 className="text-lg font-bold text-white">PLO Preflop Solver</h1>
      <div className="flex items-center gap-3">
        {simsLoading ? (
          <span className="text-slate-400 text-sm">Loading...</span>
        ) : (
          <select
            value={currentSimId || ''}
            onChange={(e) => {
              dispatch({
                type: 'SET_SIM_ID',
                payload: e.target.value ? parseInt(e.target.value) : null,
              });
            }}
            className="bg-slate-700 text-white text-sm px-3 py-1.5 rounded border border-slate-600 focus:border-blue-500 focus:outline-none"
          >
            <option value="">Select simulation</option>
            {simulations.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.num_players}max {s.stack_bb}bb)
              </option>
            ))}
          </select>
        )}
      </div>
    </header>
  );
}

function AppContent() {
  return (
    <AppLayout
      header={<Header />}
      actionBar={<PositionActionBar />}
      leftPanel={<LeftPanel />}
      rightPanel={<RightPanel />}
    />
  );
}

export default function SolverPage() {
  return (
    <AppProvider>
      <RangeDataProvider>
        <AppContent />
      </RangeDataProvider>
    </AppProvider>
  );
}
