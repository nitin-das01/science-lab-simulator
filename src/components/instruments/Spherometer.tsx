import React, { useRef, useEffect, useCallback } from 'react';
import type { TestObject } from '../../types/instruments';
import { RotateCw, Compass } from 'lucide-react';

interface SpherometerProps {
  currentPosition: number; // sagitta h in mm (e.g. 0 to 10 mm)
  zeroError: number;
  clampedObject?: TestObject | null;
  onPositionChange: (newPos: number) => void;
  onRatchetSound?: () => void;
}

export const Spherometer: React.FC<SpherometerProps> = ({
  currentPosition,
  zeroError,
  onPositionChange,
  onRatchetSound,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const startPosRef = useRef(0);

  const CANVAS_WIDTH = 900;
  const CANVAS_HEIGHT = 420;

  // Spherometer formula:
  // l = mean distance between outer legs = 45 mm
  // h = sagitta (currentPosition - zeroError)
  // R = (l^2) / (6 * h) + h / 2
  const l = 45.0; // mm
  const effectiveH = Math.max(0.01, currentPosition - zeroError);
  const radiusOfCurvature = (l * l) / (6 * effectiveH) + effectiveH / 2;

  // Pitch = 1 mm, Circular Divisions = 100 -> Least Count = 0.01 mm
  const pitch = 1.0;
  const totalDivisions = 100;
  const leastCount = pitch / totalDivisions;
  const mainScaleReading = Math.floor(currentPosition);
  const circularDivision = Math.round((currentPosition - mainScaleReading) / leastCount) % totalDivisions;

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

    // Workbench background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid lines
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    for (let x = 0; x < CANVAS_WIDTH; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y < CANVAS_HEIGHT; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    const CX = 340;
    const CY = 180;

    // Specimen surface (e.g. watch glass / mirror curve)
    const tableY = 320;
    ctx.strokeStyle = '#0284c7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    // Curved watch glass arc
    const sagittaPx = currentPosition * 12;
    ctx.moveTo(CX - 160, tableY);
    ctx.quadraticCurveTo(CX, tableY - sagittaPx * 2, CX + 160, tableY);
    ctx.stroke();

    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.fill();

    // 1. Spherometer Tripod Legs (Outer fixed legs)
    const legGrad = ctx.createLinearGradient(0, 0, 0, 400);
    legGrad.addColorStop(0, '#cbd5e1');
    legGrad.addColorStop(1, '#475569');
    ctx.fillStyle = legGrad;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;

    // Left leg
    ctx.fillRect(CX - 120, CY + 40, 10, tableY - (CY + 40));
    ctx.strokeRect(CX - 120, CY + 40, 10, tableY - (CY + 40));
    // Right leg
    ctx.fillRect(CX + 110, CY + 40, 10, tableY - (CY + 40));
    ctx.strokeRect(CX + 110, CY + 40, 10, tableY - (CY + 40));

    // Triangular Brass Base Frame
    ctx.beginPath();
    ctx.roundRect(CX - 140, CY + 30, 280, 24, 6);
    const brassGrad = ctx.createLinearGradient(0, CY + 30, 0, CY + 54);
    brassGrad.addColorStop(0, '#fde047');
    brassGrad.addColorStop(0.5, '#ca8a04');
    brassGrad.addColorStop(1, '#854d0e');
    ctx.fillStyle = brassGrad;
    ctx.fill();
    ctx.stroke();

    // 2. Central Screw Rod & Tip
    const centralScrewY = tableY - sagittaPx * 2;
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(CX - 6, CY - 60, 12, centralScrewY - (CY - 60));
    ctx.strokeRect(CX - 6, CY - 60, 12, centralScrewY - (CY - 60));
    // Conical pointed tip
    ctx.beginPath();
    ctx.moveTo(CX - 6, centralScrewY);
    ctx.lineTo(CX, centralScrewY + 8);
    ctx.lineTo(CX + 6, centralScrewY);
    ctx.closePath();
    ctx.fillStyle = '#64748b';
    ctx.fill();

    // 3. Vertical Linear Pitch Scale (Attached to one leg)
    const scaleX = CX - 75;
    const scaleY = CY - 80;
    const scaleW = 26;
    const scaleH = 140;

    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(scaleX, scaleY, scaleW, scaleH);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(scaleX, scaleY, scaleW, scaleH);

    // Millimeter marks on vertical scale
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'right';
    for (let m = -5; m <= 10; m++) {
      const my = scaleY + scaleH / 2 - m * 8;
      const isMajor = m % 5 === 0;
      ctx.lineWidth = isMajor ? 1.4 : 0.8;
      ctx.beginPath();
      ctx.moveTo(scaleX + scaleW, my);
      ctx.lineTo(scaleX + scaleW - (isMajor ? 12 : 7), my);
      ctx.stroke();

      if (isMajor) {
        ctx.font = '600 8px JetBrains Mono, monospace';
        ctx.fillText(`${m}`, scaleX + scaleW - 14, my + 3);
      }
    }

    // 4. Circular Disc with 100 Graduations
    const discRadiusX = 110;
    const discRadiusY = 22;
    const discCenterY = CY - 20;

    // Disc 3D ellipse
    ctx.beginPath();
    ctx.ellipse(CX, discCenterY, discRadiusX, discRadiusY, 0, 0, Math.PI * 2);
    const discGrad = ctx.createLinearGradient(CX - discRadiusX, 0, CX + discRadiusX, 0);
    discGrad.addColorStop(0, '#94a3b8');
    discGrad.addColorStop(0.3, '#f8fafc');
    discGrad.addColorStop(0.7, '#cbd5e1');
    discGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = discGrad;
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Circular ticks on rim of the disc
    for (let d = 0; d < 100; d += 2) {
      let dOff = d - circularDivision;
      while (dOff > 50) dOff -= 100;
      while (dOff < -50) dOff += 100;

      const angle = (dOff / 100) * Math.PI * 2;
      if (Math.cos(angle) > -0.1) {
        const tx = CX + Math.sin(angle) * (discRadiusX - 4);
        const ty = discCenterY + Math.cos(angle) * (discRadiusY - 4);
        const isAligned = d === circularDivision;

        ctx.strokeStyle = isAligned ? '#06b6d4' : '#0f172a';
        ctx.lineWidth = isAligned ? 2.5 : d % 10 === 0 ? 1.5 : 0.8;

        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx, ty + (d % 10 === 0 ? 9 : 5));
        ctx.stroke();
      }
    }

    // Top Knurled Turning Head
    ctx.fillStyle = '#475569';
    ctx.fillRect(CX - 18, CY - 60, 36, 25);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(CX - 18, CY - 60, 36, 25);

    // 5. Right Formula & Live Computation Panel
    ctx.save();
    const panelX = 580;
    const panelY = 40;
    const panelW = 280;
    const panelH = 340;

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(panelX, panelY, panelW, panelH);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(panelX, panelY, panelW, panelH);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('SPHEROMETER ANALYSIS', panelX + 16, panelY + 28);

    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('Pitch (P) = 1.0 mm', panelX + 16, panelY + 54);
    ctx.fillText('Circular Divisions (N) = 100', panelX + 16, panelY + 72);
    ctx.fillText(`Least Count (LC) = P/N = 0.01 mm`, panelX + 16, panelY + 90);

    ctx.strokeStyle = '#334155';
    ctx.beginPath();
    ctx.moveTo(panelX + 16, panelY + 104);
    ctx.lineTo(panelX + panelW - 16, panelY + 104);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = '600 11px JetBrains Mono, monospace';
    ctx.fillText(`Pitch Scale (MSR): ${mainScaleReading} mm`, panelX + 16, panelY + 128);
    ctx.fillText(`Circular Scale (VSR): div ${circularDivision}`, panelX + 16, panelY + 148);
    ctx.fillText(`Sagitta (h): ${currentPosition.toFixed(2)} mm`, panelX + 16, panelY + 172);

    ctx.fillStyle = '#06b6d4';
    ctx.font = '700 12px JetBrains Mono, monospace';
    ctx.fillText(`R = l²/(6h) + h/2`, panelX + 16, panelY + 210);

    ctx.fillStyle = '#10b981';
    ctx.font = '700 14px JetBrains Mono, monospace';
    ctx.fillText(`R ≈ ${radiusOfCurvature.toFixed(1)} mm`, panelX + 16, panelY + 240);
    ctx.font = '500 11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Radius of Curvature of Spherical Mirror`, panelX + 16, panelY + 262);

    ctx.restore();

    ctx.restore();
  }, [currentPosition, zeroError, mainScaleReading, circularDivision, radiusOfCurvature]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer drag on central screw
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    isDraggingRef.current = true;
    dragStartYRef.current = (e.clientY - rect.top) * scaleY;
    startPosRef.current = currentPosition;
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleY = CANVAS_HEIGHT / rect.height;
    const currentY = (e.clientY - rect.top) * scaleY;

    const deltaY = dragStartYRef.current - currentY;
    const newPos = Math.max(0, Math.min(8.0, Number((startPosRef.current + deltaY * 0.02).toFixed(2))));
    if (newPos !== currentPosition) {
      onPositionChange(newPos);
      onRatchetSound?.();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && canvas.hasPointerCapture(e.pointerId)) {
      canvas.releasePointerCapture(e.pointerId);
    }
  };

  return (
    <div className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl select-none">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-white">Spherometer Simulator</h3>
          <span className="px-2 py-0.5 rounded text-xs bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">Physics Practical</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => {
              const next = Number(Math.min(8, currentPosition + 0.05).toFixed(2));
              onPositionChange(next);
              onRatchetSound?.();
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
          >
            <RotateCw className="w-3 h-3 text-cyan-400" /> +0.05mm
          </button>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: '900px', height: 'auto', aspectRatio: '900/420' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-ns-resize rounded-xl w-full block"
      />

      <div className="mt-2 text-xs text-slate-400 flex justify-between px-2">
        <span>Drag vertically to elevate/lower central screw onto spherical surface.</span>
        <span className="text-cyan-400 font-mono">Current Sagitta h = {currentPosition.toFixed(2)} mm</span>
      </div>
    </div>
  );
};
