'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSessionStore } from '@/entities/session';
import { Button, Card } from '@/shared/ui';
import { authApi } from '@/features/auth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, clearSession } = useSessionStore();

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore logout API errors
    } finally {
      clearSession();
      router.push('/login');
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">대시보드</h1>
            <Button variant="outline" onClick={handleLogout}>
              로그아웃
            </Button>
          </div>

          <div className="space-y-4">
            <p className="text-gray-600">
              환영합니다, <span className="font-semibold">{user?.username || user?.email}</span>님!
            </p>
            <div className="p-4 bg-gray-100 rounded-lg">
              <h3 className="font-medium mb-2">사용자 정보</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>이메일: {user?.email}</li>
                <li>사용자명: {user?.username || '-'}</li>
                <li>상태: {user?.actSt}</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
