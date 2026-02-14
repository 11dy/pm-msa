'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/entities/session';
import { Card } from '@/shared/ui';

export default function OAuth2CallbackPage() {
  const router = useRouter();
  const { setSession } = useSessionStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.substring(1);
    const params = new URLSearchParams(hash);

    const errorParam = params.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      return;
    }

    const accessToken = params.get('access_token');
    const refreshToken = params.get('refresh_token');

    if (accessToken && refreshToken) {
      // 토큰에서 사용자 정보 추출 (JWT 디코딩)
      try {
        const payload = JSON.parse(atob(accessToken.split('.')[1]));

        setSession(
          {
            id: Number(payload.sub),
            email: payload.email || '',
            username: payload.email?.split('@')[0] || '',
            actSt: 'ACTIVE',
            createdAt: '',
            updatedAt: '',
          },
          accessToken,
          refreshToken
        );

        router.push('/dashboard');
      } catch (e) {
        setError('토큰 처리 중 오류가 발생했습니다');
      }
    } else {
      setError('인증 정보가 없습니다');
    }
  }, [router, setSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-red-600 mb-4">로그인 실패</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/login')}
            className="text-blue-600 hover:underline"
          >
            로그인 페이지로 돌아가기
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
        <p className="text-gray-600">로그인 처리 중...</p>
      </div>
    </div>
  );
}
