import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface FineControlsProps {
  currentPosition: number;
  maxPosition: number;
  leastCount: number;
  isLocked: boolean;
  onPositionChange: (newPos: number) => void;
  onTickSound?: () => void;
}

export const FineControls: React.FC<FineControlsProps> = ({
  currentPosition,
  maxPosition,
  leastCount,
  isLocked,
  onPositionChange,
  onTickSound,
}) => {
  const step = (delta: number) => {
    if (isLocked) return;
    const newPos = Math.max(0, Math.min(maxPosition, Number((currentPosition + delta).toFixed(3))));
    onPositionChange(newPos);
    onTickSound?.();
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400" />
          Precision Fine Stepper
        </h3>
        <span className="text-xs font-mono text-cyan-400 font-bold bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
          Position: {currentPosition.toFixed(leastCount <= 0.01 ? 2 : 1)} mm
        </span>
      </div>

      {/* Main position slider */}
      <div className="mb-4">
        <input
          type="range"
          min="0"
          max={maxPosition}
          step={leastCount}
          value={currentPosition}
          disabled={isLocked}
          onChange={(e) => {
            onPositionChange(Number(Number(e.target.value).toFixed(2)));
            onTickSound?.();
          }}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 disabled:opacity-40"
        />
        <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1">
          <span>0.0 mm</span>
          <span>{(maxPosition / 2).toFixed(0)} mm</span>
          <span>{maxPosition.toFixed(0)} mm</span>
        </div>
      </div>

      {/* Stepper Buttons Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {/* -1.0 mm / -0.1 mm */}
        <button
          onClick={() => step(-1.0)}
          disabled={isLocked || currentPosition <= 0}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-mono font-medium border border-slate-700/80 transition-all active:scale-95"
        >
          <ChevronsLeft className="w-3.5 h-3.5 text-slate-400" />
          <span>-1.0 mm</span>
        </button>

        <button
          onClick={() => step(-0.1)}
          disabled={isLocked || currentPosition <= 0}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-mono font-medium border border-slate-700/80 transition-all active:scale-95"
        >
          <ChevronLeft className="w-3.5 h-3.5 text-cyan-400" />
          <span>-0.1 mm</span>
        </button>

        {/* +0.1 mm / +1.0 mm */}
        <button
          onClick={() => step(0.1)}
          disabled={isLocked || currentPosition >= maxPosition}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-mono font-medium border border-slate-700/80 transition-all active:scale-95"
        >
          <span>+0.1 mm</span>
          <ChevronRight className="w-3.5 h-3.5 text-cyan-400" />
        </button>

        <button
          onClick={() => step(1.0)}
          disabled={isLocked || currentPosition >= maxPosition}
          className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 text-xs font-mono font-medium border border-slate-700/80 transition-all active:scale-95"
        >
          <span>+1.0 mm</span>
          <ChevronsRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Micro-stepping for 0.01 mm (Screw gauge / vernier) */}
      <div className="grid grid-cols-2 gap-2 mt-2">
        <button
          onClick={() => step(-leastCount)}
          disabled={isLocked || currentPosition <= 0}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[11px] font-mono border border-slate-800 transition-all"
        >
          <ChevronLeft className="w-3 h-3 text-emerald-400" />
          <span>-{leastCount} mm (1 LC)</span>
        </button>

        <button
          onClick={() => step(leastCount)}
          disabled={isLocked || currentPosition >= maxPosition}
          className="flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 disabled:opacity-40 text-slate-300 text-[11px] font-mono border border-slate-800 transition-all"
        >
          <span>+{leastCount} mm (1 LC)</span>
          <ChevronRight className="w-3 h-3 text-emerald-400" />
        </button>
      </div>
    </div>
  );
};
