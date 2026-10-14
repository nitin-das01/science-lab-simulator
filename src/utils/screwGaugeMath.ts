export interface ScrewGaugeCalculations {
  pitch: number; // Pitch in mm (usually 1.0 mm or 0.5 mm)
  totalDivisions: number; // Total circular scale divisions (usually 100 or 50)
  leastCount: number; // Pitch / totalDivisions (e.g. 0.01 mm)
  psr: number; // Pitch Scale Reading (linear scale mm)
  csr: number; // Circular Scale Reading (coinciding division)
  fractionalReading: number; // csr * leastCount
  rawReading: number; // psr + fractionalReading
  zeroError: number; // in mm
  zeroCorrection: number; // -zeroError
  correctedReading: number; // rawReading - zeroError
}

export function calculateScrewGauge(
  rawPositionMm: number,
  zeroErrorMm: number,
  pitch: number = 1.0,
  totalDivisions: number = 100
): ScrewGaugeCalculations {
  const leastCount = pitch / totalDivisions;
  const pos = Math.max(0, rawPositionMm);

  // Linear / Pitch Scale Reading:
  // For pitch = 1.0mm, psr = floor(pos)
  // For pitch = 0.5mm, psr = floor(pos / 0.5) * 0.5
  const psr = Math.floor(pos / pitch) * pitch;

  // Remainder beyond linear mark
  const remainder = pos - psr;

  // Circular Scale Reading: division coinciding with the datum line
  let csr = Math.round(remainder / leastCount) % totalDivisions;
  if (csr < 0) csr += totalDivisions;

  const fractionalReading = Number((csr * leastCount).toFixed(3));
  const rawReading = Number((psr + fractionalReading).toFixed(3));
  const correctedReading = Number((rawReading - zeroErrorMm).toFixed(3));
  const zeroCorrection = Number((-zeroErrorMm).toFixed(3));

  return {
    pitch,
    totalDivisions,
    leastCount,
    psr: Number(psr.toFixed(2)),
    csr,
    fractionalReading,
    rawReading,
    zeroError: zeroErrorMm,
    zeroCorrection,
    correctedReading,
  };
}
