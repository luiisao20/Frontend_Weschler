import React, { useState } from 'react';
import { SubtestInfo, IndexInfo } from '../../data/scaleInfo/waisInfo';

interface IndexCompositionTableProps {
  tests: SubtestInfo[];
  primaryIndexes: IndexInfo[];
  secondaryIndexes?: IndexInfo[];
  scalarPoints: Record<string, number>;
  inputs: Record<string, number | string>;
  onInputChange: (code: string, value: string) => void;
  isEarlyAge?: boolean;
  normativeTable?: any; // Firebase table to derive max raw score per test
}

/**
 * Derives the maximum raw score for a subtest from the normative table.
 * The table keys are ranges like "0-4", "5", "6-9", etc.
 * The max is the highest upper bound across all keys.
 */
function getMaxFromTable(testCode: string, table: any): number | null {
  if (!table?.data?.[testCode]) return null;
  const ranges = Object.keys(table.data[testCode]);
  let max = -Infinity;
  for (const range of ranges) {
    if (range.includes('-')) {
      const upper = parseInt(range.split('-')[1], 10);
      if (!isNaN(upper) && upper > max) max = upper;
    } else {
      const val = parseInt(range, 10);
      if (!isNaN(val) && val > max) max = val;
    }
  }
  return max === -Infinity ? null : max;
}


function getMainsForIndex(indexObj: IndexInfo, isEarlyAge?: boolean): string[] {
  if (isEarlyAge !== undefined) {
    if (isEarlyAge && indexObj.earlyMains) return indexObj.earlyMains;
    if (!isEarlyAge && indexObj.lastMains) return indexObj.lastMains;
  }
  if (indexObj.mains) return indexObj.mains;
  return [];
}

function getOptionalsForIndex(indexObj: IndexInfo, isEarlyAge?: boolean): string[] {
  if (isEarlyAge !== undefined) {
    if (isEarlyAge && indexObj.earlyOptionals) return indexObj.earlyOptionals;
    if (!isEarlyAge && indexObj.lastOptionals) return indexObj.lastOptionals;
  }
  if (indexObj.optionals) return indexObj.optionals;
  return [];
}

function getSubstitutionLabel(
  testCode: string,
  indexObj: IndexInfo,
  isEarlyAge?: boolean
): string | null {
  if (isEarlyAge !== undefined) {
    if (isEarlyAge && indexObj.earlySubstitutions)
      return indexObj.earlySubstitutions[testCode] ?? null;
    if (!isEarlyAge && indexObj.lastSubstitutions)
      return indexObj.lastSubstitutions[testCode] ?? null;
  }
  if (indexObj.substitutions) return indexObj.substitutions[testCode] ?? null;
  return null;
}

function testBelongsToIndex(
  test: SubtestInfo,
  indexObj: IndexInfo,
  isEarlyAge?: boolean
): 'main' | 'optional' | false {
  const mains = getMainsForIndex(indexObj, isEarlyAge);
  const optionals = getOptionalsForIndex(indexObj, isEarlyAge);

  if (mains.length > 0 || optionals.length > 0) {
    if (mains.includes(test.code)) return 'main';
    if (optionals.includes(test.code)) return 'optional';
    return false;
  }

  // Group-based matching (WAIS / WISC)
  if (indexObj.group) {
    const belongsViaPrimary = test.primary?.includes(indexObj.group);
    const belongsViaSecondary = test.secondary?.includes(indexObj.group);
    const belongsViaGroup = test.group === indexObj.group;
    if (belongsViaPrimary || belongsViaSecondary || belongsViaGroup) return 'main';
  }

  return false;
}

interface TooltipCellProps {
  scalar: number | undefined;
  isOptional: boolean;
  isPrimary: boolean;
  tooltip: string | null;
  align?: 'left' | 'center' | 'right';
}

const TooltipCell: React.FC<TooltipCellProps> = ({
  scalar,
  isOptional,
  isPrimary,
  tooltip,
  align = 'center',
}) => {
  const [visible, setVisible] = useState(false);

  const bgFilled = isPrimary ? 'bg-teal-600' : 'bg-teal-800';

  if (!isOptional) {
    return (
      <td className={`px-3 py-2.5 text-center ${bgFilled}`}>
        {scalar !== undefined ? (
          <span className="text-white font-bold text-sm">{scalar}</span>
        ) : (
          <span className="text-teal-200 text-xs">—</span>
        )}
      </td>
    );
  }

  // Optional cell with tooltip
  return (
    <td
      className={`px-3 py-2.5 text-center ${bgFilled} relative cursor-help`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {scalar !== undefined ? (
        <span className="text-white font-bold text-sm italic opacity-80">{scalar}</span>
      ) : (
        <span className="text-teal-200 text-xs italic">—</span>
      )}

      {/* Tooltip */}
      {visible && tooltip && (
        <div
          className={`absolute z-50 bottom-full mb-2 w-48 sm:w-56 pointer-events-none transition-opacity duration-150 ${
            align === 'right'
              ? 'right-0'
              : align === 'left'
              ? 'left-0'
              : 'left-1/2 -translate-x-1/2'
          }`}
          style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.25))' }}
        >
          <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 text-center leading-snug shadow-xl">
            <span className="text-teal-300 font-semibold block mb-0.5">Sustitución</span>
            <span className="break-words">{tooltip}</span>
          </div>
          {/* Arrow */}
          <div
            className={`flex ${
              align === 'right'
                ? 'justify-end pr-4'
                : align === 'left'
                ? 'justify-start pl-4'
                : 'justify-center'
            }`}
          >
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900" />
          </div>
        </div>
      )}
    </td>
  );
};

export const IndexCompositionTable: React.FC<IndexCompositionTableProps> = ({
  tests,
  primaryIndexes,
  secondaryIndexes = [],
  scalarPoints,
  inputs,
  onInputChange,
  isEarlyAge,
  normativeTable,
}) => {
  const allIndexes = [...primaryIndexes, ...secondaryIndexes];
  const hasPrimary = primaryIndexes.length > 0;
  const hasSecondary = secondaryIndexes.length > 0;

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100">
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-base">Subpruebas y Puntuaciones Directas</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          Ingresa los puntajes directos. Las celdas en <span className="text-teal-700 font-medium">teal</span> muestran el escalar por índice.
          Las celdas <em className="not-italic opacity-80">en cursiva</em> son pruebas suplementarias — pasa el cursor para ver a qué reemplazan.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm border-collapse">
          <thead>
            {/* Group header row */}
            {(hasPrimary || hasSecondary) && (
              <tr className="border-b border-gray-200">
                <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider bg-gray-50 min-w-[180px]">
                  Puntuación Directa
                </th>
                {hasPrimary && (
                  <th
                    colSpan={primaryIndexes.length}
                    className="px-4 py-2.5 text-center text-xs font-bold text-white uppercase tracking-wider bg-teal-700"
                  >
                    Análisis Primario
                  </th>
                )}
                {hasSecondary && (
                  <th
                    colSpan={secondaryIndexes.length}
                    className="px-4 py-2.5 text-center text-xs font-bold text-white uppercase tracking-wider bg-teal-800"
                  >
                    Análisis Secundario
                  </th>
                )}
              </tr>
            )}

            {/* Index codes row */}
            <tr className="border-b border-gray-100">
              <th className="px-4 py-2 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider bg-gray-50 sticky left-0 z-10">
                Subprueba
              </th>
              {allIndexes.map((idx, i) => (
                <th
                  key={idx.code}
                  title={idx.name}
                  className={`px-3 py-2 text-center text-xs font-bold uppercase tracking-wider text-white min-w-[60px] ${
                    i < primaryIndexes.length ? 'bg-teal-600/90' : 'bg-teal-800/90'
                  }`}
                >
                  {idx.code}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {tests.map((t, rowIdx) => {
              if (!t?.code) return null;
              const scalar = scalarPoints[t.code];
              const inputVal = inputs[t.code];

              const rowBg = rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50/40';

              return (
                <tr key={t.code} className={rowBg}>
                  {/* Subtest name + input */}
                  <td className="px-4 py-2.5 font-medium text-gray-800 sticky left-0 bg-inherit min-w-[200px]">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] text-teal-600 font-bold">{t.name}</span>
                      <div className="flex flex-col gap-0.5">
                        {(() => {
                          const numVal = inputVal !== undefined && inputVal !== '' ? Number(inputVal) : null;
                          const maxScore = getMaxFromTable(t.code, normativeTable);
                          const isOutOfRange = numVal !== null && maxScore !== null && numVal > maxScore;
                          return (
                            <>
                              <input
                                type="number"
                                min="0"
                                value={inputVal !== undefined ? inputVal : ''}
                                onChange={e => onInputChange(t.code, e.target.value)}
                                className={`w-20 px-2 py-1 rounded-lg border text-center font-semibold text-sm focus:outline-none focus:ring-2 transition-colors ${
                                  isOutOfRange
                                    ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-400'
                                    : 'border-gray-200 focus:ring-teal-500'
                                }`}
                                placeholder="0"
                              />
                              {isOutOfRange && (
                                <span className="text-[9px] text-red-500 font-medium leading-tight">
                                  Fuera de rango (máx. {maxScore})
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </td>


                  {/* One cell per index */}
                  {allIndexes.map((idx, colIdx) => {
                    const belongs = testBelongsToIndex(t, idx, isEarlyAge);
                    const isPrimary = colIdx < primaryIndexes.length;

                    if (!belongs) {
                      // Empty cell: inherit alternating row bg, add subtle tint per group
                      const emptyBg = rowIdx % 2 === 0
                        ? (isPrimary ? 'bg-teal-50/60' : 'bg-teal-900/5')
                        : (isPrimary ? 'bg-teal-100/40' : 'bg-teal-900/10');
                      return (
                        <td
                          key={idx.code}
                          className={`px-3 py-2.5 text-center ${emptyBg}`}
                        />
                      );
                    }

                    const isOptional = belongs === 'optional';
                    const tooltip = isOptional
                      ? getSubstitutionLabel(t.code, idx, isEarlyAge)
                      : null;
                    const isLastCols = colIdx >= allIndexes.length - 2;
                    const isFirstCol = colIdx === 0;
                    const align = isLastCols ? 'right' : isFirstCol ? 'left' : 'center';

                    return (
                      <TooltipCell
                        key={idx.code}
                        scalar={scalar}
                        isOptional={isOptional}
                        isPrimary={isPrimary}
                        tooltip={tooltip}
                        align={align}
                      />
                    );
                  })}
                </tr>
              );
            })}

            {/* Totals row */}
            <tr className="border-t-2 border-gray-200 bg-gray-50">
              <td className="px-4 py-2.5 text-xs font-bold text-gray-600 uppercase tracking-wider">
                Suma Escalar
              </td>
              {allIndexes.map((idx, colIdx) => {
                const isPrimary = colIdx < primaryIndexes.length;
                const mains = getMainsForIndex(idx, isEarlyAge);
                const total = mains.length > 0
                  ? mains.reduce((acc, code) => acc + (scalarPoints[code] ?? 0), 0)
                  : tests
                      .filter(t => testBelongsToIndex(t, idx, isEarlyAge) === 'main')
                      .reduce((acc, t) => acc + (scalarPoints[t.code] ?? 0), 0);

                return (
                  <td
                    key={idx.code}
                    className={`px-3 py-2.5 text-center ${isPrimary ? 'bg-teal-600/20' : 'bg-teal-800/20'}`}
                  >
                    {total > 0 ? (
                      <span className={`font-extrabold text-sm ${isPrimary ? 'text-teal-700' : 'text-teal-900'}`}>
                        {total}
                      </span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
