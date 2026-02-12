'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface Product {
  id: string;
  title: string;
  description: string | null;
  publishPrice: number;
  imageUrl: string;
  status: 'active' | 'expired' | 'deleted';
  expiresAt: string;
  createdAt: string;
}

interface ProductListProps {
  status?: 'active' | 'expired' | 'deleted' | 'all';
}

export function ProductList({ status = 'all' }: ProductListProps) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'active' | 'expired' | 'deleted' | 'all'>(
    status === 'all' ? 'active' : status
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const url = filter === 'all' ? '/api/products/mine' : `/api/products/mine?status=${filter}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.products);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [filter]);

  const handleDelete = async (productId: string) => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // Refresh list
      await fetchProducts();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'expired':
        return 'bg-gray-100 text-gray-700';
      case 'deleted':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'expired':
        return '已过期';
      case 'deleted':
        return '已删除';
      default:
        return status;
    }
  };

  const getExpiresText = (expiresAt: string, status: string) => {
    if (status === 'deleted') return '已删除';
    if (status === 'expired') return '已过期';

    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMs <= 0) return '已过期';
    if (diffDays < 1) return '即将过期';
    return `${diffDays}天后过期`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="text-primary text-xl font-bold animate-pulse">加载中...</div>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="bg-bg-card shadow-card rounded-xl p-12 text-center">
        <p className="text-text-secondary mb-4 text-lg">
          {filter === 'deleted'
            ? '没有已删除的商品'
            : filter === 'expired'
              ? '没有已过期的商品'
              : '还没有发布任何商品'}
        </p>
        {filter !== 'deleted' && (
          <button
            onClick={() => router.push('/publish')}
            className="bg-primary hover:bg-primary-light mx-auto rounded-full px-8 py-3 text-bg-card text-lg font-bold transition-all"
          >
            发布第一个商品
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs - only show if status is 'all' */}
      {status === 'all' && (
        <div className="bg-bg-card shadow-card flex gap-2 rounded-xl p-2">
          <button
            onClick={() => setFilter('active')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === 'active'
                ? 'bg-primary text-bg-card'
                : 'text-text-primary hover:bg-primary-bg'
            }`}
          >
            进行中
          </button>
          <button
            onClick={() => setFilter('expired')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === 'expired'
                ? 'bg-primary text-bg-card'
                : 'text-text-primary hover:bg-primary-bg'
            }`}
          >
            已过期
          </button>
          <button
            onClick={() => setFilter('deleted')}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
              filter === 'deleted'
                ? 'bg-primary text-bg-card'
                : 'text-text-primary hover:bg-primary-bg'
            }`}
          >
            已删除
          </button>
        </div>
      )}

      {/* Products Table/Grid */}
      <div className="space-y-3">
        {products.map((product) => (
          <div
            key={product.id}
            className="bg-bg-card shadow-card hover:shadow-lg flex items-center gap-4 rounded-xl p-4 transition-all"
          >
            {/* Product Image */}
            <div className="bg-primary-bg h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.title}
                  width={80}
                  height={80}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <span className="text-primary text-2xl">📦</span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="min-w-0 flex-1">
              <h3 className="text-text-primary mb-1 truncate text-lg font-semibold">
                {product.title}
              </h3>
              <p className="text-primary text-xl font-bold">
                ¥{(product.publishPrice / 100).toFixed(2)}
              </p>
              <p className="text-text-light mt-1 text-sm">
                {product.description || '无描述'}
              </p>
            </div>

            {/* Status & Expiry */}
            <div className="flex-shrink-0">
              <span
                className={`mb-1 inline-block rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadge(
                  product.status
                )}`}
              >
                {getStatusText(product.status)}
              </span>
              <p className="text-text-secondary text-xs">
                {getExpiresText(product.expiresAt, product.status)}
              </p>
            </div>

            {/* Actions */}
            {product.status !== 'deleted' && (
              <div className="flex gap-2">
                <button
                  onClick={() => router.push(`/publish/edit/${product.id}`)}
                  className="border-primary bg-bg-page hover:bg-primary-bg hover:border-primary border rounded-lg px-4 py-2 text-primary text-sm font-semibold transition-all"
                  disabled={product.status === 'expired'}
                >
                  编辑
                </button>
                <button
                  onClick={() => setDeleteConfirm(product.id)}
                  className="border-red-500 bg-bg-page hover:bg-red-50 hover:border-red-600 border rounded-lg px-4 py-2 text-red-500 text-sm font-semibold transition-all"
                  disabled={product.status === 'expired'}
                >
                  删除
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="bg-black/50 fixed inset-0 z-50 flex items-center justify-center">
          <div className="bg-bg-card shadow-card max-w-md w-full rounded-xl p-6">
            <h3 className="text-text-primary mb-4 text-xl font-bold">
              确定要删除此商品吗？
            </h3>
            <p className="text-text-secondary mb-6">
              删除后商品将不再显示在砍价大厅，但可以在&ldquo;已删除&rdquo;标签中查看。
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="border-gray-300 bg-bg-page hover:bg-gray-100 border flex-1 rounded-lg px-4 py-2 text-text-primary font-semibold transition-all"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600 disabled:opacity-50 flex-1 rounded-lg px-4 py-2 text-bg-card font-semibold transition-all"
              >
                {isDeleting ? '删除中...' : '确认删除'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
