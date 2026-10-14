import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import type { VivaChallenge, InstrumentType } from '../../types/instruments';
import { STATIC_CHALLENGES, generateRandomChallenge } from '../../utils/challenges';
import {
  Trophy,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';

interface VivaChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instrumentId: InstrumentType;
  onApplyChallengePosition: (pos: number, zeroError: number, objName: string) => void;
  onSuccessSound?: () => void;
  onErrorSound?: () => void;
}

export const VivaChallengeModal: React.FC<VivaChallengeModalProps> = ({
  isOpen,
  onClose,
  instrumentId,
  onApplyChallengePosition,
  onSuccessSound,
  onErrorSound,
}) => {
  // Current challenge
  const [currentChallenge, setCurrentChallenge] = useState<VivaChallenge>(() => {
    const list = STATIC_CHALLENGES.filter((c) => c.instrumentId === instrumentId);
    return list[0] || generateRandomChallenge(instrumentId);
  });

  // User input answers
  const [inputMsr, setInputMsr] = useState<string>('');
  const [inputVsr, setInputVsr] = useState<string>('');
  const [inputTotal, setInputTotal] = useState<string>('');
  const [inputCorrected, setInputCorrected] = useState<string>('');

  // Submission feedback
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [revealedHints, setRevealedHints] = useState<number>(0);

  if (!isOpen) return null;

  const isVernier = currentChallenge.instrumentId === 'vernier-caliper';

  // Apply target to instrument viewport
  const loadChallenge = (ch: VivaChallenge) => {
    setCurrentChallenge(ch);
    setInputMsr('');
    setInputVsr('');
    setInputTotal('');
    setInputCorrected('');
    setSubmitted(false);
    setRevealedHints(0);
    onApplyChallengePosition(ch.targetPosition, ch.zeroError, ch.objectName);
  };

  const handleNextChallenge = () => {
    const newChallenge = generateRandomChallenge(instrumentId);
    loadChallenge(newChallenge);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);

    const userMsr = parseFloat(inputMsr);
    const userVsr = parseFloat(inputVsr);
    const userTotal = parseFloat(inputTotal);
    const userCorrected = parseFloat(inputCorrected);

    const isMsrCorrect = Math.abs(userMsr - currentChallenge.expectedMsr) < 0.05;
    const isVsrCorrect = Math.abs(userVsr - currentChallenge.expectedVsr) < 0.05;
    const isTotalCorrect = Math.abs(userTotal - currentChallenge.expectedTotal) < 0.05;
    const isCorrectedCorrect = Math.abs(userCorrected - currentChallenge.expectedCorrected) < 0.05;

    const allCorrect = isMsrCorrect && isVsrCorrect && isTotalCorrect && isCorrectedCorrect;

    if (allCorrect) {
      setScore((s) => s + 10);
      onSuccessSound?.();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // fallback
      }
    } else {
      onErrorSound?.();
    }
  };

  const userMsr = parseFloat(inputMsr);
  const userVsr = parseFloat(inputVsr);
  const userTotal = parseFloat(inputTotal);
  const userCorrected = parseFloat(inputCorrected);

  const isMsrOk = submitted && Math.abs(userMsr - currentChallenge.expectedMsr) < 0.05;
  const isVsrOk = submitted && Math.abs(userVsr - currentChallenge.expectedVsr) < 0.05;
  const isTotalOk = submitted && Math.abs(userTotal - currentChallenge.expectedTotal) < 0.05;
  const isCorrectedOk = submitted && Math.abs(userCorrected - currentChallenge.expectedCorrected) < 0.05;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-3xl p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Practical Exam Viva Voce
                <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                  Score: {score} pts
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Inspect the instrument reading above and enter your measurements to verify.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-all text-xs font-semibold"
          >
            ✕ Close
          </button>
        </div>

        {/* Challenge Prompt */}
        <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-cyan-400 font-bold mb-1">
            <span>{currentChallenge.title}</span>
            <span className="font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              Specimen: {currentChallenge.objectName}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-medium">
            Instrument has Zero Error:{' '}
            <span
              className={`font-mono font-bold ${
                currentChallenge.zeroError === 0
                  ? 'text-slate-300'
                  : currentChallenge.zeroError > 0
                  ? 'text-amber-400'
                  : 'text-rose-400'
              }`}
            >
              {currentChallenge.zeroError >= 0
                ? `+${currentChallenge.zeroError.toFixed(2)}`
                : currentChallenge.zeroError.toFixed(2)}{' '}
              mm
            </span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Field 1: MSR / PSR */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isVernier ? 'Main Scale Reading (MSR) [mm]:' : 'Pitch Scale Reading (PSR) [mm]:'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 14"
                  value={inputMsr}
                  onChange={(e) => setInputMsr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all"
                  required
                />
                {submitted && (
                  <div className="absolute right-3 top-2.5">
                    {isMsrOk ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                  </div>
                )}
              </div>
              {submitted && !isMsrOk && (
                <p className="text-[11px] text-rose-400 mt-1">Expected: {currentChallenge.expectedMsr} mm</p>
              )}
            </div>

            {/* Field 2: VSR / CSR */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isVernier ? 'Coinciding Vernier Div (VSR):' : 'Coinciding Circular Div (CSR):'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 6"
                  value={inputVsr}
                  onChange={(e) => setInputVsr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all"
                  required
                />
                {submitted && (
                  <div className="absolute right-3 top-2.5">
                    {isVsrOk ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                  </div>
                )}
              </div>
              {submitted && !isVsrOk && (
                <p className="text-[11px] text-rose-400 mt-1">Expected: {currentChallenge.expectedVsr} div</p>
              )}
            </div>

            {/* Field 3: Total Observed Reading */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Total Observed Reading (mm):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 14.60"
                  value={inputTotal}
                  onChange={(e) => setInputTotal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all"
                  required
                />
                {submitted && (
                  <div className="absolute right-3 top-2.5">
                    {isTotalOk ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                  </div>
                )}
              </div>
              {submitted && !isTotalOk && (
                <p className="text-[11px] text-rose-400 mt-1">Expected: {currentChallenge.expectedTotal.toFixed(2)} mm</p>
              )}
            </div>

            {/* Field 4: Corrected Reading */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Corrected Reading [Obs - Zero Error] (mm):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="any"
                  placeholder="e.g. 14.60"
                  value={inputCorrected}
                  onChange={(e) => setInputCorrected(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 rounded-xl px-3 py-2 text-sm font-mono text-white placeholder-slate-600 outline-none transition-all"
                  required
                />
                {submitted && (
                  <div className="absolute right-3 top-2.5">
                    {isCorrectedOk ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
                  </div>
                )}
              </div>
              {submitted && !isCorrectedOk && (
                <p className="text-[11px] text-rose-400 mt-1">Expected: {currentChallenge.expectedCorrected.toFixed(2)} mm</p>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            {/* Reveal Hint button */}
            {currentChallenge.hints.length > 0 && revealedHints < currentChallenge.hints.length ? (
              <button
                type="button"
                onClick={() => setRevealedHints((h) => h + 1)}
                className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Lightbulb className="w-4 h-4" />
                <span>Show Hint ({revealedHints}/{currentChallenge.hints.length})</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleNextChallenge}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                <span>New Problem</span>
              </button>

              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/25 transition-all active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Verify Answer</span>
              </button>
            </div>
          </div>
        </form>

        {/* Revealed Hints */}
        {revealedHints > 0 && (
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-300">
              <Lightbulb className="w-4 h-4" /> Exam Hints:
            </div>
            {currentChallenge.hints.slice(0, revealedHints).map((hint, idx) => (
              <div key={idx}>• {hint}</div>
            ))}
          </div>
        )}

        {/* Full Explanation on submission */}
        {submitted && (
          <div className="mt-4 p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-slate-200">
            <h4 className="font-bold text-cyan-400 flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4" /> Step-by-Step Solution Breakdown:
            </h4>
            <p className="leading-relaxed text-slate-300">{currentChallenge.explanation}</p>
          </div>
        )}
      </div>
    </div>
  );
};
