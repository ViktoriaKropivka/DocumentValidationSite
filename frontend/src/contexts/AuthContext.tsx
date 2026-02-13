import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserCreate, UserLogin } from '../types';
import { apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: boolean;
  isModerator: boolean;
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
        const userData = {
          ...response.data,
          role: response.data.role || 'user'
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
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
      const userData = {
        ...userResponse.data,
        role: userResponse.data.role || 'user'
      };

      if (userData.is_active === false) {
        localStorage.removeItem('token');
        throw new Error('Ваш аккаунт заблокирован. Обратитесь к администратору.');
      }

      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
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
    localStorage.removeItem('user');
    setUser(null);
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user) return false;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role);
  };

  const isAdmin = hasRole('admin');
  const isModerator = hasRole(['moderator', 'admin']);

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
    hasRole,
    isAdmin,
    isModerator,
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