'use client';

import { useEffect, useState, useMemo } from 'react';
import { ArrowLeft, Upload, FileText, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { useDocumentStore } from '@/features/document/model';
import { UploadDocumentModal } from '@/features/document/ui/UploadDocumentModal';
import { ProjectCalendar } from './ProjectCalendar';
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

interface ProjectDetailViewProps {
  project: Project;
  onBack: () => void;
}

export function ProjectDetailView({ project, onBack }: ProjectDetailViewProps) {
  const { documents, loading, fetchDocuments, deleteDocument } = useDocumentStore();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments(project.id);
  }, [project.id, fetchDocuments]);

  // 날짜별 문서 그룹핑
  const documentsByDate = useMemo(() => {
    const map: Record<string, DocumentFile[]> = {};
    for (const doc of documents) {
      const date = doc.createdAt.split('T')[0];
      if (!map[date]) map[date] = [];
      map[date].push(doc);
    }
    return map;
  }, [documents]);

  // 문서가 있는 날짜 Set
  const datesWithDocs = useMemo(() => new Set(Object.keys(documentsByDate)), [documentsByDate]);

  const selectedDocs = selectedDate ? (documentsByDate[selectedDate] || []) : [];

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
        <Button size="sm" onClick={() => setShowUpload(true)}>
          <Upload size={14} className="mr-1.5" />
          업로드
        </Button>
      </div>

      {/* Calendar + Document List */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="animate-spin text-muted" />
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="p-4">
              <ProjectCalendar
                datesWithDocs={datesWithDocs}
                selectedDate={selectedDate}
                onDateSelect={setSelectedDate}
              />
            </div>

            {/* Date-based Document List */}
            <div className="px-4 pb-4">
              {selectedDate ? (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-muted">
                      {selectedDate} ({selectedDocs.length}건)
                    </h3>
                  </div>
                  {selectedDocs.length > 0 ? (
                    <div className="grid gap-2">
                      {selectedDocs.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-card-hover transition-colors"
                        >
                          <FileText size={20} className="text-accent shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{doc.originalFilename}</p>
                            <div className="flex items-center gap-2 mt-0.5">
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
                    <p className="text-sm text-muted">이 날짜에 업로드된 문서가 없습니다</p>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted text-center py-4">날짜를 선택하면 해당 날짜의 문서를 확인할 수 있습니다</p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        projectId={project.id}
        onUploaded={handleUploaded}
      />
    </div>
  );
}
