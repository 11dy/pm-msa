'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Input, Card } from '@/shared/ui';
import { useSessionStore } from '@/entities/session';
import { signupSchema, SignupFormData, useAuthStore } from '../model';
import { authApi } from '../api';
// import { SocialLoginButtons } from './SocialLoginButtons';

export function SignupForm() {
  const router = useRouter();
  const { setSession } = useSessionStore();
  const { isLoading, error, setLoading, setError, reset } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (data: SignupFormData) => {
    reset();
    setLoading(true);

    try {
      const response = await authApi.signup({
        email: data.email,
        password: data.password,
        username: data.username,
      });

      if (response.success && response.data) {
        setSession(
          { id: 0, email: data.email, username: data.username, actSt: 'ACTIVE', createdAt: '', updatedAt: '' },
          response.data.accessToken,
          response.data.refreshToken
        );
        router.push('/dashboard');
      } else {
        setError(response.error?.message || '회원가입에 실패했습니다');
      }
    } catch {
      setError('서버 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">회원가입</h1>

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
          id="username"
          type="text"
          label="사용자명"
          placeholder="사용자명을 입력하세요"
          error={errors.username?.message}
          {...register('username')}
        />
        <Input
          id="password"
          type="password"
          label="비밀번호"
          placeholder="비밀번호를 입력하세요 (최소 8자)"
          error={errors.password?.message}
          {...register('password')}
        />
        <Input
          id="confirmPassword"
          type="password"
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" className="w-full" isLoading={isLoading}>
          회원가입
        </Button>
      </form>

      {/* OAuth2 소셜 로그인 비활성화
      <div className="my-6 flex items-center">
        <div className="flex-1 border-t border-border" />
        <span className="px-4 text-sm text-muted">또는</span>
        <div className="flex-1 border-t border-border" />
      </div>

      <SocialLoginButtons />
      */}

      <p className="mt-6 text-center text-sm text-muted">
        이미 계정이 있으신가요?{' '}
        <Link href="/login" className="text-accent hover:underline">
          로그인
        </Link>
      </p>
    </Card>
  );
}
