import React, { useEffect, useState } from "react";
import {
  useParams,
  useSearchParams,
  useNavigate,
  Link,
} from "react-router-dom";
import { Navbar } from "../../components/layout/Navbar";
import { IndexCompositionTable } from "../../components/tables/IndexCompositionTable";
import { TableIndexes } from "../../components/tables/TableIndexes";
import { CompositeScoresChart } from "../../components/charts/CompositeScoresChart";
import { wnvTests, wnvIndexes } from "../../data/scaleInfo/wnvInfo";
import {
  findScalars,
  getScales,
  findComposes,
  extractCompositeScore,
} from "../../utils/psychometrics";
import { addEvaluation, getPatientById } from "../../services/firestore";
import { Patient } from "../../types";
import {
  ArrowLeft,
  Save,
  Brain,
  CheckCircle2,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { ModalEditRecordName } from "../../components/modals/ModalEditRecordName";

export const WnvScalePage: React.FC = () => {
  const { id: patientId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const yearsStr = searchParams.get("years") || "12";
  const monthsStr = searchParams.get("months") || "0";
  const daysStr = searchParams.get("days") || "0";
  const evalDate =
    searchParams.get("evalDate") || new Date().toISOString().split("T")[0];
  const evalNameParam =
    searchParams.get("name") || `Evaluación WNV - ${evalDate}`;
  const [evalName, setEvalName] = useState(evalNameParam);
  const [isEditNameModalOpen, setIsEditNameModalOpen] = useState(false);

  const yearsNum = parseInt(yearsStr, 10);
  const monthsNum = parseInt(monthsStr, 10);
  const daysNum = parseInt(daysStr, 10);

  const [patient, setPatient] = useState<Patient | null>(null);
  const [inputs, setInputs] = useState<Record<string, number | string>>({});
  const [scalarPoints, setScalarPoints] = useState<Record<string, number>>({});
  const [indexesSum, setIndexesSum] = useState<Record<string, number>>({});
  const [composes, setComposes] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showRange, setShowRange] = useState(false);

  const isEarlyAge = yearsNum < 8;
  const applicableTests = wnvTests.filter((t) => {
    const mains = isEarlyAge
      ? wnvIndexes[0].earlyMains
      : wnvIndexes[0].lastMains;
    return mains?.includes(t.code);
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [normativeTable, setNormativeTable] = useState<any>(null);
  const [primaryIndexTables, setPrimaryIndexTables] = useState<any[]>([]);

  useEffect(() => {
    if (patientId) {
      getPatientById(patientId).then(setPatient);
    }
  }, [patientId]);

  useEffect(() => {
    const ageObj = {
      years: parseInt(yearsStr, 10),
      months: parseInt(monthsStr, 10),
    };
    getScales(ageObj, "wnv")
      .then((res) => {
        setNormativeTable(res.table);
        if (res.indexes?.primary) {
          setPrimaryIndexTables(res.indexes.primary);
        }
      })
      .catch((err) => {
        console.error("Error loading WNV table:", err);
        setError(err instanceof Error ? err.message : String(err));
      });
  }, [yearsStr, monthsStr]);

  useEffect(() => {
    if (Object.keys(indexesSum).length > 0 && primaryIndexTables.length > 0) {
      const comp = findComposes(indexesSum, primaryIndexTables, isEarlyAge);
      setComposes(comp);
    }
  }, [indexesSum, primaryIndexTables, isEarlyAge]);

  const handleInputChange = (code: string, val: string) => {
    const newInputs = { ...inputs, [code]: val };
    setInputs(newInputs);

    if (normativeTable) {
      const result = findScalars(
        newInputs,
        normativeTable,
        applicableTests,
        wnvIndexes,
        undefined,
        isEarlyAge,
        'wnv'
      );
      setScalarPoints(result.points);
      setIndexesSum(result.sum);
    }
  };

  const parseIntervalLimits = (item: any, confidence: "90" | "95") => {
    if (typeof item !== "object" || item === null)
      return { lower: 0, upper: 0 };
    const key = confidence === "90" ? "90%" : "95%";
    const intervalStr =
      item[key] || item[confidence === "90" ? "ic90" : "ic95"];
    if (intervalStr && String(intervalStr).includes("-")) {
      const parts = String(intervalStr).split("-");
      const lower = parseInt(parts[0], 10);
      const upper = parseInt(parts[1], 10);
      return {
        lower: isNaN(lower) ? 0 : lower,
        upper: isNaN(upper) ? 0 : upper,
      };
    }
    return { lower: 0, upper: 0 };
  };

  const chartGraphicsData = (() => {
    const validItems = wnvIndexes
      .map((i) => {
        const val = extractCompositeScore(composes[i.code], i.code);
        const limits = parseIntervalLimits(
          composes[i.code],
          showRange ? "95" : "90",
        );
        return {
          code: i.code,
          val: val > 0 ? val : null,
          upper: limits.upper > 0 ? limits.upper : null,
          lower: limits.lower > 0 ? limits.lower : null,
        };
      })
      .filter((item) => item.val !== null);

    return {
      xlabel: validItems.map((i) => i.code),
      values: validItems.map((i) => i.val as number),
      upperLimits: validItems.map((i) => i.upper as number),
      lowerLimits: validItems.map((i) => i.lower as number),
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
        scale: "wnv",
        type: "wnv",
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
        indexesSum: indexesSum,
        indexes: composes,
        data: {
          sum: indexesSum,
          composes: composes,
        },
      });
      setSuccess(true);
      setTimeout(() => {
        navigate(`/patient/${patientId}/evaluation/${newEvalId}/report`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || "Error guardando evaluación");
    } finally {
      setSaving(false);
    }
  };

  const firstName = patient?.firstName;
  const lastName = patient?.lastName;
  const fullName = `${firstName} ${lastName}`.trim() || "Paciente";

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Link
              to={`/patient/${patientId}`}
              className="hover:text-indigo-600 flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Paciente</span>
            </Link>
            <span>/</span>
            <span className="text-gray-900 font-medium">{fullName}</span>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || Object.keys(scalarPoints).length === 0}
            className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:opacity-50 text-white font-semibold text-sm transition shadow-sm"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Guardando..." : "Guardar Evaluación"}</span>
          </button>
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
            <span>Evaluación WNV guardada exitosamente. Redirigiendo...</span>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                WNV
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
                <span>
                  Edad: {yearsStr} años, {monthsStr} meses
                </span>
              </div>
            </div>
          </div>

          <div className="max-w-2xl mx-auto">
            <IndexCompositionTable
              tests={applicableTests}
              primaryIndexes={wnvIndexes}
              inputs={inputs}
              scalarPoints={scalarPoints}
              onInputChange={handleInputChange}
              normativeTable={normativeTable}
              isEarlyAge={isEarlyAge}
            />
          </div>
        </div>

        <div className="max-w-2xl mx-auto">
          {Object.keys(indexesSum).length > 0 && (
            <div className="space-y-6">
              <TableIndexes
                indexes={wnvIndexes}
                composes={composes}
                showWNV={true}
                indexesSum={indexesSum}
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
