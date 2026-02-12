'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PublishForm } from '@/components/PublishForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [productId, setProductId] = useState<string>('');

  useEffect(() => {
    const init = async () => {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);

      // Check auth
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
        return;
      }

      // Fetch product
      try {
        const res = await fetch(`/api/products/${resolvedParams.id}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('商品不存在');
          } else {
            setError('加载商品失败');
          }
          setLoading(false);
          return;
        }
        const data = await res.json();
        setProduct(data.product);
      } catch (error) {
        console.error('Failed to fetch product:', error);
        setError('加载商品失败');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [params, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-primary text-xl font-bold animate-pulse">加载中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="bg-bg-card shadow-card max-w-md w-full rounded-xl p-8 text-center">
          <p className="text-text-primary mb-6 text-xl">{error}</p>
          <button
            onClick={() => router.push('/my-products')}
            className="bg-primary hover:bg-primary-light w-full rounded-full px-6 py-3 text-bg-card text-lg font-bold transition-all"
          >
            返回我的商品
          </button>
        </div>
      </div>
    );
  }

  if (!product || !user) return null;

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
              <Link href="/my-products" className="bg-primary shadow-button border-2 border-primary rounded-full px-5 py-2 text-bg-card text-sm font-semibold cursor-pointer">
                我的商品
              </Link>
            </nav>

            {/* User info */}
            <div className="bg-primary hover:bg-primary-light ml-auto flex items-center gap-2 rounded-full px-5 py-2 text-bg-card text-sm font-semibold transition-all">
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  className="h-6 w-6 rounded-full"
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
      <main className="mx-auto max-w-[1440px] px-10 py-8">
        <PublishForm
          initialData={{
            id: product.id,
            title: product.title,
            description: product.description,
            publishPrice: product.publishPrice,
            imageUrl: product.imageUrl,
            category: product.category,
            durationDays: product.durationDays,
          }}
          isEdit={true}
        />
      </main>
    </div>
  );
}
