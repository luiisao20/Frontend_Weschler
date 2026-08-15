import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AgeCalculated } from '../types';
import { selectReplacementsWAIS, selectReplacementsWAIS_CIT, selectReplacementsWISC, selectReplacementsWPPSI } from './replacements';

export function parseAnyDate(dateStr: string | Date | number): Date | null {
  if (!dateStr) return null;
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr;
  if (typeof dateStr === 'number') {
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d;
  }

  const str = String(dateStr).trim();
  if (!str) return null;

  let d = new Date(str);
  if (!isNaN(d.getTime())) return d;

  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    if (!isNaN(p0) && !isNaN(p1) && !isNaN(p2)) {
      if (p2 > 1000) {
        if (p0 > 12) {
          d = new Date(p2, p1 - 1, p0);
        } else {
          d = new Date(p2, p1 - 1, p0);
        }
      } else if (p0 > 1000) {
        d = new Date(p0, p1 - 1, p2);
      }
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

export function calculateAge(birthdateStr: string, evalDateStr?: string): AgeCalculated {
  const birthDate = parseAnyDate(birthdateStr);
  const evalDate = parseAnyDate(evalDateStr || '') || new Date();

  if (!birthDate) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = evalDate.getFullYear() - birthDate.getFullYear();
  let months = evalDate.getMonth() - birthDate.getMonth();
  let days = evalDate.getDate() - birthDate.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(evalDate.getFullYear(), evalDate.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return {
    years: isNaN(years) || years < 0 ? 0 : years,
    months: isNaN(months) || months < 0 ? 0 : months,
    days: isNaN(days) || days < 0 ? 0 : days
  };
}

function generateIntegerArray(lowerLimit: number, upperLimit: number): number[] {
  return Array.from({ length: upperLimit - lowerLimit + 1 }, (_, k) => k + lowerLimit);
}

export function getRange(testCode: string, rawValue: string | number, table: any): string | null {
  if (rawValue === '' || rawValue === undefined || rawValue === null) return null;
  if (!table || !table.data || !table.data[testCode]) return null;

  const inputValue = typeof rawValue === 'number' ? rawValue : parseInt(rawValue, 10);
  if (isNaN(inputValue)) return null;

  const testRanges = Object.keys(table.data[testCode]);

  for (const range of testRanges) {
    if (range.includes('-')) {
      const parts = range.split('-');
      const lower = parseInt(parts[0], 10);
      const upper = parseInt(parts[1], 10);
      const arr = generateIntegerArray(lower, upper);
      if (arr.includes(inputValue)) return range;
    } else {
      const valueModel = parseInt(range, 10);
      if (valueModel === inputValue) return range;
    }
  }

  return null;
}

export function findScalars(
  inputTests: Record<string, number | string>,
  table: any,
  tests: any[],
  indexes: any[],
  multipleIndexes?: string,
  isEarlyAge?: boolean,
  scaleType?: 'wais' | 'wisc' | 'wppsi' | 'wnv'
) {
  const points: Record<string, number> = {};
  const sum: Record<string, number> = {};
  const errors = {
    empty: false,
    outOfRange: ''
  };

  indexes.forEach(element => {
    sum[element.code] = 0;
  });

  // Calculate points for each input test
  Object.keys(inputTests).forEach(testCode => {
    const rawVal = inputTests[testCode];
    if (rawVal === '' || rawVal === undefined || rawVal === null) {
      errors.empty = true;
      return;
    }

    const range = getRange(testCode, rawVal, table);
    if (!range) {
      errors.outOfRange = testCode;
    } else {
      const scalarValue = table.data[testCode][range];
      points[testCode] = scalarValue;
    }
  });

  // Special substitution and completeness logic for WPPSI Early Age (2:6 - 3:11)
  if (scaleType === 'wppsi' && isEarlyAge && (multipleIndexes === 'primary' || multipleIndexes === 'secondary')) {
    indexes.forEach(indexObj => {
      const idxCode = indexObj.code;

      if (idxCode === 'CIT') {
        // Main required subtests for CIT (2:6 - 3:11): D, C, R, I, RO
        // Allowed substitutions: D -> N, R -> L (Max 1 substitution total)
        let substitutionCount = 0;
        let citSum = 0;
        let isInvalid = false;

        // Check C, I, RO (must be present)
        for (const reqCode of ['C', 'I', 'RO']) {
          if (points[reqCode] === undefined) {
            isInvalid = true;
            break;
          }
          citSum += points[reqCode];
        }

        // Check D (Dibujos) -> substitute by N (Nombres) if missing
        if (!isInvalid) {
          if (points['D'] !== undefined) {
            citSum += points['D'];
          } else if (points['N'] !== undefined) {
            citSum += points['N'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        // Check R (Reconocimiento) -> substitute by L (Localización) if missing
        if (!isInvalid) {
          if (points['R'] !== undefined) {
            citSum += points['R'];
          } else if (points['L'] !== undefined) {
            citSum += points['L'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        // Max 1 substitution allowed for CIT. If 2 substitutions, CIT is invalid!
        if (isInvalid || substitutionCount > 1) {
          delete sum['CIT'];
        } else {
          sum['CIT'] = citSum;
        }

      } else if (idxCode === 'ICG') {
        // Main required subtests for ICG (2:6 - 3:11): D, C, I, RO
        // Allowed substitution: D -> N
        let isInvalid = false;
        let icgSum = 0;

        for (const reqCode of ['C', 'I', 'RO']) {
          if (points[reqCode] === undefined) {
            isInvalid = true;
            break;
          }
          icgSum += points[reqCode];
        }

        if (!isInvalid) {
          if (points['D'] !== undefined) {
            icgSum += points['D'];
          } else if (points['N'] !== undefined) {
            icgSum += points['N'];
          } else {
            isInvalid = true;
          }
        }

        if (isInvalid) {
          delete sum['ICG'];
        } else {
          sum['ICG'] = icgSum;
        }

      } else {
        // Other indexes for age 2:6 - 3:11 (ICV, IVE, IMT, IAV, INV, ICC)
        // Substitutions NOT allowed. ALL required subtests MUST be present.
        let mainList: string[] | undefined = indexObj.earlyMains;
        
        if (!mainList && indexObj.group) {
          mainList = tests.filter(t => !t.restriction && t.primary?.includes(indexObj.group)).map(t => t.code);
          if (!mainList || mainList.length === 0) {
            mainList = tests.filter(t => !t.restriction && t.secondary?.includes(indexObj.group)).map(t => t.code);
          }
        }

        if (mainList && mainList.length > 0) {
          let currentSum = 0;
          let allPresent = true;

          for (const code of mainList) {
            if (points[code] === undefined) {
              allPresent = false;
              break;
            }
            currentSum += points[code];
          }

          if (allPresent) {
            sum[idxCode] = currentSum;
          } else {
            delete sum[idxCode];
          }
        } else {
          delete sum[idxCode];
        }
      }
    });

    return { points, sum, errors };
  }

  // Special substitution and completeness logic for WPPSI Late Age (4:0 - 7:7)
  if (scaleType === 'wppsi' && !isEarlyAge && (multipleIndexes === 'primary' || multipleIndexes === 'secondary')) {
    indexes.forEach(indexObj => {
      const idxCode = indexObj.code;

      if (idxCode === 'CIT') {
        // Main required subtests for CIT (4:0 - 7:7): C, I, M, BA, R, S
        // Substitutions allowed:
        // C -> RO
        // M -> CON
        // BA -> CA or CF
        // R -> L
        // I or S -> V or CO
        // Max 1 substitution allowed total!
        let substitutionCount = 0;
        let citSum = 0;
        let isInvalid = false;

        // Check C (Cubos)
        if (points['C'] !== undefined) {
          citSum += points['C'];
        } else if (points['RO'] !== undefined) {
          citSum += points['RO'];
          substitutionCount += 1;
        } else {
          isInvalid = true;
        }

        // Check M (Matrices)
        if (!isInvalid) {
          if (points['M'] !== undefined) {
            citSum += points['M'];
          } else if (points['CON'] !== undefined) {
            citSum += points['CON'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        // Check BA (Búsqueda de animales)
        if (!isInvalid) {
          if (points['BA'] !== undefined) {
            citSum += points['BA'];
          } else if (points['CA'] !== undefined) {
            citSum += points['CA'];
            substitutionCount += 1;
          } else if (points['CF'] !== undefined) {
            citSum += points['CF'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        // Check R (Reconocimiento)
        if (!isInvalid) {
          if (points['R'] !== undefined) {
            citSum += points['R'];
          } else if (points['L'] !== undefined) {
            citSum += points['L'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        // Check I (Información) and S (Semejanzas)
        if (!isInvalid) {
          const hasI = points['I'] !== undefined;
          const hasS = points['S'] !== undefined;

          if (hasI && hasS) {
            citSum += points['I'] + points['S'];
          } else if (!hasI && hasS) {
            if (points['V'] !== undefined) {
              citSum += points['V'] + points['S'];
              substitutionCount += 1;
            } else if (points['CO'] !== undefined) {
              citSum += points['CO'] + points['S'];
              substitutionCount += 1;
            } else {
              isInvalid = true;
            }
          } else if (hasI && !hasS) {
            if (points['V'] !== undefined) {
              citSum += points['I'] + points['V'];
              substitutionCount += 1;
            } else if (points['CO'] !== undefined) {
              citSum += points['I'] + points['CO'];
              substitutionCount += 1;
            } else {
              isInvalid = true;
            }
          } else {
            isInvalid = true;
          }
        }

        // Max 1 substitution allowed for CIT. If > 1 substitutions, CIT is invalid!
        if (isInvalid || substitutionCount > 1) {
          delete sum['CIT'];
        } else {
          sum['CIT'] = citSum;
        }

      } else if (idxCode === 'INV') {
        // Main required subtests for INV (4:0 - 7:7): C, M, BA, R, CON
        // Substitutions allowed (Max 1):
        // C -> RO
        // R -> L
        // BA -> CA or CF
        let substitutionCount = 0;
        let invSum = 0;
        let isInvalid = false;

        // Check C
        if (points['C'] !== undefined) {
          invSum += points['C'];
        } else if (points['RO'] !== undefined) {
          invSum += points['RO'];
          substitutionCount += 1;
        } else {
          isInvalid = true;
        }

        // Check M
        if (!isInvalid) {
          if (points['M'] !== undefined) {
            invSum += points['M'];
          } else {
            isInvalid = true;
          }
        }

        // Check CON
        if (!isInvalid) {
          if (points['CON'] !== undefined) {
            invSum += points['CON'];
          } else {
            isInvalid = true;
          }
        }

        // Check BA
        if (!isInvalid) {
          if (points['BA'] !== undefined) {
            invSum += points['BA'];
          } else if (points['CA'] !== undefined) {
            invSum += points['CA'];
            substitutionCount += 1;
          } else if (points['CF'] !== undefined) {
            invSum += points['CF'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        // Check R
        if (!isInvalid) {
          if (points['R'] !== undefined) {
            invSum += points['R'];
          } else if (points['L'] !== undefined) {
            invSum += points['L'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        if (isInvalid || substitutionCount > 1) {
          delete sum['INV'];
        } else {
          sum['INV'] = invSum;
        }

      } else if (idxCode === 'ICG') {
        // Main required subtests for ICG (4:0 - 7:7): C, I, M, S
        // Substitutions allowed (Max 1):
        // C -> RO
        // M -> CON
        // I or S -> V or CO
        let substitutionCount = 0;
        let icgSum = 0;
        let isInvalid = false;

        // Check C
        if (points['C'] !== undefined) {
          icgSum += points['C'];
        } else if (points['RO'] !== undefined) {
          icgSum += points['RO'];
          substitutionCount += 1;
        } else {
          isInvalid = true;
        }

        // Check M
        if (!isInvalid) {
          if (points['M'] !== undefined) {
            icgSum += points['M'];
          } else if (points['CON'] !== undefined) {
            icgSum += points['CON'];
            substitutionCount += 1;
          } else {
            isInvalid = true;
          }
        }

        // Check I and S
        if (!isInvalid) {
          const hasI = points['I'] !== undefined;
          const hasS = points['S'] !== undefined;

          if (hasI && hasS) {
            icgSum += points['I'] + points['S'];
          } else if (!hasI && hasS) {
            if (points['V'] !== undefined) {
              icgSum += points['V'] + points['S'];
              substitutionCount += 1;
            } else if (points['CO'] !== undefined) {
              icgSum += points['CO'] + points['S'];
              substitutionCount += 1;
            } else {
              isInvalid = true;
            }
          } else if (hasI && !hasS) {
            if (points['V'] !== undefined) {
              icgSum += points['I'] + points['V'];
              substitutionCount += 1;
            } else if (points['CO'] !== undefined) {
              icgSum += points['I'] + points['CO'];
              substitutionCount += 1;
            } else {
              isInvalid = true;
            }
          } else {
            isInvalid = true;
          }
        }

        if (isInvalid || substitutionCount > 1) {
          delete sum['ICG'];
        } else {
          sum['ICG'] = icgSum;
        }

      } else if (idxCode === 'ICC') {
        // Main required subtests for ICC (4:0 - 7:7): BA, R, CA, L
        // Allowed substitution (Max 1):
        // CF replaces BA or CA
        let substitutionCount = 0;
        let iccSum = 0;
        let isInvalid = false;

        // Check R and L
        if (points['R'] !== undefined && points['L'] !== undefined) {
          iccSum += points['R'] + points['L'];
        } else {
          isInvalid = true;
        }

        // Check BA and CA
        if (!isInvalid) {
          const hasBA = points['BA'] !== undefined;
          const hasCA = points['CA'] !== undefined;

          if (hasBA && hasCA) {
            iccSum += points['BA'] + points['CA'];
          } else if (!hasBA && hasCA) {
            if (points['CF'] !== undefined) {
              iccSum += points['CF'] + points['CA'];
              substitutionCount += 1;
            } else {
              isInvalid = true;
            }
          } else if (hasBA && !hasCA) {
            if (points['CF'] !== undefined) {
              iccSum += points['BA'] + points['CF'];
              substitutionCount += 1;
            } else {
              isInvalid = true;
            }
          } else {
            isInvalid = true;
          }
        }

        if (isInvalid || substitutionCount > 1) {
          delete sum['ICC'];
        } else {
          sum['ICC'] = iccSum;
        }

      } else {
        // Primary indexes for age 4:0 - 7:7 (ICV, IVE, IRF, IMT, IVP) and IAV
        // NO substitutions allowed! All required subtests MUST be present.
        let mainList: string[] | undefined = indexObj.lastMains;

        if (mainList && mainList.length > 0) {
          let currentSum = 0;
          let allPresent = true;

          for (const code of mainList) {
            if (points[code] === undefined) {
              allPresent = false;
              break;
            }
            currentSum += points[code];
          }

          if (allPresent) {
            sum[idxCode] = currentSum;
          } else {
            delete sum[idxCode];
          }
        } else {
          delete sum[idxCode];
        }
      }
    });

    return { points, sum, errors };
  }

  const completed = Object.keys(points);
  const allTestCodes = tests.map(t => t.code);
  const uncompleted = allTestCodes.filter(c => !completed.includes(c));

  indexes.forEach(indexObj => {
    let mainList: string[] | undefined = undefined;

    if (isEarlyAge && indexObj.earlyMains) {
      mainList = indexObj.earlyMains;
    } else if (!isEarlyAge && indexObj.lastMains) {
      mainList = indexObj.lastMains;
    } else if (indexObj.mains) {
      mainList = indexObj.mains;
    }

    if (mainList && Array.isArray(mainList)) {
      let currentSum = 0;
      let missingCount = 0;
      mainList.forEach((code: string) => {
        if (points[code] !== undefined) {
          currentSum += points[code];
        } else {
          missingCount++;
        }
      });

      let replacement: number | false = 0;

      // WAIS CIT: allows up to 2 substitutions — handled by its own function
      if (scaleType === 'wais' && indexObj.code === 'CIT') {
        const missingCodes = mainList.filter((code: string) => points[code] === undefined);
        const citResult = selectReplacementsWAIS_CIT(missingCodes, completed, points);
        if (missingCodes.length === 0) {
          sum[indexObj.code] = currentSum;
        } else if (citResult !== false) {
          sum[indexObj.code] = currentSum + citResult;
        } else {
          delete sum[indexObj.code];
        }
      } else {
        if (scaleType === 'wisc') {
          replacement = selectReplacementsWISC(indexObj.code, completed, uncompleted, points);
        } else if (scaleType === 'wppsi') {
          replacement = selectReplacementsWPPSI(indexObj.code, completed, uncompleted, points);
        } else if (scaleType === 'wais') {
          replacement = selectReplacementsWAIS(indexObj.code, completed, uncompleted, points);
        }

        if (missingCount === 0) {
          sum[indexObj.code] = currentSum;
        } else if (missingCount === 1) {
          if (typeof replacement === 'number' && replacement > 0) {
            sum[indexObj.code] = currentSum + replacement;
          } else {
            delete sum[indexObj.code];
          }
        } else {
          delete sum[indexObj.code];
        }
      }
    } else {
      let currentSum = 0;
      Object.keys(points).forEach(testCode => {
        const scalarValue = points[testCode];
        const item = tests.find(v => v.code === testCode);

        if (item) {
          if (multipleIndexes && item[multipleIndexes] && Array.isArray(item[multipleIndexes])) {
            if (item[multipleIndexes].includes(indexObj.group)) {
              currentSum += scalarValue;
            }
          } else if (item.group && item.group === indexObj.group) {
            currentSum += scalarValue;
          }
        }
      });

      sum[indexObj.code] = currentSum;
    }
  });

  return { points, sum, errors };
}

export function findComposes(
  indexesSum: Record<string, number>,
  indexConversionTables: any[],
  isEarlyAge?: boolean
): Record<string, any> {
  const composes: Record<string, any> = {};
  if (!indexesSum || !indexConversionTables || !Array.isArray(indexConversionTables)) return composes;

  indexConversionTables.forEach((element: any) => {
    if (!element) return;
    const rawCode = element.index || element.code || element.name || element.group || '';
    const fullCodeStr = String(rawCode).trim().toUpperCase();
    
    // Extract base code (e.g. "ICV 2-6 3-11" -> "ICV", "IAV 2-6 7-7" -> "IAV")
    const baseCode = fullCodeStr.split(' ')[0];

    // Age matching filter for WPPSI tables that include range in index code
    if (isEarlyAge !== undefined) {
      const containsEarly = fullCodeStr.includes('2-6') || fullCodeStr.includes('3-11');
      const containsLate = fullCodeStr.includes('4-0') || fullCodeStr.includes('7-7');

      const isExplicitEarlyOnly = containsEarly && !fullCodeStr.includes('4-0') && !fullCodeStr.includes('7-7');
      const isExplicitLateOnly = containsLate && !fullCodeStr.includes('2-6') && !fullCodeStr.includes('3-11');

      if (isEarlyAge && isExplicitLateOnly) return;
      if (!isEarlyAge && isExplicitEarlyOnly) return;
    }

    // Match against keys in indexesSum (either full code or base code)
    const matchedKey = Object.keys(indexesSum).find(k => {
      const upperK = k.trim().toUpperCase();
      return upperK === fullCodeStr || upperK === baseCode || (element.group && upperK === String(element.group).trim().toUpperCase());
    });

    const targetKey = matchedKey || baseCode;
    const sumVal = indexesSum[targetKey];

    if (sumVal !== undefined && sumVal !== null && element.data) {
      let foundData = element.data[sumVal] ?? element.data[String(sumVal)];

      if (!foundData && Array.isArray(element.data)) {
        foundData = element.data.find(
          (d: any) => d && (d.sum === sumVal || d.sum === String(sumVal) || d.score === sumVal || d.score === String(sumVal))
        );
      }

      if (foundData) {
        composes[targetKey] = foundData;
        composes[baseCode] = foundData;
        composes[fullCodeStr] = foundData;
      }
    }
  });

  return composes;
}

export function extractCompositeScore(comp: any, code: string): number {
  if (!comp) return 0;
  if (typeof comp === 'number') return comp;
  if (typeof comp === 'string') return parseInt(comp, 10) || 0;

  if (typeof comp === 'object') {
    if (comp[code] !== undefined && comp[code] !== null) {
      const v = Number(comp[code]);
      if (!isNaN(v)) return v;
    }
    if (comp.composite !== undefined && comp.composite !== null) {
      const v = Number(comp.composite);
      if (!isNaN(v)) return v;
    }
    if (comp.score !== undefined && comp.score !== null) {
      const v = Number(comp.score);
      if (!isNaN(v)) return v;
    }
    if (comp.value !== undefined && comp.value !== null) {
      const v = Number(comp.value);
      if (!isNaN(v)) return v;
    }

    const codeKey = Object.keys(comp).find(k => k.toUpperCase().startsWith(code.toUpperCase()));
    if (codeKey && comp[codeKey] !== undefined && comp[codeKey] !== null) {
      const v = Number(comp[codeKey]);
      if (!isNaN(v)) return v;
    }

    const ignoreKeys = ['percentil', 'percentile', '90%', '95%', 'ic90', 'ic95', 'rango'];
    const numericKey = Object.keys(comp).find(k => {
      const lowerK = k.toLowerCase();
      if (ignoreKeys.some(ik => lowerK.includes(ik))) return false;
      const val = comp[k];
      return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && String(val).trim() !== '');
    });

    if (numericKey && comp[numericKey] !== undefined && comp[numericKey] !== null) {
      const v = Number(comp[numericKey]);
      if (!isNaN(v)) return v;
    }
  }

  return 0;
}

export async function getScales(age: { years: number; months: number }, scale: string) {
  const docRef = doc(db, 'tables', `scales_${scale}`);
  const docSnap = await getDoc(docRef);
  const chrAge = age.years + age.months / 12;

  if (docSnap.exists()) {
    const tablesData = docSnap.data().tables;
    for (let i = 0; i < tablesData.length; i++) {
      const table = tablesData[i];
      const rangeParts = table.range.split(' ');
      const lowerAgeParts = rangeParts[0].split('-');
      const upperAgeParts = rangeParts[1].split('-');

      const lowerAge = parseFloat(lowerAgeParts[0]) + parseFloat(lowerAgeParts[1]) / 12;
      const upperAge = parseFloat(upperAgeParts[0]) + parseFloat(upperAgeParts[1]) / 12;

      if (chrAge <= upperAge && chrAge >= lowerAge) {
        const indexes: { primary: any[]; secondary: any[] } = {
          primary: [],
          secondary: []
        };

        if (['wnv', 'wais_e', 'wais_m', 'wais_c'].includes(scale)) {
          const indexRef = doc(db, 'tables', `indexes_${scale}`);
          const indexSnap = await getDoc(indexRef);
          if (indexSnap.exists()) {
            indexes.primary = [...indexSnap.data().tables];
          }
        } else {
          const pIndexRef = doc(db, 'tables', `p_indexes_${scale}`);
          const pIndexSnap = await getDoc(pIndexRef);
          if (pIndexSnap.exists()) {
            indexes.primary = [...pIndexSnap.data().tables];
          }

          const sIndexRef = doc(db, 'tables', `s_indexes_${scale}`);
          const sIndexSnap = await getDoc(sIndexRef);
          if (sIndexSnap.exists()) {
            indexes.secondary = [...sIndexSnap.data().tables];
          }
        }
        return { table, indexes };
      }
    }

    const lowerAgeStr = tablesData[0].range.split(' ')[0].split('-')[0];
    const upperAgeStr = tablesData.at(-1).range.split(' ')[1].split('-')[0];
    throw new Error(`El rango de edades para la prueba ${scale.toUpperCase()} es entre los ${lowerAgeStr} y ${upperAgeStr} años.`);
  }

  throw new Error(`No se encontraron tablas normativas para la escala ${scale.toUpperCase()}`);
}
