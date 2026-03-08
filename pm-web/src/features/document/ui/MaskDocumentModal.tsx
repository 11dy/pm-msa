'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ShieldCheck, FileText, Loader2, Check, Circle } from 'lucide-react';
import { Modal } from '@/shared/ui/Modal';
import { Button } from '@/shared/ui/Button';
import { env } from '@/shared/config/env';

const ACCEPT = '.pdf,.docx,.txt,.md,.csv,.xlsx,.xls,.hwp';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const STEPS = [
  '파일 분석',
  'PII 탐지',
  '마스킹 처리',
  'ZIP 생성',
] as const;

// 시뮬레이션 딜레이 (ms) — 각 단계로 넘어가는 최소 시간
const STEP_DELAYS = [1000, 3000, 6000] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Phase = 'select' | 'progress' | 'done';

interface MaskDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MaskDocumentModal({ isOpen, onClose }: MaskDocumentModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('select');
  const [currentStep, setCurrentStep] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const blobRef = useRef<{ url: string; name: string } | null>(null);

  // 단계 시뮬레이션 타이머
  useEffect(() => {
    if (phase !== 'progress') return;

    const timers = STEP_DELAYS.map((delay, i) =>
      setTimeout(() => setCurrentStep((prev) => Math.max(prev, i + 1)), delay),
    );

    return () => timers.forEach(clearTimeout);
  }, [phase]);

  // 완료 화면 → 1.5초 후 자동 닫기
  useEffect(() => {
    if (phase !== 'done') return;

    const timer = setTimeout(() => {
      resetState();
      onClose();
    }, 1500);

    return () => clearTimeout(timer);
  }, [phase, onClose]);

  const resetState = () => {
    setSelectedFile(null);
    setSizeError(false);
    setError(null);
    setPhase('select');
    setCurrentStep(0);
    blobRef.current = null;
  };

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
    setPhase('progress');
    setCurrentStep(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch(`${env.API_BASE_URL}/agent/pii/mask`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || '마스킹 처리에 실패했습니다');
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const baseName = selectedFile.name.replace(/\.[^.]+$/, '');

      // 다운로드 트리거
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_masked.zip`;
      a.click();
      URL.revokeObjectURL(url);

      // 모든 단계 완료 표시 후 done 전환
      setCurrentStep(STEPS.length);
      // 약간의 딜레이 후 done phase로 전환 (마지막 단계 체크 애니메이션 보여주기)
      setTimeout(() => setPhase('done'), 400);
    } catch (e) {
      setError(e instanceof Error ? e.message : '마스킹 처리에 실패했습니다');
      setPhase('select');
      setCurrentStep(0);
    }
  };

  const handleClose = () => {
    if (phase === 'progress') return;
    resetState();
    onClose();
  };

  const isProcessing = phase === 'progress' || phase === 'done';

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isProcessing ? undefined : 'PII 마스킹 다운로드'}>
      {phase === 'select' && (
        <>
          <p className="text-xs text-muted mb-2">
            파일의 개인정보(PII)를 마스킹 처리한 문서와 대조표를 ZIP으로 다운로드합니다.
          </p>
          <p className="text-xs text-muted/60 mb-4">
            Excel 파일은 시트별 CSV로 변환되어 제공됩니다. (숨김 시트 제외)
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
            <Button variant="ghost" onClick={handleClose}>
              취소
            </Button>
            <Button onClick={handleMask} disabled={!selectedFile}>
              <ShieldCheck size={14} className="mr-1.5" />
              마스킹 다운로드
            </Button>
          </div>
        </>
      )}

      {isProcessing && (
        <div className="py-4 flex flex-col items-center">
          {/* 상단 아이콘 + 타이틀 */}
          <div className="mb-6 text-center">
            {phase === 'done' ? (
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-green-500/20 flex items-center justify-center animate-[scale-in_0.3s_ease-out]">
                <Check size={28} className="text-green-400" />
              </div>
            ) : (
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-accent/20 flex items-center justify-center">
                <Loader2 size={28} className="text-accent animate-spin" />
              </div>
            )}
            <h3 className="text-base font-medium">
              {phase === 'done' ? '마스킹 완료!' : 'PII 마스킹 처리 중'}
            </h3>
          </div>

          {/* 파일명 */}
          {selectedFile && (
            <div className="flex items-center gap-2 mb-5 px-4 py-2 bg-card-hover rounded-lg">
              <FileText size={16} className="text-accent shrink-0" />
              <span className="text-sm truncate max-w-[240px]">{selectedFile.name}</span>
            </div>
          )}

          {/* 단계별 진행 */}
          <div className="w-full space-y-3 px-2">
            {STEPS.map((label, i) => {
              const done = currentStep > i;
              const active = currentStep === i && phase === 'progress';

              return (
                <div key={label} className="flex items-center gap-3">
                  {done ? (
                    <Check size={16} className="text-green-400 shrink-0" />
                  ) : active ? (
                    <Loader2 size={16} className="text-accent animate-spin shrink-0" />
                  ) : (
                    <Circle size={16} className="text-muted/40 shrink-0" />
                  )}
                  <span
                    className={`text-sm ${
                      done
                        ? 'text-green-400'
                        : active
                          ? 'text-foreground'
                          : 'text-muted/40'
                    }`}
                  >
                    {label}
                    {active && '...'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* 하단 안내 / 닫기 */}
          {phase === 'progress' && (
            <p className="mt-6 text-xs text-muted">
              처리에 다소 시간이 걸릴 수 있습니다.
            </p>
          )}
          {phase === 'done' && (
            <Button variant="ghost" className="mt-6" onClick={handleClose}>
              닫기
            </Button>
          )}
        </div>
      )}
    </Modal>
  );
}
