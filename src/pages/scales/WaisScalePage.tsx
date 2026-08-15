import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { IndexCompositionTable } from '../../components/tables/IndexCompositionTable';
import { IndexesSum } from '../../components/tables/IndexesSum';
import { TableIndexes } from '../../components/tables/TableIndexes';
import { CompositeScoresChart } from '../../components/charts/CompositeScoresChart';
import { waisTests, waisIndexes } from '../../data/scaleInfo/waisInfo';
import { findScalars, findComposes, getScales, extractCompositeScore } from '../../utils/psychometrics';
import { addEvaluation, getPatientById } from '../../services/firestore';
import { Patient } from '../../types';
import { ArrowLeft, Save, Brain, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import { ModalEditRecordName } from '../../components/modals/ModalEditRecordName';

export const WaisScalePage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const yearsStr = searchParams.get('years') || '20';
  const monthsStr = searchParams.get('months') || '0';
  const daysStr = searchParams.get('days') || '0';
  const evalDate = searchParams.get('evalDate') || new Date().toISOString().split('T')[0];
  const waisType = searchParams.get('type') || 'wais_c';
  const evalNameParam = searchParams.get('name') || `Evaluación WAIS - ${evalDate}`;
  const [evalName, setEvalName] = useState(evalNameParam);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  const yearsNum = parseInt(yearsStr, 10);
  const monthsNum = parseInt(monthsStr, 10);
  const daysNum = parseInt(daysStr, 10);
  const chrAge = yearsNum + monthsNum / 12;

  // Apply WAIS age 70 restriction
  const applicableTests = chrAge >= 70
    ? waisTests.filter(t => !t.restriction)
    : waisTests;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [inputs, setInputs] = useState<Record<string, number | string>>({});
  const [scalarPoints, setScalarPoints] = useState<Record<string, number>>({});
  const [indexesSum, setIndexesSum] = useState<Record<string, number>>({});
  const [composes, setComposes] = useState<Record<string, any>>({});
  const [showRange, setShowRange] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [normativeTable, setNormativeTable] = useState<any>(null);
  const [indexConversionTables, setIndexConversionTables] = useState<any[]>([]);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId).then(setPatient);
    }
  }, [patientId]);

  useEffect(() => {
    const ageObj = { years: yearsNum, months: monthsNum };
    getScales(ageObj, waisType)
      .then(res => {
        setNormativeTable(res.table);
        if (res.indexes && res.indexes.primary) {
          setIndexConversionTables(res.indexes.primary);
        }
      })
      .catch(err => {
        console.error(`Error loading WAIS (${waisType}) table:`, err);
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [yearsNum, monthsNum, waisType]);

  useEffect(() => {
    if (indexConversionTables && indexConversionTables.length > 0 && Object.keys(indexesSum).length > 0 && !error) {
      const computedComposes = findComposes(indexesSum, indexConversionTables);
      setComposes(computedComposes);
    } else if (error) {
      setComposes({});
    }
  }, [indexesSum, indexConversionTables, error]);

  const handleInputChange = (code: string, val: string) => {
    const newInputs = { ...inputs, [code]: val };
    setInputs(newInputs);

    if (normativeTable) {
      const result = findScalars(newInputs, normativeTable, applicableTests, waisIndexes, undefined, undefined, 'wais');
      
      if (result.errors.outOfRange) {
        const testObj = applicableTests.find(t => t.code === result.errors.outOfRange);
        const testName = testObj ? testObj.name : result.errors.outOfRange;
        setError(`La prueba ${testName} se encuentra fuera de rango.`);
        setScalarPoints({});
        setIndexesSum({});
        setComposes({});
        return;
      }

      setError(null);
      setScalarPoints(result.points);
      setIndexesSum(result.sum);
    }
  };

  const parseIntervalLimits = (item: any, confidence: '90' | '95') => {
    if (typeof item !== 'object' || item === null) return { lower: 0, upper: 0 };
    const key = confidence === '90' ? '90%' : '95%';
    const intervalStr = item[key] || item[confidence === '90' ? 'ic90' : 'ic95'];
    if (intervalStr && String(intervalStr).includes('-')) {
      const parts = String(intervalStr).split('-');
      const lower = parseInt(parts[0], 10);
      const upper = parseInt(parts[1], 10);
      return { lower: isNaN(lower) ? 0 : lower, upper: isNaN(upper) ? 0 : upper };
    }
    return { lower: 0, upper: 0 };
  };

  const chartGraphicsData = (() => {
    const validItems = waisIndexes.map(i => {
      const val = extractCompositeScore(composes[i.code], i.code);
      const limits = parseIntervalLimits(composes[i.code], showRange ? '95' : '90');
      return {
        code: i.code,
        val: val > 0 ? val : null,
        upper: limits.upper > 0 ? limits.upper : null,
        lower: limits.lower > 0 ? limits.lower : null
      };
    }).filter(item => item.val !== null);

    return {
      xlabel: validItems.map(i => i.code),
      values: validItems.map(i => i.val as number),
      upperLimits: validItems.map(i => i.upper as number),
      lowerLimits: validItems.map(i => i.lower as number)
    };
  })();

  const handleSave = async () => {
    if (!patientId) return;

    if (error) {
      alert(`No se puede guardar la evaluación: ${error}`);
      return;
    }

    if (Object.keys(scalarPoints).length === 0 || Object.keys(composes).length === 0) {
      alert("Por favor completa los puntajes de las subpruebas antes de guardar.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const newEvalId = await addEvaluation({
        patient: patientId,
        patientId,
        scale: 'wais',
        type: waisType,
        name: evalName,
        date: evalDate,
        testDay: evalDate,
        years: yearsNum,
        months: monthsNum,
        days: daysNum,
        age: { years: yearsNum, months: monthsNum, days: daysNum },
        rawScores: inputs,
        scalarScores: scalarPoints,
        indexesSum: indexesSum,
        indexes: composes,
        data: {
          sum: indexesSum,
          composes: composes
        }
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/patient/${patientId}/evaluation/${newEvalId}/report`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Error guardando evaluación');
    } finally {
      setSaving(false);
    }
  };

  const firstName = patient?.firstName 
  const lastName = patient?.lastName;
  const fullName = `${firstName} ${lastName}`.trim() || 'Paciente';

  const getWaisLabel = () => {
    if (waisType === 'wais_e') return 'WAIS-IV (Española)';
    if (waisType === 'wais_m') return 'WAIS-IV (Mexicana)';
    return 'WAIS-IV (Chilena)';
  };

  const isSaveDisabled = saving || Boolean(error) || Object.keys(scalarPoints).length === 0 || Object.keys(composes).length === 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link to={`/patient/${patientId}`} className="hover:text-indigo-600 flex items-center space-x-1">
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Paciente</span>
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{fullName}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaveDisabled}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Guardando...' : 'Guardar Evaluación'}</span>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm font-semibold">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm font-semibold">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span>Evaluación {getWaisLabel()} guardada exitosamente. Redirigiendo...</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                {getWaisLabel()}
              </span>
              <div className="flex items-center space-x-2 mt-2">
                <h1 className="text-2xl font-bold text-gray-900">
                  {evalName}
                </h1>
                <button
                  type="button"
                  onClick={() => setIsEditNameModalOpen(true)}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors"
                  title="Editar nombre del registro"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-1.5 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-100">
                <Brain className="w-4 h-4 text-indigo-600" />
                <span>Edad: {yearsStr} años, {monthsStr} meses</span>
              </div>
            </div>
          </div>

          <IndexCompositionTable
            tests={applicableTests}
            primaryIndexes={waisIndexes}
            inputs={inputs}
            scalarPoints={scalarPoints}
            onInputChange={handleInputChange}
            normativeTable={normativeTable}
          />
        </div>

        {Object.keys(indexesSum).length > 0 && !error && (
          <div className="space-y-6">
            <IndexesSum
              indexes={waisIndexes}
              indexesSum={indexesSum}
              title="Suma Escalar"
            />

            <TableIndexes
              indexes={waisIndexes}
              composes={composes}
              onRangeChange={setShowRange}
            />

            {Object.keys(composes).length > 0 && (
              <CompositeScoresChart
                dataGraphics={chartGraphicsData}
                range={showRange}
                title="Puntuación Escala Total"
              />
            )}
          </div>
        )}

        <ModalEditRecordName
          isOpen={isEditNameModalOpen}
          onClose={() => setIsEditNameModalOpen(false)}
          currentName={evalName}
          onSave={setEvalName}
        />
      </main>
    </div>
  );
};
