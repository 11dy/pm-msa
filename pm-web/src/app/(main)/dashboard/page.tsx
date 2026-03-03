'use client';

import { ProjectList, useProjectStore } from '@/features/project';
import { ChatPanel } from '@/features/chat';

export default function DashboardPage() {
  const selectedProject = useProjectStore((s) => s.selectedProject);

  return (
    <div className="flex h-full">
      {/* 좌측: 프로젝트 리스트 */}
      <div className="w-1/2 border-r border-border">
        <ProjectList />
      </div>
      {/* 우측: AI 채팅 */}
      <div className="w-1/2">
        <ChatPanel
          projectId={selectedProject?.id ?? null}
          projectName={selectedProject?.name ?? null}
        />
      </div>
    </div>
  );
}
