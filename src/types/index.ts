export interface Patient {
  id?: string;
  name: string;
  lastname: string;
  document: string;
  birthdate: string;
  gender: string;
  location: string;
  owner: string;
  createdAt?: string;
}

export interface AgeCalculated {
  years: number;
  months: number;
  days: number;
}

export interface Evaluation {
  id?: string;
  patient: string;
  scale: 'wais' | 'wisc' | 'wppsi' | 'wnv';
  date: string;
  age: AgeCalculated;
  scores: Record<string, number | string>;
  indexes?: Record<string, any>;
  createdAt?: string;
}

export type ScaleType = 'wais' | 'wisc' | 'wppsi' | 'wnv';

export interface NormativeTableRange {
  range: string;
  [key: string]: any;
}
