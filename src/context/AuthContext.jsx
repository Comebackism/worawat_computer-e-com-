/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // The session lives in an httpOnly cookie that JavaScript cannot read, so the
  // profile is re-fetched from the API on every load instead of being trusted
  // from client storage.
  useEffect(() => {
    let cancelled = false;
    api('/me')
      .then((data) => {
        if (!cancelled) setUser(data?.user || null);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const data = await api('/login', { method: 'POST', body: { email, password } });
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (formData) => {
    try {
      const data = await api('/register', { method: 'POST', body: formData });
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // `credential` is the ID token handed back by Google Identity Services and is
  // verified by the API before a session is created.
  const loginWithGoogle = async (credential) => {
    try {
      const data = await api('/google-login', { method: 'POST', body: { credential } });
      setUser(data.user);
      return { success: true, user: data.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = useCallback(async () => {
    setUser(null);
    try {
      await api('/logout', { method: 'POST' });
    } catch {
      // The local state is already cleared; a failed logout just leaves a stale
      // cookie that the next /me call will reject anyway.
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, loginWithGoogle, logout }),
    [user, loading, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);