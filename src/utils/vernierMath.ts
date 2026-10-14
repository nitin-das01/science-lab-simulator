export interface VernierCalculations {
  msr: number; // Main scale reading in mm
  vsr: number; // Vernier scale reading (coincident division index)
  leastCount: number; // in mm
  fractionalReading: number; // vsr * leastCount
  rawReading: number; // msr + fractionalReading
  zeroError: number; // in mm
  zeroCorrection: number; // -zeroError
  correctedReading: number; // rawReading - zeroError
  coincidenceAccuracy: number; // 0 to 1 how close to perfect alignment
}

export function calculateVernier(
  rawPositionMm: number,
  zeroErrorMm: number,
  divisionsCount: 10 | 20 | 50 = 10
): VernierCalculations {
  // Least count formula:
  // For 10 divisions: 10 VSD = 9 MSD (1 MSD = 1mm) => LC = 1 - 9/10 = 0.1 mm
  // For 20 divisions: 20 VSD = 19 MSD => LC = 1 - 19/20 = 0.05 mm
  // For 50 divisions: 50 VSD = 49 MSD => LC = 1 - 49/50 = 0.02 mm
  const leastCount = 1 / divisionsCount;

  // Clamp raw position to valid range
  const pos = Math.max(0, rawPositionMm);

  // Main Scale Reading is the largest whole mm mark to the left of the Vernier zero mark
  const msr = Math.floor(pos);

  // Fractional displacement beyond MSR
  const fractionalPart = pos - msr;

  // Vernier Scale Reading is the index of the vernier line that aligns closest with any main scale line
  // Vernier line k is at position: pos + k * (1 - leastCount)
  // We want (pos + k * (1 - leastCount)) to be an integer (align with a main scale line)
  // pos + k - k * leastCount = integer
  // msr + frac + k - k * leastCount = integer
  // frac - k * leastCount approx 0  =>  k approx frac / leastCount
  const exactVsr = fractionalPart / leastCount;
  let vsr = Math.round(exactVsr);

  if (vsr >= divisionsCount) {
    vsr = divisionsCount - 1;
  }
  if (vsr < 0) {
    vsr = 0;
  }

  const fractionalReading = Number((vsr * leastCount).toFixed(3));
  const rawReading = Number((msr + fractionalReading).toFixed(3));
  const correctedReading = Number((rawReading - zeroErrorMm).toFixed(3));
  const zeroCorrection = Number((-zeroErrorMm).toFixed(3));

  const alignmentOffset = Math.abs(exactVsr - vsr);
  const coincidenceAccuracy = Math.max(0, 1 - alignmentOffset);

  return {
    msr,
    vsr,
    leastCount,
    fractionalReading,
    rawReading,
    zeroError: zeroErrorMm,
    zeroCorrection,
    correctedReading,
    coincidenceAccuracy,
  };
}
