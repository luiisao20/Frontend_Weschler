export interface SubtestInfo {
  code: string;
  name: string;
  group?: string;
  restriction?: boolean;
  primary?: string[];
  secondary?: string[];
}

export interface IndexInfo {
  code: string;
  name: string;
  group?: string | null;
  mains?: string[];
  optionals?: string[];
  earlyMains?: string[];
  earlyOptionals?: string[];
  earlySubstitutions?: Record<string, string>;
  lastMains?: string[];
  lastOptionals?: string[];
  lastSubstitutions?: Record<string, string>;
  substitutions?: Record<string, string>;
  restriction?: boolean;
}

export const waisTests: SubtestInfo[] = [
  { code: 'C',  name: 'Cubos',               group: 'Escala razonamiento perceptivo'    },
  { code: 'S',  name: 'Analogías',            group: 'Escala comprensión verbal'         },
  { code: 'D',  name: 'Dígitos',              group: 'Escala memoria de trabajo'         },
  { code: 'M',  name: 'Matrices',             group: 'Escala razonamiento perceptivo'    },
  { code: 'V',  name: 'Vocabulario',          group: 'Escala comprensión verbal'         },
  { code: 'A',  name: 'Aritmética',           group: 'Escala memoria de trabajo'         },
  { code: 'BS', name: 'Búsqueda de símbolos', group: 'Escala velocidad de procesamiento' },
  { code: 'PV', name: 'Puzles visuales',      group: 'Escala razonamiento perceptivo'    },
  { code: 'I',  name: 'Información',          group: 'Escala comprensión verbal'         },
  { code: 'CN', name: 'Clave de números',     group: 'Escala velocidad de procesamiento' },
  { code: 'LN', name: 'Letras y números',     group: 'Escala memoria de trabajo',         restriction: true },
  { code: 'B',  name: 'Balanzas',             group: 'Escala razonamiento perceptivo',    restriction: true },
  { code: 'CO', name: 'Comprensión',          group: 'Escala comprensión verbal'         },
  { code: 'CA', name: 'Cancelación',          group: 'Escala velocidad de procesamiento', restriction: true },
  { code: 'FI', name: 'Figuras incompletas',  group: 'Escala razonamiento perceptivo'    },
];

export const waisIndexes: IndexInfo[] = [
  {
    code: 'ICV',
    name: 'Índice de comprensión verbal',
    group: 'Escala comprensión verbal',
    mains: ['S', 'V', 'I'],
    optionals: ['CO'],
    substitutions: {
      'CO': 'Reemplaza a Analogías, Vocabulario o Información'
    }
  },
  {
    code: 'IRP',
    name: 'Índice de razonamiento perceptivo',
    group: 'Escala razonamiento perceptivo',
    mains: ['C', 'M', 'PV'],
    optionals: ['B', 'FI'],
    substitutions: {
      'B': 'Reemplaza a Cubos, Matrices o Puzles visuales',
      'FI': 'Reemplaza a Cubos, Matrices o Puzles visuales'
    }
  },
  {
    code: 'IMT',
    name: 'Índice de memoria de trabajo',
    group: 'Escala memoria de trabajo',
    mains: ['D', 'A'],
    optionals: ['LN'],
    substitutions: {
      'LN': 'Reemplaza a Dígitos o Aritmética'
    }
  },
  {
    code: 'IVP',
    name: 'Índice de velocidad de procesamiento',
    group: 'Escala velocidad de procesamiento',
    mains: ['BS', 'CN'],
    optionals: ['CA'],
    substitutions: {
      'CA': 'Reemplaza a Búsqueda de símbolos o Clave de números'
    }
  },
  {
    code: 'CIT',
    name: 'Coeficiente intelectual total',
    group: null,
    mains: ['S', 'V', 'I', 'C', 'M', 'PV', 'D', 'A', 'BS', 'CN'],
    optionals: ['CO', 'FI', 'LN', 'B', 'CA'],
    substitutions: {
      'CO': 'Reemplaza a Analogías, Vocabulario o Información',
      'B': 'Reemplaza a Cubos, Matrices o Puzles visuales',
      'FI': 'Reemplaza a Cubos, Matrices o Puzles visuales',
      'LN': 'Reemplaza a Dígitos o Aritmética',
      'CA': 'Reemplaza a Búsqueda de símbolos o Clave de números'
    }
  }
];
