import React, { useState } from 'react';
import { IndexInfo } from '../../data/scaleInfo/waisInfo';

interface TableIndexesProps {
  indexes: IndexInfo[];
  composes: Record<string, any>;
  onRangeChange?: (range: boolean) => void;
  showWNV?: boolean;
}

export const TableIndexes: React.FC<TableIndexesProps> = ({
  indexes,
  composes,
  onRangeChange,
  showWNV = false
}) => {
  const [range, setRange] = useState<boolean>(false);

  const handleToggle = (checked: boolean) => {
    setRange(checked);
    if (onRangeChange) {
      onRangeChange(checked);
    }
  };

  const getCompositeScore = (comp: any, code: string): string => {
    if (!comp) return '-';
    if (typeof comp === 'number' || typeof comp === 'string') return String(comp);

    if (comp[code] !== undefined && comp[code] !== null) return String(comp[code]);
    if (comp.composite !== undefined && comp.composite !== null) return String(comp.composite);
    if (comp.score !== undefined && comp.score !== null) return String(comp.score);
    if (comp.value !== undefined && comp.value !== null) return String(comp.value);

    // Search by key starting with code (e.g. comp['ICV 2-6 3-11'])
    const codeKey = Object.keys(comp).find(k => k.toUpperCase().startsWith(code.toUpperCase()));
    if (codeKey && comp[codeKey] !== undefined && comp[codeKey] !== null) {
      return String(comp[codeKey]);
    }

    // Fallback: any numeric property excluding percentiles and confidence intervals
    const ignoreKeys = ['percentil', 'percentile', '90%', '95%', 'ic90', 'ic95', 'rango'];
    const numericKey = Object.keys(comp).find(k => {
      const lowerK = k.toLowerCase();
      if (ignoreKeys.some(ik => lowerK.includes(ik))) return false;
      const val = comp[k];
      return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && String(val).trim() !== '');
    });

    if (numericKey && comp[numericKey] !== undefined && comp[numericKey] !== null) {
      return String(comp[numericKey]);
    }

    return '-';
  };

  const getPercentile = (comp: any): string => {
    if (!comp || typeof comp !== 'object') return '-';
    const keys = Object.keys(comp);
    const percentileKey = keys.find(k => k.toLowerCase().includes('percentil') || k.toLowerCase().includes('percentile'));
    if (percentileKey && comp[percentileKey] !== undefined && comp[percentileKey] !== null) {
      return String(comp[percentileKey]);
    }
    return '-';
  };

  const getConfidenceInterval = (comp: any, is95: boolean): string => {
    if (!comp || typeof comp !== 'object') return '-';
    const target = is95 ? '95%' : '90%';
    const altTarget = is95 ? 'ic95' : 'ic90';

    if (comp[target] !== undefined && comp[target] !== null) return String(comp[target]);
    if (comp[altTarget] !== undefined && comp[altTarget] !== null) {
      return Array.isArray(comp[altTarget]) ? comp[altTarget].join('-') : String(comp[altTarget]);
    }

    const key = Object.keys(comp).find(k => k.toLowerCase().includes(target.toLowerCase()) || k.toLowerCase().includes(altTarget));
    if (key && comp[key] !== undefined && comp[key] !== null) {
      return Array.isArray(comp[key]) ? comp[key].join('-') : String(comp[key]);
    }

    return '-';
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden w-full">
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800 text-base">Conversión a Puntuaciones Compuestas e Índices</h3>

        {/* Toggle Switch 90% / 95% */}
        <div className="flex items-center space-x-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200">
          <span className="text-xs font-semibold text-gray-600">Intervalo:</span>
          <label className="inline-flex items-center cursor-pointer gap-2">
            <span className={`text-xs font-bold ${!range ? 'text-indigo-600' : 'text-gray-400'}`}>90%</span>
            <input
              type="checkbox"
              checked={range}
              onChange={e => handleToggle(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-indigo-600 after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all"></div>
            <span className={`text-xs font-bold ${range ? 'text-indigo-600' : 'text-gray-400'}`}>95%</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-5 py-3">Índice</th>
              {showWNV && <th className="px-5 py-3 text-center">Suma Escalar</th>}
              <th className="px-5 py-3 text-center">Compuesto</th>
              <th className="px-5 py-3 text-center">Percentil</th>
              <th className="px-5 py-3 text-center">Intervalo de Confianza ({range ? '95%' : '90%'})</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {indexes.map(idx => {
              const comp = composes[idx.code];
              const compositeVal = getCompositeScore(comp, idx.code);
              const percentileVal = getPercentile(comp);
              const ciVal = getConfidenceInterval(comp, range);

              return (
                <tr key={idx.code} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3.5 font-medium text-gray-800">
                    <span className="font-bold text-indigo-600 mr-2">{idx.code}</span>
                    <span className="text-xs text-gray-500 hidden sm:inline">{idx.name}</span>
                  </td>
                  {showWNV && (
                    <td className="px-5 py-3.5 text-center font-bold text-gray-800">
                      {composes.Sum !== undefined ? composes.Sum : '-'}
                    </td>
                  )}
                  <td className="px-5 py-3.5 text-center font-bold text-base text-gray-900">
                    {compositeVal !== '-' ? (
                      <span className="text-indigo-700 font-extrabold">{compositeVal}</span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center font-semibold text-gray-700">
                    {percentileVal !== '-' ? `${percentileVal}` : '-'}
                  </td>
                  <td className="px-5 py-3.5 text-center font-medium text-gray-600">
                    {ciVal !== '-' ? (
                      <span className="bg-indigo-50/70 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-semibold border border-indigo-100">
                        {ciVal}
                      </span>
                    ) : (
                      <span className="text-gray-300">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
