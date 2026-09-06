import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPatientById, getEvaluationsByPatient, deleteEvaluation } from '../services/firestore';
import type { Patient, Evaluation } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { ModalAgeCalculator } from '../components/modals/ModalAgeCalculator';
import { ModalEvaluationDetail } from '../components/modals/ModalEvaluationDetail';
import { calculateAge } from '../utils/psychometrics';
import { formatDate, orderByDate } from '../utils/formatDate';
import { ArrowLeft, Plus, Calendar, Trash2, FileText, MapPin, CreditCard } from 'lucide-react';

export const PatientPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<any | null>(null);
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAgeModalOpen, setIsAgeModalOpen] = useState<boolean>(false);
  const [selectedEval, setSelectedEval] = useState<any | null>(null);

  const fetchPatientData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const patientData = await getPatientById(id);
      setPatient(patientData);

      const evalsData = await getEvaluationsByPatient(id);
      setEvaluations(orderByDate(evalsData));
    } catch (err) {
      console.error('Error loading patient details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientData();
  }, [id]);

  const handleDeleteEval = async (evalId: string) => {
    if (!window.confirm('¿Deseas eliminar esta evaluación?')) return;
    try {
      await deleteEvaluation(evalId);
      if (selectedEval?.id === evalId) setSelectedEval(null);
      await fetchPatientData();
    } catch (err) {
      console.error('Error deleting evaluation:', err);
    }
  };

  const getEvalScale = (ev: any): string => {
    if (!ev) return 'EVALUACIÓN';
    const typeKey = String(ev.type || ev.scale || '').toLowerCase();
    if (typeKey === 'wais_c') return 'WAIS-IV (Chilena)';
    if (typeKey === 'wais_e') return 'WAIS-IV (Española)';
    if (typeKey === 'wais_m') return 'WAIS-IV (Mexicana)';
    if (typeKey.startsWith('wais')) return 'WAIS-IV';
    if (typeKey === 'wisc') return 'WISC-V';
    if (typeKey === 'wppsi') return 'WPPSI-IV';
    if (typeKey === 'wnv') return 'WNV';

    const s = ev.scale || ev.type || ev.name || 'EVALUACIÓN';
    return String(s).toUpperCase();
  };

  const extractIndexes = (ev: any): Record<string, any> => {
    if (!ev) return {};
    if (ev.indexes && Object.keys(ev.indexes).length > 0) return ev.indexes;

    const data = ev.data || {};
    let res: Record<string, any> = {};

    if (data.primaryComposes && Object.keys(data.primaryComposes).length > 0) {
      res = { ...res, ...data.primaryComposes };
    } else if (data.composes && Object.keys(data.composes).length > 0) {
      res = { ...res, ...data.composes };
    }

    if (data.secondaryComposes && Object.keys(data.secondaryComposes).length > 0) {
      res = { ...res, ...data.secondaryComposes };
    }

    if (Object.keys(res).length === 0) {
      if (data.primarySum) res = { ...res, ...data.primarySum };
      if (data.sum) res = { ...res, ...data.sum };
      if (data.secondarySum) res = { ...res, ...data.secondarySum };
    }

    return res;
  };

  const getDisplayScore = (valObj: any, idxKey: string): string => {
    if (valObj === undefined || valObj === null) return '-';
    if (typeof valObj === 'number' || typeof valObj === 'string') return String(valObj);

    if (typeof valObj === 'object') {
      if (valObj[idxKey] !== undefined && valObj[idxKey] !== null) return String(valObj[idxKey]);
      if (valObj.composite !== undefined && valObj.composite !== null) return String(valObj.composite);
      if (valObj.score !== undefined && valObj.score !== null) return String(valObj.score);
      if (valObj.value !== undefined && valObj.value !== null) return String(valObj.value);

      for (const k of Object.keys(valObj)) {
        if (k !== 'Percentil' && k !== 'PERCENTIL' && k !== 'percentil' && k !== 'percentile' && k !== '90%' && k !== '95%' && k !== 'ic90' && k !== 'ic95') {
          const itemVal = valObj[k];
          if (typeof itemVal === 'number' || (typeof itemVal === 'string' && !isNaN(Number(itemVal)))) {
            return String(itemVal);
          }
        }
      }
    }

    return '-';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-12 text-center">
          <h2 className="text-xl font-bold text-gray-800">Paciente no encontrado</h2>
          <Link to="/home" className="text-teal-600 mt-4 inline-block hover:underline">
            Volver a la lista de pacientes
          </Link>
        </div>
      </div>
    );
  }

  const firstName = patient.name || patient.firstName || '';
  const lastName = patient.lastname || patient.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim() || 'Paciente sin nombre';
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase() || 'P';
  const docNum = patient.document || patient.id || patient.cedula || 'N/A';
  const birthdate = patient.birthday || patient.birthdate || patient.fechaNacimiento || patient.fecha_nacimiento || patient.birthDate || '';
  const age = birthdate ? calculateAge(birthdate) : (patient.age ? { years: patient.age, months: 0, days: 0 } : null);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/home" className="hover:text-teal-600 flex items-center space-x-1">
            <ArrowLeft className="w-4 h-4" />
            <span>Pacientes</span>
          </Link>
          <span>/</span>
          <span className="text-gray-900 font-medium">{fullName}</span>
        </div>

        {/* Patient Header Card */}
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 rounded-2xl bg-teal-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-teal-100">
                {initials}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {fullName}
                </h1>
                <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-600">
                  <span className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                    <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                    <span>Doc: {docNum}</span>
                  </span>
                  {birthdate ? (
                    <span className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        Nacimiento: {formatDate(birthdate)} {age ? `(${age.years} años, ${age.months}m)` : ''}
                      </span>
                    </span>
                  ) : age ? (
                    <span className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                      <Calendar className="w-3.5 h-3.5 text-gray-400" />
                      <span>Edad: {age.years} años</span>
                    </span>
                  ) : null}
                  {patient.location && (
                    <span className="flex items-center space-x-1.5 bg-gray-50 px-3 py-1 rounded-lg border border-gray-100">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span>{patient.location}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsAgeModalOpen(true)}
              className="inline-flex items-center justify-center space-x-2 px-6 py-3.5 rounded-2xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white font-semibold text-sm transition shadow-lg shadow-teal-200"
            >
              <Plus className="w-5 h-5" />
              <span>Aplicar Nueva Evaluación</span>
            </button>
          </div>
        </div>

        {/* Evaluations History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Historial de Evaluaciones ({evaluations.length})</h2>
          </div>

          {evaluations.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-800">Sin evaluaciones aplicadas</h3>
              <p className="text-xs text-gray-500 mt-1">
                Haz clic en "Aplicar Nueva Evaluación" para registrar la primera escala de este paciente.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {evaluations.map((ev: any) => {
                const scaleName = getEvalScale(ev);
                const dateStr = ev.date || ev.testDay || '';
                const idxMap = extractIndexes(ev);
                const idxKeys = Object.keys(idxMap);

                return (
                  <div
                    key={ev.id}
                    className="bg-white rounded-2xl border border-gray-100 p-5 shadow-xs hover:border-teal-200 transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-teal-50 text-teal-700 border border-teal-100">
                            {scaleName}
                          </span>
                          <h4 className="font-semibold text-gray-800 mt-2 text-base">
                            {ev.name || `Evaluación ${scaleName}`}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {dateStr ? formatDate(dateStr) : 'Fecha N/A'}
                          </p>
                        </div>

                        <button
                          onClick={() => ev.id && handleDeleteEval(ev.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                          title="Eliminar evaluación"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {idxKeys.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-3 gap-2">
                          {idxKeys.slice(0, 6).map(idxKey => {
                            const valObj = idxMap[idxKey];
                            const displayVal = getDisplayScore(valObj, idxKey);
                            return (
                              <div key={idxKey} className="bg-teal-50/50 border border-teal-100/60 p-2 rounded-xl text-center">
                                <div className="text-[10px] font-extrabold text-teal-500 uppercase tracking-wider">{idxKey}</div>
                                <div className="text-base font-extrabold text-teal-900 mt-0.5">
                                  {displayVal}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                      {ev.id ? (
                        <Link
                          to={`/patient/${id}/evaluation/${ev.id}/report`}
                          className="text-xs font-bold text-teal-700 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl border border-teal-200 transition flex items-center space-x-1"
                        >
                          <FileText className="w-3.5 h-3.5 mr-1" />
                          <span>Informe PDF</span>
                        </Link>
                      ) : <div />}

                      <button
                        onClick={() => setSelectedEval(ev)}
                        className="text-xs font-bold text-teal-600 hover:text-teal-800 transition flex items-center space-x-1"
                      >
                        <span>Ver Detalle</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Evaluation Detail */}
        <ModalEvaluationDetail
          isOpen={!!selectedEval}
          onClose={() => setSelectedEval(null)}
          evaluation={selectedEval}
        />

        <ModalAgeCalculator
          isOpen={isAgeModalOpen}
          onClose={() => setIsAgeModalOpen(false)}
          patientId={patient.id || id || ''}
          birthdate={birthdate}
        />
      </main>
    </div>
  );
};
