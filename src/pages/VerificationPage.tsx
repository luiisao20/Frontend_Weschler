import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { getEvaluationByVerificationCode } from '../services/firestore';
import type { Evaluation } from '../types';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertCircle,
  Brain,
  Calendar,
  Lock,
  FileCheck2,
  ArrowLeft,
  Loader2,
  Sparkles
} from 'lucide-react';

export const VerificationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { code: codeParam } = useParams<{ code?: string }>();
  const initialCode = (codeParam || searchParams.get('code') || '').toUpperCase();

  const [inputCode, setInputCode] = useState<string>(initialCode);
  const [loading, setLoading] = useState<boolean>(false);
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [searched, setSearched] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const performVerification = async (codeToVerify: string) => {
    const cleanCode = codeToVerify.trim().toUpperCase();
    if (!cleanCode) {
      setError('Por favor ingresa un código de verificación válido.');
      return;
    }

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const evalData = await getEvaluationByVerificationCode(cleanCode);
      if (!evalData) {
        setEvaluation(null);
        setError('No se encontró ningún registro psicométrico con el código ingresado. Verifica que el código coincida exactamente con el impreso en el informe.');
      } else {
        setEvaluation(evalData);
      }
    } catch (err: any) {
      console.error('Error during verification:', err);
      setError('Ocurrió un error al consultar el sistema de verificación.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialCode) {
      performVerification(initialCode);
    }
  }, [initialCode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performVerification(inputCode);
  };

  const getScaleLabel = (ev: Evaluation) => {
    const scale = (ev.type || ev.scale || 'wais').toLowerCase();
    if (scale === 'wais_c') return 'WAIS-IV (Versión Chilena)';
    if (scale === 'wais_e') return 'WAIS-IV (Versión Española)';
    if (scale === 'wais_m') return 'WAIS-IV (Versión Mexicana)';
    if (scale.startsWith('wais')) return 'WAIS-IV (Escala de Inteligencia de Wechsler para Adultos)';
    if (scale.includes('wisc')) return 'WISC-V (Escala de Inteligencia de Wechsler para Niños)';
    if (scale.includes('wppsi')) return 'WPPSI-IV (Escala para Preescolar y Primaria)';
    if (scale.includes('wnv')) return 'WNV (Escala No Verbal de Aptitud Intelectual)';
    return scale.toUpperCase();
  };

  const getVerifiedIndexes = (ev: Evaluation) => {
    const data = ev.data || {};
    const primaryComposes = data.primaryComposes || data.composes || ev.indexes || {};
    const secondaryComposes = data.secondaryComposes || {};
    const allComposes = { ...primaryComposes, ...secondaryComposes };

    const results: { code: string; score: string; ci?: string; percentile?: string }[] = [];

    Object.keys(allComposes).forEach((key) => {
      const item = allComposes[key];
      if (!item) return;

      let score = '-';
      if (typeof item === 'number' || typeof item === 'string') score = String(item);
      else if (item.composite !== undefined) score = String(item.composite);
      else if (item.score !== undefined) score = String(item.score);
      else if (item[key] !== undefined) score = String(item[key]);

      let ci = '-';
      if (item['90%']) ci = String(item['90%']);
      else if (item['95%']) ci = String(item['95%']);
      else if (item.ic90) ci = Array.isArray(item.ic90) ? item.ic90.join('-') : String(item.ic90);

      let percentile = '-';
      if (item.percentil !== undefined) percentile = String(item.percentil);
      else if (item.percentile !== undefined) percentile = String(item.percentile);

      if (score !== '-') {
        results.push({ code: key, score, ci, percentile });
      }
    });

    return results;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-teal-950 via-teal-900 to-gray-900 text-white flex flex-col">
      {/* Public Header */}
      <header className="border-b border-teal-800/80 bg-teal-950/60 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3 text-white group">
            <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-lg shadow-teal-600/30 group-hover:scale-105 transition">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-white block leading-tight">
                Plataforma Psicométrica
              </span>
              <span className="text-[11px] font-semibold text-teal-300 uppercase tracking-widest block">
                Portal de Verificación Oficial
              </span>
            </div>
          </Link>

          <Link
            to="/login"
            className="text-xs font-bold text-teal-200 hover:text-white bg-teal-800/60 hover:bg-teal-700/80 px-4 py-2 rounded-xl border border-teal-700/60 transition"
          >
            Acceso Profesionales
          </Link>
        </div>
      </header>

      {/* Hero & Search Section */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center space-x-2 bg-teal-800/40 border border-teal-700/60 px-3 py-1 rounded-full text-xs font-bold text-teal-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Sistema Criptográfico de Validación de Informes</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Verificación de Autenticidad de Informes
          </h1>
          <p className="text-sm text-teal-200/90 max-w-2xl mx-auto leading-relaxed">
            Ingresa el código público de validación impreso en el documento oficial para certificar su legitimidad e integridad psicométrica.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl border border-teal-700/40 p-3 sm:p-4 shadow-2xl">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-teal-300">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Ej. VER-WISC-8F3A-9B21"
                className="w-full pl-11 pr-4 py-3.5 bg-teal-950/60 border border-teal-600/40 rounded-2xl text-white font-mono text-base font-bold placeholder-teal-500/60 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:border-transparent transition"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className="inline-flex items-center justify-center px-8 py-3.5 rounded-2xl bg-teal-500 hover:bg-teal-400 active:bg-teal-600 disabled:opacity-50 text-teal-950 font-black text-sm shadow-lg shadow-teal-500/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4 mr-2" />
                  Verificar Documento
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/40 text-red-200 rounded-3xl p-5 flex items-start space-x-3 text-sm animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="font-bold text-white">No fue posible validar el documento</p>
              <p className="text-xs text-red-200">{error}</p>
            </div>
          </div>
        )}

        {/* Verified Result Certificate */}
        {evaluation && (
          <div className="bg-white text-gray-900 rounded-3xl shadow-2xl border border-teal-200 overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Seal Header */}
            <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-teal-800 p-6 text-white text-center sm:text-left sm:flex sm:items-center sm:justify-between border-b border-teal-600">
              <div className="flex items-center justify-center sm:justify-start space-x-4 mb-4 sm:mb-0">
                <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border-2 border-teal-300 flex items-center justify-center text-teal-300">
                  <CheckCircle2 className="w-8 h-8 text-teal-300" />
                </div>
                <div>
                  <span className="text-[11px] font-black uppercase tracking-widest text-teal-300 block">
                    CERTIFICACIÓN DE AUTENTICIDAD
                  </span>
                  <h3 className="text-xl font-black text-white">Documento Oficial Válido</h3>
                  <p className="text-xs text-teal-100 font-mono mt-0.5">
                    Código: <span className="font-extrabold text-white">{evaluation.verificationCode}</span>
                  </p>
                </div>
              </div>

              <div className="text-center sm:text-right bg-teal-900/60 border border-teal-500/30 px-4 py-2 rounded-2xl">
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 block">
                  Estado en el Registro
                </span>
                <span className="text-sm font-black text-teal-200 flex items-center justify-center sm:justify-end space-x-1">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>AUTÉNTICO</span>
                </span>
              </div>
            </div>

            {/* Certificate Content */}
            <div className="p-6 sm:p-8 space-y-6 text-xs">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-teal-50/50 p-4 rounded-2xl border border-teal-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">Batería Psicométrica</span>
                  <span className="font-extrabold text-gray-900 text-sm">{getScaleLabel(evaluation)}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">Fecha de Aplicación</span>
                  <span className="font-bold text-gray-900">{evaluation.date || evaluation.testDay || '-'}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-teal-700 block">Fecha de Certificación</span>
                  <span className="font-bold text-gray-900">
                    {evaluation.verifiedAt ? new Date(evaluation.verifiedAt).toLocaleDateString() : 'Registrado'}
                  </span>
                </div>
              </div>

              {/* Verified Psychometric Scores */}
              {(() => {
                const verifiedItems = getVerifiedIndexes(evaluation);
                if (verifiedItems.length === 0) return null;
                return (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-teal-900 flex items-center">
                      <Brain className="w-3.5 h-3.5 mr-1.5 text-teal-700" />
                      Puntuaciones Compuestas Registradas Oficialmente
                    </h4>
                    <div className="rounded-xl border border-teal-200 overflow-hidden">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="bg-teal-800 text-white font-bold uppercase text-[10px] tracking-wider">
                          <tr>
                            <th className="px-4 py-2">Índice</th>
                            <th className="px-4 py-2 text-center">Punt. Compuesta Registrada</th>
                            <th className="px-4 py-2 text-center">Percentil</th>
                            <th className="px-4 py-2 text-center">Intervalo de Confianza</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-teal-100">
                          {verifiedItems.map((item, idx) => (
                            <tr key={item.code} className={idx % 2 === 0 ? 'bg-white' : 'bg-teal-50/30'}>
                              <td className="px-4 py-2 font-bold text-teal-900">{item.code}</td>
                              <td className="px-4 py-2 text-center font-extrabold text-sm text-teal-950 bg-teal-100/40">
                                {item.score}
                              </td>
                              <td className="px-4 py-2 text-center font-semibold text-gray-700">{item.percentile}</td>
                              <td className="px-4 py-2 text-center font-medium text-gray-600">{item.ci}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {/* Cryptographic Hash Badge */}
              {evaluation.verificationHash && (
                <div className="bg-gray-50 border border-gray-200 p-3.5 rounded-xl text-[11px] space-y-1">
                  <div className="flex items-center space-x-1.5 text-teal-800 font-bold">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Firma Criptográfica SHA-256 de Integridad:</span>
                  </div>
                  <p className="font-mono text-[10px] text-gray-600 break-all select-all bg-white p-2 rounded border border-gray-200">
                    {evaluation.verificationHash}
                  </p>
                </div>
              )}

              {/* Privacy Notice */}
              <div className="bg-teal-50 border border-teal-200 p-3.5 rounded-xl text-teal-900 text-[11px] flex items-start space-x-2.5">
                <Lock className="w-4 h-4 text-teal-700 mt-0.5 flex-shrink-0" />
                <p className="leading-relaxed">
                  <strong>Protección de Privacidad Médica:</strong> Por estrictas normativas éticas y de protección de datos personales de salud, los nombres reales, números de identificación (cédula) y diagnósticos no se almacenan en servidores públicos. La autenticidad se certifica mediante la coincidencia de las puntuaciones psicométricas y la firma de integridad.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-teal-800/60 bg-teal-950 py-6 text-center text-xs text-teal-400">
        <p>© {new Date().getFullYear()} Plataforma Psicométrica • Validación de Autenticidad Documental</p>
      </footer>
    </div>
  );
};
