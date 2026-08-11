import React, { useState, useEffect } from 'react';
import { X, Calendar, ArrowRight, Calculator, FileText, Loader2 } from 'lucide-react';
import { calculateAge, getScales } from '../../utils/psychometrics';
import { useNavigate } from 'react-router-dom';

interface ModalAgeCalculatorProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  birthdate: string;
}

type ScaleOption = 'wais_c' | 'wais_e' | 'wais_m' | 'wisc' | 'wnv' | 'wppsi';

export const ModalAgeCalculator: React.FC<ModalAgeCalculatorProps> = ({
  isOpen,
  onClose,
  patientId,
  birthdate: initialBirthdate
}) => {
  const navigate = useNavigate();
  const todayStr = new Date().toISOString().split('T')[0];

  const [evalName, setEvalName] = useState<string>('Registro 1');
  const [scaleType, setScaleType] = useState<ScaleOption>('wais_c');
  const [birthdate, setBirthdate] = useState<string>(initialBirthdate || '');
  const [evalDate, setEvalDate] = useState<string>(todayStr);
  const [years, setYears] = useState<number>(0);
  const [months, setMonths] = useState<number>(0);
  const [days, setDays] = useState<number>(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [validatingScale, setValidatingScale] = useState<boolean>(false);

  useEffect(() => {
    setBirthdate(initialBirthdate || '');
  }, [initialBirthdate]);

  // Recalculate age whenever birthdate or evalDate changes
  useEffect(() => {
    if (birthdate) {
      const calculated = calculateAge(birthdate, evalDate);
      setYears(calculated.years);
      setMonths(calculated.months);
      setDays(calculated.days);
    } else {
      setYears(0);
      setMonths(0);
      setDays(0);
    }
  }, [birthdate, evalDate]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!evalName.trim()) newErrors.evalName = 'El nombre de la evaluación es requerido';
    if (!evalDate) newErrors.evalDate = 'La fecha de administración es requerida';
    if (!birthdate) {
      newErrors.birthdate = 'La fecha de nacimiento es requerida';
    } else if (birthdate > todayStr) {
      newErrors.birthdate = 'La fecha de nacimiento no puede ser posterior a hoy';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleStartEvaluation = async () => {
    if (!validate()) return;

    const finalYears = isNaN(years) ? 0 : years;
    const finalMonths = isNaN(months) ? 0 : months;
    const finalDays = isNaN(days) ? 0 : days;
    const nameParam = encodeURIComponent(evalName.trim() || 'Registro 1');

    setValidatingScale(true);
    setErrors(prev => ({ ...prev, scale: '' }));

    try {
      await getScales({ years: finalYears, months: finalMonths }, scaleType);

      let routeScale = 'wais';
      if (scaleType === 'wisc') routeScale = 'wisc';
      else if (scaleType === 'wppsi') routeScale = 'wppsi';
      else if (scaleType === 'wnv') routeScale = 'wnv';

      navigate(
        `/patient/${patientId}/${routeScale}?type=${scaleType}&name=${nameParam}&years=${finalYears}&months=${finalMonths}&days=${finalDays}&evalDate=${evalDate}`
      );
      onClose();
    } catch (err: any) {
      const message = err instanceof Error ? err.message : String(err);
      setErrors(prev => ({
        ...prev,
        scale: message || 'No se encontró la prueba para la edad especificada'
      }));
    } finally {
      setValidatingScale(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-xs p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-gray-100">
        
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2.5 text-gray-800 font-semibold text-lg">
            <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
              <Calculator className="w-5 h-5" />
            </div>
            <span className="font-bold text-gray-900">Crear nueva evaluación</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <div className="p-6 space-y-5">
          
          {/* Row 1: Nombre de la evaluación + Tipo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-gray-400" />
                <span>Nombre de la evaluación</span>
              </label>
              <input
                type="text"
                value={evalName}
                onChange={e => { setEvalName(e.target.value); setErrors(prev => ({ ...prev, evalName: '', scale: '' })); }}
                placeholder="Registro 1"
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50/30 font-medium ${
                  errors.evalName ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                }`}
              />
              {errors.evalName && <p className="mt-1 text-xs text-red-500">{errors.evalName}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Tipo
              </label>
              <select
                value={scaleType}
                onChange={e => { setScaleType(e.target.value as ScaleOption); setErrors(prev => ({ ...prev, scale: '' })); }}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white font-semibold text-gray-800"
              >
                <option value="wais_c">WAIS (Chilena)</option>
                <option value="wais_e">WAIS (Española)</option>
                <option value="wais_m">WAIS (Mexicana)</option>
                <option value="wisc">WISC</option>
                <option value="wnv">WNV</option>
                <option value="wppsi">WPPSI</option>
              </select>
            </div>
          </div>

          {/* Row 2: Fecha de administración de la prueba + Fecha Nacimiento */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Fecha de administración</span>
              </label>
              <input
                type="date"
                value={evalDate}
                onChange={e => { setEvalDate(e.target.value); setErrors(prev => ({ ...prev, evalDate: '', scale: '' })); }}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50/50 ${
                  errors.evalDate ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                }`}
              />
              {errors.evalDate && <p className="mt-1 text-xs text-red-500">{errors.evalDate}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Fecha de nacimiento</span>
              </label>
              <input
                type="date"
                max={todayStr}
                value={birthdate}
                onChange={e => { setBirthdate(e.target.value); setErrors(prev => ({ ...prev, birthdate: '', scale: '' })); }}
                className={`w-full px-3.5 py-2.5 rounded-xl border focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50/50 ${
                  errors.birthdate ? 'border-red-400 bg-red-50/30' : 'border-gray-200'
                }`}
              />
              {errors.birthdate && <p className="mt-1 text-xs text-red-500">{errors.birthdate}</p>}
            </div>
          </div>

          {/* Age Section */}
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-3">
            <h4 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
              Edad Cronológica (Calculada / Modificable)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-indigo-700 uppercase mb-1">Años</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  value={years}
                  onChange={e => { setYears(parseInt(e.target.value, 10) || 0); setErrors(prev => ({ ...prev, scale: '' })); }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 font-extrabold text-indigo-900 text-center text-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-700 uppercase mb-1">Meses</label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={months}
                  onChange={e => { setMonths(parseInt(e.target.value, 10) || 0); setErrors(prev => ({ ...prev, scale: '' })); }}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 font-extrabold text-indigo-900 text-center text-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-indigo-700 uppercase mb-1">Días</label>
                <input
                  type="number"
                  min="0"
                  max="31"
                  value={days}
                  onChange={e => setDays(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 bg-white rounded-xl border border-indigo-200 font-extrabold text-indigo-900 text-center text-lg focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {errors.scale && (
            <p className="text-xs text-red-500 font-medium bg-red-50/50 p-2.5 rounded-xl border border-red-200">
              {errors.scale}
            </p>
          )}

          {/* Action Buttons */}
          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              disabled={validatingScale}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleStartEvaluation}
              disabled={validatingScale}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
            >
              {validatingScale ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Validando escala...</span>
                </>
              ) : (
                <>
                  <span>Iniciar Evaluación</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

