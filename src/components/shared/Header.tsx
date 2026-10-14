import React from 'react';
import { Volume2, VolumeX, Sparkles, BookOpen, RotateCcw, GraduationCap } from 'lucide-react';
import type { SimulationMode } from '../../types/instruments';

interface HeaderProps {
  simulationMode: SimulationMode;
  onModeToggle: (mode: SimulationMode) => void;
  soundEnabled: boolean;
  onSoundToggle: () => void;
  onReset: () => void;
  onOpenViva: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  simulationMode,
  onModeToggle,
  soundEnabled,
  onSoundToggle,
  onReset,
  onOpenViva,
}) => {
  return (
    <header className="w-full bg-slate-900/90 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50 px-4 lg:px-8 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Logo and Lab Info */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                VirtualLab <span className="bg-gradient-to-r from-cyan-400 to-emerald-400 bg-clip-text text-transparent">11-12</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                CBSE • ISC • AP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              High-Precision Physics & Science Instrument Simulator for Practical Exams
            </p>
          </div>
        </div>

        {/* Action Controls & Mode Switcher */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => onModeToggle('sandbox')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                simulationMode === 'sandbox'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sandbox Mode</span>
            </button>
            <button
              onClick={() => {
                onModeToggle('challenge');
                onOpenViva();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                simulationMode === 'challenge'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Viva Challenge</span>
            </button>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={onSoundToggle}
            className={`p-2 rounded-xl border text-xs font-medium transition-all ${
              soundEnabled
                ? 'bg-slate-800/80 text-cyan-400 border-cyan-500/30 hover:bg-slate-700'
                : 'bg-slate-900 text-slate-500 border-slate-800 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Synthesized Audio Clicks ON' : 'Audio Muted'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          {/* Reset View */}
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all hover:text-white"
            title="Reset Instrument Position & Clamping"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};
