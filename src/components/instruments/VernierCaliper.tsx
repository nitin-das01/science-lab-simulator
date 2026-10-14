import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TestObject } from '../../types/instruments';
import { calculateVernier } from '../../utils/vernierMath';
import { Maximize2, Lock, Unlock } from 'lucide-react';

interface VernierCaliperProps {
  currentPosition: number;
  zeroError: number;
  divisionsCount: 10 | 20;
  clampedObject: TestObject | null;
  isLocked: boolean;
  onPositionChange: (newPos: number) => void;
  onLockToggle: () => void;
  onTickSound?: () => void;
  showCoincidenceHint?: boolean;
}

export const VernierCaliper: React.FC<VernierCaliperProps> = ({
  currentPosition,
  zeroError,
  divisionsCount,
  clampedObject,
  isLocked,
  onPositionChange,
  onLockToggle,
  onTickSound,
  showCoincidenceHint = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const startPosRef = useRef(0);

  // Loupe magnifier inspection state
  const [loupeActive, setLoupeActive] = useState(true);
  const [loupePosition, setLoupePosition] = useState<{ x: number; y: number } | null>(null);

  // 1 mm in canvas world space
  const PIXELS_PER_MM = 6.2;
  const CANVAS_HEIGHT = 380;
  const CANVAS_WIDTH = 1100;
  const ZERO_OFFSET_X = 175; // X position where 0 mm mark is on main scale
  const BEAM_Y = 145; // Y position of main scale beam top
  const BEAM_HEIGHT = 64;

  const vernierData = calculateVernier(currentPosition, zeroError, divisionsCount);

  // Keyboard navigation for micro-stepping
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      let delta = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        delta = e.shiftKey ? 1.0 : e.altKey ? 0.01 : 0.1;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        delta = e.shiftKey ? -1.0 : e.altKey ? -0.01 : -0.1;
      }

      if (delta !== 0) {
        e.preventDefault();
        const newPos = Math.max(0, Math.min(130, Number((currentPosition + delta).toFixed(2))));
        onPositionChange(newPos);
        onTickSound?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPosition, isLocked, onPositionChange, onTickSound]);

  // Procedural Canvas Renderer
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

    // Canvas Background (subtle laboratory grid)
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Grid lines for lab workbench feel
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

    // Positions
    const jawGapMm = currentPosition;
    const sliderPixelOffset = jawGapMm * PIXELS_PER_MM;
    const sliderZeroX = ZERO_OFFSET_X + sliderPixelOffset;

    // ==========================================
    // 1. RETRACTABLE DEPTH PROBE (Far Right Tail)
    // ==========================================
    const probeWidth = Math.max(10, sliderPixelOffset + 20);
    const probeStartX = ZERO_OFFSET_X + 135 * PIXELS_PER_MM;
    const probeY = BEAM_Y + 28;
    
    // Depth probe slot & bar
    ctx.fillStyle = '#475569';
    ctx.fillRect(probeStartX, probeY - 3, probeWidth, 6);
    const probeGrad = ctx.createLinearGradient(probeStartX, probeY - 3, probeStartX, probeY + 3);
    probeGrad.addColorStop(0, '#94a3b8');
    probeGrad.addColorStop(0.5, '#f8fafc');
    probeGrad.addColorStop(1, '#64748b');
    ctx.fillStyle = probeGrad;
    ctx.fillRect(probeStartX, probeY - 2.5, probeWidth, 5);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(probeStartX, probeY - 3, probeWidth, 6);

    // Depth measurement specimen rendering if clamped
    if (clampedObject && clampedObject.dimensionType === 'depth') {
      const cavityX = probeStartX + probeWidth - 5;
      const cavityW = 35;
      const cavityH = 90;
      ctx.save();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.strokeRect(cavityX, probeY - cavityH / 2, cavityW, cavityH);
      ctx.fillRect(cavityX, probeY - cavityH / 2, cavityW, cavityH);
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#7dd3fc';
      ctx.fillText('Depth Cavity', cavityX + 2, probeY - cavityH / 2 - 8);
      ctx.restore();
    }

    // ==========================================
    // 2. MAIN BEAM & FIXED JAWS (Stainless Steel)
    // ==========================================
    const beamStartX = ZERO_OFFSET_X - 110;
    const beamEndX = ZERO_OFFSET_X + 135 * PIXELS_PER_MM + 20;

    // Draw Fixed Jaws & Main Beam
    ctx.save();
    // Brushed stainless steel gradient for the beam
    const steelGrad = ctx.createLinearGradient(0, BEAM_Y, 0, BEAM_Y + BEAM_HEIGHT);
    steelGrad.addColorStop(0, '#cbd5e1');
    steelGrad.addColorStop(0.15, '#e2e8f0');
    steelGrad.addColorStop(0.5, '#94a3b8');
    steelGrad.addColorStop(0.85, '#64748b');
    steelGrad.addColorStop(1, '#475569');

    // Main scale beam bar
    ctx.fillStyle = steelGrad;
    ctx.fillRect(beamStartX, BEAM_Y, beamEndX - beamStartX, BEAM_HEIGHT);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(beamStartX, BEAM_Y, beamEndX - beamStartX, BEAM_HEIGHT);

    // Fixed External Jaw (Lower Jaw on left)
    const jawBottomY = BEAM_Y + BEAM_HEIGHT + 135;
    ctx.beginPath();
    ctx.moveTo(beamStartX, BEAM_Y + BEAM_HEIGHT);
    ctx.lineTo(ZERO_OFFSET_X - 25, BEAM_Y + BEAM_HEIGHT);
    ctx.lineTo(ZERO_OFFSET_X, BEAM_Y + BEAM_HEIGHT + 20); // bevel down
    ctx.lineTo(ZERO_OFFSET_X, jawBottomY); // measurement contact face
    ctx.lineTo(ZERO_OFFSET_X - 14, jawBottomY);
    ctx.lineTo(ZERO_OFFSET_X - 45, BEAM_Y + BEAM_HEIGHT + 65);
    ctx.lineTo(beamStartX, BEAM_Y + BEAM_HEIGHT + 35);
    ctx.closePath();
    ctx.fillStyle = steelGrad;
    ctx.fill();
    ctx.stroke();

    // Fixed Internal Jaw (Upper Jaw on left)
    const upperJawY = BEAM_Y - 75;
    ctx.beginPath();
    ctx.moveTo(beamStartX, BEAM_Y);
    ctx.lineTo(ZERO_OFFSET_X - 25, BEAM_Y);
    ctx.lineTo(ZERO_OFFSET_X, BEAM_Y - 15);
    ctx.lineTo(ZERO_OFFSET_X, upperJawY); // contact edge
    ctx.lineTo(ZERO_OFFSET_X - 16, upperJawY);
    ctx.lineTo(ZERO_OFFSET_X - 40, BEAM_Y - 25);
    ctx.lineTo(beamStartX, BEAM_Y - 10);
    ctx.closePath();
    ctx.fillStyle = steelGrad;
    ctx.fill();
    ctx.stroke();

    // Screw / rivet details on fixed head
    ctx.fillStyle = '#334155';
    ctx.beginPath();
    ctx.arc(ZERO_OFFSET_X - 60, BEAM_Y + BEAM_HEIGHT / 2, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#1e293b';
    ctx.stroke();

    // ==========================================
    // 3. MAIN SCALE GRADUATIONS (Metric 0 - 130 mm)
    // ==========================================
    const metricAxisY = BEAM_Y + BEAM_HEIGHT - 4; // Bottom of beam
    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    for (let mm = 0; mm <= 130; mm++) {
      const tickX = ZERO_OFFSET_X + mm * PIXELS_PER_MM;
      let tickHeight = 7;

      if (mm % 10 === 0) {
        tickHeight = 20;
        ctx.lineWidth = 1.6;
        ctx.font = '600 11px JetBrains Mono, monospace';
        // Label in centimeters (0, 1, 2, 3...)
        ctx.fillText(`${mm / 10}`, tickX, metricAxisY - tickHeight - 2);
      } else if (mm % 5 === 0) {
        tickHeight = 13;
        ctx.lineWidth = 1.2;
      } else {
        tickHeight = 8;
        ctx.lineWidth = 0.9;
      }

      ctx.beginPath();
      ctx.moveTo(tickX, metricAxisY);
      ctx.lineTo(tickX, metricAxisY - tickHeight);
      ctx.stroke();
    }

    // Metric unit label
    ctx.font = '700 10px JetBrains Mono, monospace';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#334155';
    ctx.fillText('cm (1 mm divs)', ZERO_OFFSET_X + 130 * PIXELS_PER_MM - 60, BEAM_Y + 16);

    // Upper imperial scale markings (decorative & authentic)
    const inchAxisY = BEAM_Y + 4;
    for (let inch = 0; inch <= 5; inch++) {
      const inX = ZERO_OFFSET_X + inch * 25.4 * PIXELS_PER_MM;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(inX, inchAxisY);
      ctx.lineTo(inX, inchAxisY + 14);
      ctx.stroke();
      if (inch > 0) {
        ctx.font = '600 9px JetBrains Mono, monospace';
        ctx.fillText(`${inch}"`, inX, inchAxisY + 24);
      }
    }
    ctx.restore();

    // ==========================================
    // 4. CLAMPED TEST OBJECT RENDERING
    // ==========================================
    if (clampedObject) {
      ctx.save();
      const objWidthPx = jawGapMm * PIXELS_PER_MM;
      const objCenterX = ZERO_OFFSET_X + objWidthPx / 2;

      if (clampedObject.dimensionType === 'external') {
        const objCenterY = BEAM_Y + BEAM_HEIGHT + 65;
        const objRadiusPx = Math.max(8, objWidthPx / 2);

        if (clampedObject.renderShape === 'sphere') {
          // Steel ball 3D sphere gradient
          const sphereGrad = ctx.createRadialGradient(
            objCenterX - objRadiusPx * 0.35,
            objCenterY - objRadiusPx * 0.35,
            objRadiusPx * 0.1,
            objCenterX,
            objCenterY,
            objRadiusPx
          );
          sphereGrad.addColorStop(0, '#ffffff');
          sphereGrad.addColorStop(0.3, clampedObject.color);
          sphereGrad.addColorStop(0.7, clampedObject.secondaryColor || '#334155');
          sphereGrad.addColorStop(1, '#0f172a');

          ctx.fillStyle = sphereGrad;
          ctx.beginPath();
          ctx.arc(objCenterX, objCenterY, objRadiusPx, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = 'rgba(255,255,255,0.4)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
        } else {
          // Block / Cylinder
          const blockH = Math.min(80, objRadiusPx * 2.2);
          const blockY = objCenterY - blockH / 2;
          const rectGrad = ctx.createLinearGradient(ZERO_OFFSET_X, blockY, ZERO_OFFSET_X + objWidthPx, blockY);
          rectGrad.addColorStop(0, clampedObject.secondaryColor || '#334155');
          rectGrad.addColorStop(0.4, clampedObject.color);
          rectGrad.addColorStop(1, clampedObject.secondaryColor || '#1e293b');

          ctx.fillStyle = rectGrad;
          ctx.fillRect(ZERO_OFFSET_X, blockY, objWidthPx, blockH);
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 1.5;
          ctx.strokeRect(ZERO_OFFSET_X, blockY, objWidthPx, blockH);
        }

        // Dimension Callout badge
        ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
        ctx.fillRect(objCenterX - 36, objCenterY + 48, 72, 18);
        ctx.strokeStyle = '#06b6d4';
        ctx.strokeRect(objCenterX - 36, objCenterY + 48, 72, 18);
        ctx.fillStyle = '#38bdf8';
        ctx.font = '600 10px JetBrains Mono, monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`${clampedObject.name.split(' ')[0]}`, objCenterX, objCenterY + 61);
      } else if (clampedObject.dimensionType === 'internal') {
        // Internal hollow cylinder between upper jaws
        const upperGapW = sliderPixelOffset;
        const upperX = ZERO_OFFSET_X;
        const upperY = BEAM_Y - 45;
        ctx.fillStyle = 'rgba(234, 179, 8, 0.25)';
        ctx.strokeStyle = '#eab308';
        ctx.lineWidth = 2;
        ctx.strokeRect(upperX, upperY - 20, upperGapW, 40);
        ctx.fillRect(upperX, upperY - 20, upperGapW, 40);
        ctx.font = '10px Inter, sans-serif';
        ctx.fillStyle = '#fde047';
        ctx.textAlign = 'center';
        ctx.fillText('Internal Bore', upperX + upperGapW / 2, upperY - 25);
      }
      ctx.restore();
    }

    // ==========================================
    // 5. MOVABLE VERNIER SLIDER (Chrome & Titanium)
    // ==========================================
    ctx.save();
    const sliderWidth = 115;
    const sliderLeft = sliderZeroX - 16;
    const sliderTop = BEAM_Y - 30;
    const sliderHeight = BEAM_HEIGHT + 55;

    // Movable Lower Jaw (External measurement contact edge)
    ctx.beginPath();
    ctx.moveTo(sliderZeroX, BEAM_Y + BEAM_HEIGHT);
    ctx.lineTo(sliderZeroX, jawBottomY); // measurement contact face
    ctx.lineTo(sliderZeroX + 16, jawBottomY);
    ctx.lineTo(sliderZeroX + 48, BEAM_Y + BEAM_HEIGHT + 65);
    ctx.lineTo(sliderLeft + sliderWidth, BEAM_Y + BEAM_HEIGHT + 35);
    ctx.lineTo(sliderLeft + sliderWidth, BEAM_Y + BEAM_HEIGHT);
    ctx.closePath();

    const sliderGrad = ctx.createLinearGradient(sliderLeft, 0, sliderLeft + sliderWidth, 0);
    sliderGrad.addColorStop(0, '#e2e8f0');
    sliderGrad.addColorStop(0.3, '#f1f5f9');
    sliderGrad.addColorStop(0.7, '#cbd5e1');
    sliderGrad.addColorStop(1, '#94a3b8');

    ctx.fillStyle = sliderGrad;
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Movable Upper Jaw (Internal measurement)
    ctx.beginPath();
    ctx.moveTo(sliderZeroX, BEAM_Y);
    ctx.lineTo(sliderZeroX, upperJawY); // contact edge
    ctx.lineTo(sliderZeroX + 16, upperJawY);
    ctx.lineTo(sliderZeroX + 40, BEAM_Y - 25);
    ctx.lineTo(sliderLeft + sliderWidth, BEAM_Y - 10);
    ctx.lineTo(sliderLeft + sliderWidth, BEAM_Y);
    ctx.closePath();
    ctx.fillStyle = sliderGrad;
    ctx.fill();
    ctx.stroke();

    // Slider Body / Window Frame over the main beam
    ctx.fillStyle = sliderGrad;
    ctx.fillRect(sliderLeft, sliderTop, sliderWidth, sliderHeight);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sliderLeft, sliderTop, sliderWidth, sliderHeight);

    // Bevel Cutout Window to reveal main scale numbers underneath
    const winX = sliderLeft + 12;
    const winY = BEAM_Y - 15;
    const winW = sliderWidth - 24;
    const winH = 34;
    ctx.clearRect(winX, winY, winW, winH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(winX, winY, winW, winH);

    // Knurled thumb grip (grooved surface for dragging)
    const gripX = sliderLeft + sliderWidth - 18;
    const gripY = BEAM_Y + BEAM_HEIGHT + 6;
    const gripW = 14;
    const gripH = 34;
    ctx.fillStyle = '#475569';
    ctx.fillRect(gripX, gripY, gripW, gripH);
    ctx.strokeStyle = '#1e293b';
    for (let gy = gripY + 4; gy < gripY + gripH - 3; gy += 4) {
      ctx.beginPath();
      ctx.moveTo(gripX + 2, gy);
      ctx.lineTo(gripX + gripW - 2, gy);
      ctx.stroke();
    }

    // Locking screw knob at top of slider
    const screwX = sliderLeft + 35;
    const screwY = sliderTop - 12;
    ctx.fillStyle = isLocked ? '#f43f5e' : '#64748b';
    ctx.fillRect(screwX, screwY, 22, 12);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(screwX, screwY, 22, 12);
    // Knurling lines on screw
    for (let sx = screwX + 3; sx < screwX + 20; sx += 4) {
      ctx.beginPath();
      ctx.moveTo(sx, screwY + 2);
      ctx.lineTo(sx, screwY + 10);
      ctx.stroke();
    }

    // ==========================================
    // 6. VERNIER SCALE GRADUATIONS (10 or 20 divisions)
    // ==========================================
    // In standard metric caliper:
    // 10 VSD = 9 mm (each VSD = 0.9 mm = 0.9 * PIXELS_PER_MM)
    // 20 VSD = 19 mm (each VSD = 0.95 mm = 0.95 * PIXELS_PER_MM)
    const vsdLengthMm = (divisionsCount - 1) / divisionsCount;
    const vsdPixels = vsdLengthMm * PIXELS_PER_MM;
    const vernierBaseY = BEAM_Y + BEAM_HEIGHT; // Top edge of vernier scale window

    ctx.fillStyle = '#0f172a';
    ctx.strokeStyle = '#0f172a';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let div = 0; div <= divisionsCount; div++) {
      const lineX = sliderZeroX + div * vsdPixels;
      let lineH = 9;

      if (div === 0 || div === divisionsCount || (divisionsCount === 10 && div === 5) || (divisionsCount === 20 && div % 5 === 0)) {
        lineH = 16;
        ctx.lineWidth = 1.3;
        ctx.font = '600 9px JetBrains Mono, monospace';
        const labelText = divisionsCount === 20 ? `${div / 2}` : `${div}`;
        ctx.fillText(labelText, lineX, vernierBaseY + lineH + 2);
      } else {
        lineH = 9;
        ctx.lineWidth = 0.9;
      }

      // Check if this division is the coincident line
      const isCoincident = div === vernierData.vsr && showCoincidenceHint;

      if (isCoincident) {
        ctx.strokeStyle = '#06b6d4'; // Glowing cyan highlight for aligned line
        ctx.lineWidth = 2.2;
      } else {
        ctx.strokeStyle = '#0f172a';
      }

      ctx.beginPath();
      ctx.moveTo(lineX, vernierBaseY);
      ctx.lineTo(lineX, vernierBaseY + lineH);
      ctx.stroke();

      // Draw subtle arrow marker for coincident line
      if (isCoincident) {
        ctx.fillStyle = '#06b6d4';
        ctx.beginPath();
        ctx.moveTo(lineX, vernierBaseY + lineH + 14);
        ctx.lineTo(lineX - 3.5, vernierBaseY + lineH + 20);
        ctx.lineTo(lineX + 3.5, vernierBaseY + lineH + 20);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Scale title on slider
    ctx.font = '700 8px JetBrains Mono, monospace';
    ctx.fillStyle = '#475569';
    ctx.textAlign = 'left';
    ctx.fillText(`VERNIER (${divisionsCount} DIV = ${divisionsCount - 1}mm)`, sliderLeft + 10, BEAM_Y + BEAM_HEIGHT + 35);
    ctx.fillText(`LC = ${vernierData.leastCount} mm`, sliderLeft + 10, BEAM_Y + BEAM_HEIGHT + 45);

    ctx.restore();

    // ==========================================
    // 7. LOUPE / MAGNIFIER INSPECTION OVERLAY
    // ==========================================
    if (loupeActive) {
      const inspectX = loupePosition ? loupePosition.x : sliderZeroX + (vernierData.vsr * vsdPixels);
      const inspectY = loupePosition ? loupePosition.y : BEAM_Y + BEAM_HEIGHT;

      const loupeRadius = 65;
      const loupeCenterCanvasX = 980;
      const loupeCenterCanvasY = 95;

      ctx.save();
      // Loupe container background & shadow
      ctx.beginPath();
      ctx.arc(loupeCenterCanvasX, loupeCenterCanvasY, loupeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#070a11';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Clip inside circle
      ctx.save();
      ctx.beginPath();
      ctx.arc(loupeCenterCanvasX, loupeCenterCanvasY, loupeRadius - 1.5, 0, Math.PI * 2);
      ctx.clip();

      // Zoom factor = 3.2x
      const zoom = 3.2;
      ctx.translate(loupeCenterCanvasX, loupeCenterCanvasY);
      ctx.scale(zoom, zoom);
      ctx.translate(-inspectX, -inspectY);

      // Redraw Main Scale ticks inside loupe
      for (let mm = Math.floor((inspectX - ZERO_OFFSET_X) / PIXELS_PER_MM) - 5; mm <= Math.ceil((inspectX - ZERO_OFFSET_X) / PIXELS_PER_MM) + 5; mm++) {
        if (mm < 0 || mm > 130) continue;
        const tickX = ZERO_OFFSET_X + mm * PIXELS_PER_MM;
        const tickH = mm % 10 === 0 ? 18 : mm % 5 === 0 ? 12 : 7;
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(tickX, BEAM_Y + BEAM_HEIGHT - 4);
        ctx.lineTo(tickX, BEAM_Y + BEAM_HEIGHT - 4 - tickH);
        ctx.stroke();
      }

      // Redraw Vernier ticks inside loupe
      for (let div = 0; div <= divisionsCount; div++) {
        const lineX = sliderZeroX + div * vsdPixels;
        const isCoincident = div === vernierData.vsr;
        ctx.strokeStyle = isCoincident ? '#06b6d4' : '#f8fafc';
        ctx.lineWidth = isCoincident ? 1.8 : 0.9;
        ctx.beginPath();
        ctx.moveTo(lineX, BEAM_Y + BEAM_HEIGHT);
        ctx.lineTo(lineX, BEAM_Y + BEAM_HEIGHT + 12);
        ctx.stroke();
      }

      ctx.restore();

      // Crosshair reference on Loupe
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(loupeCenterCanvasX, loupeCenterCanvasY - loupeRadius);
      ctx.lineTo(loupeCenterCanvasX, loupeCenterCanvasY + loupeRadius);
      ctx.moveTo(loupeCenterCanvasX - loupeRadius, loupeCenterCanvasY);
      ctx.lineTo(loupeCenterCanvasX + loupeRadius, loupeCenterCanvasY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Loupe Title
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('3.2× ALIGNMENT LOUPE', loupeCenterCanvasX, loupeCenterCanvasY + loupeRadius + 15);
      ctx.fillText(`Coincident Line: #${vernierData.vsr}`, loupeCenterCanvasX, loupeCenterCanvasY + loupeRadius + 28);
      ctx.restore();
    }
  }, [
    currentPosition,
    zeroError,
    divisionsCount,
    clampedObject,
    isLocked,
    showCoincidenceHint,
    loupeActive,
    loupePosition,
    vernierData,
    PIXELS_PER_MM,
    ZERO_OFFSET_X,
    BEAM_Y,
    BEAM_HEIGHT,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer Drag Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isLocked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const clickX = (e.clientX - rect.left) * scaleX;

    isDraggingRef.current = true;
    dragStartXRef.current = clickX;
    startPosRef.current = currentPosition;
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    // Update loupe position if hovered near vernier
    if (currentX > 50 && currentX < CANVAS_WIDTH - 200 && currentY > BEAM_Y - 40 && currentY < BEAM_Y + BEAM_HEIGHT + 70) {
      setLoupePosition({ x: currentX, y: currentY });
    } else {
      setLoupePosition(null);
    }

    if (!isDraggingRef.current || isLocked) return;

    const deltaX = currentX - dragStartXRef.current;
    const deltaMm = deltaX / PIXELS_PER_MM;
    const rawNewPos = Math.max(0, Math.min(130, startPosRef.current + deltaMm));
    
    // Snap to 0.05 mm or 0.1 mm precision
    const step = divisionsCount === 20 ? 0.05 : 0.1;
    const roundedPos = Number((Math.round(rawNewPos / step) * step).toFixed(2));

    if (roundedPos !== currentPosition) {
      onPositionChange(roundedPos);
      onTickSound?.();
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
    <div ref={containerRef} className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl overflow-hidden select-none">
      {/* Top Floating Controls inside Viewport */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <button
          onClick={onLockToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
            isLocked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
              : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-slate-500'
          }`}
          title="Toggle locking screw"
        >
          {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
          <span>{isLocked ? 'Slider Locked' : 'Slider Free'}</span>
        </button>

        <button
          onClick={() => setLoupeActive(!loupeActive)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
            loupeActive
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle 3.2x Loupe Inspection View"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{loupeActive ? 'Loupe On' : 'Loupe Off'}</span>
        </button>

        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono bg-slate-800/60 border border-slate-700/60 text-slate-400">
          <span>Scale: {divisionsCount} Div (LC = {vernierData.leastCount} mm)</span>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="w-full overflow-x-auto touch-none">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', maxWidth: '1100px', height: 'auto', aspectRatio: '1100/380' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`cursor-grab active:cursor-grabbing rounded-xl w-full block ${isLocked ? 'cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Touch / Drag hint bottom badge */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Drag vernier slider or use Left / Right arrow keys (Shift: 1mm, Alt: 0.01mm)</span>
        </div>
        {clampedObject && (
          <div className="text-cyan-400 font-medium">
            Clamped Specimen: <span className="text-white">{clampedObject.name}</span> ({clampedObject.trueDimension} mm)
          </div>
        )}
      </div>
    </div>
  );
};
