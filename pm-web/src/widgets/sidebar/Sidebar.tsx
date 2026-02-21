'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Settings, User, ChevronUp } from 'lucide-react';
import { useSessionStore } from '@/entities/session';
import { authApi } from '@/features/auth';
import { Button } from '@/shared/ui';

interface SidebarProps {
  onCreateProject: () => void;
}

export function Sidebar({ onCreateProject }: SidebarProps) {
  const router = useRouter();
  const { user, clearSession } = useSessionStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearSession();
      router.push('/login');
    }
  };

  const displayName = user?.username || user?.email?.split('@')[0] || '사용자';

  return (
    <aside className="w-64 h-screen bg-card border-r border-border flex flex-col shrink-0">
      {/* Logo */}
      <div className="p-4 border-b border-border">
        <span className="text-lg font-bold tracking-tight">PM</span>
      </div>

      {/* Create Project */}
      <div className="p-3">
        <Button
          variant="outline"
          className="w-full gap-2 justify-start"
          onClick={onCreateProject}
        >
          <Plus size={16} />
          Create Project
        </Button>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* User Profile */}
      <div className="relative p-3 border-t border-border" ref={menuRef}>
        {showUserMenu && (
          <div className="absolute bottom-full left-3 right-3 mb-1 bg-zinc-800 border border-border rounded-lg shadow-xl overflow-hidden">
            <button
              onClick={() => { setShowUserMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <Settings size={16} />
              설정
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              <LogOut size={16} />
              로그아웃
            </button>
          </div>
        )}

        <button
          onClick={() => setShowUserMenu(!showUserMenu)}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-card-hover transition-colors cursor-pointer"
        >
          <div className="w-8 h-8 bg-accent/20 text-accent rounded-full flex items-center justify-center shrink-0">
            <User size={16} />
          </div>
          <span className="text-sm font-medium truncate flex-1 text-left">
            {displayName}님
          </span>
          <ChevronUp size={14} className={`text-muted transition-transform ${showUserMenu ? '' : 'rotate-180'}`} />
        </button>
      </div>
    </aside>
  );
}
