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
  withCredentials: true,
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
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

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }
    
    if (originalRequest.url === '/refresh') {
      console.error('Refresh token недействителен');
      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      return Promise.reject(error);
    }
    
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch(err => Promise.reject(err));
    }
    
    originalRequest._retry = true;
    isRefreshing = true;
    
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      if (!refreshToken) {
        console.log('Нет refresh token — пользователь не авторизован');
        processQueue(new Error('No refresh token'), null);
        return Promise.reject(error);
      }
      
      console.log('Обновляем токен...');
      const response = await api.post('/refresh', { 
        refresh_token: refreshToken 
      });
      
      const { access_token, refresh_token } = response.data;
      
      localStorage.setItem('refresh_token', refresh_token);
      
      api.defaults.headers.common.Authorization = `Bearer ${access_token}`;
      
      processQueue(null, access_token);
      
      console.log('Токен обновлён');
      
      originalRequest.headers.Authorization = `Bearer ${access_token}`;
      return api(originalRequest);
      
    } catch (refreshError) {
      console.error('Не удалось обновить токен:', refreshError);
      

      localStorage.removeItem('token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      
      processQueue(refreshError, null);
      
      return Promise.reject(refreshError);
      
    } finally {
      isRefreshing = false;
    }
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

  updateProfile: (userData: { full_name?: string; email?: string }) =>
    api.put<User>("/users/me", userData),

  deleteAccount: () =>
    api.delete("/users/me"),

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

  getValidationHistory: (params?: any) =>
    api.get<{
      items: DocumentValidation[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    }>("/validation-history", { params }),

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

  getDownloadUrl: (documentId: number) =>
    api.get<{ download_url: string; filename: string }>(`/documents/${documentId}/download`),
};