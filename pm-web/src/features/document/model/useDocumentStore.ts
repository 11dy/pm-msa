import { create } from 'zustand';
import { apiClient } from '@/shared/api/client';
import { env } from '@/shared/config/env';
import type { DocumentResponse } from '@/shared/api/types';
import type { DocumentFile } from './types';

function toDocumentFile(res: DocumentResponse): DocumentFile {
  return {
    id: res.id,
    projectId: res.projectId,
    originalFilename: res.originalFilename,
    fileType: res.fileType,
    fileSize: res.fileSize,
    status: res.status as DocumentFile['status'],
    chunkCount: res.chunkCount,
    errorMessage: res.errorMessage,
    createdAt: res.createdAt,
    updatedAt: res.updatedAt,
  };
}

interface DocumentState {
  documents: DocumentFile[];
  loading: boolean;
  uploading: boolean;
  error: string | null;
  fetchDocuments: (projectId: number) => Promise<void>;
  uploadDocument: (projectId: number, file: File) => Promise<void>;
  deleteDocument: (id: number) => Promise<void>;
}

export const useDocumentStore = create<DocumentState>((set, get) => ({
  documents: [],
  loading: false,
  uploading: false,
  error: null,

  fetchDocuments: async (projectId: number) => {
    set({ loading: true, error: null });
    try {
      const data = await apiClient
        .get('api/documents', { searchParams: { projectId } })
        .json<DocumentResponse[]>();
      set({ documents: data.map(toDocumentFile), loading: false });
    } catch (e) {
      set({ error: 'Failed to fetch documents', loading: false });
    }
  },

  uploadDocument: async (projectId: number, file: File) => {
    set({ uploading: true, error: null });
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('project_id', String(projectId));

      const token = typeof window !== 'undefined'
        ? localStorage.getItem('accessToken')
        : null;

      const res = await fetch(`${env.API_BASE_URL}/api/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });

      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return;
      }

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      set({ uploading: false });
    } catch (e) {
      set({ error: 'Failed to upload document', uploading: false });
      throw e;
    }
  },

  deleteDocument: async (id: number) => {
    try {
      await apiClient.delete(`api/documents/${id}`);
      set({ documents: get().documents.filter((d) => d.id !== id) });
    } catch (e) {
      set({ error: 'Failed to delete document' });
    }
  },
}));
