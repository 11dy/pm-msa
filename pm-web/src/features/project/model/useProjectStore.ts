import { create } from 'zustand';
import { apiClient } from '@/shared/api';
import type { ApiResponse, ProjectResponse } from '@/shared/api';
import type { Project } from './types';

interface ProjectState {
  projects: Project[];
  selectedProject: Project | null;
  loading: boolean;
  fetchProjects: () => Promise<void>;
  addProject: (name: string, description?: string) => Promise<void>;
  updateProject: (id: number, name?: string, description?: string) => Promise<void>;
  selectProject: (project: Project | null) => void;
}

function toProject(res: ProjectResponse): Project {
  return {
    id: res.id,
    name: res.name,
    description: res.description,
    createdAt: res.createdAt,
    updatedAt: res.updatedAt,
    documentCount: 0,
  };
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  selectedProject: null,
  loading: false,

  fetchProjects: async () => {
    set({ loading: true });
    try {
      const res = await apiClient.get('api/project').json<ApiResponse<ProjectResponse[]>>();
      if (res.data) {
        set({ projects: res.data.map(toProject) });
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      set({ loading: false });
    }
  },

  addProject: async (name, description) => {
    try {
      const res = await apiClient.post('api/project', {
        json: { name, description },
      }).json<ApiResponse<ProjectResponse>>();
      if (res.data) {
        set((state) => ({ projects: [toProject(res.data!), ...state.projects] }));
      }
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  },

  updateProject: async (id, name, description) => {
    try {
      const res = await apiClient.put(`api/project/${id}`, {
        json: { name, description },
      }).json<ApiResponse<ProjectResponse>>();
      if (res.data) {
        const updated = toProject(res.data);
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? updated : p)),
        }));
      }
    } catch (error) {
      console.error('Failed to update project:', error);
    }
  },

  selectProject: (project) => set({ selectedProject: project }),
}));
