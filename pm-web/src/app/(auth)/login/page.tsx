import { LoginForm } from '@/features/auth';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-2xl font-bold tracking-tight mb-8">PM</Link>
      <LoginForm />
    </div>
  );
}
