import React from 'react';
import { Box, Check, X } from 'lucide-react';
import type { TestObject, InstrumentType } from '../../types/instruments';
import { PRESET_TEST_OBJECTS } from '../../utils/testObjects';

interface PresetObjectSelectorProps {
  instrumentId: InstrumentType;
  clampedObject: TestObject | null;
  zeroError?: number;
  onClampObject: (obj: TestObject | null) => void;
  onContactSound?: () => void;
}

export const PresetObjectSelector: React.FC<PresetObjectSelectorProps> = ({
  instrumentId,
  clampedObject,
  onClampObject,
  onContactSound,
}) => {
  const objects = PRESET_TEST_OBJECTS[instrumentId] || [];

  const handleSelect = (obj: TestObject) => {
    if (clampedObject?.id === obj.id) {
      onClampObject(null); // unclamp
    } else {
      onClampObject(obj);
      onContactSound?.();
    }
  };

  if (objects.length === 0) return null;

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <Box className="w-3.5 h-3.5 text-cyan-400" />
          Preset Lab Specimens
        </h3>

        {clampedObject ? (
          <button
            onClick={() => onClampObject(null)}
            className="flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/20 transition-all"
          >
            <X className="w-3 h-3" />
            <span>Release Specimen</span>
          </button>
        ) : (
          <span className="text-[11px] text-slate-500 font-mono">No object clamped</span>
        )}
      </div>

      {/* Grid of specimen cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {objects.map((obj) => {
          const isClamped = clampedObject?.id === obj.id;
          return (
            <button
              key={obj.id}
              onClick={() => handleSelect(obj)}
              className={`p-2.5 rounded-xl text-left border transition-all flex items-start gap-2.5 ${
                isClamped
                  ? 'bg-cyan-500/20 border-cyan-500/60 text-white shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <div
                className="w-4 h-4 rounded-full mt-0.5 shrink-0 ring-1 ring-white/20"
                style={{ backgroundColor: obj.color }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold truncate">{obj.name}</div>
                  {isClamped && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  True: <span className="text-cyan-300 font-bold">{obj.trueDimension} mm</span> ({obj.dimensionType})
                </div>
                <div className="text-[10px] text-slate-500 truncate mt-0.5">{obj.description}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
