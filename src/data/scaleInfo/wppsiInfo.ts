import { SubtestInfo, IndexInfo } from './waisInfo';

export const wppsiTests: SubtestInfo[] = [
  { code: 'C', name: 'Cubos', primary: ['Visoespacial'], secondary: ['No verbal', 'Capacidad general'] },
  { code: 'I', name: 'Información', primary: ['Comprensión verbal'], secondary: ['Capacidad general'] },
  { code: 'M', name: 'Matrices', primary: ['Razonamiento fluido'], secondary: ['No verbal', 'Capacidad general'], restriction: true },
  { code: 'BA', name: 'Búsqueda de animales', primary: ['Velocidad de procesamiento'], secondary: ['No verbal', 'Competencia cognitiva'], restriction: true },
  { code: 'R', name: 'Reconocimiento', primary: ['Memoria de trabajo'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'S', name: 'Semejanzas', primary: ['Comprensión verbal'], secondary: ['Capacidad general'], restriction: true },
  { code: 'CON', name: 'Conceptos', primary: ['Razonamiento fluido'], secondary: ['No verbal', 'Capacidad general'], restriction: true },
  { code: 'CA', name: 'Cancelación', restriction: true, primary: ['Velocidad de procesamiento'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'L', name: 'Localización', primary: ['Memoria de trabajo'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'RO', name: 'Rompecabezas', primary: ['Visoespacial'], secondary: ['No verbal', 'Capacidad general'] },
  { code: 'V', name: 'Vocabulario', restriction: true, primary: [], secondary: ['Capacidad general'] },
  { code: 'CF', name: 'Clave de figuras', restriction: true, primary: [], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'CO', name: 'Comprensión', restriction: true, primary: [], secondary: ['Capacidad general'] },
  { code: 'D', name: 'Dibujos', primary: ['Comprensión verbal'], secondary: ['Adquisición de vocabulario', 'Capacidad general'] },
  { code: 'N', name: 'Nombres', primary: [], secondary: ['Adquisición de vocabulario', 'Capacidad general'] }
];

export const wppsiPrimaryIndexes: IndexInfo[] = [
  { code: 'ICV', name: 'Índice de comprensión verbal', group: 'Comprensión verbal' },
  { code: 'IVE', name: 'Índice visoespacial', group: 'Visoespacial' },
  { code: 'IRF', name: 'Índice de razonamiento fluido', group: 'Razonamiento fluido', restriction: true },
  { code: 'IMT', name: 'Índice de memoria de trabajo', group: 'Memoria de trabajo' },
  { code: 'IVP', name: 'Índice de velocidad de procesamiento', group: 'Velocidad de procesamiento', restriction: true },
  { 
    code: 'CIT', 
    name: 'Coeficiente intelectual total', 
    group: null,
    earlyMains: ['D', 'C', 'R', 'I', 'RO'],
    earlyOptionals: ['N', 'L'],
    lastMains: ['C', 'I', 'M', 'BA', 'R', 'S'],
    lastOptionals: ['CON', 'CA', 'L', 'RO', 'V', 'CF', 'CO']
  }
];

export const wppsiSecondaryIndexes: IndexInfo[] = [
  { code: 'IAV', name: 'Índice de adquisición de vocabulario', group: 'Adquisición de vocabulario', earlyMains: ['D', 'N'] },
  { code: 'INV', name: 'Índice no verbal', group: 'No verbal', earlyMains: ['C', 'R', 'RO', 'L'], lastMains: ['C', 'M', 'BA', 'R', 'CON'], lastOptionals: ['CA', 'L', 'RO', 'CF'] },
  { code: 'ICG', name: 'Índice de capacidad general', group: 'Capacidad general', earlyMains: ['D', 'C', 'I', 'RO'], earlyOptionals: ['N'], lastMains: ['C', 'I', 'M', 'S'], lastOptionals: ['CON', 'RO', 'V', 'CO'] },
  { code: 'ICC', name: 'Índice de competencia cognitiva', group: 'Competencia cognitiva', lastMains: ['BA', 'R', 'CA', 'L'], lastOptionals: ['CF'], restriction: true }
];
