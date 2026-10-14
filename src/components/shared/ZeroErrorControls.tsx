import React from 'react';
import { AlertCircle, HelpCircle } from 'lucide-react';
import type { InstrumentType } from '../../types/instruments';

interface ZeroErrorControlsProps {
  instrumentId: InstrumentType;
  zeroError: number;
  onZeroErrorChange: (val: number) => void;
}

export const ZeroErrorControls: React.FC<ZeroErrorControlsProps> = ({
  instrumentId,
  zeroError,
  onZeroErrorChange,
}) => {
  // Common preset zero errors depending on instrument
  const isVernier = instrumentId === 'vernier-caliper';
  const presets = isVernier
    ? [
        { label: 'Nil (0.0 mm)', value: 0.0, desc: 'Zeroes coincide when jaws close' },
        { label: 'Positive (+0.2 mm)', value: 0.2, desc: 'Vernier 0 is to the right of Main 0' },
        { label: 'Negative (-0.3 mm)', value: -0.3, desc: 'Vernier 0 is to the left of Main 0' },
      ]
    : [
        { label: 'Nil (0.00 mm)', value: 0.0, desc: 'Circular 0 aligns with datum line' },
        { label: 'Positive (+0.03 mm)', value: 0.03, desc: 'Circular 0 is below datum line' },
        { label: 'Negative (-0.04 mm)', value: -0.04, desc: 'Circular 0 is above datum line' },
      ];

  const errorType = zeroError === 0 ? 'nil' : zeroError > 0 ? 'positive' : 'negative';

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400" />
          Zero Error & Correction Simulation
        </h3>
        <span
          className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
            errorType === 'nil'
              ? 'bg-slate-800 text-slate-300 border-slate-700'
              : errorType === 'positive'
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
          }`}
        >
          {zeroError === 0 ? 'Nil Zero Error' : zeroError > 0 ? `+${zeroError.toFixed(2)} mm (Positive)` : `${zeroError.toFixed(2)} mm (Negative)`}
        </span>
      </div>

      {/* Preset toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-3">
        {presets.map((p) => {
          const isSelected = Math.abs(zeroError - p.value) < 0.005;
          return (
            <button
              key={p.label}
              onClick={() => onZeroErrorChange(p.value)}
              className={`p-2.5 rounded-xl text-left border transition-all ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-white shadow-md shadow-cyan-500/10'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div className="text-xs font-bold font-mono">{p.label}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 leading-snug">{p.desc}</div>
            </button>
          );
        })}
      </div>

      {/* Custom slider */}
      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex justify-between text-xs text-slate-400 mb-1">
          <span>Fine-tune Zero Error:</span>
          <span className="font-mono text-cyan-400 font-bold">{zeroError >= 0 ? `+${zeroError.toFixed(2)}` : zeroError.toFixed(2)} mm</span>
        </div>
        <input
          type="range"
          min={isVernier ? -0.5 : -0.1}
          max={isVernier ? 0.5 : 0.1}
          step={isVernier ? 0.1 : 0.01}
          value={zeroError}
          onChange={(e) => onZeroErrorChange(Number(Number(e.target.value).toFixed(2)))}
          className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
      </div>

      {/* Pedagogical Rule Box */}
      <div className="mt-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 leading-relaxed flex items-start gap-2">
        <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-200">Exam Rule:</strong>{' '}
          <span className="font-mono text-cyan-300">Corrected Reading = Observed Reading - (Zero Error)</span>.
          {errorType === 'positive' && (
            <span className="text-amber-400 block mt-0.5">
              • Positive error: Instrument over-reads by +{zeroError.toFixed(2)} mm. You must <u>subtract</u> this value.
            </span>
          )}
          {errorType === 'negative' && (
            <span className="text-rose-400 block mt-0.5">
              • Negative error: Instrument under-reads by {Math.abs(zeroError).toFixed(2)} mm. Subtracting negative adds +{Math.abs(zeroError).toFixed(2)} mm.
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
