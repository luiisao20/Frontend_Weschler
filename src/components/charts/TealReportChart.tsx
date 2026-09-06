import React from 'react';

interface TealReportChartProps {
  categories: string[];
  values: (number | null | undefined)[];
  upperLimits?: (number | null | undefined)[];
  lowerLimits?: (number | null | undefined)[];
  confidence?: '90' | '95';
  title?: string;
}

export const TealReportChart: React.FC<TealReportChartProps> = ({
  categories,
  values,
  upperLimits = [],
  lowerLimits = [],
  confidence = '90',
  title = 'Perfil Gráfico de Puntuaciones Compuestas'
}) => {
  if (!categories || categories.length === 0) return null;

  const width = 680;
  const height = 260;
  const padding = { top: 35, right: 35, bottom: 45, left: 45 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const minY = 40;
  const maxY = 160;

  const getY = (val: number) => {
    const clamped = Math.max(minY, Math.min(maxY, val));
    return padding.top + chartHeight - ((clamped - minY) / (maxY - minY)) * chartHeight;
  };

  const getX = (index: number) => {
    if (categories.length === 1) return padding.left + chartWidth / 2;
    return padding.left + (index / (categories.length - 1)) * chartWidth;
  };

  // Build points for paths
  const mainPoints: { x: number; y: number; val: number }[] = [];
  const upperPoints: { x: number; y: number; val: number }[] = [];
  const lowerPoints: { x: number; y: number; val: number }[] = [];

  categories.forEach((_, i) => {
    const v = values[i];
    if (typeof v === 'number' && v > 0) {
      mainPoints.push({ x: getX(i), y: getY(v), val: v });
    }
    const u = upperLimits[i];
    if (typeof u === 'number' && u > 0) {
      upperPoints.push({ x: getX(i), y: getY(u), val: u });
    }
    const l = lowerLimits[i];
    if (typeof l === 'number' && l > 0) {
      lowerPoints.push({ x: getX(i), y: getY(l), val: l });
    }
  });

  const makePath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  };

  const yTicks = [40, 60, 80, 90, 100, 110, 120, 140, 160];
  const hasLimits = upperPoints.length > 0 && lowerPoints.length > 0;

  return (
    <div className="w-full bg-white rounded-xl border border-teal-200 p-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900">{title}</h4>
        {hasLimits && (
          <span className="text-[10px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
            Intervalo de Confianza {confidence}%
          </span>
        )}
      </div>

      <div className="w-full flex justify-center overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-w-170"
          style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
        >
          {/* Shaded average zone (90 - 110) */}
          <rect
            x={padding.left}
            y={getY(110)}
            width={chartWidth}
            height={getY(90) - getY(110)}
            fill="#0d9488"
            fillOpacity="0.07"
          />

          {/* Grid lines */}
          {yTicks.map(t => {
            const y = getY(t);
            const isAverageBorder = t === 90 || t === 110;
            const isCenter = t === 100;
            return (
              <g key={t}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke={isCenter ? '#0d9488' : isAverageBorder ? '#14b8a6' : '#e5e7eb'}
                  strokeWidth={isCenter ? 1.5 : 1}
                  strokeDasharray={isCenter ? '4 3' : isAverageBorder ? '2 2' : undefined}
                  strokeOpacity={isCenter ? 0.6 : 0.8}
                />
                <text
                  x={padding.left - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="9"
                  fontWeight={t === 100 ? '700' : '500'}
                  fill={t === 100 ? '#0f766e' : '#6b7280'}
                >
                  {t}
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          {categories.map((cat, i) => {
            const x = getX(i);
            return (
              <g key={cat}>
                <line
                  x1={x}
                  y1={padding.top}
                  x2={x}
                  y2={height - padding.bottom}
                  stroke="#f3f4f6"
                  strokeWidth="1"
                />
                <text
                  x={x}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill="#115e59"
                >
                  {cat}
                </text>
              </g>
            );
          })}

          {/* Upper Limits Line (Dashed Teal) */}
          {hasLimits && (
            <>
              {categories.length === 1 ? (
                <line
                  x1={padding.left}
                  y1={upperPoints[0].y}
                  x2={width - padding.right}
                  y2={upperPoints[0].y}
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              ) : (
                <path
                  d={makePath(upperPoints)}
                  fill="none"
                  stroke="#0d9488"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              )}
              {upperPoints.map((p, idx) => (
                <circle
                  key={`u-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#0d9488"
                />
              ))}
            </>
          )}

          {/* Lower Limits Line (Dashed Light Teal) */}
          {hasLimits && (
            <>
              {categories.length === 1 ? (
                <line
                  x1={padding.left}
                  y1={lowerPoints[0].y}
                  x2={width - padding.right}
                  y2={lowerPoints[0].y}
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              ) : (
                <path
                  d={makePath(lowerPoints)}
                  fill="none"
                  stroke="#2dd4bf"
                  strokeWidth="2"
                  strokeDasharray="4 3"
                />
              )}
              {lowerPoints.map((p, idx) => (
                <circle
                  key={`l-${idx}`}
                  cx={p.x}
                  cy={p.y}
                  r="3.5"
                  fill="#2dd4bf"
                />
              ))}
            </>
          )}

          {/* Main Composite Score Line (Solid Deep Teal) */}
          <path
            d={makePath(mainPoints)}
            fill="none"
            stroke="#0f766e"
            strokeWidth="3.5"
          />

          {/* Main Score Points and Labels */}
          {mainPoints.map((p, idx) => (
            <g key={`m-${idx}`}>
              <circle
                cx={p.x}
                cy={p.y}
                r="6"
                fill="#0f766e"
                stroke="#ffffff"
                strokeWidth="2"
              />
              {/* Score Value Tag */}
              <rect
                x={p.x - 14}
                y={p.y - 23}
                width="28"
                height="17"
                rx="4"
                fill="#042f2e"
                fillOpacity="0.92"
              />
              <text
                x={p.x}
                y={p.y - 11}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill="#ffffff"
              >
                {p.val}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center space-x-6 pt-2 border-t border-gray-100 text-[10px]">
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-3 rounded-full bg-teal-800 inline-block"></span>
          <span className="font-semibold text-gray-700">Puntuación Compuesta</span>
        </div>
        {hasLimits && (
          <>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-teal-600 inline-block border-t border-dashed border-teal-600"></span>
              <span className="text-gray-600">Límite Superior (IC {confidence}%)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-teal-400 inline-block border-t border-dashed border-teal-400"></span>
              <span className="text-gray-600">Límite Inferior (IC {confidence}%)</span>
            </div>
          </>
        )}
        <div className="flex items-center space-x-1.5">
          <span className="w-3 h-2 bg-teal-100/60 border border-teal-300 inline-block"></span>
          <span className="text-gray-500">Rango Promedio (90-110)</span>
        </div>
      </div>
    </div>
  );
};
