import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Brain, User as UserIcon, LogOut, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center space-x-3">
            <Link to="/home" className="flex items-center space-x-2 text-indigo-600 font-bold text-xl hover:opacity-90">
              <div className="bg-indigo-100 p-2 rounded-xl text-indigo-600">
                <Brain className="w-6 h-6" />
              </div>
              <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">
                Intelligence Scales
              </span>
            </Link>
          </div>

          {user && (
            <div className="flex items-center space-x-4">
              <Link
                to="/home"
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                <Home className="w-4 h-4" />
                <span className="hidden sm:inline font-medium">Pacientes</span>
              </Link>

              <Link
                to="/user"
                className="flex items-center space-x-2 text-sm text-gray-600 hover:text-indigo-600 px-3 py-2 rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-xs border border-indigo-200">
                  {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <span className="hidden sm:inline font-medium max-w-[150px] truncate">{user.email}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center space-x-1.5 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition font-medium"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Salir</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
