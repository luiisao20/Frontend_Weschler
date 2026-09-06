import React, { useState } from 'react';
import { X, UserPlus, Save } from 'lucide-react';
import { addPatient } from '../../services/firestore';
import { useAuth } from '../../context/AuthContext';
import type { Patient } from '../../types';

interface ModalPatientFormProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdded?: () => void;
  onPatientSaved?: () => void;
}

export const ModalPatientForm: React.FC<ModalPatientFormProps> = ({
  isOpen,
  onClose,
  onPatientAdded,
  onPatientSaved
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    lastname: '',
    document: '',
    birthdate: '',
    gender: 'Masculino',
    location: ''
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;

    if (!formData.name || !formData.lastname || !formData.document || !formData.birthdate) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newPatient: Omit<Patient, 'id'> = {
        ...formData,
        birthday: formData.birthdate,
        fechaNacimiento: formData.birthdate,
        owner: user.email
      };

      await addPatient(newPatient);

      if (typeof onPatientAdded === 'function') onPatientAdded();
      if (typeof onPatientSaved === 'function') onPatientSaved();

      onClose();
      setFormData({
        name: '',
        lastname: '',
        document: '',
        birthdate: '',
        gender: 'Masculino',
        location: ''
      });
    } catch (err: any) {
      console.error('Error adding patient:', err);
      setError(err.message || 'Error al guardar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center space-x-2.5 text-gray-800 font-semibold text-lg">
            <div className="bg-teal-100 p-2 rounded-lg text-teal-600">
              <UserPlus className="w-5 h-5" />
            </div>
            <span>Registrar Nuevo Paciente</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Nombres *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Ej. Juan Carlos"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Apellidos *
              </label>
              <input
                type="text"
                name="lastname"
                value={formData.lastname}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Ej. Pérez Gómez"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Documento de Identidad *
              </label>
              <input
                type="text"
                name="document"
                value={formData.document}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="DNI, Cédula o RUT"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Fecha de Nacimiento *
              </label>
              <input
                type="date"
                name="birthdate"
                value={formData.birthdate}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Género
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm bg-white"
              >
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                Ciudad / Ubicación
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
                placeholder="Ej. Bogotá, Madrid"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end space-x-3 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Guardando...' : 'Guardar Paciente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
