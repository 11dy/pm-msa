'use client';

import { useState } from 'react';
import { Modal, Input, Button } from '@/shared/ui';
import { useProjectStore } from '../model';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const { addProject } = useProjectStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await addProject(name.trim(), description.trim() || undefined);
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="새 프로젝트">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          id="project-name"
          label="프로젝트명"
          placeholder="프로젝트명을 입력하세요"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
        />
        <Input
          id="project-desc"
          label="설명 (선택)"
          placeholder="프로젝트 설명을 입력하세요"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {/* TODO: 참여자 검색 - user table 연동 후 구현 */}
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-1">참여자</label>
          <div className="px-3 py-2 bg-zinc-900 border border-border rounded-lg text-sm text-zinc-500">
            추후 구현 예정
          </div>
        </div>
        <div className="flex gap-3 justify-end pt-2">
          <Button variant="ghost" type="button" onClick={onClose}>취소</Button>
          <Button type="submit" disabled={!name.trim()}>생성</Button>
        </div>
      </form>
    </Modal>
  );
}
