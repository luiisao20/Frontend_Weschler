import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, Brain, BarChart2, FileText } from 'lucide-react';
import { CompositeScoresChart } from '../charts/CompositeScoresChart';
import { formatDate } from '../../utils/formatDate';
import { waisIndexes } from '../../data/scaleInfo/waisInfo';
import { wiscPrimaryIndexes, wiscSecondaryIndexes } from '../../data/scaleInfo/wiscInfo';
import { wppsiPrimaryIndexes, wppsiSecondaryIndexes } from '../../data/scaleInfo/wppsiInfo';
import { wnvIndexes } from '../../data/scaleInfo/wnvInfo';
interface ModalEvaluationDetailProps {
  isOpen: boolean;
  onClose: () => void;
  evaluation: any | null;
}

export const ModalEvaluationDetail: React.FC<ModalEvaluationDetailProps> = ({
  isOpen,
  onClose,
  evaluation
}) => {
  const [primaryCi, setPrimaryCi] = useState<'90' | '95'>('90');
  const [secondaryCi, setSecondaryCi] = useState<'90' | '95'>('90');

  if (!isOpen || !evaluation) return null;

  const data = evaluation.data || {};
  const scaleType = (evaluation.type || evaluation.scale || 'wais').toLowerCase();

  let displayScaleName = 'WAIS-IV';
  if (scaleType === 'wais_c') displayScaleName = 'WAIS-IV (Chilena)';
  else if (scaleType === 'wais_e') displayScaleName = 'WAIS-IV (Española)';
  else if (scaleType === 'wais_m') displayScaleName = 'WAIS-IV (Mexicana)';
  else if (scaleType.startsWith('wais')) displayScaleName = 'WAIS-IV';
  else if (scaleType === 'wisc') displayScaleName = 'WISC-V';
  else if (scaleType === 'wppsi') displayScaleName = 'WPPSI-IV';
  else if (scaleType === 'wnv') displayScaleName = 'WNV';
  else displayScaleName = scaleType.toUpperCase();

  const evalTitle = evaluation.name || `Evaluación ${displayScaleName}`;
  const dateStr = evaluation.date || evaluation.testDay || '';
  const years = evaluation.years || evaluation.age?.years || 0;
  const months = evaluation.months || evaluation.age?.months || 0;

  // Primary vs Secondary Definitions based on test type
  let primaryDefs: { code: string; name: string }[] = [];
  let secondaryDefs: { code: string; name: string }[] = [];

  if (scaleType.includes('wisc')) {
    primaryDefs = wiscPrimaryIndexes;
    secondaryDefs = wiscSecondaryIndexes;
  } else if (scaleType.includes('wppsi')) {
    const chrAge = years + months / 12;
    const isEarlyAge = chrAge > 0 && chrAge < 4;
    primaryDefs = isEarlyAge ? wppsiPrimaryIndexes.filter(i => !i.restriction) : wppsiPrimaryIndexes;
    secondaryDefs = isEarlyAge ? wppsiSecondaryIndexes.filter(i => !i.restriction) : wppsiSecondaryIndexes;
  } else if (scaleType.includes('wnv')) {
    primaryDefs = wnvIndexes;
    secondaryDefs = [];
  } else {
    // WAIS (Chilena / Española / Mexicana)
    primaryDefs = waisIndexes;
    secondaryDefs = [];
  }

  // Extract Sum maps
  const primarySum = data.primarySum || data.sum || evaluation.indexesSum || {};
  const secondarySum = data.secondarySum || {};

  // Extract Composes maps
  const primaryComposes = data.primaryComposes || data.composes || evaluation.indexes || {};
  const secondaryComposes = data.secondaryComposes || {};

  // Extract index item from composes map safely
  const getIndexItem = (composesMap: any, idxCode: string) => {
    if (!composesMap) return null;
    if (composesMap[idxCode]) return composesMap[idxCode];
    if (composesMap.CIT && idxCode === 'CIT') return composesMap.CIT;
    const key = Object.keys(composesMap).find(k => k.toUpperCase().startsWith(idxCode.toUpperCase()));
    if (key) return composesMap[key];
    return null;
  };

  const getSumValue = (sumMap: any, idxCode: string) => {
    if (!sumMap) return '-';
    if (sumMap[idxCode] !== undefined && sumMap[idxCode] !== null) return String(sumMap[idxCode]);
    if (sumMap.Sum !== undefined && sumMap.Sum !== null && idxCode === 'CIT') return String(sumMap.Sum);
    const key = Object.keys(sumMap).find(k => k.toUpperCase().startsWith(idxCode.toUpperCase()));
    if (key && sumMap[key] !== undefined && sumMap[key] !== null) return String(sumMap[key]);
    return '-';
  };

  const getCompositeScore = (item: any, idxCode: string) => {
    if (!item) return '-';
    if (typeof item === 'number' || typeof item === 'string') return String(item);
    if (typeof item === 'object') {
      if (item[idxCode] !== undefined && item[idxCode] !== null) return String(item[idxCode]);
      if (item.composite !== undefined && item.composite !== null) return String(item.composite);
      if (item.score !== undefined && item.score !== null) return String(item.score);
      if (item.value !== undefined && item.value !== null) return String(item.value);

      const codeKey = Object.keys(item).find((k) => k.toUpperCase().startsWith(idxCode.toUpperCase()));
      if (codeKey && item[codeKey] !== undefined && item[codeKey] !== null) {
        return String(item[codeKey]);
      }

      const ignoreKeys = ['percentil', 'percentile', '90%', '95%', 'ic90', 'ic95', 'rango'];
      const numericKey = Object.keys(item).find((k) => {
        const lowerK = k.toLowerCase();
        if (ignoreKeys.some((ik) => lowerK.includes(ik))) return false;
        const val = item[k];
        return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && String(val).trim() !== '');
      });

      if (numericKey && item[numericKey] !== undefined && item[numericKey] !== null) {
        return String(item[numericKey]);
      }
    }
    return '-';
  };

  const getPercentile = (item: any) => {
    if (!item || typeof item !== 'object') return '-';
    const keys = Object.keys(item);
    const percentileKey = keys.find((k) => k.toLowerCase().includes('percentil') || k.toLowerCase().includes('percentile'));
    if (percentileKey && item[percentileKey] !== undefined && item[percentileKey] !== null) {
      return String(item[percentileKey]);
    }
    return '-';
  };

  const getConfidenceInterval = (item: any, confidence: '90' | '95'): string => {
    if (!item || typeof item !== 'object') return '-';

    const exactKey = confidence === '90' ? '90%' : '95%';
    if (item[exactKey] !== undefined && item[exactKey] !== null) {
      return String(item[exactKey]);
    }

    const altKey = confidence === '90' ? 'ic90' : 'ic95';
    if (item[altKey] !== undefined && item[altKey] !== null) {
      const val = item[altKey];
      return Array.isArray(val) ? `${val[0]}-${val[1]}` : String(val);
    }

    return '-';
  };

  const parseIntervalLimits = (item: any, confidence: '90' | '95') => {
    const intervalStr = getConfidenceInterval(item, confidence);
    if (intervalStr && intervalStr.includes('-')) {
      const parts = intervalStr.split('-');
      const lower = parseInt(parts[0], 10);
      const upper = parseInt(parts[1], 10);
      return { lower: isNaN(lower) ? 0 : lower, upper: isNaN(upper) ? 0 : upper };
    }
    return { lower: 0, upper: 0 };
  };

  // Graphics data for ApexCharts with independent CI
  const primaryGraphics = {
    xlabel: primaryDefs.map(i => i.code),
    values: primaryDefs.map(i => {
      const item = getIndexItem(primaryComposes, i.code);
      const val = getCompositeScore(item, i.code);
      return typeof val === 'number' ? val : (parseInt(String(val), 10) || 0);
    }),
    upperLimits: primaryDefs.map(i => {
      const item = getIndexItem(primaryComposes, i.code);
      return parseIntervalLimits(item, primaryCi).upper;
    }),
    lowerLimits: primaryDefs.map(i => {
      const item = getIndexItem(primaryComposes, i.code);
      return parseIntervalLimits(item, primaryCi).lower;
    })
  };

  const secondaryGraphics = {
    xlabel: secondaryDefs.map(i => i.code),
    values: secondaryDefs.map(i => {
      const item = getIndexItem(secondaryComposes, i.code);
      const val = getCompositeScore(item, i.code);
      return typeof val === 'number' ? val : (parseInt(String(val), 10) || 0);
    }),
    upperLimits: secondaryDefs.map(i => {
      const item = getIndexItem(secondaryComposes, i.code);
      return parseIntervalLimits(item, secondaryCi).upper;
    }),
    lowerLimits: secondaryDefs.map(i => {
      const item = getIndexItem(secondaryComposes, i.code);
      return parseIntervalLimits(item, secondaryCi).lower;
    })
  };

  const renderSumTable = (title: string, defs: any[], sumMap: Record<string, any>) => {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-indigo-100 w-full">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 px-5 py-3.5 text-center text-white">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-100">{title}</h4>
          <div className="flex justify-between text-[11px] font-bold text-indigo-200 uppercase mt-2 px-2">
            <span>ESCALA</span>
            <span>SUMA ESCALAR</span>
          </div>
        </div>
        <div className="divide-y divide-gray-100 text-xs">
          {defs.map(idx => (
            <div key={idx.code} className="flex justify-between items-center px-5 py-3.5 hover:bg-indigo-50/40 transition">
              <span className="font-medium text-gray-800">{idx.name}</span>
              <span className="font-extrabold text-indigo-600 text-base">{getSumValue(sumMap, idx.code)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderConversionTable = (
    title: string,
    defs: any[],
    composesMap: Record<string, any>,
    currentCi: '90' | '95',
    onCiChange: (ci: '90' | '95') => void
  ) => {
    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-xs border border-indigo-100 w-full">
        <div className="bg-gradient-to-r from-indigo-700 via-indigo-600 to-blue-600 px-5 py-3.5 flex items-center justify-between text-white">
          <h4 className="font-extrabold text-xs uppercase tracking-wider text-indigo-100">{title}</h4>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-indigo-200 font-semibold">INTERVALO DE CONFIANZA:</span>
            <button
              type="button"
              onClick={() => onCiChange('90')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${currentCi === '90' ? 'bg-white text-indigo-700 shadow-xs' : 'bg-indigo-800/60 text-indigo-100 hover:bg-indigo-800'}`}
            >
              90%
            </button>
            <button
              type="button"
              onClick={() => onCiChange('95')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${currentCi === '95' ? 'bg-white text-indigo-700 shadow-xs' : 'bg-indigo-800/60 text-indigo-100 hover:bg-indigo-800'}`}
            >
              95%
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-indigo-50/80 text-[10px] font-bold text-indigo-900 uppercase tracking-wider border-b border-indigo-100">
              <tr>
                <th className="px-5 py-3">ESCALA</th>
                <th className="px-5 py-3 text-center">PUNTUACIÓN COMPUESTA</th>
                <th className="px-5 py-3 text-center">PERCENTIL</th>
                <th className="px-5 py-3 text-center">INTERVALO DE CONFIANZA ({currentCi}%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {defs.map(idx => {
                const item = getIndexItem(composesMap, idx.code);
                const composite = getCompositeScore(item, idx.code);
                const percentile = getPercentile(item);
                const rangeStr = getConfidenceInterval(item, currentCi);

                return (
                  <tr key={idx.code} className="hover:bg-indigo-50/40 transition">
                    <td className="px-5 py-3.5 font-medium text-gray-800">{idx.name}</td>
                    <td className="px-5 py-3.5 text-center font-extrabold text-indigo-600 text-base">
                      {composite !== undefined && composite !== null ? String(composite) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-gray-700">
                      {percentile !== undefined && percentile !== null ? String(percentile) : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      {rangeStr !== '-' ? (
                        <span className="bg-indigo-50 text-indigo-700 font-semibold px-2.5 py-1 rounded-md text-xs border border-indigo-100">
                          {rangeStr}
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

  const isDualAnalysis = secondaryDefs.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className={`bg-white rounded-3xl shadow-2xl w-full ${isDualAnalysis ? 'max-w-5xl' : 'max-w-3xl'} overflow-hidden my-8 animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]`}>
        
        {/* Header */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-extrabold text-sm uppercase text-gray-900 tracking-wide">{evalTitle}</span>
            <span className="bg-indigo-600 text-white font-bold text-xs px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-xs">
              {displayScaleName}
            </span>
            {(years > 0 || months > 0) && (
              <span className="flex items-center space-x-1 text-xs font-semibold text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200">
                <Brain className="w-3.5 h-3.5 text-indigo-600" />
                <span>{years} años, {months} meses</span>
              </span>
            )}
            {dateStr && (
              <span className="flex items-center space-x-1 text-xs text-gray-500 bg-white px-3 py-1 rounded-lg border border-gray-200">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>{formatDate(dateStr)}</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {evaluation?.id && (
              <Link
                to={`/evaluation/${evaluation.id}/report`}
                className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-bold text-xs shadow-xs transition"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Generar Informe PDF</span>
              </Link>
            )}

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-700 p-2 rounded-xl hover:bg-gray-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-gray-50/30">
          
          {/* Sums Section */}
          <div className={isDualAnalysis ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "w-full max-w-2xl mx-auto flex justify-center"}>
            {renderSumTable(isDualAnalysis ? "ANÁLISIS PRIMARIO" : "SUMA ESCALAR", primaryDefs, primarySum)}
            {isDualAnalysis && renderSumTable("ANÁLISIS SECUNDARIO", secondaryDefs, secondarySum)}
          </div>

          {/* Conversion Tables Section */}
          <div className={isDualAnalysis ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "w-full max-w-2xl mx-auto flex justify-center"}>
            {renderConversionTable(
              isDualAnalysis ? "ANÁLISIS PRIMARIO" : "TABLA DE CONVERSIÓN",
              primaryDefs,
              primaryComposes,
              primaryCi,
              setPrimaryCi
            )}
            {isDualAnalysis && renderConversionTable(
              "ANÁLISIS SECUNDARIO",
              secondaryDefs,
              secondaryComposes,
              secondaryCi,
              setSecondaryCi
            )}
          </div>

          {/* Charts Section */}
          <div className={isDualAnalysis ? "grid grid-cols-1 md:grid-cols-2 gap-6" : "w-full max-w-2xl mx-auto"}>
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase">
                  <BarChart2 className="w-4 h-4 text-indigo-600" />
                  <span>{scaleType === 'wnv' ? 'Puntuación Escala Total' : 'Análisis Primario - Puntuaciones compuestas'}</span>
                </div>
                <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                  IC {primaryCi}%
                </span>
              </div>
              <CompositeScoresChart
                dataGraphics={primaryGraphics}
                range={primaryCi === '95'}
                title={scaleType === 'wnv' ? `Puntuación Escala Total (IC ${primaryCi}%)` : `Análisis Primario - Perfil Compuesto (IC ${primaryCi}%)`}
              />
            </div>

            {isDualAnalysis && (
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 uppercase">
                    <BarChart2 className="w-4 h-4 text-indigo-600" />
                    <span>Análisis Secundario - Puntuaciones compuestas</span>
                  </div>
                  <span className="text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                    IC {secondaryCi}%
                  </span>
                </div>
                <CompositeScoresChart
                  dataGraphics={secondaryGraphics}
                  range={secondaryCi === '95'}
                  title={`Análisis Secundario - Perfil Compuesto (IC ${secondaryCi}%)`}
                />
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-gray-50 border-t border-gray-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
