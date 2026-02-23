import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserCreate, UserLogin } from '../types';
import { api, apiService } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (credentials: UserLogin) => Promise<void>;
  register: (userData: UserCreate) => Promise<void>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
  isAdmin: boolean;
  isModerator: boolean;
  accessToken: string | null;
}

const [accessToken, setAccessToken] = useState<string | null>(null);
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        const response = await apiService.refreshToken(refreshToken);
       // setAccessToken(response.data.access_token);
        api.defaults.headers.common.Authorization = `Bearer ${response.data.access_token}`;
        
        const userResponse = await apiService.getProfile();
        const userData = {
          ...userResponse.data,
          role: userResponse.data.role || 'user'
        };
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
      }
    } catch (error) {
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials: UserLogin): Promise<void> => {
    try {
      setLoading(true);
      const response = await apiService.login(credentials);
      setAccessToken(response.data.access_token);
      localStorage.setItem('refresh_token', response.data.refresh_token);
      api.defaults.headers.common.Authorization = `Bearer ${response.data.access_token}`;
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

  const logout = async (): Promise<void> => {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        await apiService.logout(refreshToken);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setAccessToken(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common.Authorization;
      setUser(null);
      
      window.dispatchEvent(new CustomEvent('app:logout'));
    }
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
    accessToken,
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