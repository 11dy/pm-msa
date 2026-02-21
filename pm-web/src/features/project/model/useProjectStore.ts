import { create } from 'zustand';
import type { Project } from './types';

// 목 데이터
const MOCK_PROJECTS: Project[] = [
  { id: 1, name: '마케팅 전략 2026', description: '2026년 상반기 마케팅 계획', createdAt: '2026-02-15', updatedAt: '2026-02-20', documentCount: 5 },
  { id: 2, name: 'PM-MSA 개발', description: 'AI Agent 서비스 개발 프로젝트', createdAt: '2026-02-18', updatedAt: '2026-02-21', documentCount: 12 },
  { id: 3, name: '회의록 아카이브', description: '주간 회의록 모음', createdAt: '2026-02-10', updatedAt: '2026-02-21', documentCount: 8 },
];

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  addProject: (name: string, description?: string) => void;
  selectProject: (project: Project | null) => void;
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: MOCK_PROJECTS,
  selectedProject: null,

  addProject: (name, description) => {
    const newProject: Project = {
      id: Date.now(),
      name,
      description,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      documentCount: 0,
    };
    set((state) => ({ projects: [newProject, ...state.projects] }));
  },

  selectProject: (project) => set({ selectedProject: project }),
}));
