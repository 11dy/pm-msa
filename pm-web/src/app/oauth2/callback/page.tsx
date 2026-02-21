'use client';

// OAuth2 소셜 로그인 비활성화 - 이메일 로그인만 사용
// 추후 OAuth2 복원 시 아래 주석 해제

/*
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
      } catch {
        setError('토큰 처리 중 오류가 발생했습니다');
      }
    } else {
      setError('인증 정보가 없습니다');
    }
  }, [router, setSession]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center">
          <h1 className="text-xl font-bold text-danger mb-4">로그인 실패</h1>
          <p className="text-muted mb-6">{error}</p>
          <button onClick={() => router.push('/login')} className="text-accent hover:underline cursor-pointer">
            로그인 페이지로 돌아가기
          </button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4" />
        <p className="text-muted">로그인 처리 중...</p>
      </div>
    </div>
  );
}
*/

import { redirect } from 'next/navigation';

export default function OAuth2CallbackPage() {
  redirect('/login');
}
