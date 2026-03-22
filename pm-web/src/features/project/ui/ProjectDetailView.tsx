'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Upload, FileText, Trash2, Loader2, ArrowUpDown, ShieldCheck } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useDocumentStore } from '@/features/document/model';
import { UploadDocumentModal } from '@/features/document/ui/UploadDocumentModal';
import { MaskDocumentModal } from '@/features/document/ui/MaskDocumentModal';
import type { Project } from '../model';
import type { DocumentFile } from '@/features/document/model';

const STATUS_LABEL: Record<DocumentFile['status'], string> = {
  UPLOADED: '업로드됨',
  PROCESSING: '처리 중',
  COMPLETED: '완료',
  FAILED: '실패',
};

const STATUS_COLOR: Record<DocumentFile['status'], string> = {
  UPLOADED: 'bg-blue-500/20 text-blue-400',
  PROCESSING: 'bg-yellow-500/20 text-yellow-400',
  COMPLETED: 'bg-green-500/20 text-green-400',
  FAILED: 'bg-red-500/20 text-red-400',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type SortOrder = 'newest' | 'oldest';

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetailView({ project, onBack }: ProjectDetailViewProps) {
  const { documents, loading, fetchDocuments, deleteDocument } = useDocumentStore();
  const [showUpload, setShowUpload] = useState(false);
  const [showMask, setShowMask] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  useEffect(() => {
    fetchDocuments(project.id);
  }, [project.id, fetchDocuments]);

  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      const diff = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortOrder === 'newest' ? -diff : diff;
    });
  }, [documents, sortOrder]);

  const handleUploaded = () => {
    fetchDocuments(project.id);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1 rounded-lg hover:bg-card-hover transition-colors cursor-pointer">
            <ArrowLeft size={18} />
          </button>
          <h2 className="font-semibold">{project.name}</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-muted hover:bg-card-hover transition-colors cursor-pointer"
          >
            <ArrowUpDown size={14} />
            {sortOrder === 'newest' ? '최신순' : '오래된순'}
          </button>
          <Button size="sm" variant="ghost" onClick={() => setShowMask(true)}>
            <ShieldCheck size={14} className="mr-1.5" />
            마스킹
          </Button>
          <Button size="sm" onClick={() => setShowUpload(true)}>
            <Upload size={14} className="mr-1.5" />
            업로드
          </Button>
        </div>
      </div>

      {/* Document List */}
      <div className="flex-1 overflow-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : sortedDocuments.length > 0 ? (
          <div className="grid gap-2">
            {sortedDocuments.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-colors"
              >
                <FileText size={20} className="text-accent shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{doc.originalFilename}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted">{doc.createdAt.split('T')[0]}</span>
                    <span className="text-xs text-muted uppercase">{doc.fileType}</span>
                    <span className="text-xs text-muted">{formatFileSize(doc.fileSize)}</span>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[doc.status]}`}>
                  {STATUS_LABEL[doc.status]}
                </span>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="p-1 rounded-lg text-muted hover:text-danger hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-muted">
            <FileText size={48} className="mb-3 opacity-30" />
            <p className="text-sm">업로드된 문서가 없습니다</p>
            <p className="text-xs mt-1">업로드 버튼으로 문서를 추가하세요</p>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        projectId={project.id}
        onUploaded={handleUploaded}
      />

      {/* Mask Download Modal */}
      <MaskDocumentModal
        isOpen={showMask}
        onClose={() => setShowMask(false)}
      />
    </div>
  );
}
