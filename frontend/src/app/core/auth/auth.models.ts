export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface UserProfile {
  id: number;
  email: string;
  full_name: string;
  role: 'superadmin' | 'business_admin';
  is_active: boolean;
}
