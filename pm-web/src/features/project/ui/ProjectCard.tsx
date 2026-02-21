'use client';

import { FileText, Sparkles } from 'lucide-react';
import type { Project } from '../model';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onSummary: (e: React.MouseEvent) => void;
}

export function ProjectCard({ project, onClick, onSummary }: ProjectCardProps) {
  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-5 hover:border-zinc-600 hover:bg-card-hover transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
          {project.name}
        </h3>
      </div>

      {project.description && (
        <p className="text-sm text-muted mb-4 line-clamp-2">{project.description}</p>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-muted">
          <FileText size={14} />
          <span>{project.documentCount}개 문서</span>
        </div>
        <button
          onClick={onSummary}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-accent bg-accent/10 rounded-md hover:bg-accent/20 transition-colors cursor-pointer"
        >
          <Sparkles size={12} />
          요약
        </button>
      </div>
    </div>
  );
}
