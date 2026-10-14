import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Droplet, Play, RotateCcw, Beaker } from 'lucide-react';

interface TitrationSimulatorProps {
  onDropSound?: () => void;
}

export const TitrationSimulator: React.FC<TitrationSimulatorProps> = ({ onDropSound }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Volume delivered in mL (0 to 50 mL)
  const [volumeDelivered, setVolumeDelivered] = useState<number>(0.0);
  // Flow rate mode: 'off' | 'dropwise' | 'stream'
  const [flowMode, setFlowMode] = useState<'off' | 'dropwise' | 'stream'>('off');

  // Titration endpoint parameters:
  // 20.0 mL of 0.1 M Oxalic Acid vs approx 0.108 M NaOH -> equivalence point = 18.5 mL
  const EQUIVALENCE_POINT = 18.5;

  // Swirl animation phase
  const [swirlPhase, setSwirlPhase] = useState(0);

  // Animated flow loop
  useEffect(() => {
    if (flowMode === 'off') return;

    const interval = setInterval(() => {
      setVolumeDelivered((prev) => {
        const increment = flowMode === 'dropwise' ? 0.05 : 0.25;
        const next = Math.min(50.0, Number((prev + increment).toFixed(2)));
        if (next >= 50.0) {
          setFlowMode('off');
        }
        return next;
      });
      setSwirlPhase((p) => p + 0.3);
      if (flowMode === 'dropwise') {
        onDropSound?.();
      }
    }, flowMode === 'dropwise' ? 220 : 60);

    return () => clearInterval(interval);
  }, [flowMode, onDropSound]);

  // Color calculation for phenolphthalein indicator
  // Colorless below pH 8.2 (before 18.5 mL).
  // At 18.4 - 18.5 mL, transient pink swirls.
  // Beyond 18.5 mL, permanent pink/magenta!
  const isAtOrBeyondEndpoint = volumeDelivered >= EQUIVALENCE_POINT;
  const isNearEndpoint = Math.abs(volumeDelivered - EQUIVALENCE_POINT) < 0.4 && !isAtOrBeyondEndpoint;

  let flaskColor = 'rgba(240, 249, 255, 0.25)'; // Clear water
  if (isAtOrBeyondEndpoint) {
    const excess = volumeDelivered - EQUIVALENCE_POINT;
    const opacity = Math.min(0.9, 0.4 + excess * 0.15);
    flaskColor = `rgba(244, 63, 94, ${opacity})`; // Permanent vibrant rose pink
  } else if (isNearEndpoint) {
    // Transient flash of pink
    flaskColor = 'rgba(251, 113, 133, 0.35)';
  }

  const CANVAS_WIDTH = 900;
  const CANVAS_HEIGHT = 480;

  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    if (canvas.width !== CANVAS_WIDTH * dpr || canvas.height !== CANVAS_HEIGHT * dpr) {
      canvas.width = CANVAS_WIDTH * dpr;
      canvas.height = CANVAS_HEIGHT * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Dark laboratory background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Retort Stand (Cast iron base + vertical steel rod)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(140, 420, 220, 24);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(140, 420, 220, 24);

    // Vertical rod
    ctx.fillStyle = '#64748b';
    ctx.fillRect(170, 30, 10, 390);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(170, 30, 10, 390);

    // Retort clamp holding burette
    ctx.fillStyle = '#475569';
    ctx.fillRect(175, 140, 85, 14);
    ctx.fillRect(255, 135, 14, 24);

    // Burette Glass Tube (0 to 50 mL)
    const buretteX = 280;
    const buretteTopY = 40;
    const buretteW = 22;
    const buretteH = 260;

    // Glass sheen
    const glassGrad = ctx.createLinearGradient(buretteX, 0, buretteX + buretteW, 0);
    glassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
    glassGrad.addColorStop(0.2, 'rgba(56, 189, 248, 0.15)');
    glassGrad.addColorStop(0.8, 'rgba(56, 189, 248, 0.1)');
    glassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.3)');

    // Burette liquid column (NaOH solution)
    const liquidTopY = buretteTopY + (volumeDelivered / 50.0) * (buretteH - 30);
    ctx.fillStyle = 'rgba(186, 230, 253, 0.4)';
    ctx.fillRect(buretteX, liquidTopY, buretteW, buretteH - (liquidTopY - buretteTopY));

    // Meniscus curve at top of liquid
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(buretteX + buretteW / 2, liquidTopY, buretteW / 2, 3, 0, 0, Math.PI);
    ctx.stroke();

    // Glass walls
    ctx.fillStyle = glassGrad;
    ctx.fillRect(buretteX, buretteTopY, buretteW, buretteH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(buretteX, buretteTopY, buretteW, buretteH);

    // Burette Graduations (0 to 50 mL, marked every 5 mL and every 1 mL)
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'right';
    for (let ml = 0; ml <= 50; ml += 1) {
      const markY = buretteTopY + (ml / 50.0) * (buretteH - 30);
      const isMajor = ml % 5 === 0;
      ctx.lineWidth = isMajor ? 1.2 : 0.6;
      ctx.strokeStyle = '#f8fafc';
      ctx.beginPath();
      ctx.moveTo(buretteX + buretteW, markY);
      ctx.lineTo(buretteX + buretteW - (isMajor ? 9 : 5), markY);
      ctx.stroke();

      if (isMajor && ml % 10 === 0) {
        ctx.fillStyle = '#7dd3fc';
        ctx.font = '600 7px JetBrains Mono, monospace';
        ctx.fillText(`${ml}`, buretteX - 4, markY + 3);
      }
    }

    // Stopcock Valve & Tip
    const valveY = buretteTopY + buretteH;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(buretteX + 7, valveY, 8, 20); // neck
    // Glass stopcock tap
    ctx.fillStyle = flowMode === 'off' ? '#f43f5e' : '#10b981';
    ctx.beginPath();
    ctx.roundRect(buretteX - 4, valveY + 6, 30, 8, 3);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // Fine capillary jet tip
    ctx.beginPath();
    ctx.moveTo(buretteX + 8, valveY + 20);
    ctx.lineTo(buretteX + 10, valveY + 45);
    ctx.lineTo(buretteX + 12, valveY + 45);
    ctx.lineTo(buretteX + 14, valveY + 20);
    ctx.closePath();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fill();
    ctx.stroke();

    // Falling Drops when flow is active
    if (flowMode !== 'off') {
      const dropY = valveY + 50 + (swirlPhase % 1) * 35;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(buretteX + 11, dropY, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Conical Flask (Erlenmeyer Flask)
    const flaskX = buretteX + 11;
    const flaskTopY = valveY + 55;
    const flaskBaseY = 420;

    ctx.save();
    ctx.beginPath();
    // Neck
    ctx.moveTo(flaskX - 16, flaskTopY);
    ctx.lineTo(flaskX - 16, flaskTopY + 25);
    // Left flare
    ctx.lineTo(flaskX - 65, flaskBaseY - 10);
    ctx.quadraticCurveTo(flaskX - 65, flaskBaseY, flaskX - 55, flaskBaseY);
    // Flat bottom
    ctx.lineTo(flaskX + 55, flaskBaseY);
    ctx.quadraticCurveTo(flaskX + 65, flaskBaseY, flaskX + 65, flaskBaseY - 10);
    // Right flare
    ctx.lineTo(flaskX + 16, flaskTopY + 25);
    ctx.lineTo(flaskX + 16, flaskTopY);
    ctx.closePath();

    // Liquid inside flask
    ctx.fillStyle = flaskColor;
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Swirling magnetic flea inside flask
    const stirrerOffset = Math.sin(swirlPhase * 3) * 8;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(flaskX - 10 + stirrerOffset, flaskBaseY - 12, 20, 6, 3);
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.stroke();

    ctx.restore();

    // Right Analysis Panel & Meniscus Loupe
    const panelX = 490;
    const panelY = 40;
    const panelW = 370;
    const panelH = 390;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('TITRATION ANALYSIS & MENISCUS', panelX + 18, panelY + 26);

    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Titrant: Standard NaOH (in Burette)', panelX + 18, panelY + 52);
    ctx.fillText('Analyte: 20.0 mL Oxalic Acid (in Flask)', panelX + 18, panelY + 70);
    ctx.fillText('Indicator: Phenolphthalein (Clear -> Pink)', panelX + 18, panelY + 88);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(panelX + 18, panelY + 100);
    ctx.lineTo(panelX + panelW - 18, panelY + 100);
    ctx.stroke();

    // Current Reading
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 12px JetBrains Mono, monospace';
    ctx.fillText(`Burette Reading: ${volumeDelivered.toFixed(2)} mL`, panelX + 18, panelY + 126);

    // Meniscus reading demonstration loupe
    const mRadius = 45;
    const mCenterX = panelX + panelW / 2;
    const mCenterY = panelY + 205;

    ctx.beginPath();
    ctx.arc(mCenterX, mCenterY, mRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#070a11';
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Meniscus curved line in loupe
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(mCenterX, mCenterY - 6, 26, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();

    // Horizontal sight line (read lower meniscus)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.2;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(mCenterX - 40, mCenterY + 12);
    ctx.lineTo(mCenterX + 40, mCenterY + 12);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '600 9px JetBrains Mono, monospace';
    ctx.fillStyle = '#f43f5e';
    ctx.textAlign = 'center';
    ctx.fillText('Always read lower meniscus at eye level', mCenterX, mCenterY + 62);

    // Indicator Status Card
    ctx.fillStyle = isAtOrBeyondEndpoint ? 'rgba(244, 63, 94, 0.2)' : 'rgba(15, 23, 42, 0.6)';
    ctx.fillRect(panelX + 18, panelY + 300, panelW - 36, 65);
    ctx.strokeStyle = isAtOrBeyondEndpoint ? '#f43f5e' : '#334155';
    ctx.strokeRect(panelX + 18, panelY + 300, panelW - 36, 65);

    ctx.fillStyle = isAtOrBeyondEndpoint ? '#fda4af' : '#94a3b8';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      isAtOrBeyondEndpoint ? '✓ ENDPOINT REACHED: Permanent Pale Pink' : 'ENDPOINT STATUS: Colorless (pH < 8.2)',
      panelX + 28,
      panelY + 322
    );
    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillText(
      isAtOrBeyondEndpoint
        ? `Equivalence point observed at ${volumeDelivered.toFixed(2)} mL.`
        : `Continue titration dropwise as you approach ~18.5 mL.`,
      panelX + 28,
      panelY + 342
    );

    ctx.restore();
  }, [volumeDelivered, flowMode, flaskColor, swirlPhase, isAtOrBeyondEndpoint]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl select-none">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-3">
        <div className="flex items-center gap-2">
          <Beaker className="w-5 h-5 text-rose-400" />
          <h3 className="font-semibold text-white">Burette Titration Simulator</h3>
          <span className="px-2 py-0.5 rounded text-xs bg-rose-500/20 text-rose-400 border border-rose-500/30">Chemistry Practical</span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFlowMode(flowMode === 'dropwise' ? 'off' : 'dropwise')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              flowMode === 'dropwise'
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Droplet className="w-3.5 h-3.5" />
            <span>Dropwise Flow</span>
          </button>

          <button
            onClick={() => setFlowMode(flowMode === 'stream' ? 'off' : 'stream')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              flowMode === 'stream'
                ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/25'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Fast Stream</span>
          </button>

          <button
            onClick={() => {
              setFlowMode('off');
              setVolumeDelivered(0.0);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: '900px', height: 'auto', aspectRatio: '900/480' }}
        className="rounded-xl w-full block"
      />
    </div>
  );
};
