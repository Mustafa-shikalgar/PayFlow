import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setLoading(false);
        setInitialized(true);
        return;
      }

      try {
        const { data } = await authService.getMe();
        setUser(data.data.user);
      } catch (err) {
        // Access token invalid/expired — clear all auth state
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    loadUser();
  }, []);

  // Listen for forced logout dispatched by the API interceptor
  // (fires when /auth/refresh also fails — user must re-login)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // FIX: Persist BOTH accessToken and refreshToken to localStorage on login.
  // The refreshToken must be in localStorage so the axios interceptor can send
  // it in the request body when cookies are blocked cross-origin
  // (Vercel frontend <-> Render backend with modern browser third-party cookie blocking).
  const login = useCallback(async (email, password) => {
    const { data } = await authService.login({ email, password });
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data;
  }, []);

  // FIX: Same as login — also persist refreshToken for register flow
  const register = useCallback(async (userData) => {
    const { data } = await authService.register(userData);
    localStorage.setItem('accessToken', data.data.accessToken);
    localStorage.setItem('refreshToken', data.data.refreshToken);
    setUser(data.data.user);
    return data;
  }, []);

  // FIX: Clear both tokens on logout
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (err) {
      // Ignore logout errors — clear local state regardless
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
  }, []);

  const value = {
    user,
    loading,
    initialized,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};