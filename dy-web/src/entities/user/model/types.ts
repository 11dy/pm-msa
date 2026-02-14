export interface User {
  id: number;
  email: string;
  username: string;
  actSt: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  createdAt: string;
  updatedAt: string;
}

export interface UserAuth {
  id: number;
  userId: number;
  provider: 'LOCAL' | 'GOOGLE' | 'KAKAO' | 'NAVER';
  providerId: string;
  createdAt: string;
}
