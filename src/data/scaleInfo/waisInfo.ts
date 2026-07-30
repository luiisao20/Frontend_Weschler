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
  lastMains?: string[];
  lastOptionals?: string[];
  restriction?: boolean;
}

export const waisTests: SubtestInfo[] = [
  { code: 'C', name: 'Cubos', group: 'Escala razonamiento perceptivo' },
  { code: 'S', name: 'Semejanzas', group: 'Escala comprensión verbal' },
  { code: 'D', name: 'Dígitos', group: 'Escala memoria de trabajo' },
  { code: 'M', name: 'Matrices', group: 'Escala razonamiento perceptivo' },
  { code: 'V', name: 'Vocabulario', group: 'Escala comprensión verbal' },
  { code: 'A', name: 'Aritmética', group: 'Escala memoria de trabajo' },
  { code: 'BS', name: 'Búsqueda de símbolos', group: 'Escala velocidad de procesamiento' },
  { code: 'PV', name: 'Puzles visuales', group: 'Escala razonamiento perceptivo' },
  { code: 'I', name: 'Información', group: 'Escala comprensión verbal' },
  { code: 'CN', name: 'Clave de números', group: 'Escala velocidad de procesamiento' },
  { code: 'LN', name: 'Letras y números', restriction: true, group: 'Escala memoria de trabajo' },
  { code: 'B', name: 'Balanzas', restriction: true, group: 'Escala razonamiento perceptivo' },
  { code: 'CO', name: 'Comprensión', group: 'Escala comprensión verbal' },
  { code: 'CA', name: 'Cancelación', restriction: true, group: 'Escala velocidad de procesamiento' },
  { code: 'FI', name: 'Figuras incompletas', group: 'Escala razonamiento perceptivo' }
];

export const waisIndexes: IndexInfo[] = [
  { code: 'ICV', name: 'Índice de comprensión verbal', group: 'Escala comprensión verbal', mains: ['S', 'V', 'I'], optionals: ['CO'] },
  { code: 'IRP', name: 'Índice de razonamiento perceptivo', group: 'Escala razonamiento perceptivo', mains: ['C', 'M', 'PV'], optionals: ['B', 'FI'] },
  { code: 'IMT', name: 'Índice de memoria de trabajo', group: 'Escala memoria de trabajo', mains: ['D', 'A'], optionals: ['LN'] },
  { code: 'IVP', name: 'Índice de velocidad de procesamiento', group: 'Escala velocidad de procesamiento', mains: ['BS', 'CN'], optionals: ['CA'] },
  { code: 'CIT', name: 'Coeficiente intelectual total', group: null, mains: ['S', 'V', 'I', 'C', 'M', 'PV', 'D', 'A', 'BS', 'CN'], optionals: ['CO', 'FI', 'LN', 'B', 'CA'] }
];
