'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface PurchasedProduct {
  id: string;
  productId: string;
  product: {
    id: string;
    title: string;
    imageUrl: string;
    publishPrice: number;
  };
  finalPrice: number | null;
  completedAt: Date | null;
}

export function PurchasedProductList() {
  const [purchases, setPurchases] = useState<PurchasedProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPurchases = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch('/api/bargains/my-purchases');
        if (!res.ok) {
          const data = await res.json();
          setError(data.error || '获取购买记录失败');
          return;
        }
        const data = await res.json();
        setPurchases(data.purchases || []);
      } catch (err) {
        console.error('Failed to fetch purchases:', err);
        setError('获取购买记录失败，请重试');
      } finally {
        setLoading(false);
      }
    };

    fetchPurchases();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-primary text-xl font-bold animate-pulse">加载购买记录中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-bg-card shadow-card rounded-xl p-12 text-center">
        <p className="text-text-secondary mb-4 text-lg">❌ {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-primary-light shadow-button border-2 border-primary rounded-full px-6 py-3 text-bg-card text-lg font-bold transition-all"
        >
          重试
        </button>
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-bg-card shadow-card rounded-xl p-12 text-center">
        <p className="text-text-secondary mb-4 text-lg">还没有购买任何商品</p>
        <p className="text-text-light text-sm mb-6">快去砍价大厅看看吧！</p>
        <Link
          href="/dashboard"
          className="inline-block bg-primary hover:bg-primary-light shadow-button border-2 border-primary rounded-full px-6 py-3 text-bg-card text-lg font-bold transition-all"
        >
          前往砍价大厅
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {purchases.map((purchase) => (
        <div
          key={purchase.id}
          className="bg-bg-card shadow-card rounded-xl overflow-hidden hover:shadow-lg transition-shadow"
        >
          {/* Product Image */}
          <div className="relative h-48 bg-gray-100">
            <Image
              src={purchase.product.imageUrl}
              alt={purchase.product.title}
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute top-2 right-2 bg-green-500 text-bg-card px-3 py-1 rounded-full text-xs font-bold">
              已购入
            </div>
          </div>

          {/* Product Info */}
          <div className="p-4">
            <h3 className="text-text-primary font-bold text-lg mb-2 truncate">
              {purchase.product.title}
            </h3>

            {/* Price Info */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-text-light text-xs line-through">
                  原价: ¥{(purchase.product.publishPrice / 100).toFixed(2)}
                </p>
                <p className="text-green-600 font-bold text-lg">
                  成交价: ¥{purchase.finalPrice ? (purchase.finalPrice / 100).toFixed(2) : '-'}
                </p>
              </div>
            </div>

            {/* Completion Date */}
            {purchase.completedAt && (
              <p className="text-text-light text-xs">
                购买于: {new Date(purchase.completedAt).toLocaleDateString('zh-CN')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
