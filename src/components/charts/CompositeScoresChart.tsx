import React from 'react';
import Chart from 'react-apexcharts';

interface CompositeScoresChartProps {
  dataGraphics: {
    upperLimits?: number[];
    values?: number[];
    lowerLimits?: number[];
    xlabel?: string[];
  };
  range?: boolean; // false = 90%, true = 95%
  title?: string;
}

export const CompositeScoresChart: React.FC<CompositeScoresChartProps> = ({
  dataGraphics,
  range = false,
  title = "Perfil de Puntuaciones Compuestas"
}) => {
  const categories = dataGraphics.xlabel && dataGraphics.xlabel.length > 0
    ? dataGraphics.xlabel
    : ['ICV', 'IVE', 'IRF', 'IMT', 'IVP', 'CIT'];

  const hasLimitsData = Boolean(
    dataGraphics.upperLimits &&
    dataGraphics.upperLimits.length > 0 &&
    dataGraphics.upperLimits.some(v => v > 0)
  );

  // Always display limits whenever upper & lower limits data is available
  const showLimits = hasLimitsData;
  const confidenceLabel = range ? '95%' : '90%';

  // Calculate dynamic smart Y-axis bounds to enlarge vertical resolution
  const allVals: number[] = [
    ...(dataGraphics.values || []),
    ...(showLimits ? dataGraphics.upperLimits || [] : []),
    ...(showLimits ? dataGraphics.lowerLimits || [] : [])
  ].filter(v => v > 0);

  let minY = 40;
  let maxY = 160;

  if (allVals.length > 0) {
    const minObserved = Math.min(...allVals);
    const maxObserved = Math.max(...allVals);
    
    minY = Math.max(40, Math.floor((minObserved - 12) / 10) * 10);
    maxY = Math.min(160, Math.ceil((maxObserved + 12) / 10) * 10);

    if (maxY - minY < 40) {
      maxY = Math.min(160, minY + 40);
    }
  }

  const series = showLimits
    ? [
        {
          name: `Límite Superior (IC ${confidenceLabel})`,
          data: dataGraphics.upperLimits || []
        },
        {
          name: 'Puntuación Compuesta',
          data: dataGraphics.values || []
        },
        {
          name: `Límite Inferior (IC ${confidenceLabel})`,
          data: dataGraphics.lowerLimits || []
        }
      ]
    : [
        {
          name: 'Puntuación Compuesta',
          data: dataGraphics.values || []
        }
      ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: 'line',
      height: 420,
      toolbar: { show: false },
      zoom: { enabled: false }
    },
    colors: showLimits ? ['#059669', '#4F46E5', '#DC2626'] : ['#4F46E5'],
    stroke: {
      curve: 'smooth',
      width: showLimits ? [2.5, 4, 2.5] : [4],
      dashArray: showLimits ? [5, 0, 5] : [0]
    },
    markers: {
      size: showLimits ? [5, 7, 5] : [7],
      strokeWidth: 2,
      hover: { size: 9 }
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          fontWeight: 700,
          colors: '#374151',
          fontSize: '12px'
        }
      }
    },
    yaxis: {
      min: minY,
      max: maxY,
      tickAmount: Math.min(8, Math.ceil((maxY - minY) / 10)),
      labels: {
        style: {
          fontWeight: 600,
          colors: '#6B7280'
        },
        formatter: (val: number) => val.toFixed(0)
      }
    },
    grid: {
      borderColor: '#F3F4F6',
      strokeDashArray: 4
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: '800',
        colors: showLimits ? ['#047857', '#4338CA', '#B91C1C'] : ['#4338CA']
      },
      background: {
        enabled: true,
        padding: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        opacity: 0.95
      },
      dropShadow: {
        enabled: false
      }
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: 'light',
      y: {
        formatter: (val: number, { seriesIndex }: any) => {
          if (val === undefined || val === null || val === 0) return '-';
          if (showLimits) {
            if (seriesIndex === 0) return `${val} (Sup IC ${confidenceLabel})`;
            if (seriesIndex === 1) return `${val} (Punt. Compuesta)`;
            if (seriesIndex === 2) return `${val} (Inf IC ${confidenceLabel})`;
          }
          return `${val}`;
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      fontSize: '13px',
      fontWeight: 600,
      markers: {
        size: 7
      }
    }
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {showLimits && (
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
            IC {confidenceLabel}
          </span>
        )}
      </div>
      <Chart options={options} series={series} type="line" height={420} />
    </div>
  );
};
