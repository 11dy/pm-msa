'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Brain, FileText, MessageSquare } from 'lucide-react';
import { Button } from '@/shared/ui';
import { useSessionStore } from '@/entities/session';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useSessionStore();

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-border">
        <span className="text-xl font-bold tracking-tight">PM</span>
        <div className="flex gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">로그인</Button>
          </Link>
          <Link href="/signup">
            <Button size="sm">시작하기</Button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <div className="max-w-2xl space-y-6">
          <h1 className="text-5xl font-bold tracking-tight leading-tight">
            AI로 관리하는<br />
            <span className="text-accent">나만의 프로젝트</span>
          </h1>
          <p className="text-lg text-muted max-w-lg mx-auto">
            문서를 업로드하고, AI와 대화하며 프로젝트를 효율적으로 관리하세요.
            RAG 기반 문서 검색과 워크플로우 자동화를 지원합니다.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/signup">
              <Button size="lg" className="gap-2">
                무료로 시작하기 <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 max-w-4xl w-full px-4">
          <FeatureCard
            icon={<FileText size={24} />}
            title="문서 관리"
            description="PDF, Word, 텍스트 파일을 업로드하면 자동으로 파싱하고 벡터화합니다."
          />
          <FeatureCard
            icon={<MessageSquare size={24} />}
            title="AI 채팅"
            description="업로드한 문서를 기반으로 AI와 대화하며 원하는 정보를 찾아보세요."
          />
          <FeatureCard
            icon={<Brain size={24} />}
            title="업무 요약"
            description="최근 일주일간의 업무 내용을 AI가 자동으로 요약해 드립니다."
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-sm text-muted border-t border-border">
        PM - Personal Manager
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 text-left hover:border-zinc-600 transition-colors">
      <div className="text-accent mb-3">{icon}</div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted leading-relaxed">{description}</p>
    </div>
  );
}
