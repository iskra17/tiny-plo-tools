import { Fragment } from 'react';
import { useAppContext } from '../../context/AppContext';
import { RANKS } from '../../constants/poker';

export interface CellColorData {
  fold: number;
  call: number;
  raise: number;
}

interface MatrixGridProps {
  onCellClick: (rank1: string, rank2: string, suited: boolean) => void;
  onCellHover?: (rank1: string, rank2: string, suited: boolean) => void;
  onCellLeave?: () => void;
  cellColorData?: Map<string, CellColorData>;
  stage2ValidCells?: Set<string> | null;
  secondTwo?: { rank1: string; rank2: string; suited: boolean } | null;
  handCount?: number;
  onResetFirst?: () => void;
  onResetSecond?: () => void;
}

/**
 * Compute cell background style from action frequencies.
 * Uses CSS gradient to blend fold (slate), call (green), raise (red).
 */
function getCellStyle(data: CellColorData | undefined): React.CSSProperties | undefined {
  if (!data) return undefined;

  const total = data.fold + data.call + data.raise;
  if (total === 0) return undefined;

  const foldPct = (data.fold / total) * 100;
  const callPct = (data.call / total) * 100;
  const raisePct = (data.raise / total) * 100;

  // Single dominant action: solid color
  if (foldPct > 95) return { backgroundColor: 'rgba(59, 130, 246, 0.6)' };  // blue
  if (callPct > 95) return { backgroundColor: 'rgba(16, 185, 129, 0.6)' };  // emerald
  if (raisePct > 95) return { backgroundColor: 'rgba(239, 68, 68, 0.6)' };  // red

  // Blend: use CSS linear gradient (stacked horizontal bar style)
  const parts: string[] = [];
  let offset = 0;

  if (foldPct > 0.5) {
    parts.push(`rgba(59, 130, 246, 0.7) ${offset}% ${offset + foldPct}%`);
    offset += foldPct;
  }
  if (callPct > 0.5) {
    parts.push(`rgba(16, 185, 129, 0.7) ${offset}% ${offset + callPct}%`);
    offset += callPct;
  }
  if (raisePct > 0.5) {
    parts.push(`rgba(239, 68, 68, 0.7) ${offset}% ${offset + raisePct}%`);
  }

  if (parts.length === 0) return undefined;

  return { background: `linear-gradient(to right, ${parts.join(', ')})` };
}

export function MatrixGrid({ onCellClick, onCellHover, onCellLeave, cellColorData, stage2ValidCells, secondTwo, handCount, onResetFirst, onResetSecond }: MatrixGridProps) {
  const { state } = useAppContext();
  const { matrixState } = state;

  const isStage2 = matrixState.stage === 2;
  const firstTwo = matrixState.firstTwo;
  const hasColorData = cellColorData && cellColorData.size > 0;

  // Suit label helper
  const suitLabel = (s: { suited: boolean }) => s.suited ? 's' : '';

  return (
    <div className="p-1 relative max-w-[680px]">
      {/* Card selection indicator — interactive */}
      <div className="flex items-center justify-center gap-1 mb-1.5">
        {/* First pair */}
        <button
          onClick={firstTwo ? onResetFirst : undefined}
          className={`flex gap-0.5 rounded px-1 py-0.5 transition-all ${firstTwo ? 'cursor-pointer hover:bg-slate-700/80' : 'cursor-default'}`}
          title={firstTwo ? 'Click to reset' : ''}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`w-7 h-9 rounded border-2 flex items-center justify-center text-sm font-bold transition-all
                ${firstTwo
                  ? 'border-blue-400 bg-blue-600/30 text-blue-300'
                  : 'border-slate-600 bg-slate-800/50 text-slate-600'
                }`}
            >
              {firstTwo ? (i === 0 ? firstTwo.rank1 : firstTwo.rank2) : '?'}
            </div>
          ))}
          {firstTwo && (
            <span className="text-[10px] text-blue-400/70 self-end ml-0.5">{suitLabel(firstTwo)}</span>
          )}
        </button>

        {/* Separator */}
        <span className="text-slate-600 text-xs mx-0.5">+</span>

        {/* Second pair */}
        <button
          onClick={secondTwo ? onResetSecond : undefined}
          className={`flex gap-0.5 rounded px-1 py-0.5 transition-all ${secondTwo ? 'cursor-pointer hover:bg-slate-700/80' : 'cursor-default'}`}
          title={secondTwo ? 'Click to reset' : ''}
        >
          {[0, 1].map((i) => (
            <div
              key={i}
              className={`w-7 h-9 rounded border-2 flex items-center justify-center text-sm font-bold transition-all
                ${secondTwo
                  ? 'border-emerald-400 bg-emerald-600/30 text-emerald-300'
                  : isStage2
                    ? 'border-slate-500 bg-slate-800/50 text-slate-500 animate-pulse'
                    : 'border-slate-600 bg-slate-800/50 text-slate-600'
                }`}
            >
              {secondTwo ? (i === 0 ? secondTwo.rank1 : secondTwo.rank2) : '?'}
            </div>
          ))}
          {secondTwo && (
            <span className="text-[10px] text-emerald-400/70 self-end ml-0.5">{suitLabel(secondTwo)}</span>
          )}
        </button>

        {/* Hand count */}
        {isStage2 && handCount != null && (
          <span className="text-[10px] text-slate-500 ml-2">{handCount} hands</span>
        )}
      </div>

      {/* Header info */}
      <div className="text-center mb-1">
        <div className="text-xs text-slate-300 font-medium">
          {!firstTwo ? 'Select your pair or highest two cards' : !secondTwo ? 'Select your other two cards' : 'Hand selected'}
        </div>
        {hasColorData && (
          <div className="flex items-center justify-center gap-3 mt-0.5">
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(59, 130, 246, 0.7)' }} />
              Fold
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(16, 185, 129, 0.7)' }} />
              Call
            </span>
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="w-2 h-2 rounded-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
              Raise
            </span>
          </div>
        )}
      </div>

      {/* Good Suit / Bad Suit labels */}
      <div className="absolute top-0 right-0 text-[9px] text-blue-400/50 pointer-events-none select-none">
        Good Suit ↗
      </div>
      <div className="absolute bottom-0 left-5 text-[9px] text-slate-500/50 pointer-events-none select-none">
        ↙ Bad Suit
      </div>

      {/* Grid */}
      <div className="grid gap-[1px]" style={{ gridTemplateColumns: `18px repeat(${RANKS.length}, 1fr)` }}>
        {/* Column headers */}
        <div />
        {RANKS.map((r) => (
          <div key={`col-${r}`} className="text-center text-[10px] text-slate-400 font-medium">
            {r}
          </div>
        ))}

        {/* Grid rows */}
        {RANKS.map((rowRank, ri) => (
          <Fragment key={`row-${rowRank}`}>
            {/* Row header */}
            <div className="text-center text-[10px] text-slate-400 font-medium flex items-center justify-center">
              {rowRank}
            </div>

            {/* Cells */}
            {RANKS.map((colRank, ci) => {
              const isDiagonal = ri === ci;
              const isUpperRight = ci > ri; // suited / good suit

              // Determine display text
              let cellText: string;
              if (isDiagonal) {
                cellText = `${rowRank}${colRank}`;
              } else if (isUpperRight) {
                cellText = `${rowRank}${colRank}`;
              } else {
                cellText = `${colRank}${rowRank}`;
              }

              // Color coding
              const cellKey = `${ri}-${ci}`;
              const colorData = cellColorData?.get(cellKey);
              const dynamicStyle = getCellStyle(colorData);

              let bgColor: string;
              if (dynamicStyle) {
                bgColor = 'hover:brightness-125';
              } else if (isDiagonal) {
                bgColor = 'bg-amber-900/60 hover:bg-amber-800/80';
              } else if (isUpperRight) {
                bgColor = 'bg-blue-900/40 hover:bg-blue-800/60';
              } else {
                bgColor = 'bg-slate-700/60 hover:bg-slate-600/80';
              }

              // Highlight selected first pair in stage 2
              const isFirstPairSelected =
                isStage2 &&
                firstTwo &&
                ((firstTwo.rank1 === rowRank && firstTwo.rank2 === colRank) ||
                 (firstTwo.rank1 === colRank && firstTwo.rank2 === rowRank && isDiagonal));

              // Highlight selected second pair
              const cellRank1 = isUpperRight || isDiagonal ? rowRank : colRank;
              const cellRank2 = isUpperRight || isDiagonal ? colRank : rowRank;
              const cellSuited = isUpperRight;
              const isSecondPairSelected =
                isStage2 &&
                secondTwo &&
                secondTwo.rank1 === cellRank1 &&
                secondTwo.rank2 === cellRank2 &&
                secondTwo.suited === cellSuited;

              const disabled = isStage2 && stage2ValidCells != null && !stage2ValidCells.has(cellKey);

              return (
                <button
                  key={cellKey}
                  disabled={disabled}
                  onClick={() => {
                    if (disabled) return;
                    if (isDiagonal) {
                      onCellClick(rowRank, colRank, false);
                    } else if (isUpperRight) {
                      onCellClick(rowRank, colRank, true);
                    } else {
                      onCellClick(colRank, rowRank, false);
                    }
                  }}
                  onMouseEnter={() => {
                    if (disabled || !onCellHover) return;
                    if (isDiagonal) {
                      onCellHover(rowRank, colRank, false);
                    } else if (isUpperRight) {
                      onCellHover(rowRank, colRank, true);
                    } else {
                      onCellHover(colRank, rowRank, false);
                    }
                  }}
                  onMouseLeave={onCellLeave}
                  style={isFirstPairSelected || isSecondPairSelected ? undefined : dynamicStyle}
                  className={`
                    aspect-square flex items-center justify-center text-xs font-bold rounded-[2px]
                    transition-colors
                    ${disabled ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'}
                    ${isFirstPairSelected ? 'ring-2 ring-blue-400 bg-blue-600/60' : isSecondPairSelected ? 'ring-2 ring-emerald-400 bg-emerald-600/60' : bgColor}
                    text-white/90
                  `}
                >
                  {cellText}
                </button>
              );
            })}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
