import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Zap } from 'lucide-react';

interface MetreBridgeProps {
  onTickSound?: () => void;
}

export const MetreBridge: React.FC<MetreBridgeProps> = ({ onTickSound }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);

  // Jockey slider position in cm (0 to 100 cm)
  const [jockeyPos, setJockeyPos] = useState<number>(48.5);
  // Known resistance in Left Gap: R = 5.0 Ohms
  const [knownR, setKnownR] = useState<number>(5.0);
  // True unknown resistance in Right Gap: X = 7.5 Ohms
  const trueX = 7.5;

  // Theoretical balance length:
  // R / X = l / (100 - l)  =>  l_null = (100 * R) / (R + X)
  const nullLength = (100 * knownR) / (knownR + trueX);

  // Galvanometer deflection: proportional to (jockeyPos - nullLength)
  const deflectionAngle = Math.max(-45, Math.min(45, (jockeyPos - nullLength) * 5.5));
  const isNullDeflection = Math.abs(jockeyPos - nullLength) < 0.2;

  // Experimental calculated X
  const experimentalX = Number(((knownR * (100 - jockeyPos)) / jockeyPos).toFixed(2));

  const CANVAS_WIDTH = 960;
  const CANVAS_HEIGHT = 420;

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

    // Dark workbench background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Wooden board base
    ctx.fillStyle = '#1c1917';
    ctx.fillRect(50, 40, 860, 340);
    ctx.strokeStyle = '#44403c';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 40, 860, 340);

    // Heavy Copper Strips with terminals
    const stripGrad = ctx.createLinearGradient(0, 0, 0, 400);
    stripGrad.addColorStop(0, '#f97316');
    stripGrad.addColorStop(0.5, '#ea580c');
    stripGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = stripGrad;
    ctx.strokeStyle = '#7c2d12';
    ctx.lineWidth = 1.5;

    // Left L-strip
    ctx.fillRect(90, 80, 140, 24);
    ctx.fillRect(90, 80, 26, 170);
    // Center T-strip
    ctx.fillRect(360, 80, 240, 24);
    // Right L-strip
    ctx.fillRect(730, 80, 140, 24);
    ctx.fillRect(844, 80, 26, 170);

    // Binding terminal posts
    const drawTerminal = (x: number, y: number, label: string) => {
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#854d0e';
      ctx.stroke();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '600 8px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(label, x, y - 10);
    };

    drawTerminal(220, 92, 'L1');
    drawTerminal(370, 92, 'L2');
    drawTerminal(590, 92, 'R1');
    drawTerminal(740, 92, 'R2');
    drawTerminal(480, 92, 'G');

    // Left Gap: Resistance Box (R)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(250, 65, 100, 50);
    ctx.strokeStyle = '#06b6d4';
    ctx.strokeRect(250, 65, 100, 50);
    ctx.fillStyle = '#38bdf8';
    ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Resistance Box', 300, 86);
    ctx.fillText(`R = ${knownR.toFixed(1)} Ω`, 300, 102);

    // Right Gap: Unknown Resistance Wire Coil (X)
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(610, 65, 110, 50);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(610, 65, 110, 50);
    ctx.fillStyle = '#fbbf24';
    ctx.font = '600 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('Unknown Coil (X)', 665, 86);
    ctx.fillText('X = ? Ω', 665, 102);

    // 1-Meter Manganin Wire & Scale
    const wireStartX = 116;
    const wireEndX = 844;
    const wireLengthPx = wireEndX - wireStartX; // ~728 px = 100 cm
    const wireY = 240;

    // Wooden Meter Scale background
    ctx.fillStyle = '#fef08a';
    ctx.fillRect(wireStartX, wireY + 8, wireLengthPx, 26);
    ctx.strokeStyle = '#ca8a04';
    ctx.strokeRect(wireStartX, wireY + 8, wireLengthPx, 26);

    // Meter scale markings (0 to 100 cm)
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';
    for (let cm = 0; cm <= 100; cm++) {
      const markX = wireStartX + (cm / 100) * wireLengthPx;
      const isMajor = cm % 10 === 0;
      const isMid = cm % 5 === 0;

      ctx.lineWidth = isMajor ? 1.2 : 0.6;
      ctx.beginPath();
      ctx.moveTo(markX, wireY + 8);
      ctx.lineTo(markX, wireY + 8 + (isMajor ? 14 : isMid ? 9 : 5));
      ctx.stroke();

      if (isMajor && cm % 20 === 0) {
        ctx.font = '600 8px JetBrains Mono, monospace';
        ctx.fillText(`${cm}`, markX, wireY + 31);
      }
    }

    // Taut Constantan / Manganin Wire
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(wireStartX, wireY);
    ctx.lineTo(wireEndX, wireY);
    ctx.stroke();

    // Jockey Slider (Knife-Edge contact)
    const jockeyX = wireStartX + (jockeyPos / 100) * wireLengthPx;
    ctx.save();
    // Jockey handle
    ctx.fillStyle = '#0284c7';
    ctx.fillRect(jockeyX - 6, wireY - 45, 12, 40);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(jockeyX - 6, wireY - 45, 12, 40);

    // Knife edge contact
    ctx.beginPath();
    ctx.moveTo(jockeyX - 4, wireY - 5);
    ctx.lineTo(jockeyX, wireY);
    ctx.lineTo(jockeyX + 4, wireY - 5);
    ctx.closePath();
    ctx.fillStyle = '#f8fafc';
    ctx.fill();

    // Jockey label
    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 10px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${jockeyPos.toFixed(1)} cm`, jockeyX, wireY - 52);
    ctx.restore();

    // Analog Galvanometer Dial (Top Right Center)
    const galvX = 480;
    const galvY = 175;
    const galvRadius = 42;

    ctx.save();
    ctx.beginPath();
    ctx.arc(galvX, galvY, galvRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = isNullDeflection ? '#10b981' : '#334155';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Scale arc
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(galvX, galvY + 12, 28, -Math.PI * 0.75, -Math.PI * 0.25);
    ctx.stroke();

    // Center Zero mark
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 8px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0', galvX, galvY - 14);
    ctx.fillText('G', galvX, galvY + 28);

    // Deflecting Pointer Needle
    ctx.save();
    ctx.translate(galvX, galvY + 12);
    ctx.rotate((deflectionAngle * Math.PI) / 180);
    ctx.strokeStyle = isNullDeflection ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -28);
    ctx.stroke();
    ctx.restore();

    // Center pivot
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(galvX, galvY + 12, 4, 0, Math.PI * 2);
    ctx.fill();

    if (isNullDeflection) {
      ctx.fillStyle = '#10b981';
      ctx.font = '700 9px JetBrains Mono, monospace';
      ctx.fillText('NULL BALANCE (Ig=0)', galvX, galvY - 48);
    }
    ctx.restore();

    ctx.restore();
  }, [jockeyPos, knownR, trueX, nullLength, deflectionAngle, isNullDeflection]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    const canvas = canvasRef.current;
    if (canvas) canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;

    const wireStartX = 116;
    const wireEndX = 844;
    const wireLen = wireEndX - wireStartX;

    const rawPos = ((clickX - wireStartX) / wireLen) * 100;
    const clampedPos = Math.max(1, Math.min(99, Number(rawPos.toFixed(1))));
    setJockeyPos(clampedPos);
    onTickSound?.();
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
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 mb-3 gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" />
          <h3 className="font-semibold text-white">Metre Bridge (Wheatstone Bridge)</h3>
          <span className="px-2 py-0.5 rounded text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">Physics Practical</span>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <label className="text-slate-400 flex items-center gap-1.5">
            Known Resistance R:
            <select
              value={knownR}
              onChange={(e) => setKnownR(Number(e.target.value))}
              className="bg-slate-800 text-slate-200 border border-slate-700 rounded px-2 py-1 font-mono"
            >
              <option value="2.0">2.0 Ω</option>
              <option value="5.0">5.0 Ω</option>
              <option value="10.0">10.0 Ω</option>
            </select>
          </label>
        </div>
      </div>

      <canvas
        ref={canvasRef}
        style={{ width: '100%', maxWidth: '960px', height: 'auto', aspectRatio: '960/420' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="cursor-ew-resize rounded-xl w-full block"
      />

      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
        <div>
          <span className="text-slate-400">Balancing Length l:</span>
          <span className="font-mono text-cyan-400 ml-2 font-bold">{jockeyPos.toFixed(1)} cm</span>
        </div>
        <div>
          <span className="text-slate-400">Remaining (100 - l):</span>
          <span className="font-mono text-cyan-400 ml-2 font-bold">{(100 - jockeyPos).toFixed(1)} cm</span>
        </div>
        <div>
          <span className="text-slate-400">Formula: X = R(100 - l) / l = </span>
          <span className="font-mono text-emerald-400 ml-2 font-bold">{experimentalX} Ω</span>
        </div>
      </div>
    </div>
  );
};
