export interface User {
  id: number;
  email: string;
  full_name: string;
  role: 'user' | 'moderator' | 'admin';  
  is_active: boolean;                     
  created_at?: string;                   
}

export interface UserCreate {
  email: string;
  full_name: string;
  password: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface Token {
  access_token: string;
  refresh_token: string; 
  token_type: string;
}

export interface ValidationRule {
  id: string | number;
  description: string;
  check_type?: string;
  parameters?: Record<string, any>;
  name?: string;
  severity?: "info" | "warning" | "error" | string;
  pattern?: string;
  condition?: string;
}


export interface ValidationResult {
  ruleId: string;
  ruleName: string;
  message: string;
  severity: "error" | "warning" | "warning" | "info";
  position?: {
    start: number;
    end: number;
  };
  suggestions?: string[];
}

export interface ValidationSummary {
  total: number;
  errors: number;
  warnings: number;
  info: number;
}

export interface ValidationResponse {
  success: boolean;
  results: any[];
  ai_advice?: string;
  summary: {
    total: number;
    errors: number;
    warnings: number;
    info: number;
  };
}

export interface DocumentValidation {
  id: number;
  user_id: number;
  document_name: string;
  original_text: string;
  validation_results: any;
  created_at: string;
}
