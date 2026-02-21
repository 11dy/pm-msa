export interface Project {
  id: number;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  documentCount: number;
}

export interface ProjectFile {
  id: number;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

export interface CalendarDay {
  date: string;
  files: ProjectFile[];
}
