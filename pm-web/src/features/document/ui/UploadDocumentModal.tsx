'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileText } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { useDocumentStore } from '../model';

const ACCEPT = '.pdf,.docx,.txt,.md,.csv';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: number;
  onUploaded: () => void;
}

export function UploadDocumentModal({ isOpen, onClose, projectId, onUploaded }: UploadDocumentModalProps) {
  const { uploadDocument, uploading } = useDocumentStore();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSizeError(false);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt', 'md', 'csv'];
    if (!ext || !allowed.includes(ext)) return;
    if (file.size > MAX_FILE_SIZE) {
      setSizeError(true);
      return;
    }
    setSelectedFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleUpload = async () => {
    if (!selectedFile) return;
    try {
      await uploadDocument(projectId, selectedFile);
      setSelectedFile(null);
      onUploaded();
      onClose();
    } catch {
      // error is set in store
    }
  };

  const handleClose = () => {
    if (!uploading) {
      setSelectedFile(null);
      setSizeError(false);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="문서 업로드">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-accent bg-accent/10' : 'border-border'
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        <Upload size={32} className="mx-auto mb-3 text-muted" />
        <p className="text-sm text-muted">
          파일을 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="text-xs text-muted mt-1">
          PDF, DOCX, TXT, MD, CSV 지원 (최대 5MB)
        </p>
        {sizeError && (
          <p className="text-xs text-red-400 mt-2">파일 크기가 5MB를 초과합니다</p>
        )}
      </div>

      {selectedFile && (
        <div className="mt-4 flex items-center gap-3 p-3 bg-card-hover rounded-lg">
          <FileText size={20} className="text-accent shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{selectedFile.name}</p>
            <p className="text-xs text-muted">{formatFileSize(selectedFile.size)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}
            className="text-xs text-muted hover:text-foreground cursor-pointer"
          >
            제거
          </button>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose} disabled={uploading}>
          취소
        </Button>
        <Button onClick={handleUpload} isLoading={uploading} disabled={!selectedFile}>
          업로드
        </Button>
      </div>
    </Modal>
  );
}
