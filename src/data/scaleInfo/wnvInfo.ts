import { SubtestInfo } from './waisInfo';

export const wnvTests: SubtestInfo[] = [
  { code: 'MAT', name: 'Matrices' },
  { code: 'CLA', name: 'Claves' },
  { code: 'ROM', name: 'Rompecabezas', restriction: true },
  { code: 'REC', name: 'Reconocimiento', restriction: true },
  { code: 'MES', name: 'Memoria espacial', restriction: true },
  { code: 'HIS', name: 'Historietas', restriction: true }
];
