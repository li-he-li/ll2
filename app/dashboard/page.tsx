"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProductCard } from '@/components/ProductCard';
import { UserDropdownMenu } from '@/components/UserDropdownMenu';

interface Product {
  id: string;
  title: string;
  publishPrice: number;
  imageUrl: string;
  publisherId: string;
  publisher?: {
    name: string | null;
  };
  expiresAt: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleDevLogin = async () => {
    setIsLoggingIn(true);
    try {
      const res = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: {
            userId: 'mock-bargainer-id',
            name: 'Dev User',
            email: 'dev@example.com',
          }
        })
      });
      if (res.ok) {
        // Reload to pick up the new session
        window.location.reload();
      }
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
        // Don't redirect on auth failure - stay on page and show login button
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Fetch products when user is available
  useEffect(() => {
    const fetchProducts = async () => {
      setProductsLoading(true);
      try {
        const res = await fetch('/api/products');
        if (!res.ok) throw new Error('Failed to fetch products');
        const data = await res.json();
        setProducts(data.products || []);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setProductsLoading(false);
      }
    };

    // Only fetch if we're staying on the page (user may or may not exist)
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-page">
        <div className="text-primary text-xl font-bold animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-page">
      {/* 导航栏 */}
      <header className="bg-bg-card shadow-sm">
        <div className="mx-auto max-w-[1440px] px-10">
          <div className="flex h-16 items-center gap-10">
            {/* Logo */}
            <Link href="/dashboard" className="text-primary text-2xl font-bold">
              多多砍价
            </Link>

            {/* 搜索框 */}
            <div className="flex h-10 w-full max-w-[500px] flex-1 items-center gap-3 rounded-full bg-bg-page px-4">
              <span className="text-lg">🔍</span>
              <span className="text-text-light text-sm">搜索商品</span>
            </div>

            {/* 导航链接 */}
            <nav className="flex items-center gap-4 lg:gap-8 whitespace-nowrap">
              <Link href="/" className="text-text-primary hover:text-primary text-sm font-semibold transition-colors">
                首页
              </Link>
              <Link href="/dashboard" className="bg-primary shadow-button border-2 border-primary rounded-full px-5 py-2 text-bg-card text-sm font-semibold">
                砍价大厅
              </Link>
              <Link href="/my-products" className="border-primary bg-bg-page hover:bg-primary-bg shadow-card rounded-full border-2 px-5 py-2 text-primary text-sm font-semibold transition-all">
                我的商品
              </Link>
              <Link href="/publish" className="bg-primary shadow-button hover:bg-primary-light border-2 border-primary rounded-full px-5 py-2 text-bg-card text-sm font-semibold transition-all">
                + 发布商品
              </Link>
            </nav>

            {/* User Dropdown Menu */}
            {user ? (
              <UserDropdownMenu user={user} />
            ) : (
              <button
                onClick={handleDevLogin}
                disabled={isLoggingIn}
                className="bg-accent shadow-button border-2 border-accent hover:bg-accent-light flex items-center gap-2 rounded-full px-5 py-2 text-bg-card text-sm font-semibold transition-all"
              >
                {isLoggingIn ? '登录中...' : '🔓 Dev Login'}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主体内容 */}
      <main className="mx-auto max-w-[1440px] px-10 py-6">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center gap-4">
          <h1 className="text-text-primary text-2xl font-bold">🔥 砍价大厅</h1>
          <p className="text-text-secondary text-sm">邀请好友帮忙砍价，0元免费拿好物！</p>
        </div>

        {/* Loading state */}
        {productsLoading ? (
          <div className="flex justify-center py-12">
            <div className="text-primary text-xl font-bold animate-pulse">加载商品中...</div>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-bg-card shadow-card rounded-xl p-12 text-center">
            <p className="text-text-secondary mb-4 text-lg">暂时没有商品</p>
            <p className="text-text-light text-sm">快来发布第一个商品吧！</p>
          </div>
        ) : (
          /* 商品网格 */
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                title={product.title}
                publishPrice={product.publishPrice}
                imageUrl={product.imageUrl}
                publisher={product.publisher}
                expiresAt={product.expiresAt}
                isOwner={user?.secondmeId === product.publisherId}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
