import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface ProductCardProps {
  id: string;
  title: string;
  publishPrice: number;
  imageUrl: string;
  publisher?: {
    name: string | null;
  } | null;
  expiresAt: string;
  isOwner?: boolean;
}

export function ProductCard({
  id,
  title,
  publishPrice,
  imageUrl,
  publisher,
  expiresAt,
  isOwner = false,
}: ProductCardProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);

  // Calculate derived values
  const publishPriceStr = `¥${(publishPrice / 100).toFixed(0)}`;
  const currentPrice = `¥${(publishPrice * 0.75 / 100).toFixed(0)}`; // Mock: 75% of publish
  const targetPrice = `¥${(publishPrice * 0.85 / 100).toFixed(0)}`; // Mock: 85% of publish
  const progress = Math.round((publishPrice * 0.75 / publishPrice) * 200); // Mock progress

  // Calculate time left
  const getTimeLeft = (expiryStr: string): string => {
    const expiry = new Date(expiryStr);
    const now = new Date();
    const diffMs = expiry.getTime() - now.getTime();

    if (diffMs <= 0) return '已过期';

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}天${hours}时`;
    if (hours > 0) return `${hours}时${minutes}分`;
    return `${minutes}分钟`;
  };

  const timeLeft = getTimeLeft(expiresAt);
  const userName = publisher?.name || '匿名用户';

  const handleBargainClick = async () => {
    if (isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch('/api/bargain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId: id,
          productName: title,
          publishPrice,
        }),
      });

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please log in first to bargain');
        }
        throw new Error('Failed to create bargain session');
      }

      const data = await res.json();
      router.push(`/bargain/${data.sessionId}`);
    } catch (error) {
      console.error('Error creating bargain session:', error);
      const errorMessage = error instanceof Error ? error.message : '创建砍价会话失败，请稍后再试';
      alert(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  const handleEdit = () => {
    router.push(`/publish/edit/${id}`);
  };

  const handleDelete = async () => {
    if (!confirm('确定要删除此商品吗？')) return;

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '删除失败');
      }

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert(error instanceof Error ? error.message : '删除失败');
    }
  };

  return (
    <div className="bg-bg-card shadow-card hover:shadow-xl w-full rounded-xl overflow-hidden transition-all duration-300">
      {/* 商品图片 */}
      <div className="bg-primary-bg h-[200px] flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            width={400}
            height={200}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-primary text-5xl">📦</span>
        )}
      </div>

      {/* 商品信息 */}
      <div className="p-4">
        {/* 商品标题 */}
        <h3 className="text-text-primary mb-3 text-base font-semibold line-clamp-2">
          {title}
        </h3>

        {/* 砍价进度区 */}
        <div className="mb-3 space-y-2">
          {/* 进度条 */}
          <div className="bg-primary-bg h-2 w-full overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-all duration-500"
              style={{ width: `${progress}px` }}
            />
          </div>

          {/* 价格信息 */}
          <div className="flex items-center gap-2">
            <span className="text-primary text-sm font-bold">
              已砍 {currentPrice}
            </span>
            <span className="text-text-light text-xs">
              / 目标 {targetPrice}
            </span>
          </div>

          {/* 发布价 */}
          <div className="flex items-center gap-2">
            <span className="text-text-light text-xs">发布价</span>
            <span className="text-text-secondary text-sm line-through">
              {publishPriceStr}
            </span>
          </div>
        </div>

        {/* 用户信息 */}
        <div className="mb-2 flex items-center gap-2">
          <div className="bg-primary-bg flex h-8 w-8 items-center justify-center rounded-full">
            <span>👤</span>
          </div>
          <span className="text-text-secondary text-xs">{userName}</span>
        </div>

        {/* 剩余时间 */}
        <div className="mb-3 flex items-center gap-1">
          <span className="text-xs">⏰</span>
          <span className="text-text-secondary text-xs">还剩 {timeLeft}</span>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-2">
          <button
            onClick={handleBargainClick}
            disabled={isCreating}
            className="bg-primary shadow-button border-2 border-primary hover:bg-primary-light hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex-1 rounded-full px-6 py-3 text-bg-card text-base font-bold transition-all duration-200"
          >
            {isCreating ? '创建中...' : '帮他砍一刀 🔪'}
          </button>

          {isOwner && (
            <>
              <button
                onClick={handleEdit}
                className="border-primary bg-bg-page hover:bg-primary-bg hover:border-primary border rounded-full px-4 py-3 text-primary text-sm font-semibold transition-all"
              >
                编辑
              </button>
              <button
                onClick={handleDelete}
                className="border-red-500 bg-bg-page hover:bg-red-50 hover:border-red-600 border rounded-full px-4 py-3 text-red-500 text-sm font-semibold transition-all"
              >
                删除
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
