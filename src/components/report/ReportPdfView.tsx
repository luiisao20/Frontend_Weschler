import { forwardRef } from "react";
import type { Evaluation } from "../../types";
import type { ReportFormValues } from "./ReportForm";
import type { SubtestRow, IndexItem, ChartData } from "../../services/reportService";
import { TealReportChart } from "../charts/TealReportChart";
import { Eye, User, Brain, FileText, ShieldCheck } from "lucide-react";

interface ReportPdfViewProps {
  formValues: ReportFormValues;
  evaluation: Evaluation | null;
  subtestRows: SubtestRow[];
  primaryList: IndexItem[];
  secondaryList: IndexItem[];
  primaryChartData: ChartData;
  secondaryChartData: ChartData;
  verificationCode: string;
  scaleBadgeLabel: string;
  className?: string;
}

export const ReportPdfView = forwardRef<HTMLDivElement, ReportPdfViewProps>(
  (
    {
      formValues,
      evaluation,
      subtestRows,
      primaryList,
      secondaryList,
      primaryChartData,
      secondaryChartData,
      verificationCode,
      scaleBadgeLabel,
      className = "",
    },
    ref
  ) => {
    const {
      patientName,
      documentId,
      ageDisplay,
      evalDate,
      diagnosis,
      structuration,
      evaluatorName,
      evaluatorTitle,
      evaluationPlace,
      unicodigoAcess,
      evaluationCity,
      evaluationCountry,
      confidenceInterval,
    } = formValues;

    const verificationUrl = `${window.location.origin}/verify?code=${verificationCode}`;

    return (
      <div className={className}>
        <div className="flex items-center justify-between mb-3 px-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center">
            <Eye className="w-4 h-4 mr-1 text-teal-600" />
            Vista Previa del Documento
          </span>
          <span className="text-xs text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg font-bold border border-teal-200">
            Formato A4 Oficial
          </span>
        </div>

        {/* Printable A4 Container */}
        <div className="overflow-x-auto pb-6">
          <div
            ref={ref}
            className="pdf-page bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 mx-auto p-8 sm:p-10 space-y-6 w-full max-w-[794px] min-h-[1123px] text-xs leading-normal"
            style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}
          >
            {/* Header with Teal Styling & Verification Tag */}
            <div className="border-b-2 border-teal-700 pb-4 flex items-start justify-between pdf-block bg-white">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                  {scaleBadgeLabel}
                </span>
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
                  INFORME DE EVALUACIÓN PSICOMÉTRICA
                </h1>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                  {evaluation?.name ||
                    "Evaluación de Inteligencia y Habilidades Cognitivas"}
                </p>
              </div>
              <div className="text-right text-[10px] text-gray-500 space-y-1">
                <p className="font-bold text-teal-900">Fecha: {evalDate}</p>
                <div className="bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-lg font-mono text-[10px] font-bold text-teal-900">
                  Cód: {verificationCode}
                </div>
              </div>
            </div>

            {/* Section 1: Datos de Identificación y Clínicos */}
            <div className="bg-teal-50/50 rounded-xl border border-teal-200 p-4 break-inside-avoid avoid-page-break pdf-block bg-white">
              <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-3 border-b border-teal-200/80 pb-1.5 flex items-center">
                <User className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                Datos de identificación y del contexto de la evaluación
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Paciente
                  </span>
                  <span className="font-bold text-gray-900">
                    {patientName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    N° Cédula
                  </span>
                  <span className="font-bold font-mono text-gray-900">
                    {documentId || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Edad Cronológica
                  </span>
                  <span className="font-bold text-gray-900">
                    {ageDisplay || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Fecha Aplicación
                  </span>
                  <span className="font-bold text-gray-900">
                    {evalDate || "-"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Dx Presuntivo / Definitivo
                  </span>
                  <span className="font-bold text-gray-900">
                    {diagnosis || "No especificado"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Evaluador / Profesional
                  </span>
                  <span className="font-semibold text-gray-800">
                    {evaluatorName || "-"}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Unicódigo ACESS
                  </span>
                  <span className="font-semibold font-mono text-gray-900">
                    {unicodigoAcess || "-"}
                  </span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">
                    Lugar de Evaluación
                  </span>
                  <span className="font-semibold text-gray-800">
                    {[evaluationPlace, evaluationCity, evaluationCountry]
                      .filter(Boolean)
                      .join(", ") || "-"}
                  </span>
                </div>
              </div>
            </div>

            {/* Section 2: Subtests Table (if available) */}
            {subtestRows.length > 0 && (
              <div className="pdf-block bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center">
                  <Brain className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                  Rendimiento en Subpruebas (Puntuaciones Directas y Escalares)
                </h3>
                <div className="rounded-xl border border-teal-200 overflow-hidden break-inside-avoid avoid-page-break">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-teal-700 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Subprueba</th>
                        <th className="px-3 py-2 text-center w-28">
                          Puntaje Directo (PD)
                        </th>
                        <th className="px-3 py-2 text-center w-28">
                          Puntuación Escalar (PE)
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-100">
                      {subtestRows.map((row, idx) => (
                        <tr
                          key={row.code}
                          className={idx % 2 === 0 ? "bg-white" : "bg-teal-50/30"}
                        >
                          <td className="px-3 py-1.5 font-medium text-gray-800">
                            <span className="font-bold text-teal-700 mr-1.5">
                              {row.code}
                            </span>
                            <span>{row.name}</span>
                          </td>
                          <td className="px-3 py-1.5 text-center font-semibold text-gray-700">
                            {row.rawScore}
                          </td>
                          <td className="px-3 py-1.5 text-center font-extrabold text-teal-900 bg-teal-100/40">
                            {row.scalarScore}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 3: Primary Indexes Table */}
            {primaryList.length > 0 && (
              <div className="pdf-block bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                  Análisis Primario: Puntuaciones Compuestas e Índices
                </h3>
                <div className="rounded-xl border border-teal-200 overflow-hidden break-inside-avoid avoid-page-break">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-teal-800 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Índice</th>
                        <th className="px-3 py-2 text-center w-20">Suma PE</th>
                        <th className="px-3 py-2 text-center w-24">
                          Punt. Compuesta
                        </th>
                        <th className="px-3 py-2 text-center w-20">Percentil</th>
                        <th className="px-3 py-2 text-center w-24">
                          IC ({confidenceInterval}%)
                        </th>
                        <th className="px-3 py-2 text-center">
                          Clasificación Cualitativa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-100">
                      {primaryList.map((item, idx) => (
                        <tr
                          key={item.code}
                          className={idx % 2 === 0 ? "bg-white" : "bg-teal-50/30"}
                        >
                          <td className="px-3 py-2 font-medium text-gray-800">
                            <span className="font-bold text-teal-800 mr-1.5">
                              {item.code}
                            </span>
                            <span className="text-gray-600 text-[11px]">
                              {item.name}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-gray-700">
                            {item.sum}
                          </td>
                          <td className="px-3 py-2 text-center font-black text-sm text-teal-950 bg-teal-100/50">
                            {item.composite}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-700">
                            {item.percentile}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-teal-800">
                            {item.ci}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-teal-900 text-[11px]">
                            {item.qualitative}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Section 4: Primary Chart */}
            {primaryChartData.categories.length > 0 && (
              <div className="pt-1 break-inside-avoid avoid-page-break pdf-block bg-white">
                <TealReportChart
                  categories={primaryChartData.categories}
                  values={primaryChartData.values}
                  upperLimits={primaryChartData.upperLimits}
                  lowerLimits={primaryChartData.lowerLimits}
                  confidence={confidenceInterval}
                  title="Perfil Gráfico de Índices Compuestos (Análisis Primario)"
                />
              </div>
            )}

            {/* Section 5: Secondary Indexes Table & Chart (if applicable) */}
            {secondaryList.length > 0 && (
              <div className="space-y-4 pt-2 break-inside-avoid avoid-page-break pdf-block bg-white">
                <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center">
                  <FileText className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                  Análisis Secundario: Índices Específicos
                </h3>
                <div className="rounded-xl border border-teal-200 overflow-hidden break-inside-avoid avoid-page-break">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-teal-900 text-white font-bold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="px-3 py-2">Índice Secundario</th>
                        <th className="px-3 py-2 text-center w-20">Suma PE</th>
                        <th className="px-3 py-2 text-center w-24">
                          Punt. Compuesta
                        </th>
                        <th className="px-3 py-2 text-center w-20">Percentil</th>
                        <th className="px-3 py-2 text-center w-24">
                          IC ({confidenceInterval}%)
                        </th>
                        <th className="px-3 py-2 text-center">
                          Clasificación Cualitativa
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-teal-100">
                      {secondaryList.map((item, idx) => (
                        <tr
                          key={item.code}
                          className={idx % 2 === 0 ? "bg-white" : "bg-teal-50/30"}
                        >
                          <td className="px-3 py-2 font-medium text-gray-800">
                            <span className="font-bold text-teal-900 mr-1.5">
                              {item.code}
                            </span>
                            <span className="text-gray-600 text-[11px]">
                              {item.name}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-gray-700">
                            {item.sum}
                          </td>
                          <td className="px-3 py-2 text-center font-black text-sm text-teal-950 bg-teal-100/50">
                            {item.composite}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-gray-700">
                            {item.percentile}
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-teal-800">
                            {item.ci}
                          </td>
                          <td className="px-3 py-2 text-center font-bold text-teal-900 text-[11px]">
                            {item.qualitative}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {secondaryChartData.categories.length > 0 && (
                  <TealReportChart
                    categories={secondaryChartData.categories}
                    values={secondaryChartData.values}
                    upperLimits={secondaryChartData.upperLimits}
                    lowerLimits={secondaryChartData.lowerLimits}
                    confidence={confidenceInterval}
                    title="Perfil Gráfico de Índices Secundarios"
                  />
                )}
              </div>
            )}

            {/* Section 6: Estructuración y Conclusiones */}
            <div className="rounded-xl border-l-4 border-teal-700 p-4 bg-teal-50/40 pdf-block break-inside-avoid avoid-page-break">
              <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2">
                Estructuración del Perfil Cognitivo y Observaciones
              </h4>
              <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                {structuration || "No se han registrado observaciones adicionales."}
              </p>
            </div>

            {/* Section 7: Official Public Verification Footer Card */}
            <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] pdf-block bg-white">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-teal-700 flex-shrink-0" />
                <div>
                  <span className="font-bold text-teal-950 block">
                    Verificación Oficial de Autenticidad
                  </span>
                  <span className="text-gray-600 block">
                    Valide la autenticidad e integridad de este documento en:{" "}
                    <span className="text-teal-700 font-semibold underline">
                      {verificationUrl}
                    </span>
                  </span>
                </div>
              </div>

              <div className="text-center sm:text-right bg-white px-3.5 py-1.5 rounded-lg border border-teal-300 shadow-xs">
                <span className="text-[9px] font-bold uppercase text-teal-700 block">
                  Código Público
                </span>
                <span className="font-mono font-black text-xs text-teal-950 block tracking-wider">
                  {verificationCode}
                </span>
              </div>
            </div>

            {/* Signature Block */}
            <div className="pt-8 flex items-end justify-between border-t border-gray-200 break-inside-avoid avoid-page-break pdf-block bg-white">
              <div className="text-[10px] text-gray-400 space-y-0.5">
                <p>Documento generado con validación criptográfica.</p>
                <p>
                  Protección de datos médicos conforme a normativas de privacidad.
                </p>
              </div>

              <div className="text-center min-w-55">
                <div className="border-t border-gray-900 pt-1.5 mt-10">
                  <p className="text-xs font-bold text-gray-900">
                    {evaluatorName || "Firma del Profesional"}
                  </p>
                  <p className="text-[10px] text-teal-700 font-semibold">
                    {evaluatorTitle || "Especialista en Psicometría"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReportPdfView.displayName = "ReportPdfView";
