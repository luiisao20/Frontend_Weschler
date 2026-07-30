import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { AgeCalculated } from '../types';
import { selectReplacementsWAIS } from './replacements';

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
  multipleIndexes?: string
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

  // Check if indexes have explicit 'mains' defined (like WAIS)
  const hasMains = indexes.some(idx => idx.mains && Array.isArray(idx.mains));

  if (hasMains) {
    const completed = Object.keys(points);
    const allTestCodes = tests.map(t => t.code);
    const uncompleted = allTestCodes.filter(c => !completed.includes(c));

    indexes.forEach(indexObj => {
      let currentSum = 0;
      if (indexObj.mains) {
        indexObj.mains.forEach((code: string) => {
          if (points[code] !== undefined) {
            currentSum += points[code];
          }
        });
      }

      const replacement = selectReplacementsWAIS(indexObj.code, completed, uncompleted, points);
      if (typeof replacement === 'number') {
        currentSum += replacement;
      }

      sum[indexObj.code] = currentSum;
    });
  } else {
    // Standard group summing for WISC / WPPSI / WNV
    Object.keys(points).forEach(testCode => {
      const scalarValue = points[testCode];
      const item = tests.find(v => v.code === testCode);

      if (item) {
        if (multipleIndexes && item[multipleIndexes]) {
          item[multipleIndexes].forEach((indexer: string) => {
            const indexObj = indexes.find(v => v.group === indexer);
            if (indexObj) {
              sum[indexObj.code] = (sum[indexObj.code] || 0) + scalarValue;
            }
          });
        } else if (item.group) {
          const indexObj = indexes.find(v => v.group === item.group);
          if (indexObj && indexes.length > 1) {
            sum[indexObj.code] = (sum[indexObj.code] || 0) + scalarValue;
          }
        }

        if (multipleIndexes !== 'secondary' && indexes.length > 0) {
          const totalIndexCode = indexes[indexes.length - 1].code;
          sum[totalIndexCode] = (sum[totalIndexCode] || 0) + scalarValue;
        }
      }
    });
  }

  return { points, sum, errors };
}

export function findComposes(
  indexesSum: Record<string, number>,
  indexConversionTables: any[]
): Record<string, any> {
  const composes: Record<string, any> = {};
  if (!indexConversionTables || !Array.isArray(indexConversionTables)) return composes;

  indexConversionTables.forEach((element: any) => {
    const idxCode = element.index || element.code;
    const sumVal = indexesSum[idxCode];

    if (sumVal !== undefined && element.data && element.data[sumVal]) {
      composes[idxCode] = element.data[sumVal];
    }
  });

  return composes;
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
