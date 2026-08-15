import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '../../components/layout/Navbar';
import { IndexCompositionTable } from '../../components/tables/IndexCompositionTable';
import { IndexesSum } from '../../components/tables/IndexesSum';
import { TableIndexes } from '../../components/tables/TableIndexes';
import { CompositeScoresChart } from '../../components/charts/CompositeScoresChart';
import { wppsiTests, wppsiPrimaryIndexes, wppsiSecondaryIndexes } from '../../data/scaleInfo/wppsiInfo';
import { findScalars, findComposes, getScales, extractCompositeScore } from '../../utils/psychometrics';
import { addEvaluation, getPatientById } from '../../services/firestore';
import { Patient } from '../../types';
import { ArrowLeft, Save, Brain, CheckCircle2, AlertCircle, Calculator, Pencil } from 'lucide-react';
import { ModalEditRecordName } from '../../components/modals/ModalEditRecordName';

export const WppsiScalePage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const yearsStr = searchParams.get('years') || '4';
  const monthsStr = searchParams.get('months') || '0';
  const daysStr = searchParams.get('days') || '0';
  const evalDate = searchParams.get('evalDate') || new Date().toISOString().split('T')[0];
  const evalNameParam = searchParams.get('name') || `Evaluación WPPSI - ${evalDate}`;
  const [evalName, setEvalName] = useState(evalNameParam);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  const yearsNum = parseInt(yearsStr, 10);
  const monthsNum = parseInt(monthsStr, 10);
  const daysNum = parseInt(daysStr, 10);
  const chrAge = yearsNum + monthsNum / 12;

  // Age group 1: 2:6 to 3:11 (< 4 years old) -> 7 subtests
  // Age group 2: 4:0 to 7:7 (>= 4 years old) -> 15 subtests
  const isEarlyAge = chrAge < 4;
  const earlyTestOrder = ['D', 'C', 'R', 'I', 'RO', 'L', 'N'];
  const lateTestOrder = ['C', 'I', 'M', 'BA', 'R', 'S', 'CON', 'CA', 'L', 'RO', 'V', 'CF', 'CO', 'D', 'N'];

  const orderList = isEarlyAge ? earlyTestOrder : lateTestOrder;
  const applicableTests = orderList
    .map(code => wppsiTests.find(t => t.code === code))
    .filter((t): t is typeof wppsiTests[0] => Boolean(t));

  const applicablePrimaryIndexes = isEarlyAge
    ? wppsiPrimaryIndexes.filter(i => !i.restriction)
    : wppsiPrimaryIndexes;

  const applicableSecondaryIndexes = isEarlyAge
    ? wppsiSecondaryIndexes.filter(i => !i.restriction)
    : wppsiSecondaryIndexes;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [inputs, setInputs] = useState<Record<string, number | string>>({});
  const [scalarPoints, setScalarPoints] = useState<Record<string, number>>({});

  const [primaryIndexesSum, setPrimaryIndexesSum] = useState<Record<string, number>>({});
  const [secondaryIndexesSum, setSecondaryIndexesSum] = useState<Record<string, number>>({});

  const [primaryComposes, setPrimaryComposes] = useState<Record<string, any>>({});
  const [secondaryComposes, setSecondaryComposes] = useState<Record<string, any>>({});

  const [primaryIndexTables, setPrimaryIndexTables] = useState<any[]>([]);
  const [secondaryIndexTables, setSecondaryIndexTables] = useState<any[]>([]);

  const [showRange, setShowRange] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const [normativeTable, setNormativeTable] = useState<any>(null);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId).then(setPatient);
    }
  }, [patientId]);

  useEffect(() => {
    const ageObj = { years: yearsNum, months: monthsNum };
    console.log('[WPPSI getScales request]', ageObj);
    getScales(ageObj, 'wppsi')
      .then(res => {
        console.log('[WPPSI getScales response]', res);
        setNormativeTable(res.table);
        if (res.indexes?.primary) {
          console.log('[WPPSI primaryIndexTables set]', res.indexes.primary);
          setPrimaryIndexTables(res.indexes.primary);
        } else {
          console.warn('[WPPSI primaryIndexTables MISSING in res.indexes]', res.indexes);
        }
        if (res.indexes?.secondary) {
          console.log('[WPPSI secondaryIndexTables set]', res.indexes.secondary);
          setSecondaryIndexTables(res.indexes.secondary);
        } else {
          console.warn('[WPPSI secondaryIndexTables MISSING in res.indexes]', res.indexes);
        }
      })
      .catch(err => {
        console.error('Error loading WPPSI tables:', err);
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [yearsNum, monthsNum]);

  const computeAll = (currentInputs: Record<string, number | string>) => {
    console.log('[WPPSI computeAll CALLED]', {
      currentInputs,
      normativeTable: Boolean(normativeTable),
      primaryIndexTablesLength: primaryIndexTables?.length,
      secondaryIndexTablesLength: secondaryIndexTables?.length,
      isEarlyAge
    });

    if (!normativeTable) {
      console.warn('[WPPSI computeAll ABORTED] normativeTable is null/undefined');
      return;
    }

    // Primary calculation
    const primaryRes = findScalars(currentInputs, normativeTable, applicableTests, applicablePrimaryIndexes, 'primary', isEarlyAge, 'wppsi');
    console.log('[WPPSI primaryRes]:', primaryRes);
    setScalarPoints(primaryRes.points);
    setPrimaryIndexesSum(primaryRes.sum);

    if (primaryIndexTables && primaryIndexTables.length > 0) {
      const computedPrimary = findComposes(primaryRes.sum, primaryIndexTables, isEarlyAge);
      console.log('[WPPSI computedPrimary]:', computedPrimary);
      setPrimaryComposes(computedPrimary);
    } else {
      console.warn('[WPPSI primaryIndexTables empty, skipping findComposes]');
    }

    // Secondary calculation
    const secondaryRes = findScalars(currentInputs, normativeTable, applicableTests, applicableSecondaryIndexes, 'secondary', isEarlyAge, 'wppsi');
    console.log('[WPPSI secondaryRes]:', secondaryRes);
    setSecondaryIndexesSum(secondaryRes.sum);

    if (secondaryIndexTables && secondaryIndexTables.length > 0) {
      const computedSecondary = findComposes(secondaryRes.sum, secondaryIndexTables, isEarlyAge);
      console.log('[WPPSI computedSecondary]:', computedSecondary);
      setSecondaryComposes(computedSecondary);
    } else {
      console.warn('[WPPSI secondaryIndexTables empty, skipping findComposes]');
    }
  };

  useEffect(() => {
    console.log('[WPPSI useEffect auto-compute check]', {
      hasNormative: Boolean(normativeTable),
      inputsLength: Object.keys(inputs).length,
      primaryTablesLength: primaryIndexTables?.length
    });
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
    const validItems = applicablePrimaryIndexes.map(i => {
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
    const validItems = applicableSecondaryIndexes.map(i => {
      const val = extractCompositeScore(secondaryComposes[i.code], i.code);
      const limits = parseIntervalLimits(secondaryComposes[i.code], showRange ? '95' : '90');
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
        scale: 'wppsi',
        type: 'wppsi',
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
        indexesSum: primaryIndexesSum,
        indexes: primaryComposes,
        secondaryIndexes: secondaryComposes,
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

  const firstName =patient?.firstName;
  const lastName = patient?.lastName;
  const fullName = `${firstName} ${lastName}`.trim() || 'Paciente';

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

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => computeAll(inputs)}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-sm transition border border-indigo-200 shadow-xs"
            >
              <Calculator className="w-4 h-4 text-indigo-600" />
              <span>Calcular Índices</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving || Object.keys(scalarPoints).length === 0}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Guardando...' : 'Guardar Evaluación'}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-2xl flex items-center space-x-2 text-sm">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            <span>Evaluación WPPSI guardada exitosamente. Redirigiendo...</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                WPPSI-IV ({isEarlyAge ? '2:6 - 3:11 años' : '4:0 - 7:7 años'})
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
            primaryIndexes={applicablePrimaryIndexes}
            secondaryIndexes={applicableSecondaryIndexes}
            inputs={inputs}
            scalarPoints={scalarPoints}
            onInputChange={handleInputChange}
            isEarlyAge={isEarlyAge}
            normativeTable={normativeTable}
          />
        </div>

        {/* 2-Column Grid Layout: Primary Analysis (Left) vs Secondary Analysis (Right) */}
        {(Object.keys(primaryIndexesSum).length > 0 || Object.keys(secondaryIndexesSum).length > 0) && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Primary Analysis Column (Left) */}
            {Object.keys(primaryIndexesSum).length > 0 && (
              <div className="space-y-6">
                <IndexesSum
                  indexes={applicablePrimaryIndexes}
                  indexesSum={primaryIndexesSum}
                  title="Análisis Primario - Suma Escalar"
                />

                <TableIndexes
                  indexes={applicablePrimaryIndexes}
                  composes={primaryComposes}
                  onRangeChange={setShowRange}
                />

                {Object.keys(primaryComposes).length > 0 && (
                  <CompositeScoresChart
                    dataGraphics={primaryChartData}
                    range={showRange}
                    title="Análisis Primario - Puntuaciones compuestas"
                  />
                )}
              </div>
            )}

            {/* Secondary Analysis Column (Right) */}
            {Object.keys(secondaryIndexesSum).length > 0 && (
              <div className="space-y-6">
                <IndexesSum
                  indexes={applicableSecondaryIndexes}
                  indexesSum={secondaryIndexesSum}
                  title="Análisis Secundario - Suma Escalar"
                />

                <TableIndexes
                  indexes={applicableSecondaryIndexes}
                  composes={secondaryComposes}
                  onRangeChange={setShowRange}
                />

                {Object.keys(secondaryComposes).length > 0 && (
                  <CompositeScoresChart
                    dataGraphics={secondaryChartData}
                    range={showRange}
                    title="Análisis Secundario - Puntuaciones compuestas"
                  />
                )}
              </div>
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

