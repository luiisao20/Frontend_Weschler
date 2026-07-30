import React from 'react';
import { SubtestInfo } from '../../data/scaleInfo/waisInfo';

interface TableTestsProps {
  tests: SubtestInfo[];
  inputs: Record<string, number | string>;
  points?: Record<string, number>;
  scalarPoints?: Record<string, number>;
  onInputChange: (code: string, value: string) => void;
}

export const TableTests: React.FC<TableTestsProps> = ({
  tests = [],
  inputs = {},
  points,
  scalarPoints,
  onInputChange
}) => {
  const activePoints = points || scalarPoints || {};

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-base">Subpruebas y Puntuaciones Directas</h3>
        <p className="text-xs text-gray-500 mt-0.5">Ingresa los puntajes directos obtenidos para obtener los escalares automáticamente.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50/80 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
            <tr>
              <th className="px-6 py-3">Subprueba</th>
              <th className="px-6 py-3 text-center">Puntaje Directo</th>
              <th className="px-6 py-3 text-center">Puntaje Escalar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {(tests || []).map(t => {
              if (!t || !t.code) return null;
              const scalar = activePoints[t.code];

              return (
                <tr key={t.code} className="hover:bg-gray-50/60 transition">
                  <td className="px-6 py-3.5 font-medium text-gray-800">
                    <div className="flex items-center space-x-2">
                      <span className="inline-block px-2 py-0.5 text-xs font-bold rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {t.code}
                      </span>
                      <span>{t.name}</span>
                      {t.restriction && (
                        <span className="text-[10px] text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Con restricción
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <input
                      type="number"
                      min="0"
                      value={inputs[t.code] !== undefined ? inputs[t.code] : ''}
                      onChange={e => onInputChange(t.code, e.target.value)}
                      className="w-20 px-3 py-1.5 rounded-lg border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-center font-semibold text-sm"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-3.5 text-center font-bold text-base">
                    {scalar !== undefined && scalar !== null ? (
                      <span className="text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg">
                        {scalar}
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
