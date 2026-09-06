import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navbar } from '../components/layout/Navbar';
import { getPatientsByOwner } from '../services/firestore';
import { User, Users, FileCheck, LogOut, Shield } from 'lucide-react';

export const UserProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const [patientCount, setPatientCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (user?.email) {
      getPatientsByOwner(user.email)
        .then(patients => {
          setPatientCount(patients.length);
        })
        .finally(() => setLoading(false));
    }
  }, [user]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">Perfil de Usuario</h1>

        <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-xs space-y-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-3xl bg-teal-600 text-white flex items-center justify-center font-bold text-3xl shadow-lg shadow-teal-100">
              {user?.email ? user.email.charAt(0).toUpperCase() : <User className="w-10 h-10" />}
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{user?.email}</h2>
              <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>Cuenta Verificada</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-100">
            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-teal-100 text-teal-600 rounded-xl">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {loading ? '...' : patientCount}
                </div>
                <div className="text-xs text-gray-500 font-medium">Pacientes Registrados</div>
              </div>
            </div>

            <div className="bg-gray-50 p-5 rounded-2xl border border-gray-100 flex items-center space-x-4">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                <FileCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">Activo</div>
                <div className="text-xs text-gray-500 font-medium">Estado del Sistema</div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={logout}
              className="inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-red-50 text-red-600 hover:bg-red-100 font-semibold text-sm transition"
            >
              <LogOut className="w-4 h-4" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
