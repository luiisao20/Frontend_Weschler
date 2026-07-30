import React, { useEffect, useState } from 'react';
import { getPatients, deletePatient } from '../services/firestore';
import type { Patient } from '../types';
import { Navbar } from '../components/layout/Navbar';
import { ModalPatientForm } from '../components/modals/ModalPatientForm';
import { calculateAge } from '../utils/psychometrics';
import { formatDate } from '../utils/formatDate';
import { Search, UserPlus, Trash2, Calendar, CreditCard, User, ExternalLink, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage: React.FC = () => {
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPatientsList = async () => {
    setLoading(true);
    try {
      const data = await getPatients();
      setPatients(data);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatientsList();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar al paciente "${name}"?`)) {
      return;
    }

    setDeletingId(id);
    try {
      await deletePatient(id);
      await fetchPatientsList();
    } catch (err) {
      console.error('Error deleting patient:', err);
      alert('Hubo un error al intentar eliminar el paciente.');
    } finally {
      setDeletingId(null);
    }
  };

  const getPatientFullName = (p: any): string => {
    const fn = p.name || p.firstName || '';
    const ln = p.lastname || p.lastName || '';
    const full = `${fn} ${ln}`.trim();
    return full || 'Paciente sin nombre';
  };

  const getPatientInitials = (p: any): string => {
    const fn = p.name || p.firstName || '';
    const ln = p.lastname || p.lastName || '';
    const firstChar = fn ? fn.charAt(0) : '';
    const lastChar = ln ? ln.charAt(0) : '';
    const inits = (firstChar + lastChar).toUpperCase();
    return inits || 'P';
  };

  const getPatientDoc = (p: any): string => {
    const docNum = p.document || p.id || p.cedula || 'N/A';
    return String(docNum);
  };

  const filteredPatients = patients.filter(p => {
    const query = search.toLowerCase();
    const fullName = getPatientFullName(p).toLowerCase();
    const docNum = getPatientDoc(p).toLowerCase();
    return fullName.includes(query) || docNum.includes(query);
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Directorio de Pacientes</h1>
            <p className="text-sm text-gray-500 mt-1">Gestiona los pacientes registrados y sus evaluaciones clínicas.</p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-medium text-sm transition shadow-sm shadow-indigo-200"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Paciente</span>
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs p-4 mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre, apellido o documento..."
              className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50/50"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex justify-center items-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredPatients.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <User className="w-6 h-6" />
            </div>
            <h3 className="text-base font-semibold text-gray-800">No se encontraron pacientes</h3>
            <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
              {search ? 'No hay pacientes que coincidan con la búsqueda.' : 'Aún no has registrado ningún paciente. ¡Crea el primero!'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPatients.map((p: any) => {
              const fullName = getPatientFullName(p);
              const initials = getPatientInitials(p);
              const docNum = getPatientDoc(p);
              const birthdate = p.birthday || p.birthdate || p.fechaNacimiento || p.fecha_nacimiento || p.birthDate || '';
              const age = birthdate ? calculateAge(birthdate) : (p.age ? { years: p.age, months: 0, days: 0 } : null);

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-100 hover:border-indigo-200 shadow-xs hover:shadow-md transition duration-200 p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm border border-indigo-100">
                          {initials}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 text-base leading-snug">
                            {fullName}
                          </h3>
                          <div className="flex items-center space-x-1 text-xs text-gray-500 mt-0.5">
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Doc: {docNum}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => p.id && handleDelete(p.id, fullName)}
                        disabled={deletingId === p.id}
                        className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition"
                        title="Eliminar paciente"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
                      {birthdate ? (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Nacimiento:</span>
                          </span>
                          <span className="font-semibold text-gray-800">
                            {formatDate(birthdate)} {age ? `(${age.years} años)` : ''}
                          </span>
                        </div>
                      ) : age ? (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 text-gray-500">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Edad:</span>
                          </span>
                          <span className="font-semibold text-gray-800">
                            {age.years} años
                          </span>
                        </div>
                      ) : null}

                      {p.location && (
                        <div className="flex items-center justify-between">
                          <span className="flex items-center space-x-1.5 text-gray-500">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>Ubicación:</span>
                          </span>
                          <span className="font-medium text-gray-700">{p.location}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-gray-100 flex justify-end">
                    <Link
                      to={`/patient/${p.id}`}
                      className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                    >
                      <span>Ver Expediente</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <ModalPatientForm
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onPatientSaved={fetchPatientsList}
      />
    </div>
  );
};
