import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LoginPage } from "./pages/LoginPage";
import { HomePage } from "./pages/HomePage";
import { PatientPage } from "./pages/PatientPage";
import { UserProfilePage } from "./pages/UserProfilePage";
import { WaisScalePage } from "./pages/scales/WaisScalePage";
import { WiscScalePage } from "./pages/scales/WiscScalePage";
import { WppsiScalePage } from "./pages/scales/WppsiScalePage";
import { WnvScalePage } from "./pages/scales/WnvScalePage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user"
            element={
              <ProtectedRoute>
                <UserProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Patient Detail Routes */}
          <Route
            path="/patient/:id"
            element={
              <ProtectedRoute>
                <PatientPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:id"
            element={
              <ProtectedRoute>
                <PatientPage />
              </ProtectedRoute>
            }
          />

          {/* Scale Application Routes */}
          <Route
            path="/patient/:id/wais"
            element={
              <ProtectedRoute>
                <WaisScalePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:id/wais"
            element={
              <ProtectedRoute>
                <WaisScalePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/:id/wisc"
            element={
              <ProtectedRoute>
                <WiscScalePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:id/wisc"
            element={
              <ProtectedRoute>
                <WiscScalePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/:id/wppsi"
            element={
              <ProtectedRoute>
                <WppsiScalePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:id/wppsi"
            element={
              <ProtectedRoute>
                <WppsiScalePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/patient/:id/wnv"
            element={
              <ProtectedRoute>
                <WnvScalePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/:id/wnv"
            element={
              <ProtectedRoute>
                <WnvScalePage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
