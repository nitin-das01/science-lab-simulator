export type InstrumentCategory = 'physics' | 'chemistry' | 'biology';

export type InstrumentType = 
  | 'vernier-caliper' 
  | 'screw-gauge' 
  | 'spherometer' 
  | 'metre-bridge' 
  | 'titration' 
  | 'microscope';

export type SimulationMode = 'sandbox' | 'challenge';

export type ZeroErrorType = 'nil' | 'positive' | 'negative' | 'custom';

export interface TestObject {
  id: string;
  name: string;
  category: string;
  description: string;
  trueDimension: number; // in mm
  dimensionType: 'external' | 'internal' | 'depth' | 'thickness' | 'diameter';
  color: string;
  secondaryColor?: string;
  renderShape: 'sphere' | 'cylinder' | 'plate' | 'wire' | 'capillary' | 'hollow-cylinder' | 'beaker';
}

export interface InstrumentState {
  currentPosition: number; // in mm (primary measurement value)
  zeroError: number; // in mm (positive means reads > 0 when closed)
  leastCount: number; // in mm
  clampedObject: TestObject | null;
  isLocked: boolean;
  fineStep: number; // step size in mm
}

export interface ObservationEntry {
  id: string;
  readingNumber: number;
  instrumentId: InstrumentType;
  instrumentName: string;
  objectName: string;
  msr: number; // Main scale reading (mm)
  vsr: number; // Vernier / circular scale divisions
  fractionalReading: number; // vsr * leastCount
  totalReading: number; // msr + fractionalReading
  zeroError: number; // zero error of instrument
  correctedReading: number; // totalReading - zeroError
  trueDimension?: number;
  errorPercentage?: number;
  timestamp: number;
}

export interface VivaChallenge {
  id: string;
  instrumentId: InstrumentType;
  title: string;
  targetPosition: number;
  zeroError: number;
  objectName: string;
  expectedMsr: number;
  expectedVsr: number;
  expectedTotal: number;
  expectedCorrected: number;
  hints: string[];
  explanation: string;
}
