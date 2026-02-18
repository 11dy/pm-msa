import { apiClient, ApiResponse, TokenResponse, SignUpRequest, LoginRequest } from '@/shared';

export const authApi = {
  signup: async (data: SignUpRequest): Promise<ApiResponse<TokenResponse>> => {
    return apiClient.post('api/auth/signup', { json: data }).json();
  },

  login: async (data: LoginRequest): Promise<ApiResponse<TokenResponse>> => {
    return apiClient.post('api/auth/login', { json: data }).json();
  },

  logout: async (): Promise<ApiResponse<void>> => {
    return apiClient.post('api/auth/logout').json();
  },

  refresh: async (refreshToken: string): Promise<ApiResponse<TokenResponse>> => {
    return apiClient.post('api/auth/refresh', {
      json: { refreshToken },
    }).json();
  },
};
