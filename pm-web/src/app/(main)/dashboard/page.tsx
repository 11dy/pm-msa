'use client';

import { ProjectList } from '@/features/project';
import { ChatPanel } from '@/features/chat';

export default function DashboardPage() {
  return (
    <div className="flex h-full">
      {/* 좌측: 프로젝트 리스트 */}
      <div className="w-1/2 border-r border-border">
        <ProjectList />
      </div>
      {/* 우측: AI 채팅 */}
      <div className="w-1/2">
        <ChatPanel />
      </div>
    </div>
  );
}
