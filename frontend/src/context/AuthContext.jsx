import React, { createContext, useContext, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authState, setAuthState] = useState({
    identifier: '',
    tempToken: null,
    sessionToken: localStorage.getItem('sp_session') || null,
    riskLevel: null,
    riskFactors: [],
    requiresOtp: false,
    requiresFace: false,
    devOtp: null,
  });

  const setLoginResult = useCallback((data) => {
    setAuthState(prev => ({
      ...prev,
      identifier: data.identifier || prev.identifier,
      tempToken: data.tempToken || null,
      sessionToken: data.sessionToken || prev.sessionToken,
      riskLevel: data.riskLevel || null,
      riskFactors: data.riskFactors || [],
      requiresOtp: data.requiresOtp || false,
      requiresFace: data.requiresFace || false,
      devOtp: data.devOtp || null,
    }));
    if (data.sessionToken) {
      localStorage.setItem('sp_session', data.sessionToken);
    }
  }, []);

  const setSessionToken = useCallback((token) => {
    localStorage.setItem('sp_session', token);
    setAuthState(prev => ({ ...prev, sessionToken: token, tempToken: null }));
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sp_session');
    setAuthState({
      identifier: '',
      tempToken: null,
      sessionToken: null,
      riskLevel: null,
      riskFactors: [],
      requiresOtp: false,
      requiresFace: false,
      devOtp: null,
    });
  }, []);

  const isAuthenticated = Boolean(authState.sessionToken);

  return (
    <AuthContext.Provider value={{ authState, setLoginResult, setSessionToken, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
