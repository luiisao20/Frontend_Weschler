import React from "react";
import type { FormikProps } from "formik";
import {
  FileText,
  Lock,
  User,
  CreditCard,
  Brain,
  Calendar,
  Stethoscope,
  BookOpen,
  Loader2,
  ShieldCheck,
} from "lucide-react";

export interface ReportFormValues {
  patientName: string;
  documentId: string;
  ageDisplay: string;
  evalDate: string;
  diagnosis: string;
  structuration: string;
  evaluatorName: string;
  evaluatorTitle: string;
  evaluationPlace: string;
  unicodigoAcess: string;
  evaluationCity: string;
  evaluationCountry: string;
  confidenceInterval: "90" | "95";
}

interface ReportFormProps {
  formik: FormikProps<ReportFormValues>;
  verificationCode: string;
  onOpenAiModal: () => void;
  isGeneratingAI: boolean;
  className?: string;
}

export const ReportForm: React.FC<ReportFormProps> = ({
  formik,
  verificationCode,
  onOpenAiModal,
  isGeneratingAI,
  className = "",
}) => {
  const { values, errors, touched, handleChange, handleBlur, setFieldValue } = formik;

  return (
    <div
      className={`bg-white rounded-3xl border border-gray-100 p-6 sm:p-7 shadow-xs space-y-5 ${className}`}
    >
      <div className="border-b border-gray-100 pb-3.5">
        <div className="flex items-center space-x-2 text-teal-700 mb-1">
          <FileText className="w-5 h-5" />
          <h2 className="text-lg font-bold text-gray-900">
            Datos para el Informe
          </h2>
        </div>
        <p className="text-xs text-gray-500">
          Los datos se actualizan en vivo en la vista previa del documento.
        </p>
      </div>

      {/* Privacy Protection Banner */}
      <div className="bg-teal-50/80 border border-teal-200/90 rounded-2xl p-3.5 flex items-start space-x-2.5 text-xs text-teal-900">
        <Lock className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
        <div className="space-y-0.5">
          <span className="font-bold text-teal-900 block">
            Privacidad y Confidencialidad
          </span>
          <span className="text-[11px] text-teal-800 leading-snug block">
            Los nombres, número de cédula, diagnóstico y estructuración
            ingresados en este formulario no se guardan en la base de datos por
            protección de datos de salud.
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
            name="patientName"
            value={values.patientName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej. Juan Pérez"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
          {touched.patientName && errors.patientName ? (
            <div className="text-red-500 text-[10px] mt-1 font-medium">
              {errors.patientName}
            </div>
          ) : null}
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
                values.documentId.length === 10
                  ? "text-teal-600"
                  : "text-amber-600"
              }`}
            >
              {values.documentId.length}/10 dígitos
            </span>
          </div>
          <input
            type="text"
            maxLength={10}
            name="documentId"
            value={values.documentId}
            onChange={(e) => {
              const cleaned = e.target.value.replace(/\D/g, "").slice(0, 10);
              setFieldValue("documentId", cleaned);
            }}
            onBlur={handleBlur}
            placeholder="10 dígitos numéricos"
            className={`w-full px-3.5 py-2.5 bg-gray-50 border rounded-xl font-mono text-sm font-semibold text-gray-900 focus:outline-none focus:ring-2 transition ${
              values.documentId.length === 10
                ? "border-teal-300 focus:ring-teal-500 focus:bg-white"
                : "border-gray-200 focus:ring-teal-500 focus:bg-white"
            }`}
          />
          {values.documentId.length > 0 && values.documentId.length < 10 && (
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
            name="ageDisplay"
            value={values.ageDisplay}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej. 10 años, 4 meses"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
          {touched.ageDisplay && errors.ageDisplay ? (
            <div className="text-red-500 text-[10px] mt-1 font-medium">
              {errors.ageDisplay}
            </div>
          ) : null}
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center">
            <Calendar className="w-3.5 h-3.5 mr-1 text-teal-600" />
            Fecha de Aplicación
          </label>
          <input
            type="date"
            name="evalDate"
            value={values.evalDate}
            onChange={handleChange}
            onBlur={handleBlur}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
          {touched.evalDate && errors.evalDate ? (
            <div className="text-red-500 text-[10px] mt-1 font-medium">
              {errors.evalDate}
            </div>
          ) : null}
        </div>

        {/* Diagnosis */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5 flex items-center">
            <Stethoscope className="w-3.5 h-3.5 mr-1 text-teal-600" />
            Dx Presuntivo / Definitivo
          </label>
          <input
            type="text"
            name="diagnosis"
            value={values.diagnosis}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej. Sospecha de Trastorno por Déficit de Atención (TDAH)"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>

        {/* Structuration */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center">
              <BookOpen className="w-3.5 h-3.5 mr-1 text-teal-600" />
              Interpretación Cualitativa
            </label>
            <button
              type="button"
              onClick={onOpenAiModal}
              disabled={isGeneratingAI}
              className="inline-flex items-center px-2.5 py-1 bg-teal-50 text-teal-700 hover:bg-teal-100 text-[10px] font-bold rounded-lg border border-teal-200 transition cursor-pointer disabled:opacity-50"
            >
              {isGeneratingAI ? (
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              ) : (
                <Brain className="w-3 h-3 mr-1" />
              )}
              Generar Análisis con IA
            </button>
          </div>
          <textarea
            rows={4}
            name="structuration"
            value={values.structuration}
            onChange={handleChange}
            onBlur={handleBlur}
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
            name="evaluatorName"
            value={values.evaluatorName}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Nombre del profesional"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
          {touched.evaluatorName && errors.evaluatorName ? (
            <div className="text-red-500 text-[10px] mt-1 font-medium">
              {errors.evaluatorName}
            </div>
          ) : null}
        </div>

        {/* Evaluator Title */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            Título del Profesional
          </label>
          <input
            type="text"
            name="evaluatorTitle"
            value={values.evaluatorTitle}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej. Psicólogo Clínico"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>

        {/* Place, City, Country */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            Lugar
          </label>
          <input
            type="text"
            name="evaluationPlace"
            value={values.evaluationPlace}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej. Clínica ABC"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            UNICÓDIGO ACESS
          </label>
          <input
            type="text"
            name="unicodigoAcess"
            value={values.unicodigoAcess}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ej. 12345678"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition font-mono"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            Ciudad
          </label>
          <input
            type="text"
            name="evaluationCity"
            value={values.evaluationCity}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Ciudad"
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 mb-1.5">
            País
          </label>
          <input
            type="text"
            name="evaluationCountry"
            value={values.evaluationCountry}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="País"
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
              onClick={() => setFieldValue("confidenceInterval", "90")}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                values.confidenceInterval === "90"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              IC 90%
            </button>
            <button
              type="button"
              onClick={() => setFieldValue("confidenceInterval", "95")}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                values.confidenceInterval === "95"
                  ? "bg-teal-600 text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900"
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
            Este código permite a terceros verificar la validez de este PDF en la
            plataforma.
          </p>
        </div>
      </div>
    </div>
  );
};
