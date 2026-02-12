'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface UserDropdownMenuProps {
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export function UserDropdownMenu({ user }: UserDropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Handle logout
  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });

      if (res.ok) {
        // 使用 window.location.href 强制完全重新加载页面
        // 这样可以确保所有状态被重置，包括缓存和cookie
        window.location.href = '/dashboard';
      } else {
        const data = await res.json();
        console.error('Logout failed:', data);
        alert(data.error || '退出登录失败，请重试');
      }
    } catch (error) {
      console.error('Logout error:', error);
      alert('退出登录失败，请重试');
    }
    setIsOpen(false);
  };

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative" ref={dropdownRef} onKeyDown={handleKeyDown}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-primary hover:bg-primary-light shadow-button border-2 border-primary flex items-center gap-2 rounded-full px-5 py-2 text-bg-card text-sm font-semibold transition-all cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {user.image ? (
          <Image src={user.image} alt={user.name || '用户'} width={24} height={24} className="rounded-full" />
        ) : (
          <span>👤</span>
        )}
        <span>{user.name || '账号设置'}</span>
        <span className={`text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-48 bg-bg-card shadow-card rounded-xl border border-gray-200 z-50 animate-fade-in"
          role="menu"
        >
          {/* Personal Homepage Link */}
          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-3 text-text-primary text-sm font-semibold hover:bg-primary-bg transition-colors rounded-t-xl"
            role="menuitem"
          >
            <span>🏠</span>
            <span>个人主页</span>
          </Link>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-3 text-text-primary text-sm font-semibold hover:bg-primary-bg transition-colors rounded-b-xl border-t border-gray-100"
            role="menuitem"
          >
            <span>🚪</span>
            <span>退出登录</span>
          </button>
        </div>
      )}
    </div>
  );
}
