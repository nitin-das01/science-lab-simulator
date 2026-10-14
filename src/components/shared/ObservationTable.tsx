import React from 'react';
import type { ObservationEntry } from '../../types/instruments';
import { ClipboardList, Plus, Trash2, Download } from 'lucide-react';

interface ObservationTableProps {
  observations: ObservationEntry[];
  onAddObservation: () => void;
  onClearObservations: () => void;
}

export const ObservationTable: React.FC<ObservationTableProps> = ({
  observations,
  onAddObservation,
  onClearObservations,
}) => {
  // Statistical calculations: Mean & Standard Deviation
  const correctedValues = observations.map((o) => o.correctedReading);
  const n = correctedValues.length;

  const mean = n > 0 ? correctedValues.reduce((a, b) => a + b, 0) / n : 0;
  const variance =
    n > 1
      ? correctedValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (n - 1)
      : 0;
  const standardDeviation = Math.sqrt(variance);

  // Export to CSV
  const handleExportCSV = () => {
    if (observations.length === 0) return;
    const headers = ['Trial #', 'Instrument', 'Specimen', 'MSR (mm)', 'VSR/CSR', 'Total Reading (mm)', 'Zero Error (mm)', 'Corrected Reading (mm)'];
    const rows = observations.map((o) => [
      o.readingNumber,
      o.instrumentName,
      o.objectName,
      o.msr,
      o.vsr,
      o.totalReading.toFixed(3),
      o.zeroError.toFixed(3),
      o.correctedReading.toFixed(3),
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `VirtualLab_Observations_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-5 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Practical Lab Observation Table
          </h3>
          <span className="px-2 py-0.5 text-xs font-mono rounded bg-slate-800 text-slate-300">
            {observations.length} {observations.length === 1 ? 'Trial' : 'Trials'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onAddObservation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white text-xs font-semibold shadow-md shadow-cyan-500/25 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Current Reading</span>
          </button>

          {observations.length > 0 && (
            <>
              <button
                onClick={handleExportCSV}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-all"
                title="Export Table to CSV"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                onClick={onClearObservations}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs font-medium border border-slate-700 hover:border-rose-500/30 transition-all"
                title="Clear all recorded trials"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Observation Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-3 py-2.5">Trial #</th>
              <th className="px-3 py-2.5">Specimen</th>
              <th className="px-3 py-2.5">MSR / PSR</th>
              <th className="px-3 py-2.5">VSR / CSR</th>
              <th className="px-3 py-2.5">Total Obs.</th>
              <th className="px-3 py-2.5">Zero Error (e)</th>
              <th className="px-3 py-2.5 text-cyan-400 font-bold">Corrected (Obs - e)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {observations.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-center text-slate-500 font-sans italic">
                  No readings logged yet. Adjust instrument and click &quot;Record Current Reading&quot; to begin your experiment series.
                </td>
              </tr>
            ) : (
              observations.map((obs) => (
                <tr key={obs.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-3 py-2 text-slate-400">{obs.readingNumber}</td>
                  <td className="px-3 py-2 text-slate-200 font-sans font-medium">{obs.objectName}</td>
                  <td className="px-3 py-2 text-slate-300">{obs.msr} mm</td>
                  <td className="px-3 py-2 text-slate-300">{obs.vsr} div</td>
                  <td className="px-3 py-2 text-slate-300">{obs.totalReading.toFixed(3)} mm</td>
                  <td className="px-3 py-2 text-slate-400">
                    {obs.zeroError >= 0 ? `+${obs.zeroError.toFixed(2)}` : obs.zeroError.toFixed(2)} mm
                  </td>
                  <td className="px-3 py-2 font-bold text-cyan-300 bg-cyan-500/5">
                    {obs.correctedReading.toFixed(3)} mm
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Statistical Summary Bar */}
      {observations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-950/60 p-3 rounded-xl text-xs">
          <div>
            <span className="text-slate-400">Sample Size (N):</span>
            <span className="font-mono text-white font-bold ml-2">{n}</span>
          </div>
          <div>
            <span className="text-slate-400">Mean Reading (x̄):</span>
            <span className="font-mono text-cyan-400 font-bold ml-2">{mean.toFixed(3)} mm</span>
          </div>
          <div>
            <span className="text-slate-400">Standard Deviation (σ):</span>
            <span className="font-mono text-emerald-400 font-bold ml-2">±{standardDeviation.toFixed(4)} mm</span>
          </div>
        </div>
      )}
    </div>
  );
};
