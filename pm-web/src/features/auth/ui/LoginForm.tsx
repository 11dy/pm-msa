'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/shared/ui';
import { useSessionStore } from '@/entities/session';
import { loginSchema, LoginFormData, useAuthStore } from '../model';
import { authApi } from '../api';
import { SocialLoginButtons } from './SocialLoginButtons';

export function LoginForm() {
  const router = useRouter();
  const { setSession } = useSessionStore();
  const { isLoading, error, setLoading, setError, reset } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    reset();
    setLoading(true);

    try {
      const response = await authApi.login({
        email: data.email,
        password: data.password,
      });

      if (response.success && response.data) {
        setSession(
          { id: 0, email: data.email, username: '', actSt: 'ACTIVE', createdAt: '', updatedAt: '' },
          response.data.accessToken,
          response.data.refreshToken
        );
        router.push('/dashboard');
      } else {
        setError(response.error?.message || '로그인에 실패했습니다');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">로그인</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          id="email"
          type="email"
          label="이메일"
          placeholder="이메일을 입력하세요"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          id="password"
          type="password"
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          로그인
        </Button>
      </form>

      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-4 text-sm text-muted">또는</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <SocialLoginButtons />

      <p className="mt-6 text-center text-sm text-muted">
        계정이 없으신가요?{' '}
        <Link href="/signup" className="text-accent hover:underline">
          회원가입
        </Link>
      </p>
    </Card>
  );
}
