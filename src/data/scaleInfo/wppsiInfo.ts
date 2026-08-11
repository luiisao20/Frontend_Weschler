import { SubtestInfo, IndexInfo } from './waisInfo';

export const wppsiTests: SubtestInfo[] = [
  { code: 'D', name: 'Dibujos', primary: ['Comprensión verbal'], secondary: ['Adquisición de vocabulario', 'Capacidad general'] },
  { code: 'C', name: 'Cubos', primary: ['Visoespacial'], secondary: ['No verbal', 'Capacidad general'] },
  { code: 'R', name: 'Reconocimiento', primary: ['Memoria de trabajo'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'I', name: 'Información', primary: ['Comprensión verbal'], secondary: ['Capacidad general'] },
  { code: 'RO', name: 'Rompecabezas', primary: ['Visoespacial'], secondary: ['No verbal', 'Capacidad general'] },
  { code: 'L', name: 'Localización', primary: ['Memoria de trabajo'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'N', name: 'Nombres', primary: [], secondary: ['Adquisición de vocabulario', 'Capacidad general'] },
  { code: 'M', name: 'Matrices', primary: ['Razonamiento fluido'], secondary: ['No verbal', 'Capacidad general'], restriction: true },
  { code: 'BA', name: 'Búsqueda de animales', primary: ['Velocidad de procesamiento'], secondary: ['No verbal', 'Competencia cognitiva'], restriction: true },
  { code: 'S', name: 'Semejanzas', primary: ['Comprensión verbal'], secondary: ['Capacidad general'], restriction: true },
  { code: 'CON', name: 'Conceptos', primary: ['Razonamiento fluido'], secondary: ['No verbal', 'Capacidad general'], restriction: true },
  { code: 'CA', name: 'Cancelación', restriction: true, primary: ['Velocidad de procesamiento'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'V', name: 'Vocabulario', restriction: true, primary: [], secondary: ['Capacidad general'] },
  { code: 'CF', name: 'Clave de figuras', restriction: true, primary: [], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'CO', name: 'Comprensión', restriction: true, primary: [], secondary: ['Capacidad general'] }
];

export const wppsiPrimaryIndexes: IndexInfo[] = [
  { 
    code: 'ICV', 
    name: 'Índice de comprensión verbal', 
    group: 'Comprensión verbal',
    earlyMains: ['D', 'I'],
    lastMains: ['I', 'S']
  },
  { 
    code: 'IVE', 
    name: 'Índice visoespacial', 
    group: 'Visoespacial',
    earlyMains: ['C', 'RO'],
    lastMains: ['C', 'RO']
  },
  { 
    code: 'IRF', 
    name: 'Índice de razonamiento fluido', 
    group: 'Razonamiento fluido', 
    restriction: true,
    lastMains: ['M', 'CON']
  },
  { 
    code: 'IMT', 
    name: 'Índice de memoria de trabajo', 
    group: 'Memoria de trabajo',
    earlyMains: ['R', 'L'],
    lastMains: ['R', 'L']
  },
  { 
    code: 'IVP', 
    name: 'Índice de velocidad de procesamiento', 
    group: 'Velocidad de procesamiento', 
    restriction: true,
    lastMains: ['BA', 'CA']
  },
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
  { code: 'IAV', name: 'Índice de adquisición de vocabulario', group: 'Adquisición de vocabulario', earlyMains: ['D', 'N'], lastMains: ['D', 'N'] },
  { code: 'INV', name: 'Índice no verbal', group: 'No verbal', earlyMains: ['C', 'R', 'RO', 'L'], lastMains: ['C', 'M', 'BA', 'R', 'CON'], lastOptionals: ['CA', 'L', 'RO', 'CF'] },
  { code: 'ICG', name: 'Índice de capacidad general', group: 'Capacidad general', earlyMains: ['D', 'C', 'I', 'RO'], earlyOptionals: ['N'], lastMains: ['C', 'I', 'M', 'S'], lastOptionals: ['CON', 'RO', 'V', 'CO'] },
  { code: 'ICC', name: 'Índice de competencia cognitiva', group: 'Competencia cognitiva', lastMains: ['BA', 'R', 'CA', 'L'], lastOptionals: ['CF'], restriction: true }
];
