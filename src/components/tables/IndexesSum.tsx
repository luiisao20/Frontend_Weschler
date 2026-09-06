import React from 'react';
import { IndexInfo } from '../../data/scaleInfo/waisInfo';

interface IndexesSumProps {
  indexes: IndexInfo[];
  indexesSum: Record<string, number>;
  title?: string;
}

export const IndexesSum: React.FC<IndexesSumProps> = ({
  indexes = [],
  indexesSum = {},
  title = "Suma de Puntuaciones Escalares"
}) => {
  const activeSum = indexesSum || {};

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-gray-100 overflow-hidden w-full">
      <div className="px-6 py-4 bg-gray-50/50 border-b border-gray-100">
        <h3 className="font-semibold text-gray-800 text-base">{title}</h3>
      </div>
      <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
        {(indexes || []).map(idx => {
          if (!idx || !idx.code) return null;
          const sumVal = activeSum[idx.code];

          return (
            <div key={idx.code} className="bg-gray-50 p-3.5 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{idx.code}</span>
              <span className="text-xl font-bold text-teal-600 mt-1">
                {sumVal !== undefined && sumVal !== null ? sumVal : '-'}
              </span>
              <span className="text-[11px] text-gray-400 text-center truncate max-w-full mt-0.5">{idx.name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
