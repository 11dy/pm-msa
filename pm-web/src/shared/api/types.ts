export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  deviceInfo?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ProjectCreateRequest {
  name: string;
  description?: string;
}

export interface ProjectUpdateRequest {
  name?: string;
  description?: string;
}

export interface ProjectResponse {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

export interface DocumentResponse {
  id: number;
  userId: number;
  projectId: number | null;
  filename: string;
  originalFilename: string;
  fileType: string;
  fileSize: number;
  storagePath: string;
  status: string;
  chunkCount: number | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}
