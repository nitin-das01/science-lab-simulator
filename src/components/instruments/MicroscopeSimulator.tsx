import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Microscope } from 'lucide-react';

export const MicroscopeSimulator: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Focus dial position (0 to 100 arbitrary focal plane units)
  const [coarseFocus, setCoarseFocus] = useState<number>(35);
  const [fineFocus, setFineFocus] = useState<number>(50);

  // Objective magnification: 10x | 40x | 100x
  const [objective, setObjective] = useState<10 | 40 | 100>(10);

  // Specimen slide: 'onion' | 'cheek'
  const [specimen, setSpecimen] = useState<'onion' | 'cheek'>('onion');

  // Optimal focal plane for specimen
  const OPTIMAL_COARSE = 40;
  const OPTIMAL_FINE = 50;

  // Focal blur computation
  const totalOffset = Math.abs(coarseFocus - OPTIMAL_COARSE) * 1.5 + Math.abs(fineFocus - OPTIMAL_FINE) * 0.25;
  const blurPixels = Math.max(0, Math.min(22, totalOffset * 0.7));
  const isSharpFocus = blurPixels < 1.0;

  const CANVAS_WIDTH = 860;
  const CANVAS_HEIGHT = 440;

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

    // Dark background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Left: Circular Microscope Eyepiece Field of View
    const fovX = 260;
    const fovY = 220;
    const fovRadius = 180;

    ctx.save();
    // Outer black barrel
    ctx.beginPath();
    ctx.arc(fovX, fovY, fovRadius + 18, 0, Math.PI * 2);
    ctx.fillStyle = '#020617';
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Circular clip path for eyepiece field
    ctx.beginPath();
    ctx.arc(fovX, fovY, fovRadius, 0, Math.PI * 2);
    ctx.clip();

    // Substage illumination light glow
    const lightGrad = ctx.createRadialGradient(fovX, fovY, 10, fovX, fovY, fovRadius);
    lightGrad.addColorStop(0, '#ffffff');
    lightGrad.addColorStop(0.7, '#fef9c3');
    lightGrad.addColorStop(1, '#ca8a04');
    ctx.fillStyle = lightGrad;
    ctx.fillRect(fovX - fovRadius, fovY - fovRadius, fovRadius * 2, fovRadius * 2);

    // Apply procedural cellular image with CSS-style blur filter simulated via Canvas filter
    ctx.filter = `blur(${blurPixels.toFixed(1)}px)`;

    const scaleFactor = objective === 10 ? 1.0 : objective === 40 ? 2.2 : 4.0;

    if (specimen === 'onion') {
      // ONION EPIDERMAL PEEL (Safranin Pink Stain)
      // Brick-like rectangular plant cells with distinct cell walls and peripheral nuclei
      ctx.strokeStyle = '#be123c'; // Dark pink cell wall
      ctx.lineWidth = 2.5 * scaleFactor;

      const cellW = 90 * scaleFactor;
      const cellH = 45 * scaleFactor;

      for (let row = -3; row <= 8; row++) {
        const rowOffsetX = (row % 2) * (cellW / 2);
        for (let col = -3; col <= 8; col++) {
          const cx = fovX - fovRadius + col * cellW + rowOffsetX;
          const cy = fovY - fovRadius + row * cellH;

          // Cytoplasm
          ctx.fillStyle = 'rgba(251, 113, 133, 0.45)';
          ctx.fillRect(cx, cy, cellW, cellH);
          ctx.strokeRect(cx, cy, cellW, cellH);

          // Prominent peripheral nucleus
          ctx.fillStyle = '#9f1239';
          ctx.beginPath();
          ctx.arc(cx + cellW * 0.75, cy + cellH * 0.65, 5 * scaleFactor, 0, Math.PI * 2);
          ctx.fill();

          // Central vacuole shadow
          ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
          ctx.beginPath();
          ctx.ellipse(cx + cellW * 0.45, cy + cellH * 0.5, cellW * 0.3, cellH * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } else {
      // HUMAN CHEEK CELLS (Methylene Blue Stain)
      // Polygonal irregular squamous cells with central dark nuclei
      ctx.strokeStyle = '#1d4ed8'; // Dark blue membrane
      ctx.lineWidth = 2 * scaleFactor;

      const cellSpacing = 85 * scaleFactor;
      for (let row = -2; row <= 6; row++) {
        for (let col = -2; col <= 6; col++) {
          const cx = fovX - fovRadius + col * cellSpacing + ((row * 37) % 40);
          const cy = fovY - fovRadius + row * cellSpacing + ((col * 29) % 35);

          // Irregular polygonal cell membrane
          ctx.beginPath();
          const r = 32 * scaleFactor;
          for (let a = 0; a < 6; a++) {
            const angle = (a / 6) * Math.PI * 2;
            const jitter = (Math.sin(a * 4 + row) * 0.2 + 0.9) * r;
            const px = cx + Math.cos(angle) * jitter;
            const py = cy + Math.sin(angle) * jitter;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();

          ctx.fillStyle = 'rgba(147, 197, 253, 0.4)';
          ctx.fill();
          ctx.stroke();

          // Dark prominent spherical nucleus
          ctx.fillStyle = '#1e3a8a';
          ctx.beginPath();
          ctx.arc(cx, cy, 6 * scaleFactor, 0, Math.PI * 2);
          ctx.fill();

          // Cytoplasmic granules
          ctx.fillStyle = 'rgba(30, 58, 138, 0.5)';
          ctx.beginPath();
          ctx.arc(cx + 8 * scaleFactor, cy - 6 * scaleFactor, 2, 0, Math.PI * 2);
          ctx.arc(cx - 7 * scaleFactor, cy + 9 * scaleFactor, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    ctx.restore(); // reset clip & filter

    // Eyepiece crosshair reticle
    ctx.strokeStyle = 'rgba(15, 23, 42, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(fovX - fovRadius, fovY);
    ctx.lineTo(fovX + fovRadius, fovY);
    ctx.moveTo(fovX, fovY - fovRadius);
    ctx.lineTo(fovX, fovY + fovRadius);
    ctx.stroke();

    // Right Microscope Controls & Specimen details
    const panelX = 500;
    const panelY = 40;
    const panelW = 320;
    const panelH = 360;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('COMPOUND MICROSCOPE', panelX + 18, panelY + 28);

    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Current Objective: ${objective}× (${objective * 10}× Total Magnification)`, panelX + 18, panelY + 54);
    ctx.fillText(`Mounted Specimen: ${specimen === 'onion' ? 'Onion Epidermal Peel' : 'Human Cheek Cells'}`, panelX + 18, panelY + 72);

    // Focus state badge
    ctx.fillStyle = isSharpFocus ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
    ctx.fillRect(panelX + 18, panelY + 95, panelW - 36, 48);
    ctx.strokeStyle = isSharpFocus ? '#10b981' : '#ef4444';
    ctx.strokeRect(panelX + 18, panelY + 95, panelW - 36, 48);

    ctx.fillStyle = isSharpFocus ? '#34d399' : '#f87171';
    ctx.font = '700 11px Inter, sans-serif';
    ctx.fillText(isSharpFocus ? '✓ OPTIMAL FOCAL PLANE (100% SHARP)' : '⚠ OUT OF FOCUS - ADJUST FOCUS DIALS', panelX + 28, panelY + 116);
    ctx.font = '500 10px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Focal blur: ${blurPixels.toFixed(1)} px. Rotate dials to sharpen image.`, panelX + 28, panelY + 132);

    // Cytological identification notes
    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px Inter, sans-serif';
    ctx.fillText('Key Cytological Features to Observe:', panelX + 18, panelY + 175);

    ctx.font = '400 10px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    if (specimen === 'onion') {
      ctx.fillText('• Rigid cell walls made of cellulose', panelX + 18, panelY + 195);
      ctx.fillText('• Large central vacuole pushing cytoplasm', panelX + 18, panelY + 215);
      ctx.fillText('• Nucleus positioned near cell periphery', panelX + 18, panelY + 235);
      ctx.fillText('• Absence of chloroplasts (non-photosynthetic)', panelX + 18, panelY + 255);
    } else {
      ctx.fillText('• Thin, flexible cell membrane (no cell wall)', panelX + 18, panelY + 195);
      ctx.fillText('• Prominent dark central spherical nucleus', panelX + 18, panelY + 215);
      ctx.fillText('• Granular cytoplasm with small vesicles', panelX + 18, panelY + 235);
      ctx.fillText('• Flat polygonal shape (stratified squamous)', panelX + 18, panelY + 255);
    }

    ctx.restore();
  }, [coarseFocus, fineFocus, objective, specimen, blurPixels, isSharpFocus]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl select-none">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-3">
        <div className="flex items-center gap-2">
          <Microscope className="w-5 h-5 text-emerald-400" />
          <h3 className="font-semibold text-white">Compound Microscope Simulator</h3>
          <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Biology Practical</span>
        </div>

        {/* Objective & Slide selection */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 px-1.5 font-medium">Objective:</span>
            {([10, 40, 100] as const).map((mag) => (
              <button
                key={mag}
                onClick={() => setObjective(mag)}
                className={`px-2.5 py-1 rounded font-mono font-semibold transition-all ${
                  objective === mag ? 'bg-cyan-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                {mag}×
              </button>
            ))}
          </div>

          <select
            value={specimen}
            onChange={(e) => setSpecimen(e.target.value as 'onion' | 'cheek')}
            className="bg-slate-800 text-slate-200 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium"
          >
            <option value="onion">Slide: Onion Peel (Safranin)</option>
            <option value="cheek">Slide: Cheek Cells (Methylene Blue)</option>
          </select>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: '860px', height: 'auto', aspectRatio: '860/440' }}
        className="rounded-xl w-full block"
      />

      {/* Focus adjustment controls */}
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs">
        <div>
          <div className="flex justify-between text-slate-300 font-medium mb-1">
            <span>Coarse Focus Dial (Rapid Stage Height)</span>
            <span className="font-mono text-cyan-400">{coarseFocus}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={coarseFocus}
            onChange={(e) => setCoarseFocus(Number(e.target.value))}
            className="w-full accent-cyan-500"
          />
        </div>

        <div>
          <div className="flex justify-between text-slate-300 font-medium mb-1">
            <span>Fine Focus Dial (Micrometer Precision)</span>
            <span className="font-mono text-emerald-400">{fineFocus}</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={fineFocus}
            onChange={(e) => setFineFocus(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>
    </div>
  );
};
