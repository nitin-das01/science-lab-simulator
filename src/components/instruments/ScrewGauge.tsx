import React, { useRef, useEffect, useState, useCallback } from 'react';
import type { TestObject } from '../../types/instruments';
import { calculateScrewGauge } from '../../utils/screwGaugeMath';
import { Maximize2, Lock, Unlock, RotateCw } from 'lucide-react';

interface ScrewGaugeProps {
  currentPosition: number;
  zeroError: number;
  pitch: number; // 1.0 or 0.5 mm
  totalDivisions: number; // 100 or 50
  clampedObject: TestObject | null;
  isLocked: boolean;
  onPositionChange: (newPos: number) => void;
  onLockToggle: () => void;
  onRatchetSound?: () => void;
}

export const ScrewGauge: React.FC<ScrewGaugeProps> = ({
  currentPosition,
  zeroError,
  pitch = 1.0,
  totalDivisions = 100,
  clampedObject,
  isLocked,
  onPositionChange,
  onLockToggle,
  onRatchetSound,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDraggingRef = useRef(false);
  const dragStartYRef = useRef(0);
  const dragStartXRef = useRef(0);
  const startPosRef = useRef(0);

  const [loupeActive, setLoupeActive] = useState(true);

  // Canvas dimensions
  const CANVAS_WIDTH = 1100;
  const CANVAS_HEIGHT = 440;
  const PIXELS_PER_MM = 16.0; // High resolution for screw pitch scale

  const sgData = calculateScrewGauge(currentPosition, zeroError, pitch, totalDivisions);

  // Keyboard navigation for precision micrometer adjustments
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLocked) return;
      let delta = 0;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
        delta = e.shiftKey ? 0.1 : e.altKey ? 0.005 : 0.01;
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        delta = e.shiftKey ? -0.1 : e.altKey ? -0.005 : -0.01;
      }

      if (delta !== 0) {
        e.preventDefault();
        const newPos = Math.max(0, Math.min(25, Number((currentPosition + delta).toFixed(3))));
        onPositionChange(newPos);
        onRatchetSound?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPosition, isLocked, onPositionChange, onRatchetSound]);

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

    // Lab Workbench Background
    ctx.fillStyle = '#0a0e17';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Subtle grid lines
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

    // Geometry parameters
    const ANVIL_X = 260; // fixed anvil face
    const AXIS_Y = 210; // central horizontal measurement axis
    const SPINDLE_RADIUS = 20;
    const SLEEVE_RADIUS = 28;
    const THIMBLE_RADIUS = 38;

    const gapPx = currentPosition * PIXELS_PER_MM;
    const SPINDLE_FACE_X = ANVIL_X + gapPx;
    const SLEEVE_START_X = 420;
    const THIMBLE_EDGE_X = SLEEVE_START_X + gapPx;

    // ==========================================
    // 1. CAST STEEL U-FRAME (Bow of the Micrometer)
    // ==========================================
    ctx.save();
    ctx.beginPath();
    // Outer curve of the U-frame
    ctx.moveTo(ANVIL_X - 100, AXIS_Y - 45);
    ctx.lineTo(ANVIL_X - 55, AXIS_Y - 45);
    ctx.bezierCurveTo(ANVIL_X - 90, AXIS_Y + 180, 460, AXIS_Y + 220, SLEEVE_START_X + 15, AXIS_Y + 45);
    ctx.lineTo(SLEEVE_START_X - 15, AXIS_Y + 45);
    ctx.bezierCurveTo(430, AXIS_Y + 160, ANVIL_X - 40, AXIS_Y + 130, ANVIL_X - 25, AXIS_Y + 45);
    ctx.lineTo(ANVIL_X - 60, AXIS_Y + 45);
    ctx.lineTo(ANVIL_X - 60, AXIS_Y - 45);
    ctx.closePath();

    // Heavy dark cast-iron hammertone enamel gradient
    const frameGrad = ctx.createLinearGradient(150, 100, 450, 400);
    frameGrad.addColorStop(0, '#1e293b');
    frameGrad.addColorStop(0.3, '#334155');
    frameGrad.addColorStop(0.7, '#1e293b');
    frameGrad.addColorStop(1, '#0f172a');

    ctx.fillStyle = frameGrad;
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Insulated heat-shield plate on U-frame
    ctx.beginPath();
    ctx.roundRect(250, AXIS_Y + 125, 130, 32, 6);
    ctx.fillStyle = '#0f172a';
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Spec label engraved on frame
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '700 11px JetBrains Mono, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('0 - 25 mm', 315, AXIS_Y + 140);
    ctx.font = '600 9px JetBrains Mono, monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('0.01 mm MICROMETER', 315, AXIS_Y + 151);

    // ==========================================
    // 2. FIXED ANVIL (Left Measurement Face)
    // ==========================================
    // Chrome anvil sleeve collar
    const collarGrad = ctx.createLinearGradient(0, AXIS_Y - 26, 0, AXIS_Y + 26);
    collarGrad.addColorStop(0, '#cbd5e1');
    collarGrad.addColorStop(0.5, '#f8fafc');
    collarGrad.addColorStop(1, '#64748b');

    ctx.fillStyle = collarGrad;
    ctx.fillRect(ANVIL_X - 55, AXIS_Y - 26, 40, 52);
    ctx.strokeStyle = '#334155';
    ctx.strokeRect(ANVIL_X - 55, AXIS_Y - 26, 40, 52);

    // Carbide tip anvil
    ctx.fillStyle = '#475569';
    ctx.fillRect(ANVIL_X - 15, AXIS_Y - SPINDLE_RADIUS, 15, SPINDLE_RADIUS * 2);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(ANVIL_X - 15, AXIS_Y - SPINDLE_RADIUS, 15, SPINDLE_RADIUS * 2);

    // Highly polished tungsten carbide contact face
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(ANVIL_X - 3, AXIS_Y - SPINDLE_RADIUS, 3, SPINDLE_RADIUS * 2);

    // ==========================================
    // 3. CLAMPED SPECIMEN OBJECT
    // ==========================================
    if (clampedObject && currentPosition > 0) {
      const objW = Math.max(2, gapPx);
      const objH = Math.min(65, Math.max(16, gapPx * 1.5));
      const objY = AXIS_Y - objH / 2;

      ctx.save();
      if (clampedObject.renderShape === 'wire') {
        // Thin wire cross-section cylinder
        const wireGrad = ctx.createLinearGradient(0, objY, 0, objY + objH);
        wireGrad.addColorStop(0, '#fdba74');
        wireGrad.addColorStop(0.5, clampedObject.color);
        wireGrad.addColorStop(1, '#9a3412');
        ctx.fillStyle = wireGrad;
        ctx.fillRect(ANVIL_X, objY, objW, objH);
        ctx.strokeStyle = '#431407';
        ctx.lineWidth = 1;
        ctx.strokeRect(ANVIL_X, objY, objW, objH);
      } else if (clampedObject.renderShape === 'sphere') {
        // Lead pellet / sphere
        const rad = Math.min(objW / 2, 28);
        const sGrad = ctx.createRadialGradient(ANVIL_X + objW / 2 - rad * 0.3, AXIS_Y - rad * 0.3, rad * 0.1, ANVIL_X + objW / 2, AXIS_Y, rad);
        sGrad.addColorStop(0, '#ffffff');
        sGrad.addColorStop(0.4, clampedObject.color);
        sGrad.addColorStop(1, '#0f172a');
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.arc(ANVIL_X + objW / 2, AXIS_Y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.4)';
        ctx.stroke();
      } else {
        // Glass plate or metal sheet
        const plateGrad = ctx.createLinearGradient(ANVIL_X, 0, ANVIL_X + objW, 0);
        plateGrad.addColorStop(0, 'rgba(56, 189, 248, 0.7)');
        plateGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.85)');
        plateGrad.addColorStop(1, 'rgba(56, 189, 248, 0.7)');
        ctx.fillStyle = plateGrad;
        ctx.fillRect(ANVIL_X, objY, objW, objH);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(ANVIL_X, objY, objW, objH);
      }

      // Specimen indicator line
      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`${clampedObject.name}`, ANVIL_X + objW / 2, AXIS_Y - objH / 2 - 12);
      ctx.restore();
    }

    // ==========================================
    // 4. MOVABLE SPINDLE (Precision Ground Rod)
    // ==========================================
    const spindleLength = Math.max(0, SLEEVE_START_X - SPINDLE_FACE_X);
    const spindleGrad = ctx.createLinearGradient(0, AXIS_Y - SPINDLE_RADIUS, 0, AXIS_Y + SPINDLE_RADIUS);
    spindleGrad.addColorStop(0, '#94a3b8');
    spindleGrad.addColorStop(0.3, '#f1f5f9');
    spindleGrad.addColorStop(0.7, '#cbd5e1');
    spindleGrad.addColorStop(1, '#475569');

    ctx.fillStyle = spindleGrad;
    ctx.fillRect(SPINDLE_FACE_X, AXIS_Y - SPINDLE_RADIUS, spindleLength, SPINDLE_RADIUS * 2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(SPINDLE_FACE_X, AXIS_Y - SPINDLE_RADIUS, spindleLength, SPINDLE_RADIUS * 2);

    // Highly polished spindle contact face
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(SPINDLE_FACE_X, AXIS_Y - SPINDLE_RADIUS, 3, SPINDLE_RADIUS * 2);

    // ==========================================
    // 5. FIXED SLEEVE / BARREL (Linear Pitch Scale)
    // ==========================================
    const sleeveLength = 160;
    const sleeveGrad = ctx.createLinearGradient(0, AXIS_Y - SLEEVE_RADIUS, 0, AXIS_Y + SLEEVE_RADIUS);
    sleeveGrad.addColorStop(0, '#e2e8f0');
    sleeveGrad.addColorStop(0.25, '#f8fafc');
    sleeveGrad.addColorStop(0.75, '#cbd5e1');
    sleeveGrad.addColorStop(1, '#64748b');

    ctx.fillStyle = sleeveGrad;
    ctx.fillRect(SLEEVE_START_X, AXIS_Y - SLEEVE_RADIUS, sleeveLength, SLEEVE_RADIUS * 2);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(SLEEVE_START_X, AXIS_Y - SLEEVE_RADIUS, sleeveLength, SLEEVE_RADIUS * 2);

    // Datum Line (Horizontal reference line)
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(SLEEVE_START_X, AXIS_Y);
    ctx.lineTo(SLEEVE_START_X + sleeveLength, AXIS_Y);
    ctx.stroke();

    // Linear Pitch Scale Markings
    // Upper Marks: 0, 1, 2, 3... mm
    // Lower Marks: 0.5, 1.5, 2.5... mm
    ctx.fillStyle = '#0f172a';
    ctx.textAlign = 'center';

    for (let mm = 0; mm <= 25; mm++) {
      const markX = SLEEVE_START_X + mm * PIXELS_PER_MM;
      // Only draw if not covered by the thimble
      if (markX < THIMBLE_EDGE_X) {
        // Upper Whole-Millimeter Mark
        const upperH = mm % 5 === 0 ? 14 : 9;
        ctx.lineWidth = mm % 5 === 0 ? 1.5 : 1.0;
        ctx.beginPath();
        ctx.moveTo(markX, AXIS_Y);
        ctx.lineTo(markX, AXIS_Y - upperH);
        ctx.stroke();

        if (mm % 5 === 0) {
          ctx.font = '600 10px JetBrains Mono, monospace';
          ctx.fillText(`${mm}`, markX, AXIS_Y - upperH - 3);
        }

        // Lower Half-Millimeter Mark
        if (mm < 25) {
          const halfX = markX + 0.5 * PIXELS_PER_MM;
          if (halfX < THIMBLE_EDGE_X) {
            ctx.lineWidth = 1.0;
            ctx.beginPath();
            ctx.moveTo(halfX, AXIS_Y);
            ctx.lineTo(halfX, AXIS_Y + 9);
            ctx.stroke();
          }
        }
      }
    }

    // ==========================================
    // 6. ROTATING CIRCULAR THIMBLE (Bevelled Cylinder)
    // ==========================================
    const thimbleLength = 175;
    const bevelWidth = 26; // conical tapered front edge

    // Front conical bevel shape
    ctx.beginPath();
    ctx.moveTo(THIMBLE_EDGE_X, AXIS_Y - SLEEVE_RADIUS);
    ctx.lineTo(THIMBLE_EDGE_X + bevelWidth, AXIS_Y - THIMBLE_RADIUS);
    ctx.lineTo(THIMBLE_EDGE_X + thimbleLength, AXIS_Y - THIMBLE_RADIUS);
    ctx.lineTo(THIMBLE_EDGE_X + thimbleLength, AXIS_Y + THIMBLE_RADIUS);
    ctx.lineTo(THIMBLE_EDGE_X + bevelWidth, AXIS_Y + THIMBLE_RADIUS);
    ctx.lineTo(THIMBLE_EDGE_X, AXIS_Y + SLEEVE_RADIUS);
    ctx.closePath();

    const thimbleGrad = ctx.createLinearGradient(0, AXIS_Y - THIMBLE_RADIUS, 0, AXIS_Y + THIMBLE_RADIUS);
    thimbleGrad.addColorStop(0, '#94a3b8');
    thimbleGrad.addColorStop(0.2, '#f8fafc');
    thimbleGrad.addColorStop(0.5, '#e2e8f0');
    thimbleGrad.addColorStop(0.8, '#cbd5e1');
    thimbleGrad.addColorStop(1, '#475569');

    ctx.fillStyle = thimbleGrad;
    ctx.fill();
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Knurled grip band on thimble body
    const knurlX = THIMBLE_EDGE_X + bevelWidth + 40;
    const knurlW = 90;
    ctx.fillStyle = '#475569';
    ctx.fillRect(knurlX, AXIS_Y - THIMBLE_RADIUS + 1, knurlW, THIMBLE_RADIUS * 2 - 2);
    ctx.strokeStyle = '#1e293b';
    ctx.strokeRect(knurlX, AXIS_Y - THIMBLE_RADIUS + 1, knurlW, THIMBLE_RADIUS * 2 - 2);

    // Cross-hatch diamond knurling lines
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 0.8;
    for (let kx = knurlX; kx < knurlX + knurlW; kx += 7) {
      ctx.beginPath();
      ctx.moveTo(kx, AXIS_Y - THIMBLE_RADIUS + 2);
      ctx.lineTo(kx + 15, AXIS_Y + THIMBLE_RADIUS - 2);
      ctx.moveTo(kx + 15, AXIS_Y - THIMBLE_RADIUS + 2);
      ctx.lineTo(kx, AXIS_Y + THIMBLE_RADIUS - 2);
      ctx.stroke();
    }

    // ==========================================
    // 7. PROCEDURAL 3D CIRCULAR SCALE GRADUATIONS
    // ==========================================
    // As the thimble rotates, divisions wrap around cylinder:
    // angle = 2 * PI * (division - csr) / totalDivisions
    // y = AXIS_Y - THIMBLE_RADIUS * sin(angle)
    ctx.save();
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const currentCsr = sgData.csr;
    const visibleAngularSpan = Math.PI * 0.44; // visible angle spread on cylinder

    for (let div = 0; div < totalDivisions; div++) {
      let divOffset = (div - currentCsr);
      // wrap between -totalDivisions/2 and +totalDivisions/2
      while (divOffset > totalDivisions / 2) divOffset -= totalDivisions;
      while (divOffset < -totalDivisions / 2) divOffset += totalDivisions;

      const angle = (divOffset / totalDivisions) * (Math.PI * 2);

      if (Math.abs(angle) < visibleAngularSpan) {
        // Perspective vertical position on curved cylinder
        const yPos = AXIS_Y - Math.sin(angle) * (THIMBLE_RADIUS - 3);
        const cosFactor = Math.cos(angle); // foreshortening factor

        const isCoincident = div === currentCsr;

        // Front bevel tick line
        const tickStartX = THIMBLE_EDGE_X;
        const tickEndX = THIMBLE_EDGE_X + (div % 5 === 0 ? 18 : 10) * cosFactor;

        if (isCoincident) {
          ctx.strokeStyle = '#06b6d4'; // Glowing cyan datum alignment
          ctx.lineWidth = 2.4;
        } else {
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = div % 5 === 0 ? 1.4 : 0.9;
        }

        ctx.beginPath();
        ctx.moveTo(tickStartX, yPos);
        ctx.lineTo(tickEndX, yPos);
        ctx.stroke();

        // Label on every 5th division
        if (div % 5 === 0 && cosFactor > 0.4) {
          ctx.font = '600 10px JetBrains Mono, monospace';
          ctx.fillStyle = isCoincident ? '#06b6d4' : '#0f172a';
          ctx.fillText(`${div}`, tickEndX + 4, yPos);
        }
      }
    }
    ctx.restore();

    // ==========================================
    // 8. RATCHET STOP KNOB (Far Right End)
    // ==========================================
    const ratchetStartX = THIMBLE_EDGE_X + thimbleLength;
    const ratchetW = 45;
    const ratchetRadius = 22;

    const ratchetGrad = ctx.createLinearGradient(0, AXIS_Y - ratchetRadius, 0, AXIS_Y + ratchetRadius);
    ratchetGrad.addColorStop(0, '#64748b');
    ratchetGrad.addColorStop(0.3, '#cbd5e1');
    ratchetGrad.addColorStop(0.7, '#94a3b8');
    ratchetGrad.addColorStop(1, '#334155');

    ctx.fillStyle = ratchetGrad;
    ctx.fillRect(ratchetStartX, AXIS_Y - ratchetRadius, ratchetW, ratchetRadius * 2);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(ratchetStartX, AXIS_Y - ratchetRadius, ratchetW, ratchetRadius * 2);

    // Ratchet knurling ridges
    for (let rx = ratchetStartX + 4; rx < ratchetStartX + ratchetW - 3; rx += 4) {
      ctx.beginPath();
      ctx.moveTo(rx, AXIS_Y - ratchetRadius + 2);
      ctx.lineTo(rx, AXIS_Y + ratchetRadius - 2);
      ctx.strokeStyle = '#1e293b';
      ctx.stroke();
    }

    // ==========================================
    // 9. 3.5× PRECISION DATUM LOUPE
    // ==========================================
    if (loupeActive) {
      const inspectX = THIMBLE_EDGE_X;
      const inspectY = AXIS_Y;

      const loupeRadius = 75;
      const loupeCenterCanvasX = 970;
      const loupeCenterCanvasY = 100;

      ctx.save();
      // Loupe container frame
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

      const zoom = 3.6;
      ctx.translate(loupeCenterCanvasX, loupeCenterCanvasY);
      ctx.scale(zoom, zoom);
      ctx.translate(-inspectX, -inspectY);

      // Redraw Datum Line & Linear Scale in Loupe
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(inspectX - 45, AXIS_Y);
      ctx.lineTo(inspectX + 35, AXIS_Y);
      ctx.stroke();

      // Millimeter marks
      for (let mm = Math.max(0, Math.floor(currentPosition) - 2); mm <= Math.ceil(currentPosition) + 1; mm++) {
        const mx = SLEEVE_START_X + mm * PIXELS_PER_MM;
        if (mx < inspectX) {
          ctx.strokeStyle = '#f8fafc';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mx, AXIS_Y);
          ctx.lineTo(mx, AXIS_Y - 12);
          ctx.stroke();

          // Half mm mark
          const hx = mx + 0.5 * PIXELS_PER_MM;
          if (hx < inspectX) {
            ctx.beginPath();
            ctx.moveTo(hx, AXIS_Y);
            ctx.lineTo(hx, AXIS_Y + 8);
            ctx.stroke();
          }
        }
      }

      // Redraw Circular Scale in Loupe
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(inspectX, AXIS_Y - 30);
      ctx.lineTo(inspectX, AXIS_Y + 30);
      ctx.stroke();

      for (let div = 0; div < totalDivisions; div++) {
        let divOffset = div - currentCsr;
        while (divOffset > totalDivisions / 2) divOffset -= totalDivisions;
        while (divOffset < -totalDivisions / 2) divOffset += totalDivisions;
        const angle = (divOffset / totalDivisions) * (Math.PI * 2);

        if (Math.abs(angle) < 0.35) {
          const yPos = AXIS_Y - Math.sin(angle) * (THIMBLE_RADIUS - 3);
          const isCoincident = div === currentCsr;

          ctx.strokeStyle = isCoincident ? '#06b6d4' : '#e2e8f0';
          ctx.lineWidth = isCoincident ? 2.0 : 0.8;
          ctx.beginPath();
          ctx.moveTo(inspectX, yPos);
          ctx.lineTo(inspectX + 14, yPos);
          ctx.stroke();

          ctx.font = '600 7px JetBrains Mono, monospace';
          ctx.fillStyle = isCoincident ? '#06b6d4' : '#94a3b8';
          ctx.fillText(`${div}`, inspectX + 16, yPos + 2);
        }
      }

      ctx.restore();

      // Crosshair & Loupe badge
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
      ctx.lineWidth = 1;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(loupeCenterCanvasX - loupeRadius, loupeCenterCanvasY);
      ctx.lineTo(loupeCenterCanvasX + loupeRadius, loupeCenterCanvasY);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '600 10px JetBrains Mono, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('3.6× DATUM LOUPE', loupeCenterCanvasX, loupeCenterCanvasY + loupeRadius + 15);
      ctx.fillText(`Coincident Division: #${sgData.csr}`, loupeCenterCanvasX, loupeCenterCanvasY + loupeRadius + 28);
      ctx.restore();
    }
  }, [
    currentPosition,
    zeroError,
    pitch,
    totalDivisions,
    clampedObject,
    loupeActive,
    sgData,
    PIXELS_PER_MM,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  // Pointer drag on thimble or ratchet
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isLocked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    isDraggingRef.current = true;
    dragStartXRef.current = clickX;
    dragStartYRef.current = clickY;
    startPosRef.current = currentPosition;
    canvas.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || isLocked) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    // Movement: dragging horizontally moves linear position; dragging vertically spins circular thimble
    const deltaX = currentX - dragStartXRef.current;
    const deltaY = dragStartYRef.current - currentY; // up is open, down is close

    const posFromX = deltaX / (PIXELS_PER_MM * 1.5);
    const posFromY = (deltaY / 20) * 0.01;

    const totalDelta = Math.abs(deltaY) > Math.abs(deltaX) ? posFromY : posFromX;
    const rawNewPos = Math.max(0, Math.min(25, startPosRef.current + totalDelta));
    const roundedPos = Number((Math.round(rawNewPos / 0.01) * 0.01).toFixed(2));

    if (roundedPos !== currentPosition) {
      onPositionChange(roundedPos);
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

  // Manual Ratchet Click Button
  const handleRatchetTurn = () => {
    if (isLocked) return;
    const newPos = Math.max(0, Math.min(25, Number((currentPosition + 0.01).toFixed(2))));
    onPositionChange(newPos);
    onRatchetSound?.();
  };

  return (
    <div ref={containerRef} className="relative w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 shadow-2xl overflow-hidden select-none">
      {/* Top Floating Controls */}
      <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
        <button
          onClick={onLockToggle}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
            isLocked
              ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50'
              : 'bg-slate-800/80 text-slate-300 border border-slate-700 hover:border-slate-500'
          }`}
          title="Toggle micrometer spindle lock"
        >
          {isLocked ? <Lock className="w-3.5 h-3.5 text-rose-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
          <span>{isLocked ? 'Spindle Locked' : 'Spindle Free'}</span>
        </button>

        <button
          onClick={() => setLoupeActive(!loupeActive)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold backdrop-blur-md transition-all shadow-md ${
            loupeActive
              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50'
              : 'bg-slate-800/80 text-slate-400 border border-slate-700 hover:text-slate-200'
          }`}
          title="Toggle 3.6x Datum Loupe"
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>{loupeActive ? 'Loupe On' : 'Loupe Off'}</span>
        </button>

        <button
          onClick={handleRatchetTurn}
          disabled={isLocked}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-md active:scale-95 disabled:opacity-50"
          title="Click ratchet stop (simulates slip-knob rotation)"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Ratchet Click (+0.01mm)</span>
        </button>
      </div>

      {/* Main Interactive Canvas */}
      <div className="w-full overflow-x-auto touch-none">
        <canvas
          ref={canvasRef}
          style={{ width: '100%', maxWidth: '1100px', height: 'auto', aspectRatio: '1100/440' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className={`cursor-grab active:cursor-grabbing rounded-xl w-full block ${isLocked ? 'cursor-not-allowed' : ''}`}
        />
      </div>

      {/* Instructions & Specimen info */}
      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-slate-400 px-2">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>Drag thimble up/down to rotate circular scale, or use arrow keys (Shift: 0.1mm, Alt: 0.005mm)</span>
        </div>
        {clampedObject && (
          <div className="text-emerald-400 font-medium">
            Clamped Specimen: <span className="text-white">{clampedObject.name}</span> ({clampedObject.trueDimension} mm)
          </div>
        )}
      </div>
    </div>
  );
};
