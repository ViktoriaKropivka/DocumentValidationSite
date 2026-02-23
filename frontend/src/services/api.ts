import axios from "axios";
import type {
  User,
  UserCreate,
  UserLogin,
  Token,
  ValidationRule,
  ValidationResponse,
  DocumentValidation
} from "../types";

const API_BASE_URL = "http://localhost:8000/api/v1/";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && 
        !originalRequest._retry && 
        originalRequest.url !== '/refresh') {
      
      if (isRefreshing) {
        return new Promise((resolve) => {
          addRefreshSubscriber((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(api(originalRequest));
          });
        });
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await api.post('/refresh', { 
          refresh_token: refreshToken 
        });
        
        const { access_token, refresh_token } = response.data;
        
        localStorage.setItem('refresh_token', refresh_token);
        
        api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        
        onRefreshed(access_token);
        
        return api(originalRequest);
      } catch (refreshError) {
        console.error('Не удалось обновить токен:', refreshError);
        
        localStorage.removeItem('token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        
        window.location.href = '/';
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export const apiService = {
  register: (userData: UserCreate) =>
    api.post<User>("/register/", userData),

  login: (credentials: UserLogin) =>
    api.post<Token>("/login/", credentials),

  refreshToken: (refreshToken: string) =>
    api.post("/refresh", { refresh_token: refreshToken }),

  getProfile: () =>
    api.get<User>("/users/me/"),

  logout: (refreshToken: string) =>
    api.post("/logout", { refresh_token: refreshToken }),

  generateRules: (description: string) =>
    api.post<{
      checks: ValidationRule[];
      explanation: string;
      original_request: string;
      total_checks: number;
      model_used: string;
    }>("/generate-checks", {
      user_request: description
    }),

  validateDocument: async (
    document_text: string,
    checks: ValidationRule[]
  ): Promise<{ data: ValidationResponse }> => {
    const formattedChecks = checks.map((r) => ({
      id: r.id,
      check_type: r.check_type || r.id?.toString() || 'CHECK_CUSTOM',
      description: r.description,
      parameters: r.parameters ?? {}
    }));

    const response = await api.post("/validate-document", {
      document_text,
      checks: formattedChecks
    });

    return { data: response.data };
  },

  validateFile: async (
    file: File,
    checks: ValidationRule[]
  ): Promise<{ data: ValidationResponse }> => {
    const formattedChecks = checks.map((r) => ({
      id: r.id,
      check_type: r.check_type || r.id?.toString() || 'CHECK_CUSTOM',
      description: r.description,
      parameters: r.parameters ?? {}
    }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("checks", JSON.stringify(formattedChecks));

    const response = await api.post("/validate-file", formData, {
      headers: { "Content-Type": "multipart/form-data" }
    });

    return { data: response.data };
  },

  getValidationHistory: () =>
    api.get<DocumentValidation[]>("/validation-history"),

  saveValidation: (payload: any) =>
    api.post("/save-validation", payload),

  deleteValidation: (documentId: number) =>
    api.delete(`/validation-history/${documentId}`),

  getAllUsers: () =>
    api.get<User[]>("/admin/users"),
    
  changeUserRole: (userId: number, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
    
  toggleUserBlock: (userId: number) =>
    api.put(`/admin/users/${userId}/toggle-block`),
};