import axios from "axios";
import type {
  User,
  UserCreate,
  UserLogin,
  Token,
  ValidationRule,
  ValidationResponse
} from "../types";

const API_BASE_URL = "http://localhost:8000/api/v1/";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const apiService = {
  register: (userData: UserCreate) =>
    api.post<User>("/register/", userData),

  login: (credentials: UserLogin) =>
    api.post<Token>("/login/", credentials),

  getProfile: () =>
    api.get<User>("/users/me/"),

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
        check_type: r.check_type,
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
        check_type: r.check_type,
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
    api.get("/validation-history"),

  saveValidation: (payload: any) =>
    api.post("/save-validation", payload),

  getAllUsers: () =>
    api.get<User[]>("/admin/users"),
    
  changeUserRole: (userId: number, role: string) =>
    api.put(`/admin/users/${userId}/role`, { role }),
    
  toggleUserBlock: (userId: number) =>
    api.put(`/admin/users/${userId}/toggle-block`),
};