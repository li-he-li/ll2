'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { ProductList } from '@/components/ProductList';
import { PurchasedProductList } from '@/components/PurchasedProductList';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'publishing' | 'purchased'>('publishing');

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
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-primary text-xl font-bold animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-bg-page">
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
              <Link href="/my-products" className="border-primary bg-bg-page hover:bg-primary-bg shadow-card rounded-full border-2 px-5 py-2 text-primary text-sm font-semibold transition-all">
                我的商品
              </Link>
              <Link href="/profile" className="bg-primary shadow-button border-2 border-primary rounded-full px-5 py-2 text-bg-card text-sm font-semibold">
                个人主页
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1440px] px-10 py-6">
        {/* User Profile Header */}
        <div className="bg-bg-card shadow-card rounded-xl p-6 mb-6">
          <div className="flex items-center gap-6">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name || '用户'}
                width={80}
                height={80}
                className="rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-primary-bg flex items-center justify-center text-4xl">
                👤
              </div>
            )}
            <div>
              <h1 className="text-text-primary text-2xl font-bold mb-1">
                {user.name || '用户'}
              </h1>
              <p className="text-text-secondary text-sm">查看您发布的商品和购买记录</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-bg-card shadow-card rounded-xl p-2 mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('publishing')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'publishing'
                ? 'bg-primary text-bg-card shadow-button'
                : 'text-text-primary hover:bg-primary-bg'
            }`}
          >
            正在发布
          </button>
          <button
            onClick={() => setActiveTab('purchased')}
            className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all ${
              activeTab === 'purchased'
                ? 'bg-primary text-bg-card shadow-button'
                : 'text-text-primary hover:bg-primary-bg'
            }`}
          >
            已购入商品
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'publishing' ? (
          <ProductList status="all" />
        ) : (
          <PurchasedProductList />
        )}
      </main>
    </div>
  );
}
