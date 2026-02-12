'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProductList } from '@/components/ProductList';

export default function MyProductsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (!res.ok) {
          router.push('/dashboard');
          return;
        }
        const data = await res.json();
        setUser(data.user);
      } catch (error) {
        console.error('Auth check failed:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-primary text-xl font-bold animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-bg-card shadow-sm">
        <div className="mx-auto max-w-[1440px] px-10">
          <div className="flex h-16 items-center gap-10">
            {/* Logo */}
            <Link href="/dashboard" className="text-primary text-2xl font-bold">
              多多砍价
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-4 lg:gap-8 whitespace-nowrap">
              <Link href="/dashboard" className="text-text-primary hover:text-primary text-sm font-semibold transition-colors">
                砍价大厅
              </Link>
              <Link href="/publish" className="border-primary bg-bg-page hover:bg-primary-bg shadow-card rounded-full border-2 px-5 py-2 text-primary text-sm font-semibold transition-all">
                发布商品
              </Link>
              <span className="bg-primary shadow-button border-2 border-primary rounded-full px-5 py-2 text-bg-card text-sm font-semibold cursor-pointer">
                我的商品
              </span>
            </nav>

            {/* User info */}
            <div className="bg-primary hover:bg-primary-light ml-auto flex items-center gap-2 rounded-full px-5 py-2 text-bg-card text-sm font-semibold transition-all">
              {user.image ? (
                <Image
                  src={user.image}
                  alt={user.name}
                  width={24}
                  height={24}
                  className="rounded-full"
                />
              ) : (
                <span>👤</span>
              )}
              <span>{user.name || '账号'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-10 py-6">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-text-primary mb-2 text-2xl font-bold">我的商品</h1>
            <p className="text-text-secondary text-sm">管理您发布的商品</p>
          </div>
          <Link
            href="/publish"
            className="bg-primary hover:bg-primary-light shadow-button border-2 border-primary rounded-full px-6 py-3 text-bg-card text-lg font-bold transition-all"
          >
            + 发布新商品
          </Link>
        </div>

        {/* Products List */}
        <ProductList status="all" />
      </main>
    </div>
  );
}
