import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { IndexCompositionTable } from '../../components/tables/IndexCompositionTable';
import { IndexesSum } from '../../components/tables/IndexesSum';
import { TableIndexes } from '../../components/tables/TableIndexes';
import { CompositeScoresChart } from '../../components/charts/CompositeScoresChart';
import { wiscTests, wiscPrimaryIndexes, wiscSecondaryIndexes } from '../../data/scaleInfo/wiscInfo';
import { findScalars, findComposes, getScales, extractCompositeScore } from '../../utils/psychometrics';
import { addEvaluation, getPatientById } from '../../services/firestore';
import { Patient } from '../../types';
import { ArrowLeft, Save, Brain, CheckCircle2, AlertCircle, Pencil } from 'lucide-react';
import { ModalEditRecordName } from '../../components/modals/ModalEditRecordName';

export const WiscScalePage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const yearsStr = searchParams.get('years') || '10';
  const monthsStr = searchParams.get('months') || '0';
  const daysStr = searchParams.get('days') || '0';
  const evalDate = searchParams.get('evalDate') || new Date().toISOString().split('T')[0];
  const evalNameParam = searchParams.get('name') || `Evaluación WISC - ${evalDate}`;
  const [evalName, setEvalName] = useState(evalNameParam);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  const yearsNum = parseInt(yearsStr, 10);
  const monthsNum = parseInt(monthsStr, 10);
  const daysNum = parseInt(daysStr, 10);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [inputs, setInputs] = useState<Record<string, number | string>>({});
  const [scalarPoints, setScalarPoints] = useState<Record<string, number>>({});
  
  const [primaryIndexesSum, setPrimaryIndexesSum] = useState<Record<string, number>>({});
  const [primaryComposes, setPrimaryComposes] = useState<Record<string, any>>({});
  
  const [secondaryIndexesSum, setSecondaryIndexesSum] = useState<Record<string, number>>({});
  const [secondaryComposes, setSecondaryComposes] = useState<Record<string, any>>({});

  const [showRange, setShowRange] = useState(false);
  const [showRangeSec, setShowRangeSec] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [normativeTable, setNormativeTable] = useState<any>(null);
  const [primaryIndexTables, setPrimaryIndexTables] = useState<any[]>([]);
  const [secondaryIndexTables, setSecondaryIndexTables] = useState<any[]>([]);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId).then(setPatient);
    }
  }, [patientId]);

  useEffect(() => {
    const ageObj = { years: parseInt(yearsStr, 10), months: parseInt(monthsStr, 10) };
    getScales(ageObj, 'wisc')
      .then(res => {
        setNormativeTable(res.table);
        if (res.indexes?.primary) setPrimaryIndexTables(res.indexes.primary);
        if (res.indexes?.secondary) setSecondaryIndexTables(res.indexes.secondary);
      })
      .catch(err => {
        console.error('Error loading WISC table:', err);
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [yearsStr, monthsStr]);

  const computeAll = (currentInputs: Record<string, number | string>) => {
    if (!normativeTable || !normativeTable.data) return;

    const missingKeys = Object.keys(currentInputs).filter(k => {
      const val = currentInputs[k];
      return val !== '' && val !== undefined && val !== null && !normativeTable.data[k];
    });

    if (missingKeys.length > 0) {
      setError(`Advertencia: Las siguientes pruebas no existen en la base de datos de Firebase para el WISC: ${missingKeys.join(', ')}. Verifica las claves en Firebase.`);
    } else {
      setError(null);
    }

    // Primary
    const primaryRes = findScalars(currentInputs, normativeTable, wiscTests, wiscPrimaryIndexes, 'primary', undefined, 'wisc');
    
    if (primaryRes.errors.outOfRange) {
      const testObj = wiscTests.find(t => t.code === primaryRes.errors.outOfRange);
      const testName = testObj ? testObj.name : primaryRes.errors.outOfRange;
      setError(`El valor ingresado para la prueba ${testName} está fuera del rango permitido según la tabla. Revísalo.`);
      return;
    }
    
    setScalarPoints(primaryRes.points);
    setPrimaryIndexesSum(primaryRes.sum);

    if (primaryIndexTables && primaryIndexTables.length > 0) {
      const computedPrimary = findComposes(primaryRes.sum, primaryIndexTables);
      setPrimaryComposes(computedPrimary);
    }

    // Secondary
    const secondaryRes = findScalars(currentInputs, normativeTable, wiscTests, wiscSecondaryIndexes, 'secondary', undefined, 'wisc');
    setSecondaryIndexesSum(secondaryRes.sum);

    if (secondaryIndexTables && secondaryIndexTables.length > 0) {
      const computedSecondary = findComposes(secondaryRes.sum, secondaryIndexTables);
      setSecondaryComposes(computedSecondary);
    }
  };

  useEffect(() => {
    if (normativeTable && Object.keys(inputs).length > 0) {
      computeAll(inputs);
    }
  }, [normativeTable, primaryIndexTables, secondaryIndexTables]);

  const handleInputChange = (code: string, val: string) => {
    const newInputs = { ...inputs, [code]: val };
    setInputs(newInputs);
    computeAll(newInputs);
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

  const primaryChartData = (() => {
    const validItems = wiscPrimaryIndexes.map(i => {
      const val = extractCompositeScore(primaryComposes[i.code], i.code);
      const limits = parseIntervalLimits(primaryComposes[i.code], showRange ? '95' : '90');
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

  const secondaryChartData = (() => {
    const validItems = wiscSecondaryIndexes.map(i => {
      const val = extractCompositeScore(secondaryComposes[i.code], i.code);
      const limits = parseIntervalLimits(secondaryComposes[i.code], showRangeSec ? '95' : '90');
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

    setSaving(true);
    setError(null);
    try {
      const newEvalId = await addEvaluation({
        patient: patientId,
        patientId,
        scale: 'wisc',
        type: 'wisc',
        name: evalName,
        date: evalDate,
        testDay: evalDate,
        years: yearsNum,
        months: monthsNum,
        days: daysNum,
        age: { years: yearsNum, months: monthsNum, days: daysNum },
        scores: inputs,
        rawScores: inputs,
        scalarScores: scalarPoints,
        indexesSum: { ...primaryIndexesSum, ...secondaryIndexesSum },
        indexes: { ...primaryComposes, ...secondaryComposes },
        data: {
          primarySum: primaryIndexesSum,
          primaryComposes: primaryComposes,
          secondarySum: secondaryIndexesSum,
          secondaryComposes: secondaryComposes
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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <Link
            to={`/patient/${patientId}`}
            className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver al paciente
          </Link>

          <button
            onClick={handleSave}
            disabled={saving || !!error}
            className={`inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-xs transition-all ${
              saving || !!error
                ? 'bg-indigo-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-md'
            }`}
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Guardando...' : 'Guardar Evaluación'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-sm font-medium text-green-800">Evaluación guardada exitosamente</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                WISC-V
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
            tests={wiscTests}
            primaryIndexes={wiscPrimaryIndexes}
            secondaryIndexes={wiscSecondaryIndexes}
            inputs={inputs}
            scalarPoints={scalarPoints}
            onInputChange={handleInputChange}
            normativeTable={normativeTable}
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mt-8">
          {Object.keys(primaryIndexesSum).length > 0 && (
            <div className="space-y-6">
              <IndexesSum
                indexes={wiscPrimaryIndexes}
                indexesSum={primaryIndexesSum}
                title="Análisis Primario - Suma Escalar"
              />
              <TableIndexes
                indexes={wiscPrimaryIndexes}
                composes={primaryComposes}
                onRangeChange={setShowRange}
              />
              {Object.keys(primaryComposes).length > 0 && (
                <CompositeScoresChart
                  dataGraphics={primaryChartData}
                  range={showRange}
                  title="Perfil de Índices Compuestos"
                />
              )}
            </div>
          )}

          {Object.keys(secondaryIndexesSum).length > 0 && (
            <div className="space-y-6">
              <IndexesSum
                indexes={wiscSecondaryIndexes}
                indexesSum={secondaryIndexesSum}
                title="Análisis Secundario - Suma Escalar"
              />
              <TableIndexes
                indexes={wiscSecondaryIndexes}
                composes={secondaryComposes}
                onRangeChange={setShowRangeSec}
              />
              {Object.keys(secondaryComposes).length > 0 && (
                <CompositeScoresChart
                  dataGraphics={secondaryChartData}
                  range={showRangeSec}
                  title="Perfil de Índices Compuestos"
                />
              )}
            </div>
          )}
        </div>

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
