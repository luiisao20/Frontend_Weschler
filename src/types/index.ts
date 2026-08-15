export interface Patient {
  id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  lastname?: string;
  document: string;
  birthdate: string;
  birthday?: string;
  fechaNacimiento?: string;
  gender: string;
  location: string;
  owner: string;
  createdAt?: string;
  [key: string]: any;
}

export interface AgeCalculated {
  years: number;
  months: number;
  days: number;
}

export interface Evaluation {
  id?: string;
  patient: string;
  patientId?: string;
  scale: 'wais' | 'wisc' | 'wppsi' | 'wnv';
  type?: string;
  name?: string;
  date: string;
  testDay?: string;
  years?: number;
  months?: number;
  days?: number;
  age: AgeCalculated;
  scores?: Record<string, number | string>;
  rawScores?: Record<string, number | string>;
  scalarScores?: Record<string, number>;
  indexesSum?: Record<string, number>;
  indexes?: Record<string, any>;
  data?: Record<string, any>;
  verificationCode?: string;
  verificationHash?: string;
  verifiedAt?: string;
  createdAt?: string;
  [key: string]: any;
}

export type ScaleType = 'wais' | 'wisc' | 'wppsi' | 'wnv';

export interface NormativeTableRange {
  range: string;
  [key: string]: any;
}
