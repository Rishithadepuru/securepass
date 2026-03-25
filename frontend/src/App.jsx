import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import OtpPage from './pages/OtpPage';
import FacePage from './pages/FacePage';
import DashboardPage from './pages/DashboardPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

const AuthFlowRoute = ({ children }) => {
  const { authState } = useAuth();
  return authState.tempToken ? children : <Navigate to="/" replace />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route path="/otp" element={<AuthFlowRoute><OtpPage /></AuthFlowRoute>} />
      <Route path="/face" element={<AuthFlowRoute><FacePage /></AuthFlowRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'rgba(7,13,42,0.95)',
              color: '#e2e8f0',
              border: '1px solid rgba(0,229,255,0.2)',
              backdropFilter: 'blur(20px)',
              fontFamily: 'Oxanium, sans-serif',
              fontSize: '14px',
            },
            success: {
              iconTheme: { primary: '#00ff9d', secondary: '#03061a' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#03061a' },
            },
          }}
        />
      </BrowserRouter>
    </AuthProvider>
  );
}
