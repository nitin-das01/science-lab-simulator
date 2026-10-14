import React from 'react';
import type { InstrumentType } from '../../types/instruments';
import { Ruler, Disc, Compass, Zap, Beaker, Microscope } from 'lucide-react';

interface InstrumentSelectorProps {
  currentInstrument: InstrumentType;
  onSelectInstrument: (inst: InstrumentType) => void;
}

interface InstrumentMeta {
  id: InstrumentType;
  name: string;
  category: 'Physics Core' | 'Physics Practical' | 'Chemistry' | 'Biology';
  leastCount: string;
  icon: React.ReactNode;
}

export const INSTRUMENTS_METADATA: InstrumentMeta[] = [
  {
    id: 'vernier-caliper',
    name: 'Vernier Caliper',
    category: 'Physics Core',
    leastCount: 'LC: 0.1 / 0.05 mm',
    icon: <Ruler className="w-4 h-4 text-cyan-400" />,
  },
  {
    id: 'screw-gauge',
    name: 'Screw Gauge',
    category: 'Physics Core',
    leastCount: 'LC: 0.01 mm',
    icon: <Disc className="w-4 h-4 text-emerald-400" />,
  },
  {
    id: 'spherometer',
    name: 'Spherometer',
    category: 'Physics Practical',
    leastCount: 'LC: 0.01 mm',
    icon: <Compass className="w-4 h-4 text-amber-400" />,
  },
  {
    id: 'metre-bridge',
    name: 'Metre Bridge',
    category: 'Physics Practical',
    leastCount: 'Wheatstone Null Pt',
    icon: <Zap className="w-4 h-4 text-orange-400" />,
  },
  {
    id: 'titration',
    name: 'Burette Titration',
    category: 'Chemistry',
    leastCount: '0.1 mL endpoint',
    icon: <Beaker className="w-4 h-4 text-rose-400" />,
  },
  {
    id: 'microscope',
    name: 'Compound Microscope',
    category: 'Biology',
    leastCount: '10× - 100× Zoom',
    icon: <Microscope className="w-4 h-4 text-teal-400" />,
  },
];

export const InstrumentSelector: React.FC<InstrumentSelectorProps> = ({
  currentInstrument,
  onSelectInstrument,
}) => {
  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-2 min-w-max p-1 bg-slate-900/60 rounded-2xl border border-slate-800/80">
        {INSTRUMENTS_METADATA.map((inst) => {
          const isActive = currentInstrument === inst.id;
          return (
            <button
              key={inst.id}
              onClick={() => onSelectInstrument(inst.id)}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left transition-all relative ${
                isActive
                  ? 'bg-slate-800 text-white shadow-lg border border-cyan-500/40 ring-1 ring-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                {inst.icon}
              </div>
              <div>
                <div className="text-xs font-bold leading-tight">{inst.name}</div>
                <div className="text-[10px] text-slate-500 font-mono mt-0.5">{inst.leastCount}</div>
              </div>

              {isActive && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-1 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
