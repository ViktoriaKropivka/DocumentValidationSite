import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserCreate, UserLogin } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await apiService.getProfile();
        setUser(response.data);
      }
    } catch (error) {
      localStorage.removeItem('token');
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: UserLogin): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);
      localStorage.setItem('token', response.data.access_token);
      const userResponse = await apiService.getProfile();
      setUser(userResponse.data);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: UserCreate): Promise<void> => {
    try {
      setLoading(true);
      await apiService.register(userData);
      await login({ email: userData.email, password: userData.password });
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Registration failed';
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};