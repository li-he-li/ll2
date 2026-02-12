import React from 'react';

interface ProductBargainHeaderProps {
  productName?: string;
  publishPrice: number;
  currentPrice: number;
  targetPrice: number;
  status?: string;
  finalPrice?: number | null;
}

export function ProductBargainHeader({
  productName,
  publishPrice,
  currentPrice,
  targetPrice,
  status,
  finalPrice,
}: ProductBargainHeaderProps) {
  const progress = Math.min(
    ((publishPrice - currentPrice) / (publishPrice - targetPrice)) * 100,
    100
  );
  const isCompleted = status === 'completed' || finalPrice !== null;

  return (
    <div className="bg-bg-card shadow-card mb-4 rounded-xl p-6">
      {/* Product title */}
      <div className="mb-4 flex items-center gap-4">
        <div className="bg-primary-bg flex h-16 w-16 shrink-0 items-center justify-center rounded-lg">
          <span className="text-3xl">📦</span>
        </div>
        <div className="flex-1">
          <h2 className="text-text-primary text-xl font-bold">{productName || '商品名称'}</h2>
          <p className="text-text-secondary text-sm">
            {isCompleted ? '砍价已完成' : '正在砍价中...'}
          </p>
        </div>
      </div>

      {/* Price progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">原价</span>
          <span className="text-text-light text-sm line-through">¥{publishPrice}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">当前价</span>
          <span className="text-primary text-xl font-bold">¥{currentPrice}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-text-secondary text-sm">目标价</span>
          <span className="text-green-600 text-lg font-semibold">¥{targetPrice}</span>
        </div>

        {/* Progress bar */}
        <div className="bg-primary-bg h-3 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Final price if completed */}

        {/* Final price if completed */}
        {isCompleted && finalPrice !== null && (
          <div className="bg-green-50 border-green-200 mt-4 rounded-lg border-2 p-4 text-center">
            <p className="text-green-700 text-sm font-semibold">最终成交价</p>
            <p className="text-green-600 text-3xl font-bold">¥{finalPrice}</p>
            <p className="text-green-600 text-xs mt-1">
              节省了¥{publishPrice - (finalPrice ?? currentPrice)}
            </p>
          </div>
        )}

        {/* Status indicator */}
        {!isCompleted && (
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <span className="animate-pulse">💬</span>
              <span className="text-text-secondary text-sm">
                {status === 'negotiating' ? 'AI正在为你砍价...' : '处理中...'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
