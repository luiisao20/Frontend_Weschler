import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "../components/layout/Navbar";
import {
  getEvaluationById,
  getPatientById,
  updateEvaluation,
} from "../services/firestore";
import { useAuth } from "../context/AuthContext";
import type { Evaluation, Patient } from "../types";
import {
  generatePublicVerificationCode,
  computeVerificationHash,
} from "../utils/verification";
import {
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ShieldCheck,
  ExternalLink,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useFormik } from "formik";
import * as Yup from "yup";

// Services & Components
import { generateAiAnalysis } from "../services/aiService";
import {
  exportReportToPdf,
  getScaleBadgeLabel,
  getSubtestRows,
  getIndexesData,
  getChartData,
} from "../services/reportService";
import { ReportForm, type ReportFormValues } from "../components/report/ReportForm";
import { ReportPdfView } from "../components/report/ReportPdfView";
import { AiAnalysisModal } from "../components/report/AiAnalysisModal";

export const EvaluationReportPage: React.FC = () => {
  const { id: patientIdParam, evalId: evalIdParam } = useParams<{
    id?: string;
    evalId?: string;
  }>();
  const evaluationId = evalIdParam || patientIdParam || "";
  const navigate = useNavigate();
  const { user } = useAuth();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // In-Memory Form Fields (NOT saved to DB for patient privacy)
  const formik = useFormik<ReportFormValues>({
    initialValues: {
      patientName: "",
      documentId: "",
      ageDisplay: "",
      gender: "",
      evalDate: "",
      diagnosis: "",
      structuration: "",
      evaluatorName: "",
      evaluatorTitle: "",
      evaluationPlace: "",
      unicodigoAcess: "",
      evaluationCity: "",
      evaluationCountry: "",
      confidenceInterval: "90",
    },
    validationSchema: Yup.object({
      patientName: Yup.string().required("Requerido"),
      documentId: Yup.string()
        .matches(/^\d{10}$/, "Debe tener 10 dígitos")
        .required("Requerido"),
      ageDisplay: Yup.string().required("Requerido"),
      gender: Yup.string().required("Requerido para la IA"),
      evalDate: Yup.string().required("Requerido"),
      diagnosis: Yup.string(),
      structuration: Yup.string(),
      evaluatorName: Yup.string().required("Requerido"),
      evaluatorTitle: Yup.string(),
      evaluationPlace: Yup.string(),
      unicodigoAcess: Yup.string(),
      evaluationCity: Yup.string(),
      evaluationCountry: Yup.string(),
      confidenceInterval: Yup.string().oneOf(["90", "95"]).required(),
    }),
    onSubmit: () => {},
  });

  // AI Modal State
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [openaiText, setOpenaiText] = useState<string>("");
  const [claudeText, setClaudeText] = useState<string>("");

  // Verification metadata
  const [verificationCode, setVerificationCode] = useState<string>("");
  const [, setVerificationHash] = useState<string>("");

  // Preview tab state on mobile / small screens
  const [activeTab, setActiveTab] = useState<"form" | "preview">("form");

  const reportContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!evaluationId) return;

    setLoading(true);
    getEvaluationById(evaluationId)
      .then(async (evalData) => {
        if (!evalData) {
          setError("No se encontró la evaluación solicitada.");
          setLoading(false);
          return;
        }

        setEvaluation(evalData);

        const patientId =
          evalData.patientId || evalData.patient || patientIdParam || "";
        let patientData: Patient | null = null;
        if (patientId) {
          patientData = await getPatientById(patientId);
          setPatient(patientData);
        }

        // Initialize In-Memory Form values from patient/evaluation data
        const pName = patientData
          ? `${patientData.firstName} ${patientData.lastName}`.trim()
          : evalData.patientName || "Paciente";
        const docNum = (patientData?.document || evalData.document || "")
          .replace(/\D/g, "")
          .slice(0, 10);
        const years = evalData.age?.years ?? evalData.years ?? 0;
        const months = evalData.age?.months ?? evalData.months ?? 0;
        const days = evalData.age?.days ?? evalData.days ?? 0;
        const cAgeDisplay = `${years} años, ${months} meses${days > 0 ? `, ${days} días` : ""}`;
        const cEvalDate =
          evalData.date ||
          evalData.testDay ||
          new Date().toISOString().split("T")[0];
        const cDiagnosis = evalData.diagnosis || evalData.dx || "";
        const cStructuration =
          evalData.structuration || evalData.observations || "";
        const cEvaluatorName =
          evalData.evaluator ||
          user?.displayName ||
          user?.email ||
          "Especialista en Evaluación Psicológica";

        formik.setValues({
          patientName: pName,
          documentId: docNum,
          ageDisplay: cAgeDisplay,
          gender: patientData?.gender || "",
          evalDate: cEvalDate,
          diagnosis: cDiagnosis,
          structuration: cStructuration,
          evaluatorName: cEvaluatorName,
          evaluatorTitle: "",
          evaluationPlace: "",
          unicodigoAcess: evalData.unicodigoAcess || "",
          evaluationCity: "",
          evaluationCountry: "",
          confidenceInterval: "90",
        });

        // Manage Cryptographic Verification Code & Hash
        let vCode = evalData.verificationCode;
        let vHash = evalData.verificationHash;

        if (!vCode || !vHash) {
          vCode = generatePublicVerificationCode(evalData.scale || "EVAL");
          const payload = `${evalData.id || evaluationId}:${evalData.scale}:${evalData.date || evalData.testDay}:${JSON.stringify(evalData.scalarScores || {})}`;
          vHash = await computeVerificationHash(payload);

          // Update ONLY anonymous verification metadata in Firestore
          await updateEvaluation(evaluationId, {
            verificationCode: vCode,
            verificationHash: vHash,
            verifiedAt: new Date().toISOString(),
          });
        }

        setVerificationCode(vCode);
        setVerificationHash(vHash);
      })
      .catch((err) => {
        console.error("Error fetching evaluation for report:", err);
        setError("Error al cargar la información para el informe.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [evaluationId, user]);

  // Derived calculations through reportService
  const scaleBadgeLabel = getScaleBadgeLabel(evaluation);
  const subtestRows = getSubtestRows(evaluation);
  const { primaryList, secondaryList } = getIndexesData(
    evaluation,
    formik.values.ageDisplay,
    formik.values.confidenceInterval
  );
  const primaryChartData = getChartData(primaryList);
  const secondaryChartData = getChartData(secondaryList);

  // AI Analysis Query
  const fetchAIAnalysis = async (provider: "openai" | "claude") => {
    const patientAge =
      evaluation?.age?.years ||
      parseInt(String(formik.values.ageDisplay).split(" ")[0]) ||
      0;

    return generateAiAnalysis({
      provider,
      patientAge,
      patientGender: formik.values.gender,
      scaleBadgeLabel,
      confidenceInterval: formik.values.confidenceInterval,
      primaryList,
      secondaryList,
      onProgress: (texto) => {
        if (provider === "openai") {
          setOpenaiText(texto);
        } else {
          setClaudeText(texto);
        }
      },
    });
  };

  const queryClient = useQueryClient();

  const {
    data: openaiData,
    isFetching: isGeneratingOpenai,
    refetch: refetchOpenai,
  } = useQuery({
    queryKey: ["aiAnalysis", evaluationId, "openai"],
    queryFn: () => fetchAIAnalysis("openai"),
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });

  const {
    data: claudeData,
    isFetching: isGeneratingClaude,
    refetch: refetchClaude,
  } = useQuery({
    queryKey: ["aiAnalysis", evaluationId, "claude"],
    queryFn: () => fetchAIAnalysis("claude"),
    enabled: false,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (openaiData && !isGeneratingOpenai && !openaiText) {
      setOpenaiText(openaiData);
    }
  }, [openaiData, isGeneratingOpenai]);

  useEffect(() => {
    if (claudeData && !isGeneratingClaude && !claudeText) {
      setClaudeText(claudeData);
    }
  }, [claudeData, isGeneratingClaude]);

  const handleOpenAiModal = () => {
    setIsAiModalOpen(true);
  };

  const handleGenerateOpenai = () => {
    setOpenaiText("");
    refetchOpenai();
  };

  const handleRegenerateOpenai = () => {
    queryClient.invalidateQueries({
      queryKey: ["aiAnalysis", evaluationId, "openai"],
    });
    setOpenaiText("");
    refetchOpenai();
  };

  const handleGenerateClaude = () => {
    setClaudeText("");
    refetchClaude();
  };

  const handleRegenerateClaude = () => {
    queryClient.invalidateQueries({
      queryKey: ["aiAnalysis", evaluationId, "claude"],
    });
    setClaudeText("");
    refetchClaude();
  };

  const handleApplyAiText = (text: string) => {
    formik.setFieldValue("structuration", text);
    setIsAiModalOpen(false);
  };

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;

    if (formik.values.documentId && formik.values.documentId.length !== 10) {
      if (
        !window.confirm(
          "El número de cédula no tiene 10 dígitos. ¿Deseas generar el PDF de todas formas?",
        )
      ) {
        return;
      }
    }

    setDownloadingPdf(true);
    setError(null);
    try {
      await exportReportToPdf(reportContainerRef.current, {
        patientName: formik.values.patientName,
        scale: evaluation?.scale,
        evalDate: formik.values.evalDate,
      });

      setSuccessMsg("PDF generado y descargado correctamente.");
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error("Error generating PDF:", err);
      setError("Ocurrió un error al generar el PDF. Por favor intenta nuevamente.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
          <p className="text-sm font-semibold text-gray-600">
            Cargando datos para el informe...
          </p>
        </div>
      </div>
    );
  }

  const patientTargetId =
    patient?.id || evaluation?.patientId || evaluation?.patient || "";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            {patientTargetId ? (
              <Link
                to={`/patient/${patientTargetId}`}
                className="hover:text-teal-700 flex items-center space-x-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver al Paciente</span>
              </Link>
            ) : (
              <button
                onClick={() => navigate(-1)}
                className="hover:text-teal-700 flex items-center space-x-1 font-medium transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Regresar</span>
              </button>
            )}
            <span>/</span>
            <span className="text-gray-900 font-semibold">
              {formik.values.patientName || "Informe"}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Public verification badge link */}
            {verificationCode && (
              <Link
                to={`/verify?code=${verificationCode}`}
                target="_blank"
                className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold border border-teal-200 transition"
                title="Probar portal público de verificación"
              >
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span>Verificar: {verificationCode}</span>
                <ExternalLink className="w-3 h-3 text-teal-500 ml-0.5" />
              </Link>
            )}

            <button
              onClick={handlePrint}
              className="inline-flex items-center px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 shadow-xs transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4 mr-2 text-gray-500" />
              Imprimir
            </button>

            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="inline-flex items-center px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-50 text-sm font-bold text-white shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              {downloadingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generando PDF...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Descargar PDF
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm font-medium">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-teal-50 border border-teal-200 text-teal-800 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm font-medium">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-teal-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* View mode toggle on mobile */}
        <div className="lg:hidden flex bg-white rounded-2xl p-1 border border-gray-200 shadow-xs">
          <button
            onClick={() => setActiveTab("form")}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === "form"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Formulario
          </button>
          <button
            onClick={() => setActiveTab("preview")}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === "preview"
                ? "bg-teal-600 text-white shadow-xs"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Vista Previa
          </button>
        </div>

        {/* Main 2-Column Workspace: Form on Left, Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <ReportForm
            formik={formik}
            verificationCode={verificationCode}
            onOpenAiModal={handleOpenAiModal}
            isGeneratingAI={isGeneratingOpenai || isGeneratingClaude}
            className={`lg:col-span-4 ${activeTab === "form" ? "block" : "hidden lg:block"}`}
          />

          <ReportPdfView
            ref={reportContainerRef}
            formValues={formik.values}
            evaluation={evaluation}
            subtestRows={subtestRows}
            primaryList={primaryList}
            secondaryList={secondaryList}
            primaryChartData={primaryChartData}
            secondaryChartData={secondaryChartData}
            verificationCode={verificationCode}
            scaleBadgeLabel={scaleBadgeLabel}
            className={`lg:col-span-8 ${activeTab === "preview" ? "block" : "hidden lg:block"}`}
          />
        </div>

        {/* AI Modal */}
        <AiAnalysisModal
          isOpen={isAiModalOpen}
          onClose={() => setIsAiModalOpen(false)}
          onApply={handleApplyAiText}
          openaiText={openaiText}
          setOpenaiText={setOpenaiText}
          isGeneratingOpenai={isGeneratingOpenai}
          onGenerateOpenai={handleGenerateOpenai}
          onRegenerateOpenai={handleRegenerateOpenai}
          claudeText={claudeText}
          setClaudeText={setClaudeText}
          isGeneratingClaude={isGeneratingClaude}
          onGenerateClaude={handleGenerateClaude}
          onRegenerateClaude={handleRegenerateClaude}
        />
      </main>
    </div>
  );
};
