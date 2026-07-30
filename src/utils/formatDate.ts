const opciones: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'short',
  day: 'numeric'
};

const monthMap: Record<string, number> = {
  ene: 0,
  feb: 1,
  mar: 2,
  abr: 3,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  sept: 8,
  sep: 8,
  oct: 9,
  nov: 10,
  dic: 11
};

export function formatDate(date: string | Date | number): string {
  if (!date) return '';

  if (date instanceof Date) {
    return isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-ES', opciones);
  }

  if (typeof date === 'string') {
    const trimmed = date.trim();
    if (!trimmed) return '';

    // If it's already a formatted Spanish date like "18 mar 2023"
    const isSpanishFormattedDate = /[a-zA-Z]{3,4}\s+\d{4}/.test(trimmed);
    if (isSpanishFormattedDate) {
      return trimmed;
    }

    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-ES', opciones);
    }

    // Return string as-is instead of "Invalid Date"
    return trimmed;
  }

  if (typeof date === 'number') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleDateString('es-ES', opciones);
    }
  }

  return String(date);
}

export function orderByDate<T extends { date?: string; testDay?: string; createdAt?: any }>(array: T[]): T[] {
  return [...array].sort((a, b) => {
    const dateStrA = a.date || a.testDay || '';
    const dateStrB = b.date || b.testDay || '';

    if (!dateStrA || !dateStrB) return 0;

    const partsA = dateStrA.trim().split(/\s+/);
    const partsB = dateStrB.trim().split(/\s+/);

    if (partsA.length === 3 && partsB.length === 3) {
      const [dayA, monthA, yearA] = partsA;
      const [dayB, monthB, yearB] = partsB;

      const mA = monthMap[monthA.toLowerCase()] ?? 0;
      const mB = monthMap[monthB.toLowerCase()] ?? 0;

      const timeA = new Date(Date.UTC(parseInt(yearA, 10), mA, parseInt(dayA, 10))).getTime();
      const timeB = new Date(Date.UTC(parseInt(yearB, 10), mB, parseInt(dayB, 10))).getTime();

      if (!isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
    }

    const tA = new Date(dateStrA).getTime();
    const tB = new Date(dateStrB).getTime();

    if (!isNaN(tA) && !isNaN(tB)) {
      return tB - tA;
    }

    return 0;
  });
}
