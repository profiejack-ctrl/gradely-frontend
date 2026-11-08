import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../api/types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('gradely_token');
      const storedUser = localStorage.getItem('gradely_user');

      if (storedToken && storedUser) {
        try {
          api.setToken(storedToken);
          const fresh = await api.getMe();
          if (fresh && fresh.id) {
            setUser(fresh);
            setToken(storedToken);
            localStorage.setItem('gradely_user', JSON.stringify(fresh));
          } else {
            throw new Error('User not found');
          }
        } catch (e) {
          console.warn('Session restoration failed, clearing stale token:', e);
          api.setToken(null);
          setToken(null);
          setUser(null);
          localStorage.removeItem('gradely_token');
          localStorage.removeItem('gradely_user');
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (identifier: string, password: string) => {
    const result = await api.login(identifier, password);
    setUser(result.user);
    setToken(result.token);
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.logout();
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
