import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { PokerTable } from '../PokerTable';
import { OverallFrequencyBar } from '../strategy/OverallFrequencyBar';
import { EnhancedStrategyDisplay } from '../strategy/EnhancedStrategyDisplay';
import { CategoryChart } from '../strategy/CategoryChart';
import { HoveredHandList } from '../strategy/HoveredHandList';

export function LeftPanel() {
  const { state } = useAppContext();
  const isQuiz = state.activeTab === 'quiz';
  const [showCategoryChart, setShowCategoryChart] = useState(false);

  return (
    <div className="flex flex-col h-full">
      <div className="p-2 flex-shrink-0">
        <PokerTable />
      </div>
      {!isQuiz && (
        <>
          <div className="flex-shrink-0 border-t border-slate-700">
            <OverallFrequencyBar />
          </div>
          <div className="flex-shrink-0 border-t border-slate-700">
            <label className="flex items-center gap-1.5 px-3 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showCategoryChart}
                onChange={(e) => setShowCategoryChart(e.target.checked)}
                className="w-3 h-3 rounded border-slate-600 bg-slate-700 accent-blue-500"
              />
              <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wide">
                Strategy by Category
              </span>
              <span className="text-[9px] text-slate-600">(Beta)</span>
            </label>
            {showCategoryChart && <CategoryChart />}
          </div>
          <div className="flex-1 overflow-y-auto border-t border-slate-700">
            <EnhancedStrategyDisplay />
            <div className="border-t border-slate-700">
              <HoveredHandList />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
