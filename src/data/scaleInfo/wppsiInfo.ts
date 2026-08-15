import { SubtestInfo, IndexInfo } from './waisInfo';

export const wppsiTests: SubtestInfo[] = [
  { code: 'D',   name: 'Dibujos',             primary: ['Comprensión verbal'],         secondary: ['Adquisición de vocabulario', 'Capacidad general']  },
  { code: 'C',   name: 'Cubos',               primary: ['Visoespacial'],               secondary: ['No verbal', 'Capacidad general']                   },
  { code: 'R',   name: 'Reconocimiento',      primary: ['Memoria de trabajo'],         secondary: ['No verbal', 'Competencia cognitiva']               },
  { code: 'I',   name: 'Información',         primary: ['Comprensión verbal'],         secondary: ['Capacidad general']                               },
  { code: 'RO',  name: 'Rompecabezas',        primary: ['Visoespacial'],               secondary: ['No verbal', 'Capacidad general']                   },
  { code: 'L',   name: 'Localización',        primary: ['Memoria de trabajo'],         secondary: ['No verbal', 'Competencia cognitiva']               },
  { code: 'N',   name: 'Nombres',             primary: [],                             secondary: ['Adquisición de vocabulario', 'Capacidad general']  },
  { code: 'M',   name: 'Matrices',            primary: ['Razonamiento fluido'],        secondary: ['No verbal', 'Capacidad general'],    restriction: true },
  { code: 'BA',  name: 'Búsqueda de animales',primary: ['Velocidad de procesamiento'],secondary: ['No verbal', 'Competencia cognitiva'],restriction: true },
  { code: 'S',   name: 'Semejanzas',          primary: ['Comprensión verbal'],         secondary: ['Capacidad general'],                restriction: true },
  { code: 'CON', name: 'Conceptos',           primary: ['Razonamiento fluido'],        secondary: ['No verbal', 'Capacidad general'],    restriction: true },
  { code: 'CA',  name: 'Cancelación',         primary: ['Velocidad de procesamiento'],secondary: ['No verbal', 'Competencia cognitiva'],restriction: true },
  { code: 'V',   name: 'Vocabulario',         primary: [],                             secondary: ['Capacidad general'],                restriction: true },
  { code: 'CF',  name: 'Clave de figuras',    primary: [],                             secondary: ['No verbal', 'Competencia cognitiva'],restriction: true },
  { code: 'CO',  name: 'Comprensión',         primary: [],                             secondary: ['Capacidad general'],                restriction: true },
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
    earlySubstitutions: { 'N': 'Reemplaza a Dibujos', 'L': 'Reemplaza a Reconocimiento' },
    lastMains: ['C', 'I', 'M', 'BA', 'R', 'S'],
    lastOptionals: ['CON', 'CA', 'L', 'RO', 'V', 'CF', 'CO'],
    lastSubstitutions: {
      'RO': 'Reemplaza a Cubos',
      'CON': 'Reemplaza a Matrices',
      'CA': 'Reemplaza a Búsqueda de animales',
      'CF': 'Reemplaza a Búsqueda de animales',
      'L': 'Reemplaza a Reconocimiento',
      'V': 'Reemplaza a Información o Semejanzas',
      'CO': 'Reemplaza a Información o Semejanzas'
    }
  }
];

export const wppsiSecondaryIndexes: IndexInfo[] = [
  { code: 'IAV', name: 'Índice de adquisición de vocabulario', group: 'Adquisición de vocabulario', earlyMains: ['D', 'N'], lastMains: ['D', 'N'] },
  {
    code: 'INV',
    name: 'Índice no verbal',
    group: 'No verbal',
    earlyMains: ['C', 'R', 'RO', 'L'],
    lastMains: ['C', 'M', 'BA', 'R', 'CON'],
    lastOptionals: ['CA', 'L', 'RO', 'CF'],
    lastSubstitutions: {
      'RO': 'Reemplaza a Cubos',
      'L': 'Reemplaza a Reconocimiento',
      'CA': 'Reemplaza a Búsqueda de animales',
      'CF': 'Reemplaza a Búsqueda de animales'
    }
  },
  {
    code: 'ICG',
    name: 'Índice de capacidad general',
    group: 'Capacidad general',
    earlyMains: ['D', 'C', 'I', 'RO'],
    earlyOptionals: ['N'],
    earlySubstitutions: { 'N': 'Reemplaza a Dibujos' },
    lastMains: ['C', 'I', 'M', 'S'],
    lastOptionals: ['CON', 'RO', 'V', 'CO'],
    lastSubstitutions: {
      'RO': 'Reemplaza a Cubos',
      'CON': 'Reemplaza a Matrices',
      'V': 'Reemplaza a Información o Semejanzas',
      'CO': 'Reemplaza a Información o Semejanzas'
    }
  },
  {
    code: 'ICC',
    name: 'Índice de competencia cognitiva',
    group: 'Competencia cognitiva',
    lastMains: ['BA', 'R', 'CA', 'L'],
    lastOptionals: ['CF'],
    lastSubstitutions: { 'CF': 'Reemplaza a Búsqueda de animales o Cancelación' },
    restriction: true
  }
];
