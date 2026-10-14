import type { InstrumentType, VivaChallenge } from '../types/instruments';
import { calculateVernier } from './vernierMath';
import { calculateScrewGauge } from './screwGaugeMath';

export const STATIC_CHALLENGES: VivaChallenge[] = [
  {
    id: 'vc-chal-1',
    instrumentId: 'vernier-caliper',
    title: 'Vernier Caliper: Cylinder Diameter with Nil Zero Error',
    targetPosition: 14.6,
    zeroError: 0.0,
    objectName: 'Machined Brass Cylinder',
    expectedMsr: 14,
    expectedVsr: 6,
    expectedTotal: 14.6,
    expectedCorrected: 14.6,
    hints: [
      'Look at the Vernier 0 mark. Which millimeter tick on the main scale is directly to its left?',
      'Check which Vernier division (0 to 10) lines up perfectly with a line on the main scale.',
      'Total Reading = MSR + (VSR × 0.1 mm). Since Zero Error is 0, Corrected = Total.',
    ],
    explanation: 'Vernier 0 lies between 14 mm and 15 mm, so MSR = 14 mm. The 6th vernier division coincides with the main scale mark, so VSR = 6. Reading = 14 + (6 × 0.1) = 14.60 mm.',
  },
  {
    id: 'vc-chal-2',
    instrumentId: 'vernier-caliper',
    title: 'Vernier Caliper: Steel Sphere with Positive Zero Error',
    targetPosition: 19.3,
    zeroError: 0.2,
    objectName: 'Chrome Ball Bearing',
    expectedMsr: 19,
    expectedVsr: 3,
    expectedTotal: 19.3,
    expectedCorrected: 19.1,
    hints: [
      'Read the raw MSR and VSR displayed on the instrument.',
      'Remember: Positive Zero Error must be SUBTRACTED from the total reading!',
      'Corrected Reading = Total Reading - (+Zero Error) = Total - 0.2 mm.',
    ],
    explanation: 'Raw reading is MSR (19) + VSR (3 × 0.1) = 19.30 mm. Since the instrument has a Positive Zero Error of +0.20 mm, Corrected Reading = 19.30 - 0.20 = 19.10 mm.',
  },
  {
    id: 'vc-chal-3',
    instrumentId: 'vernier-caliper',
    title: 'Vernier Caliper: Internal Pipe Bore with Negative Zero Error',
    targetPosition: 27.8,
    zeroError: -0.3,
    objectName: 'Hollow Pipe Cavity',
    expectedMsr: 27,
    expectedVsr: 8,
    expectedTotal: 27.8,
    expectedCorrected: 28.1,
    hints: [
      'Find the raw MSR (before Vernier 0) and coinciding VSR division.',
      'Remember: Zero Error is -0.3 mm. Zero Correction = -(-0.3) = +0.3 mm!',
      'Corrected Reading = Total Reading - (-0.3) = Total + 0.3 mm.',
    ],
    explanation: 'Raw reading is 27 mm + (8 × 0.1) = 27.80 mm. Since Zero Error is negative (-0.30 mm), we subtract (-0.30) which adds 0.30 mm. Corrected Reading = 28.10 mm.',
  },
  {
    id: 'sg-chal-1',
    instrumentId: 'screw-gauge',
    title: 'Screw Gauge: Wire Diameter with Nil Zero Error',
    targetPosition: 2.34,
    zeroError: 0.0,
    objectName: 'Nichrome Resistance Wire',
    expectedMsr: 2.0,
    expectedVsr: 34,
    expectedTotal: 2.34,
    expectedCorrected: 2.34,
    hints: [
      'Observe the linear pitch scale exposed on the sleeve. What is the last visible whole millimeter mark?',
      'Check which circular scale division (0 to 99) coincides with the horizontal reference/datum line.',
      'Total = Linear scale (PSR) + (CSR × 0.01 mm).',
    ],
    explanation: 'The linear scale clearly reveals 2 mm (PSR = 2 mm). The 34th division on the circular thimble aligns with the datum line (CSR = 34). Total = 2 + (34 × 0.01) = 2.34 mm.',
  },
  {
    id: 'sg-chal-2',
    instrumentId: 'screw-gauge',
    title: 'Screw Gauge: Glass Slide with Positive Zero Error',
    targetPosition: 1.48,
    zeroError: 0.05,
    objectName: 'Glass Cover Slip',
    expectedMsr: 1.0,
    expectedVsr: 48,
    expectedTotal: 1.48,
    expectedCorrected: 1.43,
    hints: [
      'PSR is 1 mm. Look at circular division at the datum line.',
      'Positive zero error means the circular scale zero was 5 divisions below datum line when closed.',
      'Corrected = Total - (+0.05 mm).',
    ],
    explanation: 'Raw reading is PSR (1.0 mm) + CSR (48 × 0.01 mm) = 1.48 mm. Accounting for positive zero error of +0.05 mm: Corrected = 1.48 - 0.05 = 1.43 mm.',
  },
  {
    id: 'sg-chal-3',
    instrumentId: 'screw-gauge',
    title: 'Screw Gauge: Lead Pellet with Negative Zero Error',
    targetPosition: 4.87,
    zeroError: -0.04,
    objectName: 'Lead Shot Specimen',
    expectedMsr: 4.0,
    expectedVsr: 87,
    expectedTotal: 4.87,
    expectedCorrected: 4.91,
    hints: [
      'Find the linear scale reading (PSR) and circular division (CSR).',
      'Negative zero error means when closed, the 96th mark was at the datum (4 divisions above).',
      'Corrected = Total - (-0.04 mm) = Total + 0.04 mm.',
    ],
    explanation: 'Raw reading is 4.0 mm + 0.87 mm = 4.87 mm. Negative zero error of -0.04 mm gives: Corrected = 4.87 - (-0.04) = 4.91 mm.',
  },
];

export function generateRandomChallenge(instrumentId: InstrumentType): VivaChallenge {
  if (instrumentId === 'vernier-caliper') {
    const whole = Math.floor(Math.random() * 40) + 5;
    const frac = Math.floor(Math.random() * 10) * 0.1;
    const target = Number((whole + frac).toFixed(1));
    const zeroErrors = [0, 0.1, 0.2, -0.1, -0.2];
    const ze = zeroErrors[Math.floor(Math.random() * zeroErrors.length)];
    const calc = calculateVernier(target, ze, 10);

    return {
      id: `vc-rand-${Date.now()}`,
      instrumentId: 'vernier-caliper',
      title: `Practice Challenge: Vernier Caliper (${ze === 0 ? 'Zero Error = 0' : ze > 0 ? `+${ze} mm Positive Error` : `${ze} mm Negative Error`})`,
      targetPosition: target,
      zeroError: ze,
      objectName: 'Mystery Test Specimen',
      expectedMsr: calc.msr,
      expectedVsr: calc.vsr,
      expectedTotal: calc.rawReading,
      expectedCorrected: calc.correctedReading,
      hints: [
        `Main scale reads the full mm mark before Vernier 0.`,
        `Vernier scale has 10 divisions with Least Count = 0.1 mm.`,
        `Corrected = Total Reading - (${ze >= 0 ? `+${ze}` : ze} mm).`,
      ],
      explanation: `MSR is ${calc.msr} mm. The coincident division is ${calc.vsr} (VSR). Total raw reading = ${calc.msr} + (${calc.vsr} × 0.1) = ${calc.rawReading.toFixed(2)} mm. Corrected reading = ${calc.rawReading.toFixed(2)} - (${ze >= 0 ? `+${ze}` : ze}) = ${calc.correctedReading.toFixed(2)} mm.`,
    };
  }

  const whole = Math.floor(Math.random() * 8) + 1;
  const csr = Math.floor(Math.random() * 95) + 3;
  const target = Number((whole + csr * 0.01).toFixed(2));
  const zeroErrors = [0, 0.02, 0.04, -0.02, -0.03];
  const ze = zeroErrors[Math.floor(Math.random() * zeroErrors.length)];
  const calc = calculateScrewGauge(target, ze, 1.0, 100);

  return {
    id: `sg-rand-${Date.now()}`,
    instrumentId: 'screw-gauge',
    title: `Practice Challenge: Screw Gauge (${ze === 0 ? 'Nil Zero Error' : ze > 0 ? `+${ze} mm Error` : `${ze} mm Error`})`,
    targetPosition: target,
    zeroError: ze,
    objectName: 'Precision Wire Specimen',
    expectedMsr: calc.psr,
    expectedVsr: calc.csr,
    expectedTotal: calc.rawReading,
    expectedCorrected: calc.correctedReading,
    hints: [
      `Pitch scale reveals whole mm markings on the horizontal datum line.`,
      `Circular scale has 100 divisions with Least Count = 0.01 mm.`,
      `Corrected = Total - (${ze >= 0 ? `+${ze}` : ze} mm).`,
    ],
    explanation: `PSR is ${calc.psr.toFixed(2)} mm. CSR is division ${calc.csr}. Raw reading = ${calc.psr} + (${calc.csr} × 0.01) = ${calc.rawReading.toFixed(2)} mm. Corrected = ${calc.rawReading.toFixed(2)} - (${ze >= 0 ? `+${ze}` : ze}) = ${calc.correctedReading.toFixed(2)} mm.`,
  };
}
