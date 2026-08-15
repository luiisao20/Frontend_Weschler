import { SubtestInfo, IndexInfo } from './waisInfo';

export const wnvTests: SubtestInfo[] = [
  { code: 'MAT', name: 'Matrices' },
  { code: 'CLA', name: 'Claves' },
  { code: 'ROM', name: 'Rompecabezas' },
  { code: 'REC', name: 'Reconocimiento' },
  { code: 'MES', name: 'Memoria espacial' },
  { code: 'HIS', name: 'Historietas' },
];

export const wnvIndexes: IndexInfo[] = [
  {
    code: 'CIT',
    name: 'Escala Total No Verbal',
    group: null,
    earlyMains: ['MAT', 'CLA', 'ROM', 'REC'],
    lastMains: ['MAT', 'CLA', 'MES', 'HIS'],
  }
];

