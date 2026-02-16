import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MatrixTab } from '../matrix/MatrixTab';
import { RangeTab } from '../range/RangeTab';
import { QuizPanel } from '../quiz/QuizPanel';

export function RightPanel() {
  const { state, dispatch } = useAppContext();
  const { activeTab } = state;
  const [isQuizMode, setIsQuizMode] = useState(false);

  if (isQuizMode) {
    return (
      <div className="flex flex-col h-full">
        <QuizPanel onExit={() => setIsQuizMode(false)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Tab switcher — left-aligned */}
      <div className="flex border-b border-slate-700 bg-slate-800">
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'range' })}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'range'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Range
        </button>
        <button
          onClick={() => dispatch({ type: 'SET_ACTIVE_TAB', payload: 'matrix' })}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'matrix'
              ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-800'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Matrix
        </button>
        {/* Quiz button — right aligned */}
        <button
          onClick={() => setIsQuizMode(true)}
          className="ml-auto px-3 py-1.5 mr-2 my-1 text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white rounded transition-colors"
        >
          Quiz
        </button>
      </div>

      {/* Tab content - both always mounted, hidden with CSS */}
      <div className="flex-1 overflow-hidden relative">
        <div className={`absolute inset-0 overflow-y-auto ${activeTab === 'matrix' ? '' : 'invisible'}`}>
          <MatrixTab />
        </div>
        <div className={`absolute inset-0 overflow-y-auto ${activeTab === 'range' ? '' : 'invisible'}`}>
          <RangeTab />
        </div>
      </div>
    </div>
  );
}
