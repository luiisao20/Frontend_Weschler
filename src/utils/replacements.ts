// Define los reemplazos para los tests WPPSI, WISC y WAIS según las reglas

export function selectReplacementsWPPSI(
  code: string,
  completed: string[],
  uncompleted: string[],
  points: Record<string, number>
): number | false {
  switch (code) {
    case 'INV':
      if (uncompleted.includes('C')) {
        if (completed.includes('RO')) return points['RO'];
        return false;
      } else if (uncompleted.includes('R')) {
        if (completed.includes('L')) return points['L'];
        return false;
      } else if (uncompleted.includes('BA')) {
        if (completed.includes('CA')) return points['CA'];
        else if (completed.includes('CF')) return points['CF'];
        return false;
      } else if (uncompleted.includes('M') || uncompleted.includes('CON')) return false;
      return 0;

    case 'ICG':
      if (uncompleted.includes('I') || uncompleted.includes('S')) {
        if (completed.includes('V')) return points['V'];
        else if (completed.includes('CO')) return points['CO'];
        return false;
      } else if (uncompleted.includes('C')) {
        if (completed.includes('RO')) return points['RO'];
        return false;
      } else if (uncompleted.includes('M')) {
        if (completed.includes('CON')) return points['CON'];
        return false;
      }
      return 0;

    case 'ICC':
      if (uncompleted.includes('BA') || uncompleted.includes('CA')) {
        if (completed.includes('CF')) return points['CF'];
        return false;
      } else if (uncompleted.includes('R') || uncompleted.includes('L')) return false;
      return 0;

    case 'CIT':
      if (uncompleted.includes('I') || uncompleted.includes('S')) {
        if (completed.includes('V')) return points['V'];
        else if (completed.includes('CO')) return points['CO'];
        return false;
      } else if (uncompleted.includes('C')) {
        if (completed.includes('RO')) return points['RO'];
        return false;
      } else if (uncompleted.includes('M')) {
        if (completed.includes('CON')) return points['CON'];
        return false;
      } else if (uncompleted.includes('R')) {
        if (completed.includes('L')) return points['L'];
        return false;
      } else if (uncompleted.includes('BA')) {
        if (completed.includes('CA')) return points['CA'];
        else if (completed.includes('CF')) return points['CF'];
        return false;
      }
      return 0;

    case 'CIT1':
      if (uncompleted.includes('D')) {
        if (completed.includes('N')) return points['N'];
        return false;
      } else if (uncompleted.includes('R')) {
        if (completed.includes('L')) return points['L'];
        return false;
      } else if (uncompleted.includes('C') || uncompleted.includes('I') || uncompleted.includes('RO')) return false;
      return 0;

    case 'ICG1':
      if (uncompleted.includes('D')) {
        if (completed.includes('N')) return points['N'];
        return false;
      } else if (uncompleted.includes('C') || uncompleted.includes('I') || uncompleted.includes('RO')) return false;
      return 0;

    default:
      return 0;
  }
}

export function selectReplacementsWISC(
  code: string,
  _completed: string[],
  uncompleted: string[],
  points: Record<string, number>
): number | false {
  switch (code) {
    case 'CIT':
      if (uncompleted.includes('S') || uncompleted.includes('V')) {
        if (_completed.includes('I')) return points['I'];
        else if (_completed.includes('CO')) return points['CO'];
        return false;
      } else if (uncompleted.includes('C')) {
        if (_completed.includes('PV')) return points['PV'];
        return false;
      } else if (uncompleted.includes('M') || uncompleted.includes('B')) {
        if (_completed.includes('A')) return points['A'];
        return false;
      } else if (uncompleted.includes('D')) {
        if (_completed.includes('SD')) return points['SD'];
        else if (_completed.includes('LN')) return points['LN'];
        return false;
      } else if (uncompleted.includes('CL')) {
        if (_completed.includes('BS')) return points['BS'];
        else if (_completed.includes('CA')) return points['CA'];
        return false;
      }
      return 0;
    default:
      return 0;
  }
}

export function selectReplacementsWAIS(
  code: string,
  completed: string[],
  uncompleted: string[],
  points: Record<string, number>
): number | false {
  switch (code) {
    case 'ICV':
      if (uncompleted.includes('S') || uncompleted.includes('V') || uncompleted.includes('I')) {
        if (completed.includes('CO')) return points['CO'];
        return false;
      }
      return 0;
    case 'IRP':
      if (uncompleted.includes('C') || uncompleted.includes('M') || uncompleted.includes('PV')) {
        if (completed.includes('B')) return points['B'];
        else if (completed.includes('FI')) return points['FI'];
        return false;
      }
      return 0;
    case 'IMT':
      if (uncompleted.includes('D') || uncompleted.includes('A')) {
        if (completed.includes('LN')) return points['LN'];
        return false;
      }
      return 0;
    case 'IVP':
      if (uncompleted.includes('BS') || uncompleted.includes('CN')) {
        if (completed.includes('CA')) return points['CA'];
        return false;
      }
      return 0;
    case 'CIT':
      if (uncompleted.includes('S') || uncompleted.includes('V') || uncompleted.includes('I')) {
        if (completed.includes('CO')) return points['CO'];
        return false;
      } else if (uncompleted.includes('C') || uncompleted.includes('M') || uncompleted.includes('PV')) {
        if (completed.includes('B')) return points['B'];
        else if (completed.includes('FI')) return points['FI'];
        return false;
      } else if (uncompleted.includes('D') || uncompleted.includes('A')) {
        if (completed.includes('LN')) return points['LN'];
        return false;
      } else if (uncompleted.includes('BS') || uncompleted.includes('CN')) {
        if (completed.includes('CA')) return points['CA'];
        return false;
      }
      return 0;
    default:
      return 0;
  }
}
