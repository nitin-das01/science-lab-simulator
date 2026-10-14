import React from 'react';
import { Calculator } from 'lucide-react';
import type { InstrumentType } from '../../types/instruments';

interface FormulaCardProps {
  instrumentId: InstrumentType;
  divisionsCount?: 10 | 20;
}

export const FormulaCard: React.FC<FormulaCardProps> = ({
  instrumentId,
  divisionsCount = 10,
}) => {
  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
        <Calculator className="w-4 h-4 text-cyan-400" />
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Formula & Least Count Derivation
        </h3>
      </div>

      {instrumentId === 'vernier-caliper' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <h4 className="font-semibold text-cyan-400 mb-1">1. Least Count (LC) Principle:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div>1 Main Scale Division (MSD) = 1.0 mm</div>
              <div>
                {divisionsCount} Vernier Scale Divisions (VSD) = {divisionsCount - 1} MSD = {(divisionsCount - 1).toFixed(1)} mm
              </div>
              <div className="text-emerald-400 font-bold">
                1 VSD = {(divisionsCount - 1) / divisionsCount} mm
              </div>
              <div className="text-cyan-300 font-bold pt-1 border-t border-slate-800">
                Least Count (LC) = 1 MSD - 1 VSD = 1 - {(divisionsCount - 1) / divisionsCount} = {(1 / divisionsCount).toFixed(2)} mm
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-cyan-400 mb-1">2. Measurement Formula:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div className="text-slate-200">
                Observed Reading = MSR + (VSR × LC)
              </div>
              <div className="text-slate-400 text-[11px]">
                where MSR = Main Scale Reading (mm), VSR = Coinciding Vernier Division
              </div>
              <div className="text-amber-300 font-bold pt-1 border-t border-slate-800">
                Corrected Reading = Observed Reading - (Zero Error)
              </div>
            </div>
          </div>
        </div>
      )}

      {instrumentId === 'screw-gauge' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <h4 className="font-semibold text-emerald-400 mb-1">1. Least Count (LC) Formula:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div>Pitch (P) = Linear distance moved in 1 revolution = 1.0 mm</div>
              <div>Total Circular Scale Divisions (N) = 100 divisions</div>
              <div className="text-emerald-300 font-bold pt-1 border-t border-slate-800">
                Least Count (LC) = Pitch / Total Divisions = 1.0 mm / 100 = 0.01 mm
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-semibold text-emerald-400 mb-1">2. Measurement Calculation:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div className="text-slate-200">
                Observed Reading = PSR + (CSR × LC)
              </div>
              <div className="text-slate-400 text-[11px]">
                where PSR = Pitch Scale Reading on sleeve, CSR = Coinciding Circular division
              </div>
              <div className="text-amber-300 font-bold pt-1 border-t border-slate-800">
                Corrected Reading = Observed Reading - (Zero Error)
              </div>
            </div>
          </div>
        </div>
      )}

      {instrumentId === 'spherometer' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <h4 className="font-semibold text-amber-400 mb-1">Radius of Curvature Formula:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div className="text-emerald-300 font-bold">R = (l²) / (6h) + (h / 2)</div>
              <div className="text-slate-400 text-[11px]">
                where l = mean distance between outer tripod legs (mm), h = sagitta / central screw height (mm)
              </div>
              <div className="text-cyan-300 pt-1 border-t border-slate-800">
                Least Count = Pitch / Circular Divisions = 1.0 mm / 100 = 0.01 mm
              </div>
            </div>
          </div>
        </div>
      )}

      {instrumentId === 'metre-bridge' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <h4 className="font-semibold text-orange-400 mb-1">Wheatstone Bridge Principle:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div>At null deflection (Ig = 0): P / Q = R / S</div>
              <div className="text-emerald-300 font-bold">R / X = l / (100 - l)</div>
              <div className="text-cyan-300 font-bold pt-1 border-t border-slate-800">
                X = R × (100 - l) / l
              </div>
              <div className="text-slate-400 text-[11px]">
                where R = known resistance (Ω), l = balancing length (cm), X = unknown resistance (Ω)
              </div>
            </div>
          </div>
        </div>
      )}

      {instrumentId === 'titration' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <h4 className="font-semibold text-rose-400 mb-1">Molarity Equivalence Equation:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div>(M₁ × V₁) / n₁ = (M₂ × V₂) / n₂</div>
              <div className="text-emerald-300 font-bold">
                M(NaOH) = [2 × M(Oxalic) × V(Oxalic)] / V(NaOH)
              </div>
              <div className="text-slate-400 text-[11px] pt-1 border-t border-slate-800">
                Phenolphthalein endpoint: Colourless to permanent faint pink (pH 8.2 - 10.0)
              </div>
            </div>
          </div>
        </div>
      )}

      {instrumentId === 'microscope' && (
        <div className="space-y-4 text-xs text-slate-300">
          <div>
            <h4 className="font-semibold text-teal-400 mb-1">Optical Magnification Formula:</h4>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono space-y-1">
              <div className="text-emerald-300 font-bold">
                Total Magnification = M(eyepiece) × M(objective)
              </div>
              <div>Eyepiece = 10× | Objectives = 10× (100× total) or 40× (400× total)</div>
              <div className="text-cyan-300 pt-1 border-t border-slate-800">
                Resolving Power = 2 NA / λ
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
