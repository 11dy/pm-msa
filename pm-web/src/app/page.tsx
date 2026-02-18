import Link from 'next/link';
import { Button, Card } from '@/shared/ui';

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-md text-center">
        <h1 className="text-3xl font-bold mb-2">dy-web</h1>
        <p className="text-gray-600 mb-8">MSA 기반 웹 애플리케이션</p>

        <div className="space-y-3">
          <Link href="/login" className="block">
            <Button className="w-full">로그인</Button>
          </Link>
          <Link href="/signup" className="block">
            <Button variant="outline" className="w-full">회원가입</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
