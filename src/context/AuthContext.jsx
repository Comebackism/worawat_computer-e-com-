/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export const USER_KEY = 'worawat_computer_user';
export const TOKEN_KEY = 'worawat_computer_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(USER_KEY);
      if (stored) setUser(JSON.parse(stored));
    } catch {
      localStorage.removeItem(USER_KEY);
    }
    setLoading(false);
  }, []);

  const persistSession = (nextUser, token) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
    if (token) localStorage.setItem(TOKEN_KEY, token);
  };

  const login = async (email, password) => {
    try {
      const data = await api('/login', { method: 'POST', body: { email, password } });
      persistSession(data.user, data.token);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (formData) => {
    try {
      const data = await api('/register', { method: 'POST', body: formData });
      persistSession(data.user, data.token);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Demo shortcut while there is no real OAuth client wired up.
  const loginWithGoogle = () => {
    const demoUser = {
      id: 999,
      name: 'Google Demo User',
      email: 'google.demo@example.com',
      role: 'customer',
    };
    persistSession(demoUser, 'mock-google-token');
    return { success: true, user: demoUser };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, loginWithGoogle, logout }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
