import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import { Brain, Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Credenciales inválidas. Revisa tu correo y contraseña.');
      } else {
        setError(err.message || 'Error al iniciar sesión.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-violet-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 mb-4">
            <Brain className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Intelligence Scales</h1>
          <p className="text-sm text-gray-500 mt-2">Plataforma de evaluación psicométrica de inteligencia</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl shadow-indigo-100/50 border border-gray-100 p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Iniciar Sesión</h2>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start space-x-3 text-red-700 text-sm">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Correo Electrónico
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50/50 focus:bg-white transition"
                  placeholder="usuario@ejemplo.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-gray-50/50 focus:bg-white transition"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-semibold rounded-xl transition shadow-lg shadow-indigo-200 flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Ingresando...' : 'Iniciar Sesión'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
