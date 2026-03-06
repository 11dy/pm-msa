'use client';

import { useState, useRef, useCallback } from 'react';
import { ShieldCheck, FileText, Loader2 } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { env } from '@/shared/config/env';

const ACCEPT = '.pdf,.docx,.txt,.md,.csv,.xlsx,.xls,.hwp';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface MaskDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MaskDocumentModal({ isOpen, onClose }: MaskDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [masking, setMasking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setSizeError(false);
    setError(null);
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ['pdf', 'docx', 'txt', 'md', 'csv', 'xlsx', 'xls', 'hwp'];
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

  const handleMask = async () => {
    if (!selectedFile) return;
    setMasking(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`${env.AGENT_BASE_URL}/api/pii/mask`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || '마스킹 처리에 실패했습니다');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const baseName = selectedFile.name.replace(/\.[^.]+$/, '');
      a.href = url;
      a.download = `${baseName}_masked.zip`;
      a.click();
      URL.revokeObjectURL(url);

      setSelectedFile(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '마스킹 처리에 실패했습니다');
    } finally {
      setMasking(false);
    }
  };

  const handleClose = () => {
    if (!masking) {
      setSelectedFile(null);
      setSizeError(false);
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="PII 마스킹 다운로드">
      <p className="text-xs text-muted mb-4">
        파일의 개인정보(PII)를 마스킹 처리한 문서와 대조표를 ZIP으로 다운로드합니다.
      </p>

      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
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
        <ShieldCheck size={32} className="mx-auto mb-3 text-muted" />
        <p className="text-sm text-muted">
          파일을 드래그하거나 클릭하여 선택하세요
        </p>
        <p className="text-xs text-muted mt-1">
          PDF, DOCX, TXT, MD, CSV, Excel, HWP 지원 (최대 5MB)
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

      {error && (
        <p className="mt-3 text-xs text-red-400">{error}</p>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <Button variant="ghost" onClick={handleClose} disabled={masking}>
          취소
        </Button>
        <Button onClick={handleMask} disabled={!selectedFile || masking}>
          {masking ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              마스킹 중...
            </>
          ) : (
            <>
              <ShieldCheck size={14} className="mr-1.5" />
              마스킹 다운로드
            </>
          )}
        </Button>
      </div>
    </Modal>
  );
}
