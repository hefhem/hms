import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'PHARMACIST' | 'RECEPTIONIST' | 'BILLING_CLERK';
  mfaEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, pass: string) => Promise<{ requireMfa?: boolean; tempToken?: string }>;
  verifyMfa: (userId: string, otpCode: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('hms_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('hms_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (token) {
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const refreshUser = async () => {
    try {
      const res = await api.get('/users/profile');
      setUser(res.data);
      localStorage.setItem('hms_user', JSON.stringify(res.data));
    } catch (err) {
      logout();
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await api.post('/auth/login', { email, pass });
    if (res.data.requireMfa) {
      return { requireMfa: true, tempToken: res.data.tempToken };
    }

    setToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem('hms_token', res.data.accessToken);
    localStorage.setItem('hms_user', JSON.stringify(res.data.user));

    return { requireMfa: false };
  };

  const verifyMfa = async (userId: string, otpCode: string) => {
    const res = await api.post('/auth/mfa/verify-login', { userId, otpCode });
    setToken(res.data.accessToken);
    setUser(res.data.user);
    localStorage.setItem('hms_token', res.data.accessToken);
    localStorage.setItem('hms_user', JSON.stringify(res.data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('hms_token');
    localStorage.removeItem('hms_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        verifyMfa,
        logout,
        isLoading,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
