import React from "react";
import Chart from "react-apexcharts";

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
  title = "Perfil de Puntuaciones Compuestas",
}) => {
  const categories =
    dataGraphics.xlabel && dataGraphics.xlabel.length > 0
      ? dataGraphics.xlabel
      : ["ICV", "IVE", "IRF", "IMT", "IVP", "CIT"];

  const hasLimitsData = Boolean(
    dataGraphics.upperLimits &&
    dataGraphics.upperLimits.length > 0 &&
    dataGraphics.upperLimits.some((v) => v > 0),
  );

  // Always display limits whenever upper & lower limits data is available
  const showLimits = hasLimitsData;
  const confidenceLabel = range ? "95%" : "90%";

  // Calculate dynamic smart Y-axis bounds to enlarge vertical resolution
  const allVals: number[] = [
    ...(dataGraphics.values || []),
    ...(showLimits ? dataGraphics.upperLimits || [] : []),
    ...(showLimits ? dataGraphics.lowerLimits || [] : []),
  ].filter((v): v is number => v !== null && v !== undefined && typeof v === 'number' && v > 0);

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
          name: "Puntuación Compuesta",
          data: (dataGraphics.values || []).map(v => (v && v > 0 ? v : null)),
        },
        {
          name: `Límite Superior (IC ${confidenceLabel})`,
          data: (dataGraphics.upperLimits || []).map(v => (v && v > 0 ? v : null)),
        },
        {
          name: `Límite Inferior (IC ${confidenceLabel})`,
          data: (dataGraphics.lowerLimits || []).map(v => (v && v > 0 ? v : null)),
        },
      ]
    : [
        {
          name: "Puntuación Compuesta",
          data: (dataGraphics.values || []).map(v => (v && v > 0 ? v : null)),
        },
      ];

  const options: ApexCharts.ApexOptions = {
    chart: {
      type: "line",
      height: 420,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    colors: showLimits ? ["#4F46E5", "#0D9488", "#0284C7"] : ["#4F46E5"],
    stroke: {
      curve: "smooth",
      width: showLimits ? [4.5, 2, 2] : [4.5],
      dashArray: showLimits ? [0, 5, 5] : [0],
    },
    markers: {
      size: showLimits ? [8, 5, 5] : [8],
      strokeWidth: 2,
      hover: { size: 10 },
    },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          fontWeight: 700,
          colors: "#374151",
          fontSize: "12px",
        },
      },
    },
    yaxis: {
      min: minY,
      max: maxY,
      tickAmount: Math.min(8, Math.ceil((maxY - minY) / 10)),
      labels: {
        style: {
          fontWeight: 600,
          colors: "#6B7280",
        },
        formatter: (val: number) => val.toFixed(0),
      },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: any) => {
        if (val === null || val === undefined || val === 0 || isNaN(val)) return '';
        return String(val);
      },
      style: {
        fontSize: "11px",
        fontWeight: "800",
        colors: showLimits ? ["#4338CA", "#0F766E", "#0369A1"] : ["#4338CA"],
      },
      background: {
        enabled: true,
        padding: 5,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: "#E5E7EB",
        opacity: 0.95,
      },
      dropShadow: {
        enabled: false,
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      theme: "light",
      y: {
        formatter: (val: number, { seriesIndex }: any) => {
          if (val === undefined || val === null || val === 0) return "-";
          if (showLimits) {
            if (seriesIndex === 0) return `${val} (Punt. Compuesta)`;
            if (seriesIndex === 1) return `${val} (Sup IC ${confidenceLabel})`;
            if (seriesIndex === 2) return `${val} (Inf IC ${confidenceLabel})`;
          }
          return `${val}`;
        },
      },
    },
    legend: {
      show: false,
    },
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-xs border border-gray-100 w-full">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-gray-800">{title}</h3>
        {showLimits && (
          <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg border border-teal-100">
            IC {confidenceLabel}
          </span>
        )}
      </div>
      <Chart options={options} series={series} type="line" height={420} />
    </div>
  );
};
