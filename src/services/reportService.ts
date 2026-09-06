import type { Evaluation } from "../types";
import { waisTests, waisIndexes } from "../data/scaleInfo/waisInfo";
import {
  wiscTests,
  wiscPrimaryIndexes,
  wiscSecondaryIndexes,
} from "../data/scaleInfo/wiscInfo";
import {
  wppsiTests,
  wppsiPrimaryIndexes,
  wppsiSecondaryIndexes,
} from "../data/scaleInfo/wppsiInfo";
import { wnvTests, wnvIndexes } from "../data/scaleInfo/wnvInfo";
import { exportHtmlToPdf } from "../utils/pdfExport";

export interface SubtestRow {
  code: string;
  name: string;
  rawScore: any;
  scalarScore: any;
}

export interface IndexItem {
  code: string;
  name: string;
  sum: any;
  composite: string;
  percentile: string;
  ci: string;
  qualitative: string;
}

export interface ChartData {
  categories: string[];
  values: (number | null)[];
  upperLimits: (number | null)[];
  lowerLimits: (number | null)[];
}

export interface ExportPdfOptions {
  patientName?: string;
  scale?: string;
  evalDate?: string;
}

export const getQualitativeClassification = (scoreVal: any): string => {
  if (
    scoreVal === undefined ||
    scoreVal === null ||
    scoreVal === "" ||
    scoreVal === "-"
  )
    return "-";
  const num =
    typeof scoreVal === "number" ? scoreVal : parseInt(String(scoreVal), 10);
  if (isNaN(num) || num <= 0) return "-";
  if (num >= 110) return "Alto o superior";
  if (num >= 90) return "Normal promedio";
  if (num >= 80) return "Normal bajo";
  if (num >= 70) return "Limítrofe";
  if (num >= 50) return "Deficiencia cognitiva leve";
  if (num >= 35) return "Deficiencia cognitiva moderada";
  return "Deficiencia cognitiva grave";
};

export const getCompositeScoreValue = (comp: any, code: string): string => {
  if (!comp) return "-";
  if (typeof comp === "number" || typeof comp === "string")
    return String(comp);
  if (comp[code] !== undefined && comp[code] !== null)
    return String(comp[code]);
  if (comp.composite !== undefined && comp.composite !== null)
    return String(comp.composite);
  if (comp.score !== undefined && comp.score !== null)
    return String(comp.score);
  if (comp.value !== undefined && comp.value !== null)
    return String(comp.value);

  const codeKey = Object.keys(comp).find((k) =>
    k.toUpperCase().startsWith(code.toUpperCase()),
  );
  if (codeKey && comp[codeKey] !== undefined && comp[codeKey] !== null) {
    return String(comp[codeKey]);
  }

  const ignoreKeys = [
    "percentil",
    "percentile",
    "90%",
    "95%",
    "ic90",
    "ic95",
    "rango",
  ];
  const numericKey = Object.keys(comp).find((k) => {
    const lowerK = k.toLowerCase();
    if (ignoreKeys.some((ik) => lowerK.includes(ik))) return false;
    const val = comp[k];
    return (
      typeof val === "number" ||
      (typeof val === "string" &&
        !isNaN(Number(val)) &&
        String(val).trim() !== "")
    );
  });

  if (
    numericKey &&
    comp[numericKey] !== undefined &&
    comp[numericKey] !== null
  ) {
    return String(comp[numericKey]);
  }

  return "-";
};

export const getPercentileValue = (comp: any): string => {
  if (!comp || typeof comp !== "object") return "-";
  const keys = Object.keys(comp);
  const percentileKey = keys.find(
    (k) =>
      k.toLowerCase().includes("percentil") ||
      k.toLowerCase().includes("percentile"),
  );
  if (
    percentileKey &&
    comp[percentileKey] !== undefined &&
    comp[percentileKey] !== null
  ) {
    return String(comp[percentileKey]);
  }
  return "-";
};

export const getConfidenceIntervalValue = (comp: any, is95: boolean): string => {
  if (!comp || typeof comp !== "object") return "-";
  const target = is95 ? "95%" : "90%";
  const altTarget = is95 ? "ic95" : "ic90";

  if (comp[target] !== undefined && comp[target] !== null)
    return String(comp[target]);
  if (comp[altTarget] !== undefined && comp[altTarget] !== null) {
    return Array.isArray(comp[altTarget])
      ? comp[altTarget].join("-")
      : String(comp[altTarget]);
  }

  const key = Object.keys(comp).find(
    (k) =>
      k.toLowerCase().includes(target.toLowerCase()) ||
      k.toLowerCase().includes(altTarget),
  );
  if (key && comp[key] !== undefined && comp[key] !== null) {
    return Array.isArray(comp[key]) ? comp[key].join("-") : String(comp[key]);
  }

  return "-";
};

export const getScaleBadgeLabel = (evaluation: Evaluation | null): string => {
  if (!evaluation) return "EVALUACIÓN";
  const scale = (evaluation.type || evaluation.scale || "wais").toLowerCase();
  if (scale === "wais_c") return "WAIS-IV (Versión Chilena)";
  if (scale === "wais_e") return "WAIS-IV (Versión Española)";
  if (scale === "wais_m") return "WAIS-IV (Versión Mexicana)";
  if (scale.startsWith("wais")) return "WAIS-IV";
  if (scale.includes("wisc"))
    return "WISC-V (Escala de Inteligencia de Wechsler para Niños)";
  if (scale.includes("wppsi"))
    return "WPPSI-IV (Escala de Inteligencia para Preescolar y Primaria)";
  if (scale.includes("wnv"))
    return "WNV (Escala No Verbal de Aptitud Intelectual)";
  return scale.toUpperCase();
};

export const getSubtestRows = (evaluation: Evaluation | null): SubtestRow[] => {
  if (!evaluation) return [];
  const scale = (evaluation.type || evaluation.scale || "wais").toLowerCase();
  let masterTests: { code: string; name: string }[] = [];

  if (scale.includes("wisc")) masterTests = wiscTests;
  else if (scale.includes("wppsi")) masterTests = wppsiTests;
  else if (scale.includes("wnv")) masterTests = wnvTests;
  else masterTests = waisTests;

  const rawScores = evaluation.rawScores || evaluation.scores || {};
  const scalarScores = evaluation.scalarScores || {};

  return masterTests
    .filter(
      (t) =>
        rawScores[t.code] !== undefined || scalarScores[t.code] !== undefined,
    )
    .map((t) => ({
      code: t.code,
      name: t.name,
      rawScore:
        rawScores[t.code] !== undefined && rawScores[t.code] !== ""
          ? rawScores[t.code]
          : "-",
      scalarScore:
        scalarScores[t.code] !== undefined ? scalarScores[t.code] : "-",
    }));
};

export const getIndexesData = (
  evaluation: Evaluation | null,
  ageDisplay: string,
  confidenceInterval: "90" | "95"
): { primaryList: IndexItem[]; secondaryList: IndexItem[] } => {
  if (!evaluation) return { primaryList: [], secondaryList: [] };

  const scale = (evaluation.type || evaluation.scale || "wais").toLowerCase();
  let primaryDefs: { code: string; name: string }[] = [];
  let secondaryDefs: { code: string; name: string }[] = [];

  if (scale.includes("wisc")) {
    primaryDefs = wiscPrimaryIndexes;
    secondaryDefs = wiscSecondaryIndexes;
  } else if (scale.includes("wppsi")) {
    const years =
      evaluation?.age?.years ||
      parseInt(String(ageDisplay).split(" ")[0]) ||
      0;
    const months = evaluation?.age?.months || 0;
    const chrAge = years + months / 12;
    const isEarlyAge = chrAge > 0 && chrAge < 4;
    primaryDefs = isEarlyAge
      ? wppsiPrimaryIndexes.filter((i) => !i.restriction)
      : wppsiPrimaryIndexes;
    secondaryDefs = isEarlyAge
      ? wppsiSecondaryIndexes.filter((i) => !i.restriction)
      : wppsiSecondaryIndexes;
  } else if (scale.includes("wnv")) {
    primaryDefs = wnvIndexes;
    secondaryDefs = [];
  } else {
    primaryDefs = waisIndexes;
    secondaryDefs = [];
  }

  const data = evaluation.data || {};
  const primarySum =
    data.primarySum || data.sum || evaluation.indexesSum || {};
  const secondarySum = data.secondarySum || {};
  const primaryComposes =
    data.primaryComposes || data.composes || evaluation.indexes || {};
  const secondaryComposes = data.secondaryComposes || {};

  const parseItem = (
    idx: { code: string; name: string },
    compMap: any,
    sumMap: any,
  ): IndexItem => {
    const compKey = compMap
      ? Object.keys(compMap).find((k) =>
          k.toUpperCase().startsWith(idx.code.toUpperCase()),
        )
      : null;
    const comp = compKey ? compMap[compKey] : null;

    const sumKey = sumMap
      ? Object.keys(sumMap).find((k) =>
          k.toUpperCase().startsWith(idx.code.toUpperCase()),
        )
      : null;
    const sumVal = sumKey ? sumMap[sumKey] : "-";

    const compScore = getCompositeScoreValue(comp, idx.code);
    const percentile = getPercentileValue(comp);
    const ci = getConfidenceIntervalValue(comp, confidenceInterval === "95");
    const qualitative = getQualitativeClassification(compScore);

    return {
      code: idx.code,
      name: idx.name,
      sum: sumVal !== undefined ? sumVal : "-",
      composite: compScore,
      percentile: percentile,
      ci: ci,
      qualitative: qualitative,
    };
  };

  const primaryList = primaryDefs
    .map((idx) => parseItem(idx, primaryComposes, primarySum))
    .filter((item) => item.composite !== "-" || item.sum !== "-");

  const secondaryList = secondaryDefs
    .map((idx) => parseItem(idx, secondaryComposes, secondarySum))
    .filter((item) => item.composite !== "-" || item.sum !== "-");

  return { primaryList, secondaryList };
};

export const getChartData = (items: IndexItem[]): ChartData => {
  const categories = items.map((i) => i.code);
  const values = items.map((i) =>
    i.composite !== "-" ? Number(i.composite) : null,
  );

  const upperLimits = items.map((i) => {
    if (i.ci && i.ci.includes("-")) {
      const parts = i.ci.split("-");
      const u = parseInt(parts[1], 10);
      return isNaN(u) ? null : u;
    }
    return null;
  });

  const lowerLimits = items.map((i) => {
    if (i.ci && i.ci.includes("-")) {
      const parts = i.ci.split("-");
      const l = parseInt(parts[0], 10);
      return isNaN(l) ? null : l;
    }
    return null;
  });

  return { categories, values, upperLimits, lowerLimits };
};

export const exportReportToPdf = async (
  element: HTMLElement,
  options: ExportPdfOptions
): Promise<void> => {
  const cleanPatient = (options.patientName || "paciente").replace(/\s+/g, "_");
  const cleanScale = (options.scale || "escala").toUpperCase();
  const date = options.evalDate || new Date().toISOString().split("T")[0];
  const filename = `Informe_${cleanPatient}_${cleanScale}_${date}.pdf`;

  await exportHtmlToPdf(element, filename);
};
