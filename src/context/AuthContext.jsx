import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for existing session
    const storedUser = localStorage.getItem('techtranquility_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await fetch('http://localhost:4000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('techtranquility_user', JSON.stringify(data.user));
      localStorage.setItem('techtranquility_token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const register = async (userData) => {
    try {
      const response = await fetch('http://localhost:4000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('techtranquility_user', JSON.stringify(data.user));
      localStorage.setItem('techtranquility_token', data.token);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const loginWithGoogle = () => {
    // Mock Google Login
    const mockGoogleUser = {
      id: 999,
      name: 'Google User',
      email: 'user@google.com'
    };
    setUser(mockGoogleUser);
    localStorage.setItem('techtranquility_user', JSON.stringify(mockGoogleUser));
    localStorage.setItem('techtranquility_token', 'mock-google-token-789');
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('techtranquility_user');
    localStorage.removeItem('techtranquility_token');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, loginWithGoogle, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
