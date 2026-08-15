import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../components/layout/Navbar';
import { getEvaluationById, getPatientById, updateEvaluation } from '../services/firestore';
import { useAuth } from '../context/AuthContext';
import type { Evaluation, Patient } from '../types';
import { waisTests, waisIndexes } from '../data/scaleInfo/waisInfo';
import { wiscTests, wiscPrimaryIndexes, wiscSecondaryIndexes } from '../data/scaleInfo/wiscInfo';
import { wppsiTests, wppsiPrimaryIndexes, wppsiSecondaryIndexes } from '../data/scaleInfo/wppsiInfo';
import { wnvTests, wnvIndexes } from '../data/scaleInfo/wnvInfo';
import { TealReportChart } from '../components/charts/TealReportChart';
import { exportHtmlToPdf } from '../utils/pdfExport';
import { generatePublicVerificationCode, computeVerificationHash } from '../utils/verification';
import {
  ArrowLeft,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  FileText,
  User,
  Calendar,
  CreditCard,
  Stethoscope,
  BookOpen,
  Brain,
  Eye,
  Loader2,
  ShieldCheck,
  Lock,
  ExternalLink
} from 'lucide-react';

export const EvaluationReportPage: React.FC = () => {
  const { id: patientIdParam, evalId: evalIdParam } = useParams<{ id?: string; evalId?: string }>();
  const evaluationId = evalIdParam || patientIdParam || '';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [downloadingPdf, setDownloadingPdf] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // In-Memory Form Fields (NOT saved to DB for patient privacy)
  const [patientName, setPatientName] = useState<string>('');
  const [documentId, setDocumentId] = useState<string>('');
  const [ageDisplay, setAgeDisplay] = useState<string>('');
  const [evalDate, setEvalDate] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState<string>('');
  const [structuration, setStructuration] = useState<string>('');
  const [evaluatorName, setEvaluatorName] = useState<string>('');
  const [confidenceInterval, setConfidenceInterval] = useState<'90' | '95'>('90');

  // Verification metadata
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [verificationHash, setVerificationHash] = useState<string>('');

  // Preview tab state on mobile / small screens
  const [activeTab, setActiveTab] = useState<'form' | 'preview'>('form');

  const reportContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!evaluationId) return;

    setLoading(true);
    getEvaluationById(evaluationId)
      .then(async (evalData) => {
        if (!evalData) {
          setError('No se encontró la evaluación solicitada.');
          setLoading(false);
          return;
        }

        setEvaluation(evalData);

        const patientId = evalData.patientId || evalData.patient || patientIdParam || '';
        let patientData: Patient | null = null;
        if (patientId) {
          patientData = await getPatientById(patientId);
          setPatient(patientData);
        }

        // Initialize In-Memory Form values from patient/evaluation data
        const pName = patientData
          ? `${patientData.firstName} ${patientData.lastName}`.trim()
          : evalData.patientName || 'Paciente';
        setPatientName(pName);

        const docNum = (patientData?.document || evalData.document || '').replace(/\D/g, '').slice(0, 10);
        setDocumentId(docNum);

        const years = evalData.age?.years ?? evalData.years ?? 0;
        const months = evalData.age?.months ?? evalData.months ?? 0;
        const days = evalData.age?.days ?? evalData.days ?? 0;
        setAgeDisplay(`${years} años, ${months} meses${days > 0 ? `, ${days} días` : ''}`);

        setEvalDate(evalData.date || evalData.testDay || new Date().toISOString().split('T')[0]);
        setDiagnosis(evalData.diagnosis || evalData.dx || '');
        setStructuration(
          evalData.structuration ||
          evalData.observations ||
          'El evaluado completó la batería de subpruebas de acuerdo con los estándares psicométricos vigentes. Los resultados reflejan un perfil de habilidades cognitivas con áreas de fortaleza y oportunidades de desarrollo según las normas de estandarización.'
        );
        setEvaluatorName(evalData.evaluator || user?.displayName || user?.email || 'Especialista en Evaluación Psicológica');

        // Manage Cryptographic Verification Code & Hash (stored anonymously in DB)
        let vCode = evalData.verificationCode;
        let vHash = evalData.verificationHash;

        if (!vCode || !vHash) {
          vCode = generatePublicVerificationCode(evalData.scale || 'EVAL');
          const payload = `${evalData.id || evaluationId}:${evalData.scale}:${evalData.date || evalData.testDay}:${JSON.stringify(evalData.scalarScores || {})}`;
          vHash = await computeVerificationHash(payload);

          // Update ONLY anonymous verification metadata in Firestore (zero personal info!)
          await updateEvaluation(evaluationId, {
            verificationCode: vCode,
            verificationHash: vHash,
            verifiedAt: new Date().toISOString()
          });
        }

        setVerificationCode(vCode);
        setVerificationHash(vHash);
      })
      .catch((err) => {
        console.error('Error fetching evaluation for report:', err);
        setError('Error al cargar la información para el informe.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [evaluationId, user]);

  const handleDocumentChange = (val: string) => {
    // Restrict strictly to max 10 numeric digits
    const cleaned = val.replace(/\D/g, '').slice(0, 10);
    setDocumentId(cleaned);
  };

  const getQualitativeClassification = (scoreVal: any): string => {
    if (scoreVal === undefined || scoreVal === null || scoreVal === '' || scoreVal === '-') return '-';
    const num = typeof scoreVal === 'number' ? scoreVal : parseInt(String(scoreVal), 10);
    if (isNaN(num) || num <= 0) return '-';
    if (num >= 130) return 'Muy Superior';
    if (num >= 120) return 'Superior';
    if (num >= 110) return 'Promedio Alto';
    if (num >= 90) return 'Promedio';
    if (num >= 80) return 'Promedio Bajo';
    if (num >= 70) return 'Limítrofe';
    return 'Muy Bajo';
  };

  const getCompositeScoreValue = (comp: any, code: string): string => {
    if (!comp) return '-';
    if (typeof comp === 'number' || typeof comp === 'string') return String(comp);
    if (comp[code] !== undefined && comp[code] !== null) return String(comp[code]);
    if (comp.composite !== undefined && comp.composite !== null) return String(comp.composite);
    if (comp.score !== undefined && comp.score !== null) return String(comp.score);
    if (comp.value !== undefined && comp.value !== null) return String(comp.value);

    const codeKey = Object.keys(comp).find((k) => k.toUpperCase().startsWith(code.toUpperCase()));
    if (codeKey && comp[codeKey] !== undefined && comp[codeKey] !== null) {
      return String(comp[codeKey]);
    }

    const ignoreKeys = ['percentil', 'percentile', '90%', '95%', 'ic90', 'ic95', 'rango'];
    const numericKey = Object.keys(comp).find((k) => {
      const lowerK = k.toLowerCase();
      if (ignoreKeys.some((ik) => lowerK.includes(ik))) return false;
      const val = comp[k];
      return typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)) && String(val).trim() !== '');
    });

    if (numericKey && comp[numericKey] !== undefined && comp[numericKey] !== null) {
      return String(comp[numericKey]);
    }

    return '-';
  };

  const getPercentileValue = (comp: any): string => {
    if (!comp || typeof comp !== 'object') return '-';
    const keys = Object.keys(comp);
    const percentileKey = keys.find((k) => k.toLowerCase().includes('percentil') || k.toLowerCase().includes('percentile'));
    if (percentileKey && comp[percentileKey] !== undefined && comp[percentileKey] !== null) {
      return String(comp[percentileKey]);
    }
    return '-';
  };

  const getConfidenceIntervalValue = (comp: any, is95: boolean): string => {
    if (!comp || typeof comp !== 'object') return '-';
    const target = is95 ? '95%' : '90%';
    const altTarget = is95 ? 'ic95' : 'ic90';

    if (comp[target] !== undefined && comp[target] !== null) return String(comp[target]);
    if (comp[altTarget] !== undefined && comp[altTarget] !== null) {
      return Array.isArray(comp[altTarget]) ? comp[altTarget].join('-') : String(comp[altTarget]);
    }

    const key = Object.keys(comp).find((k) => k.toLowerCase().includes(target.toLowerCase()) || k.toLowerCase().includes(altTarget));
    if (key && comp[key] !== undefined && comp[key] !== null) {
      return Array.isArray(comp[key]) ? comp[key].join('-') : String(comp[key]);
    }

    return '-';
  };

  const getScaleBadgeLabel = () => {
    if (!evaluation) return 'EVALUACIÓN';
    const scale = (evaluation.type || evaluation.scale || 'wais').toLowerCase();
    if (scale === 'wais_c') return 'WAIS-IV (Versión Chilena)';
    if (scale === 'wais_e') return 'WAIS-IV (Versión Española)';
    if (scale === 'wais_m') return 'WAIS-IV (Versión Mexicana)';
    if (scale.startsWith('wais')) return 'WAIS-IV';
    if (scale.includes('wisc')) return 'WISC-V (Escala de Inteligencia de Wechsler para Niños)';
    if (scale.includes('wppsi')) return 'WPPSI-IV (Escala de Inteligencia para Preescolar y Primaria)';
    if (scale.includes('wnv')) return 'WNV (Escala No Verbal de Aptitud Intelectual)';
    return scale.toUpperCase();
  };

  // Subtest list for Table
  const getSubtestRows = () => {
    if (!evaluation) return [];
    const scale = (evaluation.type || evaluation.scale || 'wais').toLowerCase();
    let masterTests: { code: string; name: string }[] = [];

    if (scale.includes('wisc')) masterTests = wiscTests;
    else if (scale.includes('wppsi')) masterTests = wppsiTests;
    else if (scale.includes('wnv')) masterTests = wnvTests;
    else masterTests = waisTests;

    const rawScores = evaluation.rawScores || evaluation.scores || {};
    const scalarScores = evaluation.scalarScores || {};

    return masterTests
      .filter((t) => rawScores[t.code] !== undefined || scalarScores[t.code] !== undefined)
      .map((t) => ({
        code: t.code,
        name: t.name,
        rawScore: rawScores[t.code] !== undefined && rawScores[t.code] !== '' ? rawScores[t.code] : '-',
        scalarScore: scalarScores[t.code] !== undefined ? scalarScores[t.code] : '-'
      }));
  };

  // Composite indexes list
  const getIndexesData = () => {
    if (!evaluation) return { primaryList: [], secondaryList: [] };

    const scale = (evaluation.type || evaluation.scale || 'wais').toLowerCase();
    let primaryDefs: { code: string; name: string }[] = [];
    let secondaryDefs: { code: string; name: string }[] = [];

    if (scale.includes('wisc')) {
      primaryDefs = wiscPrimaryIndexes;
      secondaryDefs = wiscSecondaryIndexes;
    } else if (scale.includes('wppsi')) {
      primaryDefs = wppsiPrimaryIndexes;
      secondaryDefs = wppsiSecondaryIndexes;
    } else if (scale.includes('wnv')) {
      primaryDefs = wnvIndexes;
      secondaryDefs = [];
    } else {
      primaryDefs = waisIndexes;
      secondaryDefs = [];
    }

    const data = evaluation.data || {};
    const primarySum = data.primarySum || data.sum || evaluation.indexesSum || {};
    const secondarySum = data.secondarySum || {};
    const primaryComposes = data.primaryComposes || data.composes || evaluation.indexes || {};
    const secondaryComposes = data.secondaryComposes || {};

    const parseItem = (idx: { code: string; name: string }, comp: any, sumVal: any) => {
      const compScore = getCompositeScoreValue(comp, idx.code);
      const percentile = getPercentileValue(comp);
      const ci = getConfidenceIntervalValue(comp, confidenceInterval === '95');
      const qualitative = getQualitativeClassification(compScore);

      return {
        code: idx.code,
        name: idx.name,
        sum: sumVal !== undefined ? sumVal : '-',
        composite: compScore,
        percentile: percentile,
        ci: ci,
        qualitative: qualitative
      };
    };

    const primaryList = primaryDefs
      .map((idx) => parseItem(idx, primaryComposes[idx.code], primarySum[idx.code]))
      .filter((item) => item.composite !== '-' || item.sum !== '-');

    const secondaryList = secondaryDefs
      .map((idx) => parseItem(idx, secondaryComposes[idx.code], secondarySum[idx.code]))
      .filter((item) => item.composite !== '-' || item.sum !== '-');

    return { primaryList, secondaryList };
  };

  const { primaryList, secondaryList } = getIndexesData();
  const subtestRows = getSubtestRows();

  // Chart data extraction
  const getChartData = (items: ReturnType<typeof getIndexesData>['primaryList']) => {
    const categories = items.map((i) => i.code);
    const values = items.map((i) => (i.composite !== '-' ? Number(i.composite) : null));

    const upperLimits = items.map((i) => {
      if (i.ci && i.ci.includes('-')) {
        const parts = i.ci.split('-');
        const u = parseInt(parts[1], 10);
        return isNaN(u) ? null : u;
      }
      return null;
    });

    const lowerLimits = items.map((i) => {
      if (i.ci && i.ci.includes('-')) {
        const parts = i.ci.split('-');
        const l = parseInt(parts[0], 10);
        return isNaN(l) ? null : l;
      }
      return null;
    });

    return { categories, values, upperLimits, lowerLimits };
  };

  const primaryChartData = getChartData(primaryList);
  const secondaryChartData = getChartData(secondaryList);

  const handleDownloadPdf = async () => {
    if (!reportContainerRef.current) return;

    if (documentId && documentId.length !== 10) {
      if (!window.confirm('El número de cédula no tiene 10 dígitos. ¿Deseas generar el PDF de todas formas?')) {
        return;
      }
    }

    setDownloadingPdf(true);
    setError(null);
    try {
      const cleanPatient = (patientName || 'paciente').replace(/\s+/g, '_');
      const cleanScale = (evaluation?.scale || 'escala').toUpperCase();
      const filename = `Informe_${cleanPatient}_${cleanScale}_${evalDate}.pdf`;

      await exportHtmlToPdf(reportContainerRef.current, filename);

      setSuccessMsg('PDF generado y descargado correctamente.');
      setTimeout(() => setSuccessMsg(null), 3500);
    } catch (err: any) {
      console.error('Error generating PDF:', err);
      setError('Ocurrió un error al generar el PDF. Por favor intenta nuevamente.');
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
          <p className="text-sm font-semibold text-gray-600">Cargando datos para el informe...</p>
        </div>
      </div>
    );
  }

  const patientTargetId = patient?.id || evaluation?.patientId || evaluation?.patient || '';
  const verificationUrl = `${window.location.origin}/verify?code=${verificationCode}`;

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
                className="hover:text-teal-700 flex items-center space-x-1 font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Regresar</span>
              </button>
            )}
            <span>/</span>
            <span className="text-gray-900 font-semibold">{patientName || 'Informe'}</span>
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
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'form' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Formulario
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'preview' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Vista Previa
          </button>
        </div>

        {/* Main 2-Column Workspace: Form on Left, Preview on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Panel */}
          <div
            className={`lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-xs space-y-5 ${
              activeTab === 'form' ? 'block' : 'hidden lg:block'
            }`}
          >
            <div className="border-b border-gray-100 pb-3.5">
              <div className="flex items-center space-x-2 text-teal-700 mb-1">
                <FileText className="w-5 h-5" />
                <h2 className="text-lg font-bold text-gray-900">Datos para el Informe</h2>
              </div>
              <p className="text-xs text-gray-500">
                Los datos se actualizan en vivo en la vista previa del documento.
              </p>
            </div>

            {/* Privacy Protection Banner */}
            <div className="bg-teal-50/80 border border-teal-200/90 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-teal-900">
              <Lock className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
              <div className="space-y-0.5">
                <span className="font-bold text-teal-900 block">Privacidad y Confidencialidad</span>
                <span className="text-[11px] text-teal-800 leading-snug block">
                  Los nombres, número de cédula, diagnóstico y estructuración ingresados en este formulario no se guardan en la base de datos por protección de datos de salud.
                </span>
              </div>
            </div>

            <div className="space-y-4 text-sm">
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Nombre del Paciente
                </label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>

              {/* Document Cédula (Strict 10 digits) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center">
                    <CreditCard className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    Número de Cédula
                  </label>
                  <span
                    className={`text-[11px] font-bold ${
                      documentId.length === 10 ? 'text-teal-600' : 'text-amber-600'
                    }`}
                  >
                    {documentId.length}/10 dígitos
                  </span>
                </div>
                <input
                  type="text"
                  maxLength={10}
                  value={documentId}
                  onChange={(e) => handleDocumentChange(e.target.value)}
                  placeholder="10 dígitos numéricos"
                  className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl font-mono text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 transition ${
                    documentId.length === 10
                      ? 'border-teal-300 focus:ring-teal-500 focus:bg-white'
                      : 'border-gray-200 focus:ring-teal-500 focus:bg-white'
                  }`}
                />
                {documentId.length > 0 && documentId.length < 10 && (
                  <p className="text-[11px] text-amber-600 font-medium mt-1">
                    La cédula debe contener exactamente 10 dígitos.
                  </p>
                )}
              </div>

              {/* Age */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center">
                  <Brain className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Edad
                </label>
                <input
                  type="text"
                  value={ageDisplay}
                  onChange={(e) => setAgeDisplay(e.target.value)}
                  placeholder="Ej. 10 años, 4 meses"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Fecha de Aplicación
                </label>
                <input
                  type="date"
                  value={evalDate}
                  onChange={(e) => setEvalDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>

              {/* Diagnosis */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center">
                  <Stethoscope className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Dx Presuntivo / Definitivo
                </label>
                <input
                  type="text"
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  placeholder="Ej. Sospecha de Trastorno por Déficit de Atención (TDAH)"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>

              {/* Structuration */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center">
                  <BookOpen className="w-3.5 h-3.5 mr-1 text-teal-600" />
                  Estructuración / Conclusiones
                </label>
                <textarea
                  rows={4}
                  value={structuration}
                  onChange={(e) => setStructuration(e.target.value)}
                  placeholder="Describe la estructuración del perfil cognitivo, fortalezas y recomendaciones..."
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition text-xs leading-relaxed"
                />
              </div>

              {/* Evaluator */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Evaluador / Profesional
                </label>
                <input
                  type="text"
                  value={evaluatorName}
                  onChange={(e) => setEvaluatorName(e.target.value)}
                  placeholder="Nombre del profesional"
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
                />
              </div>

              {/* Confidence Interval Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
                  Intervalo de Confianza
                </label>
                <div className="grid grid-cols-2 gap-2 bg-gray-50 p-1 rounded-xl border border-gray-200">
                  <button
                    type="button"
                    onClick={() => setConfidenceInterval('90')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      confidenceInterval === '90' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    IC 90%
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfidenceInterval('95')}
                    className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                      confidenceInterval === '95' ? 'bg-teal-600 text-white shadow-xs' : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    IC 95%
                  </button>
                </div>
              </div>

              {/* Public Verification Code Card */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-700 flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1 text-teal-600" />
                    Código de Validación
                  </span>
                  <span className="text-[10px] font-bold text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded">
                    Público
                  </span>
                </div>
                <p className="font-mono font-black text-sm text-teal-900 bg-white p-2 rounded-xl border border-gray-200 text-center tracking-wider select-all">
                  {verificationCode}
                </p>
                <p className="text-[10px] text-gray-500 text-center">
                  Este código permite a terceros verificar la validez de este PDF en la plataforma.
                </p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Printable Document Preview */}
          <div className={`lg:col-span-8 ${activeTab === 'preview' ? 'block' : 'hidden lg:block'}`}>
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
                ref={reportContainerRef}
                className="pdf-page bg-white text-gray-900 rounded-2xl shadow-xl border border-gray-200 mx-auto p-8 sm:p-10 space-y-6 w-full max-w-[794px] min-h-[1123px] text-xs leading-normal"
                style={{ fontFamily: 'ui-sans-serif, system-ui, sans-serif' }}
              >
                {/* Header with Teal Styling & Verification Tag */}
                <div className="border-b-2 border-teal-700 pb-4 flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 bg-teal-50 border border-teal-200 px-2.5 py-1 rounded-md">
                      {getScaleBadgeLabel()}
                    </span>
                    <h1 className="text-xl sm:text-2xl font-black text-gray-900 mt-2 tracking-tight">
                      INFORME DE EVALUACIÓN PSICOMÉTRICA
                    </h1>
                    <p className="text-[11px] font-semibold text-gray-500 mt-0.5">
                      {evaluation?.name || 'Evaluación de Inteligencia y Habilidades Cognitivas'}
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
                <div className="bg-teal-50/50 rounded-xl border border-teal-200 p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-3 border-b border-teal-200/80 pb-1.5 flex items-center">
                    <User className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                    Datos del Paciente e Información Clínica
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-teal-700 block">Paciente</span>
                      <span className="font-bold text-gray-900">{patientName || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-teal-700 block">N° Cédula</span>
                      <span className="font-bold font-mono text-gray-900">{documentId || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-teal-700 block">Edad Cronológica</span>
                      <span className="font-bold text-gray-900">{ageDisplay || '-'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold uppercase text-teal-700 block">Fecha Aplicación</span>
                      <span className="font-bold text-gray-900">{evalDate || '-'}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-[10px] font-bold uppercase text-teal-700 block">Dx Presuntivo / Definitivo</span>
                      <span className="font-bold text-gray-900">{diagnosis || 'No especificado'}</span>
                    </div>
                    <div className="sm:col-span-3">
                      <span className="text-[10px] font-bold uppercase text-teal-700 block">Evaluador / Profesional</span>
                      <span className="font-semibold text-gray-800">{evaluatorName || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Subtests Table (if available) */}
                {subtestRows.length > 0 && (
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center">
                      <Brain className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                      Rendimiento en Subpruebas (Puntuaciones Directas y Escalares)
                    </h3>
                    <div className="rounded-xl border border-teal-200 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-teal-700 text-white font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Subprueba</th>
                            <th className="px-3 py-2 text-center w-28">Puntaje Directo (PD)</th>
                            <th className="px-3 py-2 text-center w-28">Puntuación Escalar (PE)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-100">
                          {subtestRows.map((row, idx) => (
                            <tr key={row.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}>
                              <td className="px-3 py-1.5 font-medium text-gray-800">
                                <span className="font-bold text-teal-700 mr-1.5">{row.code}</span>
                                <span>{row.name}</span>
                              </td>
                              <td className="px-3 py-1.5 text-center font-semibold text-gray-700">{row.rawScore}</td>
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
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                      Análisis Primario: Puntuaciones Compuestas e Índices
                    </h3>
                    <div className="rounded-xl border border-teal-200 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-teal-800 text-white font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Índice</th>
                            <th className="px-3 py-2 text-center w-20">Suma PE</th>
                            <th className="px-3 py-2 text-center w-24">Punt. Compuesta</th>
                            <th className="px-3 py-2 text-center w-20">Percentil</th>
                            <th className="px-3 py-2 text-center w-24">IC ({confidenceInterval}%)</th>
                            <th className="px-3 py-2 text-center">Clasificación Cualitativa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-100">
                          {primaryList.map((item, idx) => (
                            <tr key={item.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                <span className="font-bold text-teal-800 mr-1.5">{item.code}</span>
                                <span className="text-gray-600 text-[11px]">{item.name}</span>
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-gray-700">{item.sum}</td>
                              <td className="px-3 py-2 text-center font-black text-sm text-teal-950 bg-teal-100/50">
                                {item.composite}
                              </td>
                              <td className="px-3 py-2 text-center font-semibold text-gray-700">{item.percentile}</td>
                              <td className="px-3 py-2 text-center font-semibold text-teal-800">{item.ci}</td>
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
                  <div className="pt-1">
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
                  <div className="space-y-4 pt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2 flex items-center">
                      <FileText className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                      Análisis Secundario: Índices Específicos
                    </h3>
                    <div className="rounded-xl border border-teal-200 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-teal-900 text-white font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-3 py-2">Índice Secundario</th>
                            <th className="px-3 py-2 text-center w-20">Suma PE</th>
                            <th className="px-3 py-2 text-center w-24">Punt. Compuesta</th>
                            <th className="px-3 py-2 text-center w-20">Percentil</th>
                            <th className="px-3 py-2 text-center w-24">IC ({confidenceInterval}%)</th>
                            <th className="px-3 py-2 text-center">Clasificación Cualitativa</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-100">
                          {secondaryList.map((item, idx) => (
                            <tr key={item.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}>
                              <td className="px-3 py-2 font-medium text-gray-800">
                                <span className="font-bold text-teal-900 mr-1.5">{item.code}</span>
                                <span className="text-gray-600 text-[11px]">{item.name}</span>
                              </td>
                              <td className="px-3 py-2 text-center font-bold text-gray-700">{item.sum}</td>
                              <td className="px-3 py-2 text-center font-black text-sm text-teal-950 bg-teal-100/50">
                                {item.composite}
                              </td>
                              <td className="px-3 py-2 text-center font-semibold text-gray-700">{item.percentile}</td>
                              <td className="px-3 py-2 text-center font-semibold text-teal-800">{item.ci}</td>
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
                <div className="bg-white rounded-xl border-l-4 border-teal-700 p-4 bg-teal-50/30">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 mb-2">
                    Estructuración del Perfil Cognitivo y Observaciones
                  </h4>
                  <p className="text-xs text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {structuration || 'No se han registrado observaciones adicionales.'}
                  </p>
                </div>

                {/* Section 7: Official Public Verification Footer Card */}
                <div className="bg-teal-50/70 border border-teal-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px]">
                  <div className="flex items-center space-x-2.5">
                    <ShieldCheck className="w-5 h-5 text-teal-700 flex-shrink-0" />
                    <div>
                      <span className="font-bold text-teal-950 block">Verificación Oficial de Autenticidad</span>
                      <span className="text-gray-600 block">
                        Valide la autenticidad e integridad de este documento en:{' '}
                        <span className="text-teal-700 font-semibold underline">
                          {verificationUrl}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-center sm:text-right bg-white px-3.5 py-1.5 rounded-lg border border-teal-300 shadow-xs">
                    <span className="text-[9px] font-bold uppercase text-teal-700 block">Código Público</span>
                    <span className="font-mono font-black text-xs text-teal-950 block tracking-wider">
                      {verificationCode}
                    </span>
                  </div>
                </div>

                {/* Signature Block */}
                <div className="pt-8 flex items-end justify-between border-t border-gray-200">
                  <div className="text-[10px] text-gray-400 space-y-0.5">
                    <p>Documento generado con validación criptográfica.</p>
                    <p>Protección de datos médicos conforme a normativas de privacidad.</p>
                  </div>

                  <div className="text-center min-w-55">
                    <div className="border-t border-gray-900 pt-1.5 mt-10">
                      <p className="text-xs font-bold text-gray-900">{evaluatorName || 'Firma del Profesional'}</p>
                      <p className="text-[10px] text-teal-700 font-semibold">Especialista en Psicometría</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
