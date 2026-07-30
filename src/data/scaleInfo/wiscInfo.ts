import { SubtestInfo, IndexInfo } from './waisInfo';

export const wiscTests: SubtestInfo[] = [
  { code: 'C', name: 'Cubos', primary: ['Visoespacial'], secondary: ['No verbal', 'Capacidad general'] },
  { code: 'S', name: 'Semejanzas', primary: ['Comprensión verbal'], secondary: ['Capacidad general'] },
  { code: 'M', name: 'Matrices', primary: ['Razonamiento fluido'], secondary: ['No verbal', 'Capacidad general'] },
  { code: 'D', name: 'Dígitos', primary: ['Memoria de trabajo'], secondary: ['Memoria de trabajo auditiva', 'Competencia cognitiva'] },
  { code: 'CL', name: 'Claves', primary: ['Velocidad de procesamiento'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'V', name: 'Vocabulario', primary: ['Comprensión verbal'], secondary: ['Capacidad general'] },
  { code: 'B', name: 'Balanzas', primary: ['Razonamiento fluido'], secondary: ['Razonamiento cuantitativo', 'No verbal', 'Capacidad general'] },
  { code: 'PV', name: 'Puzles visuales', primary: ['Visoespacial'], secondary: ['No verbal'] },
  { code: 'SD', name: 'Span de dibujos', primary: ['Memoria de trabajo'], secondary: ['No verbal', 'Competencia cognitiva'] },
  { code: 'BS', name: 'Búsqueda de símbolos', primary: ['Velocidad de procesamiento'], secondary: ['Competencia cognitiva'] },
  { code: 'I', name: 'Información', primary: [], secondary: [] },
  { code: 'LN', name: 'Letras y números', primary: [], secondary: ['Memoria de trabajo auditiva'] },
  { code: 'CA', name: 'Cancelación', primary: [], secondary: [] },
  { code: 'CO', name: 'Comprensión', primary: [], secondary: [] },
  { code: 'A', name: 'Aritmética', primary: [], secondary: ['Razonamiento cuantitativo'] }
];

export const wiscPrimaryIndexes: IndexInfo[] = [
  { code: 'ICV', name: 'Índice de comprensión verbal', group: 'Comprensión verbal' },
  { code: 'IVE', name: 'Índice visoespacial', group: 'Visoespacial' },
  { code: 'IRF', name: 'Índice de razonamiento fluido', group: 'Razonamiento fluido' },
  { code: 'IMT', name: 'Índice de memoria de trabajo', group: 'Memoria de trabajo' },
  { code: 'IVP', name: 'Índice de velocidad de procesamiento', group: 'Velocidad de procesamiento' },
  { code: 'CIT', name: 'Coeficiente intelectual total', group: null, mains: ['C', 'S', 'M', 'D', 'CL', 'V', 'B'], optionals: ['PV', 'SD', 'BS', 'I', 'LN', 'CA', 'CO', 'A'] }
];

export const wiscSecondaryIndexes: IndexInfo[] = [
  { code: 'IRC', name: 'Índice de razonamiento cuantitativo', group: 'Razonamiento cuantitativo' },
  { code: 'IMTA', name: 'Índice de memoria de trabajo auditiva', group: 'Memoria de trabajo auditiva' },
  { code: 'INV', name: 'Índice no verbal', group: 'No verbal' },
  { code: 'ICG', name: 'Índice de capacidad general', group: 'Capacidad general' },
  { code: 'ICC', name: 'Índice de competencia cognitiva', group: 'Competencia cognitiva' }
];
