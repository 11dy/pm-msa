'use client';

import { useState, useEffect } from 'react';
import { FolderOpen, Loader2 } from 'lucide-react';
import { useProjectStore } from '../model';
import { ProjectCard } from './ProjectCard';
import { DocumentPanel } from '@/features/document';
import type { Project } from '../model';

export function ProjectList() {
  const { projects, selectedProject, selectProject, fetchProjects, loading } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);
  const [summaryTarget, setSummaryTarget] = useState<Project | null>(null);
  const [showSummary, setShowSummary] = useState(false);

  const handleSummary = (e: React.MouseEvent, project: Project) => {
    e.stopPropagation();
    setSummaryTarget(project);
    setShowSummary(true);
    // TODO: pm-agent RAG API 연동 - 최근 1주일 업무 요약
  };

  if (selectedProject) {
    return (
      <DocumentPanel
        projectId={selectedProject.id}
        projectName={selectedProject.name}
        onBack={() => selectProject(null)}
      />
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold flex items-center gap-2">
          <FolderOpen size={18} className="text-accent" />
          프로젝트
        </h2>
      </div>

      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-3">
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onClick={() => selectProject(project)}
                onSummary={(e) => handleSummary(e, project)}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <FolderOpen size={48} className="mb-3 opacity-30" />
            <p className="text-sm">프로젝트가 없습니다</p>
            <p className="text-xs mt-1">+ Create Project로 새 프로젝트를 만드세요</p>
          </div>
        )}
      </div>

      {/* Summary Panel */}
      {showSummary && summaryTarget && (
        <div className="border-t border-border p-4 bg-zinc-900/50">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium">{summaryTarget.name} - 주간 요약</h3>
            <button
              onClick={() => setShowSummary(false)}
              className="text-xs text-muted hover:text-foreground cursor-pointer"
            >
              닫기
            </button>
          </div>
          <p className="text-sm text-muted leading-relaxed">
            {/* TODO: RAG 기반 요약 API 연동 */}
            이번 주 주요 업무: 마케팅 전략 문서 3건 업로드, 회의록 2건 정리 완료.
            핵심 키워드 - 성과 분석, Q1 목표, 캠페인 기획.
            다음 주 예정: 최종 보고서 작성.
          </p>
        </div>
      )}
    </div>
  );
}
