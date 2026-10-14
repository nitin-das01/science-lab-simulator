import { useState } from 'react';
import type {
  InstrumentType,
  SimulationMode,
  TestObject,
  ObservationEntry,
} from './types/instruments';
import { useSoundEffects } from './hooks/useSoundEffects';
import { calculateVernier } from './utils/vernierMath';
import { calculateScrewGauge } from './utils/screwGaugeMath';

// Shared Components
import { Header } from './components/shared/Header';
import { InstrumentSelector } from './components/shared/InstrumentSelector';
import { FineControls } from './components/shared/FineControls';
import { ZeroErrorControls } from './components/shared/ZeroErrorControls';
import { PresetObjectSelector } from './components/shared/PresetObjectSelector';
import { FormulaCard } from './components/shared/FormulaCard';
import { ObservationTable } from './components/shared/ObservationTable';
import { VivaChallengeModal } from './components/shared/VivaChallengeModal';

// Instrument Simulators
import { VernierCaliper } from './components/instruments/VernierCaliper';
import { ScrewGauge } from './components/instruments/ScrewGauge';
import { Spherometer } from './components/instruments/Spherometer';
import { MetreBridge } from './components/instruments/MetreBridge';
import { TitrationSimulator } from './components/instruments/TitrationSimulator';
import { MicroscopeSimulator } from './components/instruments/MicroscopeSimulator';

import {
  BookOpen,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function App() {
  // Navigation & Mode
  const [currentInstrument, setCurrentInstrument] = useState<InstrumentType>('vernier-caliper');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('sandbox');
  const [isVivaModalOpen, setIsVivaModalOpen] = useState<boolean>(false);

  // Sound synthesis hook
  const {
    soundEnabled,
    setSoundEnabled,
    playRatchetClick,
    playSliderTick,
    playClampContact,
    playSuccessChime,
    playErrorBuzzer,
  } = useSoundEffects();

  // Instrument Measurement States
  const [position, setPosition] = useState<number>(14.6);
  const [zeroError, setZeroError] = useState<number>(0.0);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [clampedObject, setClampedObject] = useState<TestObject | null>(null);

  // Vernier config: 10 divisions (LC 0.1mm) or 20 divisions (LC 0.05mm)
  const [vernierDivisions, setVernierDivisions] = useState<10 | 20>(10);

  // Active dashboard tab: 'controls' | 'formulas' | 'observations'
  const [activeTab, setActiveTab] = useState<'controls' | 'formulas' | 'observations'>('controls');

  // Observation Table entries
  const [observations, setObservations] = useState<ObservationEntry[]>([]);

  // Mathematical readings
  const vernierData = calculateVernier(position, zeroError, vernierDivisions);
  const screwGaugeData = calculateScrewGauge(position, zeroError, 1.0, 100);

  // Dynamic limits & readings based on current instrument
  const isVernier = currentInstrument === 'vernier-caliper';
  const isScrewGauge = currentInstrument === 'screw-gauge';

  const maxPosition = isVernier ? 130 : isScrewGauge ? 25 : 10;
  const leastCount = isVernier ? 1 / vernierDivisions : isScrewGauge ? 0.01 : 0.01;

  const currentMSR = isVernier ? vernierData.msr : screwGaugeData.psr;
  const currentVSR = isVernier ? vernierData.vsr : screwGaugeData.csr;
  const currentTotal = isVernier ? vernierData.rawReading : screwGaugeData.rawReading;
  const currentCorrected = isVernier ? vernierData.correctedReading : screwGaugeData.correctedReading;

  // Handle Specimen Clamping
  const handleClampObject = (obj: TestObject | null) => {
    setClampedObject(obj);
    if (obj) {
      // Position jaws around object: trueDimension + zeroError
      const targetPos = Math.max(0, Number((obj.trueDimension + zeroError).toFixed(2)));
      setPosition(targetPos);
    }
  };

  // Switch instrument handler
  const handleSelectInstrument = (inst: InstrumentType) => {
    setCurrentInstrument(inst);
    setClampedObject(null);
    setIsLocked(false);
    if (inst === 'vernier-caliper') {
      setPosition(14.6);
      setZeroError(0.0);
    } else if (inst === 'screw-gauge') {
      setPosition(2.34);
      setZeroError(0.0);
    } else if (inst === 'spherometer') {
      setPosition(2.15);
      setZeroError(0.0);
    } else {
      setPosition(0.0);
      setZeroError(0.0);
    }
  };

  // Reset current instrument
  const handleReset = () => {
    setPosition(isVernier ? 0.0 : isScrewGauge ? 0.0 : 0.0);
    setZeroError(0.0);
    setClampedObject(null);
    setIsLocked(false);
  };

  // Add observation entry
  const handleAddObservation = () => {
    const newEntry: ObservationEntry = {
      id: `obs-${Date.now()}`,
      readingNumber: observations.length + 1,
      instrumentId: currentInstrument,
      instrumentName: isVernier ? 'Vernier Caliper' : isScrewGauge ? 'Screw Gauge' : 'Spherometer',
      objectName: clampedObject ? clampedObject.name : 'Unknown Specimen',
      msr: currentMSR,
      vsr: currentVSR,
      fractionalReading: isVernier ? vernierData.fractionalReading : screwGaugeData.fractionalReading,
      totalReading: currentTotal,
      zeroError: zeroError,
      correctedReading: currentCorrected,
      trueDimension: clampedObject?.trueDimension,
      timestamp: Date.now(),
    };
    setObservations((prev) => [newEntry, ...prev]);
    playClampContact();
  };

  // Apply Challenge Target Position
  const handleApplyChallenge = (pos: number, ze: number, objName: string) => {
    setPosition(pos);
    setZeroError(ze);
    setClampedObject({
      id: 'challenge-specimen',
      name: objName,
      category: 'Exam Specimen',
      description: 'Mystery specimen for practical viva verification.',
      trueDimension: pos - ze,
      dimensionType: 'external',
      color: '#cbd5e1',
      renderShape: 'sphere',
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* 1. Top Navbar Header */}
      <Header
        simulationMode={simulationMode}
        onModeToggle={setSimulationMode}
        soundEnabled={soundEnabled}
        onSoundToggle={() => setSoundEnabled(!soundEnabled)}
        onReset={handleReset}
        onOpenViva={() => setIsVivaModalOpen(true)}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* 2. Instrument Selection Tabs */}
        <InstrumentSelector
          currentInstrument={currentInstrument}
          onSelectInstrument={handleSelectInstrument}
        />

        {/* 3. Split Layout: Viewport on Left/Top, Dashboard on Right/Bottom */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Simulation Canvas Viewport (7 Cols on LG) */}
          <section className="lg:col-span-7 space-y-4">
            {/* Active Instrument Canvas */}
            <div className="relative">
              {currentInstrument === 'vernier-caliper' && (
                <VernierCaliper
                  currentPosition={position}
                  zeroError={zeroError}
                  divisionsCount={vernierDivisions}
                  clampedObject={clampedObject}
                  isLocked={isLocked}
                  onPositionChange={setPosition}
                  onLockToggle={() => setIsLocked(!isLocked)}
                  onTickSound={playSliderTick}
                  showCoincidenceHint={simulationMode === 'sandbox'}
                />
              )}

              {currentInstrument === 'screw-gauge' && (
                <ScrewGauge
                  currentPosition={position}
                  zeroError={zeroError}
                  pitch={1.0}
                  totalDivisions={100}
                  clampedObject={clampedObject}
                  isLocked={isLocked}
                  onPositionChange={setPosition}
                  onLockToggle={() => setIsLocked(!isLocked)}
                  onRatchetSound={playRatchetClick}
                />
              )}

              {currentInstrument === 'spherometer' && (
                <Spherometer
                  currentPosition={position}
                  zeroError={zeroError}
                  clampedObject={clampedObject}
                  onPositionChange={setPosition}
                  onRatchetSound={playRatchetClick}
                />
              )}

              {currentInstrument === 'metre-bridge' && (
                <MetreBridge onTickSound={playSliderTick} />
              )}

              {currentInstrument === 'titration' && (
                <TitrationSimulator onDropSound={playSliderTick} />
              )}

              {currentInstrument === 'microscope' && (
                <MicroscopeSimulator />
              )}
            </div>

            {/* Stepper Controls (for linear instruments) */}
            {(isVernier || isScrewGauge || currentInstrument === 'spherometer') && (
              <FineControls
                currentPosition={position}
                maxPosition={maxPosition}
                leastCount={leastCount}
                isLocked={isLocked}
                onPositionChange={setPosition}
                onTickSound={isScrewGauge ? playRatchetClick : playSliderTick}
              />
            )}
          </section>

          {/* RIGHT: Measurement Readout & Collapsible Dashboard (5 Cols on LG) */}
          <aside className="lg:col-span-5 space-y-4">
            {/* Live Reading Card (Sandbox Mode vs Challenge Mode) */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-900/90 rounded-2xl border border-slate-800 p-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Live Measurement Readout
                  </h3>
                </div>

                <div className="flex items-center gap-2">
                  {simulationMode === 'sandbox' ? (
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      <Eye className="w-3 h-3" /> Sandbox Mode
                    </span>
                  ) : (
                    <button
                      onClick={() => setIsVivaModalOpen(true)}
                      className="flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 transition-all"
                    >
                      <EyeOff className="w-3 h-3" /> Challenge Active (Click to Answer)
                    </button>
                  )}
                </div>
              </div>

              {simulationMode === 'sandbox' ? (
                <div>
                  {/* Big Final Measurement Callout */}
                  <div className="flex items-baseline justify-between mb-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Final Corrected Reading
                      </div>
                      <div className="text-3xl font-extrabold font-mono text-transparent bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text">
                        {currentCorrected.toFixed(leastCount <= 0.01 ? 2 : 1)}{' '}
                        <span className="text-base font-normal text-slate-400">mm</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[10px] uppercase font-bold text-slate-400">
                        Zero Error
                      </div>
                      <div
                        className={`text-sm font-mono font-bold ${
                          zeroError === 0
                            ? 'text-slate-400'
                            : zeroError > 0
                            ? 'text-amber-400'
                            : 'text-rose-400'
                        }`}
                      >
                        {zeroError >= 0 ? `+${zeroError.toFixed(2)}` : zeroError.toFixed(2)} mm
                      </div>
                    </div>
                  </div>

                  {/* Step-by-Step Breakdown Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800/80 mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        {isVernier ? 'Main Scale (MSR):' : 'Pitch Scale (PSR):'}
                      </span>
                      <span className="text-cyan-300 font-bold">{currentMSR} mm</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">
                        {isVernier ? 'Vernier Div (VSR):' : 'Circular Div (CSR):'}
                      </span>
                      <span className="text-cyan-300 font-bold">
                        #{currentVSR} div (×{leastCount} = {(currentVSR * leastCount).toFixed(3)} mm)
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Total Observed:</span>
                      <span className="text-slate-200 font-bold">{currentTotal.toFixed(3)} mm</span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px]">Zero Correction:</span>
                      <span className="text-amber-300 font-bold">
                        {-zeroError >= 0 ? `+${(-zeroError).toFixed(2)}` : (-zeroError).toFixed(2)} mm
                      </span>
                    </div>
                  </div>

                  {/* Record Reading Button */}
                  <button
                    onClick={handleAddObservation}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-cyan-500 hover:from-cyan-500 hover:to-cyan-400 text-white font-semibold text-xs shadow-lg shadow-cyan-500/20 transition-all active:scale-[0.98]"
                  >
                    <span>Log to Observation Table</span>
                  </button>
                </div>
              ) : (
                /* Challenge Mode Hidden State */
                <div className="py-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Live Readings Hidden</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                      Inspect the graduations on the canvas loupe above and calculate the reading.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsVivaModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-500/25 hover:from-emerald-400 hover:to-teal-400 transition-all active:scale-95"
                  >
                    <span>Open Answer Form</span>
                  </button>
                </div>
              )}
            </div>

            {/* Dashboard Tabs Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('controls')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'controls'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Controls & Specs
              </button>
              <button
                onClick={() => setActiveTab('formulas')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'formulas'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Formulas
              </button>
              <button
                onClick={() => setActiveTab('observations')}
                className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all relative ${
                  activeTab === 'observations'
                    ? 'bg-slate-800 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Table ({observations.length})
              </button>
            </div>

            {/* Tab 1: Controls & Specimen Clamping */}
            {activeTab === 'controls' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Vernier divisions switcher (if on Vernier Caliper) */}
                {isVernier && (
                  <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 shadow-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-slate-200">Vernier Divisions:</div>
                      <div className="text-[11px] text-slate-400">
                        Least Count = {vernierDivisions === 10 ? '0.10 mm' : '0.05 mm'}
                      </div>
                    </div>
                    <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
                      <button
                        onClick={() => setVernierDivisions(10)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          vernierDivisions === 10 ? 'bg-cyan-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        10 Div (0.1mm)
                      </button>
                      <button
                        onClick={() => setVernierDivisions(20)}
                        className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                          vernierDivisions === 20 ? 'bg-cyan-500 text-white' : 'text-slate-400'
                        }`}
                      >
                        20 Div (0.05mm)
                      </button>
                    </div>
                  </div>
                )}

                {/* Zero Error Controls */}
                {(isVernier || isScrewGauge) && (
                  <ZeroErrorControls
                    instrumentId={currentInstrument}
                    zeroError={zeroError}
                    onZeroErrorChange={setZeroError}
                  />
                )}

                {/* Preset Specimen Objects */}
                <PresetObjectSelector
                  instrumentId={currentInstrument}
                  clampedObject={clampedObject}
                  zeroError={zeroError}
                  onClampObject={handleClampObject}
                  onContactSound={playClampContact}
                />
              </div>
            )}

            {/* Tab 2: Formula & Least Count Breakdown */}
            {activeTab === 'formulas' && (
              <div className="animate-in fade-in duration-200">
                <FormulaCard
                  instrumentId={currentInstrument}
                  divisionsCount={vernierDivisions}
                />
              </div>
            )}

            {/* Tab 3: Observation Table & Stats */}
            {activeTab === 'observations' && (
              <div className="animate-in fade-in duration-200">
                <ObservationTable
                  observations={observations}
                  onAddObservation={handleAddObservation}
                  onClearObservations={() => setObservations([])}
                />
              </div>
            )}
          </aside>
        </div>

        {/* 4. Bottom Collapsible Observation Table View (if not in tab) */}
        {activeTab !== 'observations' && (
          <section className="mt-8">
            <ObservationTable
              observations={observations}
              onAddObservation={handleAddObservation}
              onClearObservations={() => setObservations([])}
            />
          </section>
        )}
      </main>

      {/* 5. Viva Voce Practical Challenge Modal */}
      <VivaChallengeModal
        isOpen={isVivaModalOpen}
        onClose={() => setIsVivaModalOpen(false)}
        instrumentId={currentInstrument}
        onApplyChallengePosition={handleApplyChallenge}
        onSuccessSound={playSuccessChime}
        onErrorSound={playErrorBuzzer}
      />

      {/* 6. Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>VirtualLab 11-12 • Certified Procedural Millimeter Accuracy</span>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            HTML5 Canvas 2D • Web Audio Synthesizer • React 19 + TypeScript
          </div>
        </div>
      </footer>
    </div>
  );
}
