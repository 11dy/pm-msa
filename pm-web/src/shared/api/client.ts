import ky from 'ky';
import { env } from '../config/env';

export const apiClient = ky.create({
  prefixUrl: env.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  hooks: {
    beforeRequest: [
      (request) => {
        const token = typeof window !== 'undefined'
          ? localStorage.getItem('accessToken')
          : null;
        if (token) {
          request.headers.set('Authorization', `Bearer ${token}`);
        }
      },
    ],
  },
});
